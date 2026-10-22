import express from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:admin@campusbridge.com',
  process.env.VAPID_PUBLIC_KEY || 'BMlhL-j5mjXka7n5XD9rXg7qXLPVB1xXvoFS2oCblFkbROvg77ugGmZoJC50KIElNv0oP-2YyyVRFXWrA3AeFeI',
  process.env.VAPID_PRIVATE_KEY || 'FbUJpK3tIFLJaBzLgIGyCSwVt4Unsh-2u7Aw6MPCRxI'
);

const router = express.Router();

// Helper to resolve any user identifier (clerkId, _id, or username) to primary clerkId & all user IDs
const resolveUserIdentifiers = async (identifier) => {
  if (!identifier || identifier === 'undefined') return { primaryClerkId: null, allIds: [] };

  let query = [{ clerkId: identifier }, { username: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.push({ _id: identifier });
  }

  const user = await User.findOne({ $or: query });
  if (user) {
    const allIds = Array.from(new Set([user.clerkId, String(user._id), user.username].filter(Boolean)));
    return { primaryClerkId: user.clerkId, allIds, user };
  }

  return { primaryClerkId: identifier, allIds: [identifier], user: null };
};

let globalIoInstance = null;
export const setNotificationIo = (io) => {
  globalIoInstance = io;
};
export const getNotificationIo = () => globalIoInstance;

// Helper to create notification internally
export const createNotificationHelper = async ({ recipientClerkId, senderClerkId, type, title, message, link, io }) => {
  try {
    if (!recipientClerkId) return null;

    const recipientInfo = await resolveUserIdentifiers(recipientClerkId);
    const senderInfo = await resolveUserIdentifiers(senderClerkId);

    const finalRecipient = recipientInfo.primaryClerkId || recipientClerkId;
    const finalSender = senderInfo.primaryClerkId || senderClerkId;

    if (!finalRecipient || (finalSender && finalRecipient === finalSender)) {
      return null; // don't notify self
    }

    let senderName = '';
    let senderImage = '';

    if (finalSender === 'admin' || type === 'admin' || type === 'admin_warning') {
      senderName = 'CampusBridge Admin';
      senderImage = '/icon-192x192.png';
    } else if (senderInfo.user) {
      senderName = `${senderInfo.user.firstName || ''} ${senderInfo.user.lastName || ''}`.trim() || senderInfo.user.username || 'User';
      senderImage = senderInfo.user.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(senderName)}`;
    } else if (finalSender && finalSender !== 'system') {
      senderName = 'User';
      senderImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(finalSender)}`;
    } else {
      senderName = 'CampusBridge';
      senderImage = '/icon-192x192.png';
    }

    const notification = new Notification({
      recipientClerkId: finalRecipient,
      senderClerkId: finalSender,
      senderName,
      senderImage,
      type,
      title,
      message,
      link,
    });

    await notification.save();

    const activeIo = io || globalIoInstance;
    if (activeIo) {
      activeIo.emit('new_notification', notification);
    }

    // Web Push Logic
    const isPushAllowed = recipientInfo.user && recipientInfo.user.pushEnabled !== false;
    if (isPushAllowed && Array.isArray(recipientInfo.user.pushSubscriptions) && recipientInfo.user.pushSubscriptions.length > 0) {
      const payload = JSON.stringify({
        title: notification.title || 'CampusBridge',
        body: notification.message || 'You have a new update.',
        url: notification.link || '/',
        icon: senderImage || '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: `cb-${notification.type || 'alert'}-${Date.now()}`
      });

      const validSubscriptions = [];
      let subsChanged = false;

      for (const sub of recipientInfo.user.pushSubscriptions) {
        try {
          await webpush.sendNotification(sub, payload);
          validSubscriptions.push(sub);
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            subsChanged = true;
          } else {
            validSubscriptions.push(sub);
            console.error('Web push error:', err?.message || err);
          }
        }
      }

      if (subsChanged) {
        recipientInfo.user.pushSubscriptions = validSubscriptions;
        await recipientInfo.user.save();
      }
    }

    return notification;
  } catch (error) {
    console.error('Error in createNotificationHelper:', error);
    return null;
  }
};

