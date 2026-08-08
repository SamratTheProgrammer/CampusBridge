import express from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

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

// Helper to create notification internally
export const createNotificationHelper = async ({ recipientClerkId, senderClerkId, type, title, message, link }) => {
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

    if (senderInfo.user) {
      senderName = `${senderInfo.user.firstName} ${senderInfo.user.lastName || ''}`.trim();
      senderImage = senderInfo.user.imageUrl;
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

// Get all notifications for a user
router.get('/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    if (!clerkId || clerkId === 'undefined') {
      return res.status(200).json({ notifications: [], unreadCount: 0 });
    }

    const { allIds } = await resolveUserIdentifiers(clerkId);

    const notifications = await Notification.find({ recipientClerkId: { $in: allIds } })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ recipientClerkId: { $in: allIds }, isRead: false });

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
