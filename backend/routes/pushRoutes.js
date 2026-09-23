import express from 'express';
import User from '../models/User.js';
import webpush from 'web-push';

const router = express.Router();

webpush.setVapidDetails(
  'mailto:admin@campusbridge.com',
  process.env.VAPID_PUBLIC_KEY || 'BMlhL-j5mjXka7n5XD9rXg7qXLPVB1xXvoFS2oCblFkbROvg77ugGmZoJC50KIElNv0oP-2YyyVRFXWrA3AeFeI',
  process.env.VAPID_PRIVATE_KEY || 'FbUJpK3tIFLJaBzLgIGyCSwVt4Unsh-2u7Aw6MPCRxI'
);

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY || 'BMlhL-j5mjXka7n5XD9rXg7qXLPVB1xXvoFS2oCblFkbROvg77ugGmZoJC50KIElNv0oP-2YyyVRFXWrA3AeFeI';
  res.status(200).json({ publicKey });
});

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
  try {
    const { clerkId, subscription } = req.body;
    
    if (!clerkId || !subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Missing clerkId or subscription' });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!Array.isArray(user.pushSubscriptions)) {
      user.pushSubscriptions = [];
    }

    // Replace existing subscription with same endpoint or add new
    const existingIndex = user.pushSubscriptions.findIndex(sub => sub.endpoint === subscription.endpoint);
    if (existingIndex !== -1) {
      user.pushSubscriptions[existingIndex] = subscription;
    } else {
      user.pushSubscriptions.push(subscription);
    }

    user.pushEnabled = true;
    await user.save();

    res.status(201).json({ message: 'Subscribed successfully', pushEnabled: true });
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

    user.pushSubscriptions = (user.pushSubscriptions || []).filter(sub => sub.endpoint !== endpoint);
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

    res.status(200).json({ 
      pushEnabled: user.pushEnabled ?? true,
      hasSubscription: Array.isArray(user.pushSubscriptions) && user.pushSubscriptions.length > 0
    });
  } catch (error) {
    console.error('Error getting push preferences:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Send a test push notification to user's device
router.post('/test-push', async (req, res) => {
  try {
    const { clerkId } = req.body;
    if (!clerkId) return res.status(400).json({ error: 'Missing clerkId' });

    const user = await User.findOne({ clerkId });
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return res.status(404).json({ error: 'No active push subscriptions found. Please enable notifications on this device.' });
    }

    const payload = JSON.stringify({
      title: 'CampusBridge Alert 🔔',
      body: 'Push notifications are active! You will receive updates even when CampusBridge is closed.',
      url: '/dashboard',
      icon: '/icon-192x192.png'
    });

    const validSubscriptions = [];
    let sentCount = 0;

    for (const sub of user.pushSubscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
        validSubscriptions.push(sub);
        sentCount++;
      } catch (err) {
        if (err.statusCode !== 404 && err.statusCode !== 410) {
          validSubscriptions.push(sub);
        }
      }
    }

    user.pushSubscriptions = validSubscriptions;
    await user.save();

    res.json({ success: true, message: `Test push sent to ${sentCount} device(s)` });
  } catch (error) {
    console.error('Test push error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
