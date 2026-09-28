import express from 'express';
import DeviceSession from '../models/DeviceSession.js';
import { clerkClient } from '@clerk/clerk-sdk-node';

const router = express.Router();

// Helper to extract client IP address
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || '';
};

// 1. Register or update a device login session
router.post('/register', async (req, res) => {
  try {
    const { clerkId, sessionId, deviceId, deviceInfo } = req.body;

    if (!clerkId || !sessionId) {
      return res.status(400).json({ success: false, message: 'clerkId and sessionId are required' });
    }

    // Check if this session is already revoked
    const existingRevoked = await DeviceSession.findOne({ clerkId, sessionId, status: 'revoked' });
    if (existingRevoked) {
      return res.status(403).json({
        success: false,
        revoked: true,
        message: 'This session has been revoked from another device.',
        revokedBy: existingRevoked.revokedBy,
      });
    }

    const ipAddress = deviceInfo?.ip && deviceInfo.ip !== 'Fetching...' && deviceInfo.ip !== 'Unknown IP'
      ? deviceInfo.ip
      : getClientIp(req);

    const deviceName = deviceInfo?.deviceName || 
      (deviceInfo?.browser && deviceInfo?.os ? `${deviceInfo.browser} on ${deviceInfo.os}` : 'Active Device');

    const updateData = {
      clerkId,
      sessionId,
      deviceId: deviceId || sessionId,
      deviceType: deviceInfo?.deviceType || 'desktop',
      deviceName,
      browser: deviceInfo?.browser || 'Unknown Browser',
      browserVersion: deviceInfo?.browserVersion || '',
      os: deviceInfo?.os || 'Unknown OS',
      ipAddress: ipAddress || '',
      city: deviceInfo?.city && deviceInfo.city !== 'Detecting...' ? deviceInfo.city : '',
      region: deviceInfo?.region || '',
      country: deviceInfo?.country && deviceInfo.country !== 'Location' ? deviceInfo.country : '',
      userAgent: req.headers['user-agent'] || '',
      status: 'active',
      lastActiveAt: new Date(),
    };

    const session = await DeviceSession.findOneAndUpdate(
      { clerkId, sessionId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    // Notify other open tabs/devices to refresh their active sessions list
    const emitToUserSockets = req.app.get('emitToUserSockets');
    if (typeof emitToUserSockets === 'function') {
      emitToUserSockets(clerkId, 'device_sessions_updated', { activeSessionId: sessionId });
    }

    return res.status(200).json({ success: true, session });
  } catch (error) {
    console.error('Error in /api/device-sessions/register:', error);
    return res.status(500).json({ success: false, message: 'Failed to register device session' });
  }
});

// 2. Get list of active device sessions for a user
router.get('/list', async (req, res) => {
  try {
    const { clerkId } = req.query;

    if (!clerkId) {
      return res.status(400).json({ success: false, message: 'clerkId is required' });
    }

    const isSessionOnline = req.app.get('isSessionOnline') || (() => false);

    // 1. Fetch active sessions from MongoDB
    const dbSessions = await DeviceSession.find({
      clerkId,
      status: 'active',
    }).sort({ lastActiveAt: -1 }).lean();

    // 2. Fetch sessions from Clerk SDK if available for comprehensive sync
    let clerkSessionIds = new Set();
    try {
      const clerkList = await clerkClient.sessions.getSessionList({ userId: clerkId });
      if (Array.isArray(clerkList)) {
        clerkList.forEach(cs => {
          if (cs.status === 'active') {
            clerkSessionIds.add(cs.id);
          }
        });
      }
    } catch (clerkErr) {
      // Non-fatal if Clerk SDK fails or network hiccup occurs
      console.debug('Clerk getSessionList notice:', clerkErr?.message);
    }

    // Annotate sessions with real-time online status
    const formattedSessions = dbSessions.map(sess => {
      const online = isSessionOnline(sess.sessionId);
      return {
        ...sess,
        isOnline: online,
        isClerkActive: clerkSessionIds.size > 0 ? clerkSessionIds.has(sess.sessionId) : true,
      };
    });

    return res.status(200).json({
      success: true,
      sessions: formattedSessions,
      count: formattedSessions.length,
    });
  } catch (error) {
    console.error('Error in /api/device-sessions/list:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve active sessions' });
  }
});

// 3. Revoke / Remove a specific device session
router.post('/revoke', async (req, res) => {
  try {
    const { clerkId, sessionIdToRevoke, currentDeviceInfo } = req.body;

    if (!clerkId || !sessionIdToRevoke) {
      return res.status(400).json({ success: false, message: 'clerkId and sessionIdToRevoke are required' });
    }

    const revokedBy = {
      deviceName: currentDeviceInfo?.deviceName || `${currentDeviceInfo?.browser || 'Web Browser'} on ${currentDeviceInfo?.os || 'Device'}`,
      browser: currentDeviceInfo?.browser || 'Unknown Browser',
      os: currentDeviceInfo?.os || 'Unknown OS',
      ipAddress: currentDeviceInfo?.ip || getClientIp(req),
      city: currentDeviceInfo?.city || '',
      country: currentDeviceInfo?.country || '',
      revokedAt: new Date(),
    };

    // Update in MongoDB
    const updated = await DeviceSession.findOneAndUpdate(
      { clerkId, sessionId: sessionIdToRevoke },
      {
        $set: {
          status: 'revoked',
          revokedAt: new Date(),
          revokedBy,
        }
      },
      { new: true }
    );

    // Also revoke session in Clerk
    try {
      await clerkClient.sessions.revokeSession(sessionIdToRevoke);
    } catch (clerkErr) {
      console.debug('Clerk revokeSession notice:', clerkErr?.message);
    }

    // Immediately push disconnect notification to the target device via Socket.io
    const disconnectDeviceSession = req.app.get('disconnectDeviceSession');
    const disconnectPayload = {
      sessionId: sessionIdToRevoke,
      reason: 'remote_logout',
      title: 'Session Disconnected',
      message: 'Your account was logged out from another device.',
      revokedBy,
      revokedAt: new Date(),
    };

    let socketsNotified = 0;
    if (typeof disconnectDeviceSession === 'function') {
      socketsNotified = disconnectDeviceSession(sessionIdToRevoke, disconnectPayload);
    }

    // Broadcast session update to remaining user sockets to update UI
    const emitToUserSockets = req.app.get('emitToUserSockets');
    if (typeof emitToUserSockets === 'function') {
      emitToUserSockets(clerkId, 'device_sessions_updated', {
        revokedSessionId: sessionIdToRevoke,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Device session revoked successfully',
      socketsNotified,
      session: updated,
    });
  } catch (error) {
    console.error('Error in /api/device-sessions/revoke:', error);
    return res.status(500).json({ success: false, message: 'Failed to revoke device session' });
  }
});

// 4. Revoke ALL other device sessions (Logout from all other devices)
router.post('/revoke-all-others', async (req, res) => {
  try {
    const { clerkId, currentSessionId, currentDeviceInfo } = req.body;

    if (!clerkId || !currentSessionId) {
      return res.status(400).json({ success: false, message: 'clerkId and currentSessionId are required' });
    }

    const revokedBy = {
      deviceName: currentDeviceInfo?.deviceName || `${currentDeviceInfo?.browser || 'Web Browser'} on ${currentDeviceInfo?.os || 'Device'}`,
      browser: currentDeviceInfo?.browser || 'Unknown Browser',
      os: currentDeviceInfo?.os || 'Unknown OS',
      ipAddress: currentDeviceInfo?.ip || getClientIp(req),
      city: currentDeviceInfo?.city || '',
      country: currentDeviceInfo?.country || '',
      revokedAt: new Date(),
    };

    // Find all other active sessions
    const otherSessions = await DeviceSession.find({
      clerkId,
      sessionId: { $ne: currentSessionId },
      status: 'active',
    });

    const disconnectDeviceSession = req.app.get('disconnectDeviceSession');
    const emitToUserSockets = req.app.get('emitToUserSockets');

    let revokedCount = 0;

    for (const sess of otherSessions) {
      sess.status = 'revoked';
      sess.revokedAt = new Date();
      sess.revokedBy = revokedBy;
      await sess.save();

      // Revoke in Clerk
      try {
        await clerkClient.sessions.revokeSession(sess.sessionId);
      } catch (e) {}

      // Push real-time disconnect notification
      if (typeof disconnectDeviceSession === 'function') {
        disconnectDeviceSession(sess.sessionId, {
          sessionId: sess.sessionId,
          reason: 'remote_logout',
          title: 'Session Disconnected',
          message: 'Your account was logged out from another device.',
          revokedBy,
          revokedAt: new Date(),
        });
      }

      revokedCount++;
    }

    if (typeof emitToUserSockets === 'function') {
      emitToUserSockets(clerkId, 'device_sessions_updated', {
        revokedAllOthers: true,
        currentSessionId,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully logged out of ${revokedCount} other device(s)`,
      revokedCount,
    });
  } catch (error) {
    console.error('Error in /api/device-sessions/revoke-all-others:', error);
    return res.status(500).json({ success: false, message: 'Failed to revoke other sessions' });
  }
});

// 5. Check if the current device session is still valid or has been revoked
router.get('/check-status', async (req, res) => {
  try {
    const { clerkId, sessionId } = req.query;

    if (!clerkId || !sessionId) {
      return res.status(400).json({ success: false, message: 'clerkId and sessionId are required' });
    }

    const session = await DeviceSession.findOne({ clerkId, sessionId });

    if (!session) {
      return res.status(200).json({
        success: true,
        active: true,
        isNew: true,
      });
    }

    if (session.status === 'revoked') {
      return res.status(200).json({
        success: true,
        active: false,
        revoked: true,
        revokedBy: session.revokedBy,
        revokedAt: session.revokedAt,
      });
    }

    // Touch last active
    session.lastActiveAt = new Date();
    await session.save();

    return res.status(200).json({
      success: true,
      active: true,
      session,
    });
  } catch (error) {
    console.error('Error in /api/device-sessions/check-status:', error);
    return res.status(500).json({ success: false, message: 'Failed to check session status' });
  }
});

export default router;
