import express from 'express';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Job from '../models/Job.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters long.' });
    }

    const regex = new RegExp(q, 'i');

    // Run searches in parallel
    const [users, events, jobs] = await Promise.all([
      // Search Users (Mentors and Students)
      User.find({
        $or: [
          { firstName: regex },
          { lastName: regex },
          { username: regex },
          { headline: regex },
          { company: regex },
          { skills: regex },
          { role: regex }
        ],
        profileVisibility: { $ne: 'hidden' }
      })
      .select('firstName lastName username imageUrl headline role clerkId skills company')
      .limit(8)
      .lean(),

      // Search Events and Sessions
      Event.find({
        $or: [
          { title: regex },
          { category: regex },
          { mode: regex },
          { description: regex }
        ],
        active: true
      })
      .select('title type mode date imageUrl category _id')
      .limit(6)
      .lean(),

      // Search Jobs
      Job.find({
        $or: [
          { title: regex },
          { company: regex },
          { location: regex },
          { skills: regex }
        ],
        active: true,
        status: 'Approved'
      })
      .select('title company type location companyLogo _id')
      .limit(6)
      .lean()
    ]);

    res.json({
      users,
      events,
      jobs
    });

  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ message: 'Internal server error during search' });
  }
});

export default router;
