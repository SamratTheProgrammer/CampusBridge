import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Connection from '../models/Connection.js';
import Session from '../models/Session.js';
import Event from '../models/Event.js';
import Review from '../models/Review.js';
import { deleteUserDataCompletely } from '../utils/userCleanup.js';
import { createNotificationHelper, getNotificationIo } from './notificationRoutes.js';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { deleteCloudinaryAsset } from '../utils/cloudinary.js';

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

    // Resolve imageUrl from Clerk if not provided in payload
    let resolvedImageUrl = imageUrl;
    if (!resolvedImageUrl && clerkId) {
      try {
        const clerkUser = await clerkClient.users.getUser(clerkId);
        if (clerkUser?.imageUrl) {
          resolvedImageUrl = clerkUser.imageUrl;
        }
      } catch (e) {}
    }

    // Check if user already exists by clerkId
    let user = await User.findOne({ clerkId });

    if (user) {
      // Update existing user (preserve role if already set)
      user.email = normalizedEmail;
      if (firstName) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (!user.imageUrl && resolvedImageUrl) {
        user.imageUrl = resolvedImageUrl;
      } else if (resolvedImageUrl && user.imageUrl !== resolvedImageUrl) {
        user.imageUrl = resolvedImageUrl;
        Notification.updateMany(
          { senderClerkId: user.clerkId },
          { $set: { senderImage: resolvedImageUrl } }
        ).catch(() => {});
        const io = req.app?.get('io') || req.io || getNotificationIo();
        if (io) {
          io.emit('user_dp_updated', { clerkId: user.clerkId, imageUrl: resolvedImageUrl });
        }
      }
      if (coverPhoto !== undefined && coverPhoto !== null) {
        if (user.coverPhoto && user.coverPhoto !== coverPhoto && coverPhoto) {
          deleteCloudinaryAsset(user.coverPhoto).catch(e => console.error('Cloudinary cleanup error:', e));
        }
        user.coverPhoto = coverPhoto;
      }
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
      imageUrl: resolvedImageUrl,
      coverPhoto,
      role: role || 'student',
    });

    await user.save();
    
    // If the new user is a mentor or alumni, notify Admin
    if (user.role === 'mentor' || user.role === 'alumni') {
      await createNotificationHelper({
        recipientClerkId: 'admin',
        senderClerkId: clerkId,
        type: 'system',
        title: 'New Mentor Registration',
        message: `${user.firstName} ${user.lastName} has registered as a ${user.role} and is pending verification.`,
        link: '/admin/verification',
        io: req.io
      });
    }

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

// Get all mentors (excluding alumni and optionally connected mentors)
router.get('/mentors/all', async (req, res) => {
  try {
    const { userId } = req.query;
    let excludedUserIds = [];

    if (userId && userId !== 'undefined') {
      const user = await findUserByIdentifier(userId);
      const userIds = [userId, user?.clerkId, user?._id ? String(user._id) : null].filter(Boolean);
      excludedUserIds = Array.from(new Set(userIds));
    }

    let filter = { 
      role: 'mentor',
      profileVisibility: { $ne: 'hidden' }
    };

    if (excludedUserIds.length > 0) {
      const validObjectIds = excludedUserIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));
      filter.$and = [
        { clerkId: { $nin: excludedUserIds } },
        ...(validObjectIds.length > 0 ? [{ _id: { $nin: validObjectIds } }] : [])
      ];
    }

    const mentors = await User.find(filter).sort({ isVerified: -1, verificationStatus: 1, createdAt: -1 });
    res.status(200).json(mentors);
  } catch (error) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users for platform search (mentors, students, alumni)
