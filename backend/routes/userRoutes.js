import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Sync user from Clerk to MongoDB
router.post('/sync', async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName, role, username } = req.body;

    if (!clerkId || !email) {
      return res.status(400).json({ message: 'clerkId and email are required' });
    }

    // Check if user already exists
    let user = await User.findOne({ clerkId });

    if (user) {
      // Update existing user
      user.email = email;
      user.firstName = firstName;
      user.lastName = lastName;
      if (role) user.role = role;
      if (username && !user.username) user.username = username;
      await user.save();
      return res.status(200).json(user);
    }

    // Generate a unique username if none provided
    let finalUsername = username;
    if (!finalUsername) {
      const baseUsername = `${firstName || ''}${lastName || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '');
      const randomSuffix = Math.floor(Math.random() * 10000);
      finalUsername = `${baseUsername || 'user'}${randomSuffix}`;
      
      // Ensure uniqueness
      while (await User.findOne({ username: finalUsername })) {
        finalUsername = `${baseUsername || 'user'}${Math.floor(Math.random() * 10000)}`;
      }
    }

    // Create new user
    user = new User({
      clerkId,
      email,
      username: finalUsername,
      firstName,
      lastName,
      role: role || 'student',
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get suggested mentors
router.get('/mentors/suggested', async (req, res) => {
  try {
    const mentors = await User.find({ role: { $in: ['mentor', 'alumni'] } }).limit(5);
    res.status(200).json(mentors);
  } catch (error) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/:clerkId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update username
router.put('/:clerkId/username', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Check if username is already taken by another user
    const existingUser = await User.findOne({ username });
    if (existingUser && existingUser.clerkId !== req.params.clerkId) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const user = await User.findOneAndUpdate(
      { clerkId: req.params.clerkId },
      { username },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error updating username:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/:clerkId/profile', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      headline, 
      location, 
      aboutMe, 
      resumeUrl, 
      experience, 
      education, 
      skills 
    } = req.body;

    const user = await User.findOneAndUpdate(
      { clerkId: req.params.clerkId },
      { 
        firstName, 
        lastName, 
        headline, 
        location, 
        aboutMe, 
        resumeUrl, 
        experience, 
        education, 
        skills 
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
