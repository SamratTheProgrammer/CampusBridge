import express from 'express';
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import { createNotificationHelper } from './notificationRoutes.js';

const router = express.Router();

// Helper to populate user details (since we use clerkId instead of ObjectId refs)
const populateUserDetails = async (connections, currentUserId) => {
  return await Promise.all(connections.map(async (conn) => {
    // If current user is requester, get recipient details. If current is recipient, get requester details.
    const targetId = conn.requesterClerkId === currentUserId ? conn.recipientClerkId : conn.requesterClerkId;
    let targetUser = await User.findOne({ clerkId: targetId });
    if (!targetUser) {
      targetUser = await Mentor.findOne({ clerkId: targetId });
    }
    
    return {
      ...conn.toObject(),
      targetUser: targetUser ? {
        id: targetUser.clerkId || targetUser._id,
        _id: targetUser.clerkId || targetUser._id,
        clerkId: targetUser.clerkId || targetUser._id,
        name: targetUser.firstName ? `${targetUser.firstName} ${targetUser.lastName || ''}`.trim() : (targetUser.name || 'User'),
        course: targetUser.education?.[0]?.degree || targetUser.headline || 'Member',
        university: targetUser.education?.[0]?.institution || targetUser.company || 'CampusBridge',
        interest: targetUser.skills?.[0] || targetUser.headline || 'Member',
        image: targetUser.imageUrl || targetUser.image,
        role: targetUser.role || 'student'
      } : { name: 'User' }
    };
  }));
};

// Create a connection request
router.post('/', async (req, res) => {
  try {
    const { requesterClerkId, recipientClerkId, message } = req.body;

    if (!requesterClerkId || !recipientClerkId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if a connection already exists
    const existing = await Connection.findOne({
      requesterClerkId,
      recipientClerkId,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existing) {
      return res.status(400).json({ message: 'Connection request already exists or is accepted' });
    }

    const connection = new Connection({
      requesterClerkId,
      recipientClerkId,
      message,
      status: 'pending'
    });

    await connection.save();

    // Trigger notification to recipient
    const sender = await User.findOne({ clerkId: requesterClerkId });
    const senderName = sender ? `${sender.firstName} ${sender.lastName || ''}`.trim() : 'A student';
    await createNotificationHelper({
      recipientClerkId,
      senderClerkId: requesterClerkId,
      type: 'connection_request',
      title: 'New Mentorship Request',
      message: `${senderName} sent you a mentorship request.`,
      link: '/mentor-dashboard/requests'
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
    const { requesterClerkId, recipientClerkId } = req.body;
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
    const responder = await User.findOne({ clerkId: connection.recipientClerkId });
    const responderName = responder ? `${responder.firstName} ${responder.lastName || ''}`.trim() : 'A mentor';
    const isAccepted = status === 'accepted';
    
    await createNotificationHelper({
      recipientClerkId: connection.requesterClerkId,
      senderClerkId: connection.recipientClerkId,
      type: isAccepted ? 'connection_accepted' : 'connection_declined',
      title: isAccepted ? 'Request Accepted! 🎉' : 'Request Declined',
      message: isAccepted 
        ? `${responderName} accepted your mentorship request!` 
        : `${responderName} declined your mentorship request.`,
      link: isAccepted ? '/dashboard/my-mentors' : '/dashboard/requests'
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
    
    // Find where user is either requester or recipient
    const connections = await Connection.find({
      $or: [{ requesterClerkId: clerkId }, { recipientClerkId: clerkId }]
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

    // Fetch users and mentors excluding connected ones and hidden ones
    const users = await User.find({ 
      clerkId: { $nin: Array.from(excludedClerkIds) },
      role: 'student',
      profileVisibility: { $ne: 'hidden' }
    }).limit(15);

    const mentors = await User.find({ 
      clerkId: { $nin: Array.from(excludedClerkIds) },
      role: { $in: ['mentor', 'alumni'] },
      profileVisibility: { $ne: 'hidden' }
    }).limit(10);

    const formatUser = (u, defaultRole) => ({
      clerkId: u.clerkId || u._id,
      name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.name || 'User'),
      role: u.role || defaultRole,
      headline: u.headline || u.bio || `${u.role || defaultRole} at CampusBridge`,
      image: u.imageUrl || u.image || null,
      institution: u.education?.[0]?.institution || u.company || 'CampusBridge',
      skills: u.skills || u.expertise || []
    });

    const suggestions = [
      ...users.map(u => formatUser(u, 'student')),
      ...mentors.map(m => formatUser(m, 'mentor'))
    ];

    res.status(200).json(suggestions);
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
      const regex = new RegExp(q.trim(), 'i');
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

      return {
        clerkId: uId,
        name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.name || 'User'),
        role: u.role || 'student',
        headline: u.headline || u.bio || `${u.role || 'Student'} at CampusBridge`,
        image: u.imageUrl || u.image || null,
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