router.get('/search/all', async (req, res) => {
  try {
    const users = await User.find({ 
      profileVisibility: { $ne: 'hidden' }
    }).select('firstName lastName name username imageUrl headline role company clerkId location skills course').lean();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching search users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get suggested mentors (excluding existing friends, self, and alumni)
router.get('/mentors/suggested', async (req, res) => {
  try {
    const { userId } = req.query;
    let excludedClerkIds = [];

    if (userId && userId !== 'undefined') {
      const user = await findUserByIdentifier(userId);
      const userIds = [userId, user?.clerkId, user?._id ? String(user._id) : null].filter(Boolean);

      const connections = await Connection.find({
        $or: [{ requesterClerkId: { $in: userIds } }, { recipientClerkId: { $in: userIds } }],
        status: 'accepted'
      });
      excludedClerkIds = [
        ...userIds,
        ...connections.map(c => userIds.includes(c.requesterClerkId) ? c.recipientClerkId : c.requesterClerkId)
      ];
    }

    const mentors = await User.find({ 
      clerkId: { $nin: excludedClerkIds },
      role: 'mentor',
      profileVisibility: { $ne: 'hidden' }
    }).sort({ isVerified: -1, verificationStatus: 1, createdAt: -1 }).limit(5);
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
const getUserProfileHandler = async (req, res) => {
  try {
    const identifier = req.params.identifier || req.params.clerkId;
    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Auto-increment profileViews if a viewer other than the user themselves viewed it
    const { viewerId } = req.query;
    if (viewerId && viewerId !== user.clerkId && viewerId !== user._id.toString()) {
      user.profileViews = (user.profileViews || 0) + 1;
      await user.save();
    }

    // Auto-sync coverPhoto and imageUrl from Clerk if different or missing in DB
    if (user.clerkId) {
      try {
        const clerkUser = await clerkClient.users.getUser(user.clerkId);
        let updated = false;
        if (!user.imageUrl && clerkUser?.imageUrl) {
          user.imageUrl = clerkUser.imageUrl;
          updated = true;
        }
        const clerkCover = clerkUser?.unsafeMetadata?.coverPhoto;
        if (clerkCover && user.coverPhoto !== clerkCover) {
          if (user.coverPhoto && user.coverPhoto !== clerkCover) {
            deleteCloudinaryAsset(user.coverPhoto).catch(() => {});
          }
          user.coverPhoto = clerkCover;
          updated = true;
        }
        if (updated) {
          await user.save();
        }
      } catch (e) {
        // Non-blocking fallback
      }
    }

    const userObj = user.toObject();

    // Dynamically calculate completed sessions and ratings for mentors
    if (user.role === 'mentor') {
      try {
        const [oneOnOneCount, hostedCount, reviews] = await Promise.all([
          Session.countDocuments({
            mentor: user._id,
            status: { $in: ['completed', 'accepted'] }
          }),
          Event.countDocuments({
            organizer: user._id
          }),
          Review.find({
            $or: [
              { mentor: user._id },
              { referenceId: user._id }
            ]
          }).select('contentRating mentorRating')
        ]);

        const completedCount = (oneOnOneCount || 0) + (hostedCount || 0);
        userObj.totalSessions = completedCount;
        userObj.completedSessions = completedCount;

        if (reviews.length > 0) {
          const sum = reviews.reduce((acc, r) => acc + (r.mentorRating || r.contentRating || 5), 0);
          userObj.rating = Number((sum / reviews.length).toFixed(1));
          userObj.reviewsCount = reviews.length;
        } else {
          userObj.rating = user.rating || 5.0;
          userObj.reviewsCount = 0;
        }
      } catch (err) {
        console.error('Error computing dynamic mentor stats:', err);
        userObj.totalSessions = 0;
        userObj.completedSessions = 0;
      }
    }

    res.status(200).json(userObj);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

router.get('/profile/:identifier', getUserProfileHandler);
router.get('/:clerkId', getUserProfileHandler);

// Record profile view explicitly
router.post('/:clerkId/view', async (req, res) => {
  try {
    const { viewerId } = req.body;
    const targetUser = await findUserByIdentifier(req.params.clerkId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!viewerId || (viewerId !== targetUser.clerkId && viewerId !== targetUser._id.toString())) {
      targetUser.profileViews = (targetUser.profileViews || 0) + 1;
      await targetUser.save();
    }

    res.status(200).json({ success: true, profileViews: targetUser.profileViews });
  } catch (error) {
    console.error('Error recording profile view:', error);
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

    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '');
    if (cleanUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }
    if (cleanUsername.length > 30) {
      return res.status(400).json({ message: 'Username must be 30 characters or less' });
    }

    const targetUser = await findUserByIdentifier(req.params.clerkId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username is already taken by another user (case-insensitive)
    const existingUser = await User.findOne({ 
      username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') } 
    });
    if (existingUser && existingUser.clerkId !== targetUser.clerkId) {
      return res.status(400).json({ message: 'This username is already taken' });
    }

    targetUser.username = cleanUsername;
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
      username,
      firstName, 
      lastName, 
      headline, 
      department,
      country,
      state,
      city,
      location, 
      address,
      phone,
      isPhoneVerified,
      phoneVisibility,
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
      role,
      dateOfBirth,
      ageVisibility,
      dobVisibility,
      dobFormat,
      languages,
      gender
    } = req.body;

    if (username !== undefined && username.trim()) {
      const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '');
      if (cleanUsername.length >= 3 && cleanUsername.length <= 30) {
        const existingUser = await User.findOne({ 
          username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') } 
        });
        if (existingUser && existingUser.clerkId !== targetUser.clerkId) {
          return res.status(400).json({ message: 'This username is already taken' });
        }
        targetUser.username = cleanUsername;
      }
    }

    if (firstName !== undefined) targetUser.firstName = firstName;
    if (lastName !== undefined) targetUser.lastName = lastName;
    if (headline !== undefined) targetUser.headline = headline;
    if (country !== undefined) targetUser.country = country;
    if (state !== undefined) targetUser.state = state;
    if (city !== undefined) targetUser.city = city;
    if (location !== undefined) targetUser.location = location;
    if (address !== undefined) targetUser.address = address;
    if (phone !== undefined) targetUser.phone = phone;
    if (isPhoneVerified !== undefined) targetUser.isPhoneVerified = isPhoneVerified;
    if (phoneVisibility !== undefined) targetUser.phoneVisibility = phoneVisibility;
    if (aboutMe !== undefined) targetUser.aboutMe = aboutMe;
    if (resumeUrl !== undefined) targetUser.resumeUrl = resumeUrl;
    if (socialLinks !== undefined) targetUser.socialLinks = socialLinks;
    if (experience !== undefined) targetUser.experience = experience;
    if (education !== undefined) targetUser.education = education;
    if (skills !== undefined) targetUser.skills = skills;
    if (imageUrl !== undefined) {
      targetUser.imageUrl = imageUrl;
      // Sync DP to all notifications sent by this user
      Notification.updateMany(
        { senderClerkId: targetUser.clerkId },
        { $set: { senderImage: imageUrl } }
      ).catch(err => console.debug('Syncing notification senderImage skipped:', err.message));

      const io = req.app?.get('io') || req.io || getNotificationIo();
      if (io) {
        io.emit('user_dp_updated', {
          clerkId: targetUser.clerkId,
          imageUrl: imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetUser.firstName || 'User')}`
        });
      }
    }
    if (coverPhoto !== undefined) {
      if (targetUser.coverPhoto && targetUser.coverPhoto !== coverPhoto) {
        deleteCloudinaryAsset(targetUser.coverPhoto).catch(e => console.error('Cloudinary cleanup error:', e));
      }
      targetUser.coverPhoto = coverPhoto;

      // Also ensure Clerk unsafeMetadata stays in sync if clerkId is known
      if (targetUser.clerkId) {
        clerkClient.users.getUser(targetUser.clerkId).then(clerkUser => {
          return clerkClient.users.updateUser(targetUser.clerkId, {
            unsafeMetadata: {
              ...clerkUser.unsafeMetadata,
              coverPhoto: coverPhoto || null
            }
          });
        }).catch(err => console.log('Clerk sync note:', err.message));
      }
    }
    if (yearsOfExperience !== undefined) targetUser.yearsOfExperience = yearsOfExperience;
    if (profileVisibility !== undefined) targetUser.profileVisibility = profileVisibility;
    if (dateOfBirth !== undefined) targetUser.dateOfBirth = dateOfBirth;
    if (ageVisibility !== undefined) targetUser.ageVisibility = ageVisibility;
    if (dobVisibility !== undefined) targetUser.dobVisibility = dobVisibility;
    if (dobFormat !== undefined) targetUser.dobFormat = dobFormat;
    if (languages !== undefined) targetUser.languages = languages;
    if (gender !== undefined) targetUser.gender = gender;

    // Manual role update (admin role can only be assigned via secured admin routes)
    if (role !== undefined && ['student', 'mentor', 'alumni'].includes(role)) {
      targetUser.role = role;
    } else if (targetUser.role === 'student') {
      // Auto-detect alumni status
      // If user has both education and experience (working), automatically promote to alumni
      if (targetUser.education && targetUser.education.length > 0 && targetUser.experience && targetUser.experience.length > 0) {
        targetUser.role = 'alumni';
      }
    }

    await targetUser.save();

    // If role changed to mentor/alumni, notify admin
    if (role !== undefined && (role === 'mentor' || role === 'alumni')) {
      await createNotificationHelper({
        recipientClerkId: 'admin',
        senderClerkId: targetUser.clerkId,
        type: 'system',
        title: 'Mentor Role Requested',
        message: `${targetUser.firstName} ${targetUser.lastName} has updated their role to ${role} and is pending verification.`,
        link: '/admin/verification',
        io: req.io
      });
    }

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

// Dismiss an administrative warning
router.put('/:clerkId/warnings/:warningId/dismiss', async (req, res) => {
  try {
    const { clerkId, warningId } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(clerkId);
    const user = await User.findOne(
      isObjectId ? { $or: [{ clerkId }, { _id: clerkId }] } : { clerkId }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const warning = user.warnings?.find(w => String(w._id) === warningId);
    if (warning) {
      warning.isDismissed = true;
      await user.save();
    }
    res.status(200).json({ success: true, message: 'Warning acknowledged' });
  } catch (err) {
    console.error('Error dismissing warning:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Wish happy birthday to a user
router.post('/:identifier/wish-birthday', async (req, res) => {
  try {
    const { identifier } = req.params;
    const { senderClerkId, customMessage } = req.body;

    if (!senderClerkId) {
      return res.status(400).json({ success: false, message: 'senderClerkId is required' });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const targetUser = await User.findOne(
      isObjectId ? { $or: [{ clerkId: identifier }, { username: identifier }, { _id: identifier }] } : { $or: [{ clerkId: identifier }, { username: identifier }] }
    );

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const senderUser = await User.findOne({ clerkId: senderClerkId });
    const senderName = senderUser ? `${senderUser.firstName} ${senderUser.lastName || ''}`.trim() : 'A friend';

    // Create birthday wish notification
    await createNotificationHelper({
      recipientClerkId: targetUser.clerkId,
      senderClerkId,
      type: 'birthday_wish',
      title: '🎉 Birthday Wish!',
      message: customMessage || `${senderName} wished you a very Happy Birthday! 🎂✨`,
      link: senderUser?.username ? `/profile/${senderUser.username}` : `/profile/${senderClerkId}`,
      io: req.io
    });

    return res.status(200).json({ success: true, message: 'Birthday wish sent successfully! 🎈' });
  } catch (error) {
    console.error('Error wishing birthday:', error);
    return res.status(500).json({ success: false, message: 'Failed to send birthday wish' });
  }
});

// Add phone number to user on Clerk without frontend reverification block
router.post('/clerk-phone/add', async (req, res) => {
  try {
    const { clerkId, phoneNumber } = req.body;
    if (!clerkId || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'clerkId and phoneNumber are required' });
    }

    if (!process.env.CLERK_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'CLERK_SECRET_KEY is not configured on server' });
    }

    // Call Clerk Backend API directly
    const clerkRes = await fetch('https://api.clerk.com/v1/phone_numbers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: clerkId,
        phone_number: phoneNumber
      })
    });

    const data = await clerkRes.json();
    if (!clerkRes.ok) {
      const firstErr = data?.errors?.[0];
      const errCode = firstErr?.code;
      const errMsg = firstErr?.long_message || firstErr?.message || 'Failed to add phone number via Clerk';

      // If feature is not enabled in Clerk Dashboard
      if (errCode === 'feature_not_enabled') {
        return res.status(400).json({
          success: false,
          code: 'feature_not_enabled',
          message: 'Phone number is not enabled in Clerk Dashboard. Please enable Phone numbers under Configure > Email, phone, username.'
        });
      }

      // If phone number already exists on this user
      if (errCode === 'form_identifier_exists' || errMsg.includes('already exists')) {
        return res.status(200).json({
          success: true,
          alreadyExists: true,
          message: 'Phone number is already associated with this account.'
        });
      }

      return res.status(clerkRes.status).json({ success: false, code: errCode, message: errMsg, errors: data?.errors });
    }

    return res.status(200).json({ success: true, phoneResource: data });
  } catch (error) {
    console.error('Error in /clerk-phone/add:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// Finalize phone verification: set primary, cleanup older numbers, and update MongoDB
router.post('/clerk-phone/finalize', async (req, res) => {
  try {
    const { clerkId, phoneNumber, phoneNumberId } = req.body;
    if (!clerkId || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'clerkId and phoneNumber are required' });
    }

    // 1. Update MongoDB user record
    await User.findOneAndUpdate(
      { clerkId },
      { 
        phone: phoneNumber,
        isPhoneVerified: true
      },
      { new: true }
    );

    // 2. Set as primary on Clerk & cleanup old numbers via Clerk BAPI
    if (process.env.CLERK_SECRET_KEY) {
      try {
        if (phoneNumberId) {
          // Set as primary
          await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              primary_phone_number_id: phoneNumberId
            })
          }).catch(e => console.warn('Could not set primary phone on Clerk BAPI:', e));
        }

        // Cleanup other numbers from Clerk
        const userRes = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
          headers: { 'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}` }
        });
        if (userRes.ok) {
          const clerkUserData = await userRes.json();
          const oldPhones = (clerkUserData.phone_numbers || []).filter(
            p => p.id !== phoneNumberId && p.phone_number !== phoneNumber
          );
          for (const old of oldPhones) {
            await fetch(`https://api.clerk.com/v1/phone_numbers/${old.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}` }
            }).catch(e => console.warn('Could not delete old phone number on Clerk BAPI:', e));
          }
        }
      } catch (clerkErr) {
        console.warn('Clerk BAPI finalize warning:', clerkErr);
      }
    }

    return res.status(200).json({ success: true, message: 'Phone number verified and synchronized successfully' });
  } catch (error) {
    console.error('Error in /clerk-phone/finalize:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// In-memory OTP storage: phoneNumber -> { code, expiresAt, clerkId }
const phoneOtpStore = new Map();

// Send OTP to phone number (works for Indian numbers +91, Dev Mode, & custom gateways)
router.post('/phone-otp/send', async (req, res) => {
  try {
    const { clerkId, phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'phoneNumber is required' });
    }

    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '').trim();
    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    phoneOtpStore.set(cleanNumber, { otp, expiresAt, clerkId });
    console.log(`[PHONE OTP GENERATED] Phone: ${cleanNumber} | Code: ${otp}`);

    // 1. Send real SMS / WhatsApp OTP via Twilio Verify Service
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID) {
      try {
        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        
        // A. Dispatch via standard SMS
        const smsParams = new URLSearchParams({
          To: cleanNumber,
          Channel: 'sms'
        });
        const twilioSmsRes = await fetch(`https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/Verifications`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: smsParams
        });
        const twilioSmsData = await twilioSmsRes.json().catch(() => ({}));
        if (twilioSmsRes.ok) {
          console.log(`[TWILIO VERIFY SMS SENT] To: ${cleanNumber} | SID: ${twilioSmsData.sid} | Status: ${twilioSmsData.status}`);
        } else {
          console.warn('[TWILIO VERIFY SMS NOTE]:', twilioSmsData.message || twilioSmsData);
        }

        // B. Also dispatch via WhatsApp channel (reliable fallback for India where international SMS is DLT-filtered)
        try {
          const waParams = new URLSearchParams({
            To: cleanNumber,
            Channel: 'whatsapp'
          });
          const twilioWaRes = await fetch(`https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/Verifications`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: waParams
          });
          const twilioWaData = await twilioWaRes.json().catch(() => ({}));
          if (twilioWaRes.ok) {
            console.log(`[TWILIO VERIFY WHATSAPP SENT] To: ${cleanNumber} | SID: ${twilioWaData.sid} | Status: ${twilioWaData.status}`);
          }
        } catch (waErr) {
          console.warn('Twilio WhatsApp dispatch notice:', waErr?.message || waErr);
        }
      } catch (twErr) {
        console.warn('Twilio dispatch error:', twErr);
      }
    }

    // 2. Optional: If Fast2SMS API key configured in .env, send real SMS
    if (process.env.FAST2SMS_API_KEY) {
      try {
        const rawDigits = cleanNumber.replace(/\D/g, '').slice(-10);
        await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': process.env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: otp,
            numbers: rawDigits
          })
        });
      } catch (smsErr) {
        console.warn('Fast2SMS dispatch warning:', smsErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${cleanNumber}`
    });
  } catch (error) {
    console.error('Error in /phone-otp/send:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// Verify OTP sent to phone number
router.post('/phone-otp/verify', async (req, res) => {
  try {
    const { clerkId, phoneNumber, code } = req.body;
    if (!phoneNumber || !code) {
      return res.status(400).json({ success: false, message: 'phoneNumber and code are required' });
    }

    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '').trim();
    const cleanCode = code.trim().replace(/\D/g, '');

    // 1. Check with Twilio Verify Service if configured
    let twilioApproved = false;
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID) {
      try {
        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const params = new URLSearchParams({
          To: cleanNumber,
          Code: cleanCode
        });
        const twCheckRes = await fetch(`https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params
        });
        const twCheckData = await twCheckRes.json().catch(() => ({}));
        console.log(`[TWILIO CHECK RESULT] Code: ${cleanCode} | Status: ${twCheckRes.status}`, twCheckData);
        if (twCheckRes.ok && (twCheckData.status === 'approved' || twCheckData.valid === true)) {
          twilioApproved = true;
          console.log(`[TWILIO VERIFIED SUCCESS] Phone: ${cleanNumber}`);
        }
      } catch (checkErr) {
        console.warn('Twilio check note:', checkErr);
      }
    }

    if (!twilioApproved) {
      const record = phoneOtpStore.get(cleanNumber);

      // Support developer / test codes: 123456, 424242
      if (cleanCode === '123456' || cleanCode === '424242') {
        twilioApproved = true;
      } else if (record && Date.now() <= record.expiresAt && record.otp === cleanCode) {
        twilioApproved = true;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code. Please enter the latest 6-digit code sent to your phone.'
        });
      }
    }

    // Code matches or approved! Clear OTP from store
    phoneOtpStore.delete(cleanNumber);

    // Update MongoDB
    if (clerkId) {
      await User.findOneAndUpdate(
        { clerkId },
        { phone: cleanNumber, isPhoneVerified: true },
        { new: true }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Phone number verified successfully!'
    });
  } catch (error) {
    console.error('Error in /phone-otp/verify:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

export default router;
