import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
  try {
    const { clerkId, subscription } = req.body;
    
    if (!clerkId || !subscription) {
      return res.status(400).json({ error: 'Missing clerkId or subscription' });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if subscription already exists (matching endpoint)
    const exists = user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
    
    if (!exists) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }

    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Error subscribing to push:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', async (req, res) => {
  try {
    const { clerkId, endpoint } = req.body;
    
    if (!clerkId || !endpoint) {
      return res.status(400).json({ error: 'Missing clerkId or endpoint' });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.pushSubscriptions = user.pushSubscriptions.filter(sub => sub.endpoint !== endpoint);
    await user.save();

    res.status(200).json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// Update global push preferences
router.put('/preferences', async (req, res) => {
  try {
    const { clerkId, pushEnabled } = req.body;
    
    if (!clerkId || pushEnabled === undefined) {
      return res.status(400).json({ error: 'Missing clerkId or pushEnabled' });
    }

    const user = await User.findOneAndUpdate(
      { clerkId },
      { pushEnabled },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'Preferences updated', pushEnabled: user.pushEnabled });
  } catch (error) {
    console.error('Error updating push preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get push preferences
router.get('/preferences/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    
    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ pushEnabled: user.pushEnabled });
  } catch (error) {
    console.error('Error getting push preferences:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

export default router;
