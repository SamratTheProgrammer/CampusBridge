import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Connection from '../models/Connection.js';
import { deleteUserDataCompletely } from '../utils/userCleanup.js';

const router = express.Router();

// Check if email already exists in MongoDB
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(200).json({
        exists: true,
        role: existingUser.role,
        message: `An account with email '${email}' is already registered as a ${existingUser.role}. You cannot create another account with the same email.`
      });
    }

    return res.status(200).json({ exists: false });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sync user from Clerk to MongoDB
router.post('/sync', async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName, role, username, imageUrl, coverPhoto } = req.body;

    if (!clerkId || !email) {
      return res.status(400).json({ message: 'clerkId and email are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists by clerkId
    let user = await User.findOne({ clerkId });

    if (user) {
      // Update existing user (preserve role if already set)
      user.email = normalizedEmail;
      if (firstName) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (imageUrl) user.imageUrl = imageUrl;
      if (coverPhoto) user.coverPhoto = coverPhoto;
      if (username && !user.username) user.username = username;
      await user.save();
      return res.status(200).json(user);
    }

    // Check if email already exists under a DIFFERENT clerkId / existing user account
    const existingEmailUser = await User.findOne({ email: normalizedEmail });
    if (existingEmailUser) {
      return res.status(400).json({
        message: `An account with email '${email}' is already registered as a ${existingEmailUser.role}. Duplicate account creation with the same email is not allowed.`,
        existingRole: existingEmailUser.role
      });
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
      email: normalizedEmail,
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

// Delete user account completely
router.delete('/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    if (!clerkId) return res.status(400).json({ message: 'User ID is required' });

    const result = await deleteUserDataCompletely(clerkId);
    
    // Result object has success boolean
    if (result && result.success === false) {
       return res.status(500).json({ message: result.message || 'Failed to delete user' });
    }

    res.status(200).json({ success: true, message: 'User account and all associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ message: 'Server error during account deletion' });
  }
});

// Get all mentors
router.get('/mentors/all', async (req, res) => {
  try {
    const mentors = await User.find({ 
      role: { $in: ['mentor', 'alumni'] },
      profileVisibility: { $ne: 'hidden' }
    });
    res.status(200).json(mentors);
  } catch (error) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get suggested mentors (excluding existing friends and self)
router.get('/mentors/suggested', async (req, res) => {
  try {
    const { userId } = req.query;
    let excludedClerkIds = [];

    if (userId && userId !== 'undefined') {
      const connections = await Connection.find({
        $or: [{ requesterClerkId: userId }, { recipientClerkId: userId }],
        status: 'accepted'
      });
      excludedClerkIds = [
        userId,
        ...connections.map(c => c.requesterClerkId === userId ? c.recipientClerkId : c.requesterClerkId)
      ];
    }

    const mentors = await User.find({ 
      clerkId: { $nin: excludedClerkIds },
      role: { $in: ['mentor', 'alumni'] },
      profileVisibility: { $ne: 'hidden' }
    }).limit(5);
    res.status(200).json(mentors);
  } catch (error) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper to query user by clerkId, _id, username, or email
const findUserByIdentifier = async (identifier) => {
  if (!identifier || identifier === 'undefined') return null;
  let query = [{ clerkId: identifier }, { username: identifier }, { email: identifier.toLowerCase().trim() }];
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
      phone,
      aboutMe, 
      resumeUrl, 
      socialLinks,
      experience, 
      education, 
      skills,
      imageUrl,
      coverPhoto,
      yearsOfExperience,
      profileVisibility,
      role
    } = req.body;

    if (firstName !== undefined) targetUser.firstName = firstName;
    if (lastName !== undefined) targetUser.lastName = lastName;
    if (headline !== undefined) targetUser.headline = headline;
    if (location !== undefined) targetUser.location = location;
    if (address !== undefined) targetUser.address = address;
    if (phone !== undefined) targetUser.phone = phone;
    if (aboutMe !== undefined) targetUser.aboutMe = aboutMe;
    if (resumeUrl !== undefined) targetUser.resumeUrl = resumeUrl;
    if (socialLinks !== undefined) targetUser.socialLinks = socialLinks;
    if (experience !== undefined) targetUser.experience = experience;
    if (education !== undefined) targetUser.education = education;
    if (skills !== undefined) targetUser.skills = skills;
    if (imageUrl !== undefined) targetUser.imageUrl = imageUrl;
    if (coverPhoto !== undefined) targetUser.coverPhoto = coverPhoto;
    if (yearsOfExperience !== undefined) targetUser.yearsOfExperience = yearsOfExperience;
    if (profileVisibility !== undefined) targetUser.profileVisibility = profileVisibility;

    // Manual role update
    if (role !== undefined && ['student', 'mentor', 'alumni', 'admin'].includes(role)) {
      targetUser.role = role;
    } else if (targetUser.role === 'student') {
      // Auto-detect alumni status
      // If user has both education and experience (working), automatically promote to alumni
      if (targetUser.education && targetUser.education.length > 0 && targetUser.experience && targetUser.experience.length > 0) {
        targetUser.role = 'alumni';
      }
    }

    await targetUser.save();
    res.status(200).json(targetUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle save job
router.put('/:clerkId/save-job', async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    const targetUser = await findUserByIdentifier(req.params.clerkId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const jobIndex = targetUser.savedJobs.indexOf(jobId);
    let isSaved = false;
    
    if (jobIndex > -1) {
      // Job is already saved, unsave it
      targetUser.savedJobs.splice(jobIndex, 1);
    } else {
      // Job is not saved, save it
      targetUser.savedJobs.push(jobId);
      isSaved = true;
    }

    await targetUser.save();
    res.status(200).json({ message: 'Success', savedJobs: targetUser.savedJobs, isSaved });
  } catch (error) {
    console.error('Error toggling saved job:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get saved jobs
router.get('/:clerkId/saved-jobs', async (req, res) => {
  try {
    const targetUser = await User.findOne({ clerkId: req.params.clerkId }).populate({
      path: 'savedJobs',
      populate: { path: 'postedBy', select: 'firstName lastName email company' }
    });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(targetUser.savedJobs || []);
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user account & all associated data completely
router.delete('/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    if (!clerkId) {
      return res.status(400).json({ message: 'clerkId is required' });
    }

    await deleteUserDataCompletely(clerkId);
    res.status(200).json({ success: true, message: 'User account and all data deleted successfully' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ message: 'Failed to delete account data' });
  }
});

export default router;
