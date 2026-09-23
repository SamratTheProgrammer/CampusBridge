import express from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Connection from '../models/Connection.js';
import Block from '../models/Block.js';
import Post from '../models/Post.js';
import Job from '../models/Job.js';
import Event from '../models/Event.js';
import { createNotificationHelper } from './notificationRoutes.js';

const router = express.Router();

// Delete conversation for a user
router.delete('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query; // clerkId of the user requesting deletion
    
    if (!userId) {
      return res.status(400).json({ message: 'userId query parameter is required' });
    }

    // Add this user to the deletedFor array in all messages of this conversation
    await Message.updateMany(
      { conversationId },
      { $addToSet: { deletedFor: userId } }
    );

    res.status(200).json({ success: true, message: 'Conversation deleted for user' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: 'Server error deleting conversation' });
  }
});

// Get total unread count for a user across all conversations
router.get('/unread-count/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    if (!clerkId || clerkId === 'undefined') return res.status(200).json({ count: 0 });

    const unreadCount = await Message.countDocuments({
      recipientClerkId: clerkId,
      isRead: false,
      isDeleted: false,
      deletedFor: { $ne: clerkId }
    });

    res.status(200).json({ count: unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get list of active conversations/contacts for a user
router.get('/conversations/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    if (!clerkId || clerkId === 'undefined') return res.status(200).json([]);

    // Find all accepted connections where user is requester or recipient
    const connections = await Connection.find({
      $or: [{ requesterClerkId: clerkId }, { recipientClerkId: clerkId }],
      status: 'accepted'
    });

    const partnerClerkIds = connections.map(c => 
      c.requesterClerkId === clerkId ? c.recipientClerkId : c.requesterClerkId
    );

    // Also find any users with whom current user has message history
    const messagePartners = await Message.find({
      $or: [{ senderClerkId: clerkId }, { recipientClerkId: clerkId }]
    }).distinct('senderClerkId');

    const messagePartnersRecipient = await Message.find({
      $or: [{ senderClerkId: clerkId }, { recipientClerkId: clerkId }]
    }).distinct('recipientClerkId');

    const allPartnerIds = Array.from(new Set([
      ...partnerClerkIds,
      ...messagePartners,
      ...messagePartnersRecipient
    ])).filter(id => id && id !== clerkId);

    // Build contacts details with latest message & unread count
    const contacts = await Promise.all(
      allPartnerIds.map(async (partnerId) => {
        const partnerUser = await User.findOne({ clerkId: partnerId });
        if (!partnerUser) return null;

        const conversationId = Message.getConversationId(clerkId, partnerId);
        const lastMessage = await Message.findOne({ 
          conversationId,
          deletedFor: { $ne: clerkId },
          $nor: [
            {
              type: 'text',
              text: {
                $in: [
                  'Missed video call',
                  'Missed voice call',
                  'Declined video call',
                  'Declined voice call'
                ]
              }
            }
          ]
        }).sort({ createdAt: -1 });
        const unreadCount = await Message.countDocuments({
          conversationId,
          recipientClerkId: clerkId,
          isRead: false,
          isDeleted: false,
          deletedFor: { $ne: clerkId }
        });

        let displayLastMessage = 'Start a conversation';
        if (lastMessage) {
          if (lastMessage.isDeleted) {
            displayLastMessage = '🚫 This message was deleted';
          } else if (lastMessage.type === 'call_log') {
            const isVideo = lastMessage.callInfo?.callType === 'video';
            displayLastMessage = `${isVideo ? '📹' : '📞'} ${lastMessage.text || 'Call'}`;
          } else if (lastMessage.type === 'share') {
            displayLastMessage = `🔗 Shared ${lastMessage.share?.type || 'item'}`;
          } else if (
            lastMessage.type === 'voice' || 
            lastMessage.type === 'audio' || 
            lastMessage.attachment?.type === 'audio' || 
            lastMessage.attachment?.name === 'Voice Message' || 
            (typeof lastMessage.attachment?.name === 'string' && /\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(lastMessage.attachment.name))
          ) {
            displayLastMessage = `🎙️ ${lastMessage.attachment?.name || 'Voice Message'}`;
          } else if (lastMessage.attachment && lastMessage.attachment.name) {
            displayLastMessage = `📄 ${lastMessage.attachment.name}`;
          } else {
            displayLastMessage = lastMessage.text || `[${lastMessage.type || 'Attachment'}]`;
          }
        }

        return {
          id: partnerUser.clerkId,
          clerkId: partnerUser.clerkId,
          name: `${partnerUser.firstName} ${partnerUser.lastName || ''}`.trim(),
          role: partnerUser.headline || partnerUser.role || 'Member',
          userRole: partnerUser.role || 'student',
          headline: partnerUser.headline || `${(partnerUser.role ? partnerUser.role.charAt(0).toUpperCase() + partnerUser.role.slice(1) : 'Member')} at CampusBridge`,
          image: partnerUser.imageUrl,
          username: partnerUser.username,
          conversationId,
          lastMessage: displayLastMessage,
          lastMessageTime: lastMessage ? lastMessage.createdAt : null,
          unread: unreadCount,
        };
      })
    );

    const validContacts = contacts.filter(Boolean);
    // Sort contacts by last message time (most recent first)
    validContacts.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });

    res.status(200).json(validContacts);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get message history for a conversation
router.get('/:conversationId', async (req, res) => {
  try {
    const { userId } = req.query;
    const { conversationId } = req.params;

    // Validate that the requester belongs to this conversation
    const participants = conversationId.split('_');
    if (participants.length === 2) {
      if (!userId || !participants.includes(userId)) {
        return res.status(403).json({ message: 'Forbidden: You are not a participant in this conversation' });
      }
    }

    let query = { conversationId };
    if (userId) {
      query.deletedFor = { $ne: userId };
    }
    const messages = await Message.find(query).sort({ createdAt: 1 });

    // Clean up / filter out redundant duplicate text messages created by call logging bug
    const isCallLogDuplicateText = (m) => {
      if (m.type !== 'call_log' && typeof m.text === 'string') {
        const t = m.text.trim().toLowerCase();
        return (
          t === 'missed video call' ||
          t === 'missed voice call' ||
          t === 'declined video call' ||
          t === 'declined voice call' ||
          t.startsWith('video call •') ||
          t.startsWith('voice call •')
        );
      }
      return false;
    };

    // Purge duplicate text messages from DB in background
    Message.deleteMany({
      conversationId,
      type: 'text',
      text: {
        $in: [
          'Missed video call',
          'Missed voice call',
          'Declined video call',
          'Declined voice call'
        ]
      }
    }).catch(() => {});

    const cleanMessages = messages.filter((m) => !isCallLogDuplicateText(m));
    res.status(200).json(cleanMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all messages as read in a conversation for user
router.put('/read/:conversationId', async (req, res) => {
  try {
    const { clerkId } = req.body;
    if (!clerkId) return res.status(400).json({ message: 'clerkId is required' });

    await Message.updateMany(
      { conversationId: req.params.conversationId, recipientClerkId: clerkId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete conversation for a user
router.delete('/conversation/:conversationId', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    // Mark all messages in this conversation as deleted for this user
    await Message.updateMany(
      { conversationId: req.params.conversationId },
      { $addToSet: { deletedFor: userId } }
    );

    res.status(200).json({ message: 'Conversation deleted' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Post a new message REST fallback
router.post('/', async (req, res) => {
  try {
    const { senderClerkId, recipientClerkId, text } = req.body;
    if (!senderClerkId || !recipientClerkId || !text) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const conversationId = Message.getConversationId(senderClerkId, recipientClerkId);

    const message = new Message({
      conversationId,
      senderClerkId,
      recipientClerkId,
      text
    });

    await message.save();

    // Trigger notification
    const sender = await User.findOne({ clerkId: senderClerkId });
    const senderName = sender ? `${sender.firstName} ${sender.lastName || ''}`.trim() : 'Someone';

    const notifText = text ? (text.length > 40 ? text.substring(0, 40) + '...' : text) : 'Sent an attachment';

    await createNotificationHelper({
      recipientClerkId,
      senderClerkId,
      type: 'system',
      title: `New message from ${senderName}`,
      message: notifText,
      link: '/dashboard/messages'
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save Call Log History into DB
router.post('/call-log', async (req, res) => {
  try {
    const { senderClerkId, recipientClerkId, callType, status, duration } = req.body;
    if (!senderClerkId || !recipientClerkId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const conversationId = Message.getConversationId(senderClerkId, recipientClerkId);
    
    // Format descriptive text for call log
    let text = '';
    const formattedDuration = duration > 0 
      ? `${Math.floor(duration / 60)}m ${duration % 60}s` 
      : '';

    if (status === 'completed') {
      text = `${callType === 'video' ? 'Video' : 'Voice'} call • ${formattedDuration}`;
    } else if (status === 'missed') {
      text = `Missed ${callType === 'video' ? 'video' : 'voice'} call`;
    } else {
      text = `Declined ${callType === 'video' ? 'video' : 'voice'} call`;
    }

    const callLogMessage = new Message({
      conversationId,
      senderClerkId,
      recipientClerkId,
      type: 'call_log',
      text,
      callInfo: {
        callType: callType || 'video',
        status: status || 'completed',
        duration: duration || 0
      }
    });

    await callLogMessage.save();

    const io = req.app?.get('io') || req.io;
    const emitToUserSockets = req.app?.get('emitToUserSockets');

    if (io) {
      io.to(conversationId).emit('receive_message', callLogMessage);
    }
    if (emitToUserSockets) {
      emitToUserSockets(recipientClerkId, 'receive_message', callLogMessage);
      emitToUserSockets(senderClerkId, 'receive_message', callLogMessage);

      const sender = await User.findOne({ clerkId: senderClerkId });
      const senderName = sender ? `${sender.firstName} ${sender.lastName || ''}`.trim() : 'Someone';
      const isVideo = (callType || 'video') === 'video';
      const displaySnippet = `${isVideo ? '📹' : '📞'} ${text}`;

      emitToUserSockets(recipientClerkId, 'update_sidebar', {
        ...callLogMessage.toObject(),
        lastMessage: displaySnippet,
        senderName,
        senderImage: sender?.imageUrl
      });
      emitToUserSockets(senderClerkId, 'update_sidebar', {
        ...callLogMessage.toObject(),
        lastMessage: displaySnippet,
        senderName,
        senderImage: sender?.imageUrl
      });
    }

    res.status(201).json(callLogMessage);
  } catch (error) {
    console.error('Error saving call log:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle Block / Unblock User
router.post('/block', async (req, res) => {
  try {
    const { blockerClerkId, blockedClerkId } = req.body;
    if (!blockerClerkId || !blockedClerkId) {
      return res.status(400).json({ message: 'blockerClerkId and blockedClerkId are required' });
    }

    const existingBlock = await Block.findOne({ blockerClerkId, blockedClerkId });
    if (existingBlock) {
      await Block.deleteOne({ _id: existingBlock._id });
      return res.status(200).json({ isBlocked: false, message: 'User unblocked successfully' });
    } else {
      const newBlock = new Block({ blockerClerkId, blockedClerkId });
      await newBlock.save();
      return res.status(201).json({ isBlocked: true, message: 'User blocked successfully' });
    }
  } catch (error) {
    console.error('Error toggling block status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get List of Blocked User IDs for a user
router.get('/blocked/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    const blocks = await Block.find({ blockerClerkId: clerkId });
    const blockedIds = blocks.map(b => b.blockedClerkId);
    res.status(200).json(blockedIds);
  } catch (error) {
    console.error('Error fetching blocked list:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit message REST API
router.put('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { newText, userId } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.isDeleted || message.senderClerkId !== userId || message.type !== 'text') {
      return res.status(403).json({ message: 'Cannot edit this message' });
    }

    message.text = newText;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    if (req.io) {
      req.io.to(message.conversationId).emit('message_edited', {
        messageId,
        newText,
        editedAt: message.editedAt
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete message REST API
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { type, userId } = req.query;

    let message = null;
    if (mongoose.Types.ObjectId.isValid(messageId)) {
      message = await Message.findById(messageId);
    } else {
      message = await Message.findOne({ _id: messageId });
    }
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const io = req.app?.get('io') || req.io;

    if (type === 'me') {
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
        await message.save();
      }
      if (io) {
        io.to(message.conversationId).emit('message_deleted_for_me', { 
          messageId: message._id.toString(), 
          userId,
          conversationId: message.conversationId
        });
      }
    } else if (type === 'everyone') {
      if (message.senderClerkId === userId) {
        message.isDeleted = true;
        message.text = '';
        message.attachment = null;
        await message.save();

        if (io) {
          io.to(message.conversationId).emit('message_deleted_for_everyone', { 
            messageId: message._id.toString(),
            conversationId: message.conversationId
          });
        }
      }
    }

    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Restore deleted message (Undo delete)
router.post('/:messageId/restore', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, type, originalText, originalAttachment } = req.body;

    let message = null;
    if (mongoose.Types.ObjectId.isValid(messageId)) {
      message = await Message.findById(messageId);
    } else {
      message = await Message.findOne({ _id: messageId });
    }
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const io = req.app?.get('io') || req.io;

    if (type === 'me') {
      message.deletedFor = message.deletedFor.filter(id => id !== userId);
      await message.save();
      if (io) {
        io.to(message.conversationId).emit('message_restored_me', {
          messageId: message._id.toString(),
          userId,
          conversationId: message.conversationId
        });
      }
    } else if (type === 'everyone') {
      if (message.senderClerkId === userId) {
        message.isDeleted = false;
        if (originalText !== undefined) message.text = originalText;
        if (originalAttachment !== undefined) message.attachment = originalAttachment;
        await message.save();

        if (io) {
          io.to(message.conversationId).emit('message_restored_everyone', {
            messageId: message._id.toString(),
            message,
            conversationId: message.conversationId
          });
        }
      }
    }

    res.status(200).json({ success: true, message: 'Message restored', data: message });
  } catch (error) {
    console.error('Error restoring message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Share an item (post, job, event) via chat
router.post('/share', async (req, res) => {
  try {
    const { senderClerkId, recipientIds, shareType, itemId } = req.body;

    if (!senderClerkId || !recipientIds || !recipientIds.length || !shareType || !itemId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const typeModelMap = {
      'post': 'Post',
      'job': 'Job',
      'event': 'Event',
      'profile': 'User'
    };

    const typeModel = typeModelMap[shareType];
    if (!typeModel) {
      return res.status(400).json({ success: false, message: 'Invalid share type' });
    }

    let title = '';
    let description = '';
    let imageUrl = '';

    try {
      if (shareType === 'post') {
        const post = await Post.findById(itemId);
        if (post) {
          title = 'Post';
          description = post.content ? (post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '')) : '';
          if (post.images && post.images.length > 0) imageUrl = post.images[0];
        }
      } else if (shareType === 'job') {
        const job = await Job.findById(itemId);
        if (job) {
          title = job.title;
          description = `${job.company} • ${job.location}`;
          imageUrl = job.companyLogo;
        }
      } else if (shareType === 'event') {
        const event = await Event.findById(itemId);
        if (event) {
          title = event.name;
          description = `${new Date(event.date).toLocaleDateString()} • ${event.type}`;
          imageUrl = event.image;
        }
      } else if (shareType === 'profile') {
        const query = [{ clerkId: itemId }, { username: itemId }];
        if (mongoose.Types.ObjectId.isValid(itemId)) {
          query.push({ _id: itemId });
        }
        const profileUser = await User.findOne({ $or: query });
        if (profileUser) {
          title = `${profileUser.firstName || ''} ${profileUser.lastName || ''}`.trim() || profileUser.name || profileUser.username || 'User Profile';
          description = profileUser.headline || (profileUser.role ? `${profileUser.role.charAt(0).toUpperCase() + profileUser.role.slice(1)} • CampusBridge` : 'CampusBridge Member');
          imageUrl = profileUser.imageUrl || profileUser.photoUrl || profileUser.image;
        } else {
          title = 'User Profile';
          description = 'View profile on CampusBridge';
        }
      }
    } catch (err) {
      console.error('Error fetching share item details:', err);
    }

    const savedMessages = [];

    for (const recipientId of recipientIds) {
      // Check block status
      const blockExists = await Block.findOne({
        $or: [
          { blockerId: senderClerkId, blockedId: recipientId },
          { blockerId: recipientId, blockedId: senderClerkId }
        ]
      });

      if (blockExists) continue; // Skip blocked users

      const conversationId = Message.getConversationId(senderClerkId, recipientId);

      const newMessage = new Message({
        conversationId,
        senderClerkId,
        recipientClerkId: recipientId,
        type: 'share',
        share: {
          type: shareType,
          itemId,
          typeModel,
          title,
          description,
          imageUrl
        }
      });

      await newMessage.save();
      savedMessages.push(newMessage);

      if (req.io) {
        req.io.to(conversationId).emit('receive_message', newMessage);
        req.io.to(conversationId).emit('new_message', newMessage);
      }
    }

    res.status(200).json({ success: true, messages: savedMessages });
  } catch (error) {
    console.error('Error sharing item via message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
