import express from 'express';
import Announcement from '../models/Announcement.js';

const router = express.Router();

/**
 * GET /api/announcements/active
 * Query params: ?role=student|mentor
 * Returns all published announcements that are currently active within date range and match target audience.
 */
router.get('/active', async (req, res) => {
  try {
    const { role } = req.query;
    const now = new Date();

    const targetAudiences = ['All Users'];
    const normalizedRole = (role || '').toLowerCase();
    if (normalizedRole === 'student') {
      targetAudiences.push('Students');
    } else if (normalizedRole === 'mentor' || normalizedRole === 'alumni') {
      targetAudiences.push('Mentors');
    } else {
      // If role not specified or ambiguous, allow both
      targetAudiences.push('Students', 'Mentors');
    }

    const announcements = await Announcement.find({
      status: 'Published',
      audience: { $in: targetAudiences },
      $and: [
        {
          $or: [
            { startDate: null },
            { startDate: { $exists: false } },
            { startDate: { $lte: now } }
          ]
        },
        {
          $or: [
            { endDate: null },
            { endDate: { $exists: false } },
            { endDate: { $gte: now } }
          ]
        }
      ]
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      announcements
    });
  } catch (error) {
    console.error('Error fetching active announcements:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching announcements' });
  }
});

export default router;
