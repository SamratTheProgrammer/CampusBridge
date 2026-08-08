import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';

const router = express.Router();

// Sync user from Clerk to MongoDB
router.post('/sync', async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName, role, username, imageUrl, coverPhoto } = req.body;

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
      if (imageUrl) user.imageUrl = imageUrl;
      if (coverPhoto) user.coverPhoto = coverPhoto;
      if (role) user.role = role;
      if (username && !user.username) user.username = username;
      await user.save();
      return res.status(200).json(user);
    }

    // Generate a unique username if none provided (LinkedIn-style: firstname-lastname-XXXX)
    let finalUsername = username;
    if (!finalUsername) {
      const cleanFirst = (firstName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanLast = (lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const baseParts = [cleanFirst, cleanLast].filter(Boolean);
      const baseUsername = baseParts.length > 0 ? baseParts.join('-') : 'user';
      const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit number
      finalUsername = `${baseUsername}-${randomSuffix}`;
      
      // Ensure uniqueness
      while (await User.findOne({ username: finalUsername })) {
        finalUsername = `${baseUsername}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    // Create new user
    user = new User({
      clerkId,
      email,
      username: finalUsername,
      firstName,
      lastName,
      imageUrl,
      coverPhoto,
      role: role || 'student',
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all mentors
router.get('/mentors/all', async (req, res) => {
  try {
    const mentors = await User.find({ role: { $in: ['mentor', 'alumni'] } });
    res.status(200).json(mentors);
  } catch (error) {
    console.error('Error fetching mentors:', error);
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

// Helper to query user by clerkId, _id, or username
const findUserByIdentifier = async (identifier) => {
  if (!identifier || identifier === 'undefined') return null;
  let query = [{ clerkId: identifier }, { username: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.push({ _id: identifier });
  }
  return await User.findOne({ $or: query });
};

// Get user profile
router.get('/:clerkId', async (req, res) => {
  try {
    const user = await findUserByIdentifier(req.params.clerkId);
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

    const targetUser = await findUserByIdentifier(req.params.clerkId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username is already taken by another user
    const existingUser = await User.findOne({ username });
    if (existingUser && existingUser.clerkId !== targetUser.clerkId) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    targetUser.username = username;
    await targetUser.save();

    res.status(200).json(targetUser);
  } catch (error) {
    console.error('Error updating username:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/:clerkId/profile', async (req, res) => {
  try {
    const targetUser = await findUserByIdentifier(req.params.clerkId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { 
      firstName, 
      lastName, 
      headline, 
      location, 
      address,
      aboutMe, 
      resumeUrl, 
      socialLinks,
      experience, 
      education, 
      skills,
      imageUrl,
      coverPhoto
    } = req.body;

    if (firstName !== undefined) targetUser.firstName = firstName;
    if (lastName !== undefined) targetUser.lastName = lastName;
    if (headline !== undefined) targetUser.headline = headline;
    if (location !== undefined) targetUser.location = location;
    if (address !== undefined) targetUser.address = address;
    if (aboutMe !== undefined) targetUser.aboutMe = aboutMe;
    if (resumeUrl !== undefined) targetUser.resumeUrl = resumeUrl;
    if (socialLinks !== undefined) targetUser.socialLinks = socialLinks;
    if (experience !== undefined) targetUser.experience = experience;
    if (education !== undefined) targetUser.education = education;
    if (skills !== undefined) targetUser.skills = skills;
    if (imageUrl !== undefined) targetUser.imageUrl = imageUrl;
    if (coverPhoto !== undefined) targetUser.coverPhoto = coverPhoto;

    await targetUser.save();
    res.status(200).json(targetUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
