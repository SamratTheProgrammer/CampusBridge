import express from 'express';
import { Webhook } from 'svix';
import User from '../models/User.js';
import { deleteUserDataCompletely } from '../utils/userCleanup.js';

const router = express.Router();

// The webhook requires raw body, so we use express.raw middleware specifically for this route
router.post('/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    console.error('Error: Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');
    return res.status(500).json({ success: false, message: 'Server configured incorrectly' });
  }

  // Get headers
  const svix_id = req.headers['svix-id'];
  const svix_timestamp = req.headers['svix-timestamp'];
  const svix_signature = req.headers['svix-signature'];

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ success: false, message: 'Error: Missing svix headers' });
  }

  // Get body
  const payload = req.body;
  const body = payload.toString('utf8');

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET);

  let evt;

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error: Could not verify webhook:', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }

  // Do something with payload
  const { id } = evt.data;
  const eventType = evt.type;
  
  console.log(`Webhook with an ID of ${id} and type of ${eventType}`);

  try {
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { email_addresses, first_name, last_name, username, image_url, unsafe_metadata } = evt.data;
      const email = email_addresses && email_addresses.length > 0 ? email_addresses[0].email_address : '';
      
      let finalUsername = username;
      if (!finalUsername) {
        // Fallback or unique generation logic
        const baseUsername = `${first_name || ''}${last_name || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '');
        const randomSuffix = Math.floor(Math.random() * 10000);
        finalUsername = `${baseUsername || 'user'}${randomSuffix}`;
      }

      const userData = {
        clerkId: id,
        email,
        firstName: first_name || '',
        lastName: last_name || '',
        username: finalUsername,
        imageUrl: image_url || '',
        headline: unsafe_metadata?.headline || '',
        location: unsafe_metadata?.location || '',
        aboutMe: unsafe_metadata?.aboutMe || '',
        resumeUrl: unsafe_metadata?.resumeUrl || '',
        experience: unsafe_metadata?.experience || [],
        education: unsafe_metadata?.education || [],
        skills: unsafe_metadata?.skills || [],
      };

      // Check if user already exists
      let user = await User.findOne({ clerkId: id });
      
      if (user) {
        // Update
        user.email = userData.email;
        user.firstName = userData.firstName;
        user.lastName = userData.lastName;
        user.imageUrl = userData.imageUrl;
        user.headline = userData.headline;
        user.location = userData.location;
        user.aboutMe = userData.aboutMe;
        user.resumeUrl = userData.resumeUrl;
        user.experience = userData.experience;
        user.education = userData.education;
        user.skills = userData.skills;
        if (username) user.username = userData.username; // Only update if username is provided explicitly
        await user.save();
        console.log(`User updated in DB: ${id}`);
      } else {
        // Ensure uniqueness for generated username
        while (await User.findOne({ username: finalUsername })) {
            finalUsername = `${userData.username.replace(/\d+$/, '')}${Math.floor(Math.random() * 10000)}`;
        }
        userData.username = finalUsername;

        // Create
        user = new User(userData);
        await user.save();
        console.log(`User created in DB: ${id}`);
      }
    }

    if (eventType === 'user.deleted') {
      await deleteUserDataCompletely(id);
      console.log(`User and all associated data completely deleted from DB: ${id}`);
    }

    return res.status(200).json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Error saving to database:', error);
    return res.status(500).json({ success: false, message: 'Database error' });
  }
});

export default router;
