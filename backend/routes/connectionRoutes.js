import express from 'express';
import mongoose from 'mongoose';
import { clerkClient } from '@clerk/clerk-sdk-node';
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import { createNotificationHelper } from './notificationRoutes.js';
import { escapeRegex } from '../utils/regexHelper.js';

const router = express.Router();

// Helper to query user by clerkId, _id, username, or email
const findUserByIdentifier = async (identifier) => {
  if (!identifier || identifier === 'undefined') return null;
  let query = [{ clerkId: identifier }, { username: identifier }, { email: String(identifier).toLowerCase().trim() }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.push({ _id: identifier });
  }
  return await User.findOne({ $or: query });
};

// Helper to populate user details (supports clerkId or ObjectId refs)
const populateUserDetails = async (connections, currentUserId) => {
  const currentUser = await findUserByIdentifier(currentUserId);
  const currentUserIds = new Set([
    currentUserId,
    currentUser?.clerkId,
    currentUser?._id ? String(currentUser._id) : null,
    currentUser?.username
  ].filter(Boolean));

  return await Promise.all(connections.map(async (conn) => {
    // If current user is requester, get recipient details. If current is recipient, get requester details.
    const isRequester = currentUserIds.has(conn.requesterClerkId);
    const targetId = isRequester ? conn.recipientClerkId : conn.requesterClerkId;

    let targetUser = await findUserByIdentifier(targetId);
    if (!targetUser) {
      targetUser = await Mentor.findOne({
        $or: [
          { clerkId: targetId },
          ...(mongoose.Types.ObjectId.isValid(targetId) ? [{ _id: targetId }] : [])
        ]
      });
    }
    
    return {
      ...conn.toObject(),
      targetUser: targetUser ? {
        id: targetUser.clerkId || String(targetUser._id),
        _id: String(targetUser._id),
        clerkId: targetUser.clerkId || String(targetUser._id),
        name: targetUser.firstName ? `${targetUser.firstName} ${targetUser.lastName || ''}`.trim() : (targetUser.name || 'User'),
        course: targetUser.education?.[0]?.degree || targetUser.headline || 'Member',
        university: targetUser.education?.[0]?.institution || targetUser.company || 'CampusBridge',
        interest: targetUser.skills?.[0] || targetUser.headline || 'Member',
        image: targetUser.imageUrl || targetUser.image,
        username: targetUser.username,
        role: targetUser.role || (targetUser.company || targetUser.headline?.toLowerCase().includes('mentor') ? 'mentor' : 'student')
      } : { name: 'User' }
    };
  }));
};

