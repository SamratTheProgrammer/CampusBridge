import express from 'express';
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import { createNotificationHelper } from './notificationRoutes.js';

const router = express.Router();

// Helper to populate user details (since we use clerkId instead of ObjectId refs)
const populateUserDetails = async (connections, currentUserId) => {
  return await Promise.all(connections.map(async (conn) => {
    // If current user is requester, get recipient details. If current is recipient, get requester details.
    const targetId = conn.requesterClerkId === currentUserId ? conn.recipientClerkId : conn.requesterClerkId;
    const targetUser = await User.findOne({ clerkId: targetId });
    
    return {
      ...conn.toObject(),
      targetUser: targetUser ? {
        id: targetUser.clerkId,
        _id: targetUser.clerkId,
        clerkId: targetUser.clerkId,
        name: targetUser.firstName + (targetUser.lastName ? ' ' + targetUser.lastName : ''),
        course: targetUser.education?.[0]?.degree || 'Course not specified',
        university: targetUser.education?.[0]?.institution || 'University not specified',
        interest: targetUser.skills?.[0] || targetUser.headline || 'Not specified',
        image: targetUser.imageUrl,
        role: targetUser.role
      } : { name: 'Unknown User' }
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

export default router;