// Create a new notification via API
router.post('/', async (req, res) => {
  try {
    const { recipientClerkId, senderClerkId, type, title, message, link } = req.body;
    if (!recipientClerkId || !title || !message) {
      return res.status(400).json({ message: 'Recipient, title, and message are required' });
    }

    const notification = await createNotificationHelper({
      recipientClerkId,
      senderClerkId,
      type,
      title,
      message,
      link
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all notifications for a user (dynamically resolved with latest sender DP & name)
router.get('/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    if (!clerkId || clerkId === 'undefined') {
      return res.status(200).json({ notifications: [], unreadCount: 0 });
    }

    const { allIds } = await resolveUserIdentifiers(clerkId);

    const rawNotifications = await Notification.find({ recipientClerkId: { $in: allIds } })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({ recipientClerkId: { $in: allIds }, isRead: false });

    // Collect all unique sender identifiers
    const senderClerkIds = Array.from(new Set(rawNotifications.map(n => n.senderClerkId).filter(Boolean)));

    const userQueries = [
      { clerkId: { $in: senderClerkIds } },
      { username: { $in: senderClerkIds } }
    ];
    const validObjectIds = senderClerkIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validObjectIds.length > 0) {
      userQueries.push({ _id: { $in: validObjectIds } });
    }

    const senderUsers = senderClerkIds.length > 0
      ? await User.find({ $or: userQueries }, 'clerkId username firstName lastName imageUrl').lean()
      : [];

    const userMap = new Map();
    senderUsers.forEach(u => {
      if (u.clerkId) userMap.set(u.clerkId, u);
      if (u.username) userMap.set(u.username, u);
      if (u._id) userMap.set(String(u._id), u);
    });

    // Dynamically assign current profile picture & name
    const notifications = rawNotifications.map(n => {
      let dynamicImage = n.senderImage;
      let dynamicName = n.senderName;

      if (n.senderClerkId === 'admin' || n.type === 'admin' || n.type === 'admin_warning') {
        dynamicImage = '/icon-192x192.png';
        if (!dynamicName) dynamicName = 'CampusBridge Admin';
      } else {
        const senderUser = n.senderClerkId ? userMap.get(n.senderClerkId) : null;
        if (senderUser) {
          const fullName = `${senderUser.firstName || ''} ${senderUser.lastName || ''}`.trim();
          dynamicName = fullName || senderUser.username || n.senderName || 'User';
          if (senderUser.imageUrl && senderUser.imageUrl.trim() !== '') {
            dynamicImage = senderUser.imageUrl;
          } else {
            dynamicImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(dynamicName)}`;
          }
        } else {
          if (!dynamicImage || dynamicImage.trim() === '') {
            const seed = dynamicName || n.senderClerkId || 'User';
            dynamicImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
          }
        }
      }

      return {
        ...n,
        senderName: dynamicName || 'User',
        senderImage: dynamicImage
      };
    });

    // Asynchronously backfill notifications in DB where senderImage was missing or out of date
    const bulkUpdates = [];
    rawNotifications.forEach(raw => {
      const updated = notifications.find(x => String(x._id) === String(raw._id));
      if (updated && (raw.senderImage !== updated.senderImage || raw.senderName !== updated.senderName)) {
        bulkUpdates.push({
          updateOne: {
            filter: { _id: raw._id },
            update: { $set: { senderImage: updated.senderImage, senderName: updated.senderName } }
          }
        });
      }
    });

    if (bulkUpdates.length > 0) {
      Notification.bulkWrite(bulkUpdates).catch(err => console.debug('Backfill bulkWrite skipped:', err.message));
    }

    res.status(200).json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a single notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json(notification);
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read for a user
router.put('/read-all/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    const { allIds } = await resolveUserIdentifiers(clerkId);
    await Notification.updateMany(
      { recipientClerkId: { $in: allIds }, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a single notification
router.delete('/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear all notifications for a user
router.delete('/clear-all/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    const { allIds } = await resolveUserIdentifiers(clerkId);
    await Notification.deleteMany({ recipientClerkId: { $in: allIds } });
    res.status(200).json({ message: 'All notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