// Create a connection request
router.post('/', async (req, res) => {
  try {
    const requesterClerkId = req.body.requesterClerkId || req.body.senderClerkId || req.body.senderId;
    const recipientClerkId = req.body.recipientClerkId || req.body.receiverClerkId || req.body.receiverId;
    const message = req.body.message;

    if (!requesterClerkId || !recipientClerkId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (requesterClerkId === recipientClerkId) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }

    // 1. Check if recipient has ALREADY sent a pending request to this requester!
    // Auto-accept it directly instead of throwing an error, and notify the original sender.
    const reversePending = await Connection.findOne({
      requesterClerkId: recipientClerkId,
      recipientClerkId: requesterClerkId,
      status: 'pending'
    });

    if (reversePending) {
      reversePending.status = 'accepted';
      await reversePending.save();

      // Trigger notification to original requester (recipientClerkId)
      const [responder, originalSender] = await Promise.all([
        User.findOne({ clerkId: requesterClerkId }),
        User.findOne({ clerkId: recipientClerkId })
      ]);

      const responderName = responder ? `${responder.firstName} ${responder.lastName || ''}`.trim() : 'User';
      const responderRole = (responder?.role || 'student').toLowerCase();
      const originalSenderRole = (originalSender?.role || 'student').toLowerCase();

      const isMentorship = (originalSenderRole === 'student' && responderRole === 'mentor') || (responderRole === 'student' && originalSenderRole === 'mentor');

      const acceptTitle = 'Request Accepted! 🎉';
      const acceptMessage = isMentorship
        ? `${responderName} accepted your mentorship request!`
        : `${responderName} accepted your connection request!`;

      const notifLink = originalSenderRole === 'mentor' ? '/mentor-dashboard/network' : '/dashboard/network';

      await createNotificationHelper({
        recipientClerkId,
        senderClerkId: requesterClerkId,
        type: 'connection_accepted',
        title: acceptTitle,
        message: acceptMessage,
        link: notifLink
      });

      return res.status(200).json({
        ...reversePending.toObject(),
        autoAccepted: true,
        message: 'They already sent you a connection request! Connected successfully! 🎉'
      });
    }

    // 2. Check if a connection already exists in either direction
    const existing = await Connection.findOne({
      $or: [
        { requesterClerkId, recipientClerkId },
        { requesterClerkId: recipientClerkId, recipientClerkId: requesterClerkId }
      ],
      status: { $in: ['pending', 'accepted'] }
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(200).json({
          ...existing.toObject(),
          alreadyConnected: true,
          message: 'You are already connected!'
        });
      }
      return res.status(400).json({ message: 'Connection request already exists and is pending' });
    }

    const connection = new Connection({
      requesterClerkId,
      recipientClerkId,
      message,
      status: 'pending'
    });

    await connection.save();

    // Trigger role-tailored notification to recipient
    const [sender, recipient] = await Promise.all([
      User.findOne({ clerkId: requesterClerkId }),
      User.findOne({ clerkId: recipientClerkId })
    ]);

    const senderName = sender ? `${sender.firstName} ${sender.lastName || ''}`.trim() : 'A member';
    const senderRole = (sender?.role || 'student').toLowerCase();
    const recipientRole = (recipient?.role || 'student').toLowerCase();

    let title = 'New Connection Request';
    let notifMessage = `${senderName} sent you a connection request.`;

    if (senderRole === 'mentor') {
      title = 'New Mentor Connection Request';
      notifMessage = `${senderName} (Mentor) sent you a connection request.`;
    } else if (senderRole === 'alumni') {
      title = 'New Alumni Connection Request';
      notifMessage = `${senderName} (Alumni) sent you a connection request.`;
    } else if (senderRole === 'student') {
      if (recipientRole === 'mentor') {
        title = 'New Mentorship Request';
        notifMessage = `${senderName} sent you a mentorship request.`;
      } else {
        title = 'New Student Connection Request';
        notifMessage = `${senderName} sent you a connection request.`;
      }
    }

    const notifLink = recipientRole === 'mentor' ? '/mentor-dashboard/requests' : '/dashboard/network';

    await createNotificationHelper({
      recipientClerkId,
      senderClerkId: requesterClerkId,
      type: 'connection_request',
      title,
      message: notifMessage,
      link: notifLink
    });

    res.status(201).json(connection);
  } catch (error) {
    console.error('Error creating connection request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update connection status (accept/decline)
router.delete('/:id', async (req, res) => {
  try {
    const connection = await Connection.findByIdAndDelete(req.params.id);
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }
    res.status(200).json({ success: true, message: 'Connection removed' });
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel a connection by requester and recipient ID
router.post('/cancel', async (req, res) => {
  try {
    const requesterClerkId = req.body.requesterClerkId || req.body.senderClerkId || req.body.senderId;
    const recipientClerkId = req.body.recipientClerkId || req.body.receiverClerkId || req.body.receiverId;
    if (!requesterClerkId || !recipientClerkId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const connection = await Connection.findOneAndDelete({
      requesterClerkId,
      recipientClerkId,
      status: 'pending'
    });
    if (!connection) {
      return res.status(404).json({ message: 'Pending connection not found' });
    }
    res.status(200).json({ success: true, message: 'Connection request cancelled' });
  } catch (error) {
    console.error('Error cancelling connection:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const connection = await Connection.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    // Trigger notification to requester
    const [responder, requester] = await Promise.all([
      User.findOne({ clerkId: connection.recipientClerkId }),
      User.findOne({ clerkId: connection.requesterClerkId })
    ]);

    const responderName = responder ? `${responder.firstName} ${responder.lastName || ''}`.trim() : 'User';
    const responderRole = (responder?.role || 'student').toLowerCase();
    const requesterRole = (requester?.role || 'student').toLowerCase();

    const isAccepted = status === 'accepted';
    const isMentorship = (requesterRole === 'student' && responderRole === 'mentor') || (responderRole === 'student' && requesterRole === 'mentor');

    let title = '';
    let message = '';
    if (isAccepted) {
      title = 'Request Accepted! 🎉';
      message = isMentorship
        ? `${responderName} accepted your mentorship request!`
        : `${responderName} accepted your connection request!`;
    } else {
      title = 'Request Declined';
      message = isMentorship
        ? `${responderName} declined your mentorship request.`
        : `${responderName} declined your connection request.`;
    }

    const acceptLink = requesterRole === 'mentor' ? '/mentor-dashboard/network' : '/dashboard/network';

    await createNotificationHelper({
      recipientClerkId: connection.requesterClerkId,
      senderClerkId: connection.recipientClerkId,
      type: isAccepted ? 'connection_accepted' : 'connection_declined',
      title,
      message,
      link: acceptLink
    });

    res.status(200).json(connection);
  } catch (error) {
    console.error('Error updating connection:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all connections for a user
router.get('/user/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    const user = await findUserByIdentifier(clerkId);
    const userIds = [clerkId, user?.clerkId, user?._id ? String(user._id) : null].filter(Boolean);
    
    // Find where user is either requester or recipient
    const connections = await Connection.find({
      $or: [
        { requesterClerkId: { $in: userIds } },
        { recipientClerkId: { $in: userIds } }
      ]
    }).sort({ createdAt: -1 });

    const enriched = await populateUserDetails(connections, clerkId);
    
    res.status(200).json(enriched);
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check connection status between two users
router.get('/status/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    
    const connection = await Connection.findOne({
      $or: [
        { requesterClerkId: userId1, recipientClerkId: userId2 },
        { requesterClerkId: userId2, recipientClerkId: userId1 }
      ]
    }).sort({ createdAt: -1 }); // get the latest if multiple exist
    
    if (!connection) {
      return res.status(200).json({ status: 'none' });
    }
    
    // Return status and also whether the requested userId1 is the requester or recipient
    res.status(200).json({ 
      status: connection.status,
      connectionId: connection._id,
      isRequester: connection.requesterClerkId === userId1
    });
  } catch (error) {
    console.error('Error checking connection status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper to shuffle array (Fisher-Yates)
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Get Suggested Connections ("People You May Know")
router.get('/suggestions/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;

    // Find existing connections to exclude
    const existingConnections = await Connection.find({
      $or: [{ requesterClerkId: clerkId }, { recipientClerkId: clerkId }]
    });

    const excludedClerkIds = new Set([
      clerkId,
      ...existingConnections.map(c => c.requesterClerkId === clerkId ? c.recipientClerkId : c.requesterClerkId)
    ]);

    // Fetch pool of students and mentors excluding connected ones and hidden ones
    const users = await User.find({ 
      clerkId: { $nin: Array.from(excludedClerkIds) },
      role: 'student',
      profileVisibility: { $ne: 'hidden' }
    }).limit(40);

    const mentors = await User.find({ 
      clerkId: { $nin: Array.from(excludedClerkIds) },
      role: { $in: ['mentor', 'alumni'] },
      profileVisibility: { $ne: 'hidden' }
    }).limit(30);

    const capitalizeRole = (r) => r ? (r.charAt(0).toUpperCase() + r.slice(1)) : 'Member';
    const formatUser = (u, defaultRole) => {
      const name = u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.name || 'User');
      if (!u.imageUrl && u.clerkId) {
        clerkClient.users.getUser(u.clerkId).then(cu => {
          if (cu?.imageUrl) {
            User.updateOne({ clerkId: u.clerkId }, { $set: { imageUrl: cu.imageUrl } }).catch(() => {});
          }
        }).catch(() => {});
      }
      return {
        clerkId: u.clerkId || u._id,
        name,
        role: u.role || defaultRole,
        headline: u.headline || u.bio || `${capitalizeRole(u.role || defaultRole)} at CampusBridge`,
        image: u.imageUrl || u.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        username: u.username,
        institution: u.education?.[0]?.institution || u.company || 'CampusBridge',
        skills: u.skills || u.expertise || []
      };
    };

    // Shuffle users and mentors independently, then combine and shuffle together
    const formattedUsers = shuffleArray(users.map(u => formatUser(u, 'student')));
    const formattedMentors = shuffleArray(mentors.map(m => formatUser(m, 'mentor')));

    const combined = shuffleArray([
      ...formattedUsers.slice(0, 15),
      ...formattedMentors.slice(0, 10)
    ]);

    res.status(200).json(combined);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Discover & Search all people with connection status (LinkedIn/Insta style)
router.get('/discover/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    const { q, role, limit = 60 } = req.query;

    // Get all existing connections involving this user
    const existingConnections = await Connection.find({
      $or: [{ requesterClerkId: clerkId }, { recipientClerkId: clerkId }]
    });

    const connMap = new Map();
    existingConnections.forEach(c => {
      const otherId = c.requesterClerkId === clerkId ? c.recipientClerkId : c.requesterClerkId;
      connMap.set(otherId, {
        status: c.status,
        isRequester: c.requesterClerkId === clerkId,
        connectionId: c._id
      });
    });

    const query = {
      clerkId: { $ne: clerkId },
      profileVisibility: { $ne: 'hidden' }
    };

    if (q && q.trim()) {
      const regex = new RegExp(escapeRegex(q.trim()), 'i');
      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { username: regex },
        { headline: regex },
        { bio: regex },
        { company: regex },
        { 'education.institution': regex },
        { skills: { $in: [regex] } },
        { expertise: { $in: [regex] } }
      ];
    }

    if (role && role !== 'all') {
      if (role === 'mentor') {
        query.role = { $in: ['mentor', 'alumni'] };
      } else if (role === 'student') {
        query.role = 'student';
      }
    }

    const users = await User.find(query)
      .limit(parseInt(limit, 10))
      .sort({ createdAt: -1 })
      .lean();

    const results = users.map(u => {
      const uId = u.clerkId || u._id.toString();
      const connInfo = connMap.get(uId);
      let connectionStatus = 'none';
      if (connInfo) {
        if (connInfo.status === 'accepted') {
          connectionStatus = 'accepted';
        } else if (connInfo.status === 'pending') {
          connectionStatus = connInfo.isRequester ? 'pending' : 'received';
        }
      }

      const name = u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.name || 'User');
      if (!u.imageUrl && uId) {
        clerkClient.users.getUser(uId).then(cu => {
          if (cu?.imageUrl) {
            User.updateOne({ clerkId: uId }, { $set: { imageUrl: cu.imageUrl } }).catch(() => {});
          }
        }).catch(() => {});
      }

      return {
        clerkId: uId,
        name,
        role: u.role || 'student',
        headline: u.headline || u.bio || `${(u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Student')} at CampusBridge`,
        image: u.imageUrl || u.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        username: u.username,
        institution: u.education?.[0]?.institution || u.company || 'CampusBridge',
        skills: u.skills || u.expertise || [],
        connectionStatus,
        connectionId: connInfo?.connectionId || null
      };
    });

    res.status(200).json(results);
  } catch (error) {
    console.error('Error in discover people:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a connection
router.delete('/:id', async (req, res) => {
  try {
    const connection = await Connection.findByIdAndDelete(req.params.id);
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }
    res.status(200).json({ message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
