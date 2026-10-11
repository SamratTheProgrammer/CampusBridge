import express from 'express';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Job from '../models/Job.js';
import { escapeRegex } from '../utils/regexHelper.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters long.' });
    }

    const regex = new RegExp(escapeRegex(q.trim()), 'i');

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

// GET /api/search/history - Fetch search history for a user from DB
router.get('/history', async (req, res) => {
  try {
    const { clerkId } = req.query;
    if (!clerkId) {
      return res.status(200).json({ success: true, history: [] });
    }

    const user = await User.findOne({ clerkId }).select('searchHistory').lean();
    if (!user) {
      return res.status(200).json({ success: true, history: [] });
    }

    const history = (user.searchHistory || []).sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    res.json({ success: true, history });
  } catch (error) {
    console.error('Fetch search history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch search history' });
  }
});

// POST /api/search/history - Add search item to DB history (Instagram style)
router.post('/history', async (req, res) => {
  try {
    const { clerkId, item } = req.body;
    if (!clerkId || !item) {
      return res.status(400).json({ success: false, message: 'clerkId and item are required' });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.searchHistory) {
      user.searchHistory = [];
    }

    const queryStr = (item.query || item.title || '').trim();
    if (!queryStr) {
      return res.status(400).json({ success: false, message: 'Query or title is required' });
    }

    // Filter out existing duplicates (by title, query, or path)
    const lowerQuery = queryStr.toLowerCase();
    const lowerPath = (item.path || '').toLowerCase();

    user.searchHistory = user.searchHistory.filter((h) => {
      const hTitle = (h.title || '').toLowerCase();
      const hQuery = (h.query || '').toLowerCase();
      const hPath = (h.path || '').toLowerCase();

      if (lowerPath && hPath && lowerPath === hPath) return false;
      if (hTitle === lowerQuery || hQuery === lowerQuery) return false;
      return true;
    });

    // Add new item at the top
    user.searchHistory.unshift({
      query: queryStr,
      title: item.title || queryStr,
      description: item.description || '',
      image: item.image || item.imageUrl || '',
      type: item.type || (item.path ? 'nav' : 'text'),
      path: item.path || '',
      role: item.role || '',
      badge: item.badge || '',
      targetId: item.id || item.targetId || '',
      createdAt: new Date()
    });

    // Keep max 20 items
    if (user.searchHistory.length > 20) {
      user.searchHistory = user.searchHistory.slice(0, 20);
    }

    await user.save();

    res.json({ success: true, history: user.searchHistory });
  } catch (error) {
    console.error('Save search history error:', error);
    res.status(500).json({ success: false, message: 'Failed to save search history' });
  }
});

// DELETE /api/search/history/item - Delete single item from DB history
router.delete('/history/item', async (req, res) => {
  try {
    const { clerkId, id, query, title } = req.body;
    if (!clerkId) {
      return res.status(400).json({ success: false, message: 'clerkId is required' });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.searchHistory) user.searchHistory = [];

    user.searchHistory = user.searchHistory.filter((h) => {
      if (id && (h._id?.toString() === id || h.targetId === id)) return false;
      if (query && (h.query || '').toLowerCase() === query.toLowerCase()) return false;
      if (title && (h.title || '').toLowerCase() === title.toLowerCase()) return false;
      return true;
    });

    await user.save();

    res.json({ success: true, history: user.searchHistory });
  } catch (error) {
    console.error('Delete search history item error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete search history item' });
  }
});

// DELETE /api/search/history/clear - Clear all search history in DB
router.delete('/history/clear', async (req, res) => {
  try {
    const { clerkId } = req.body;
    if (!clerkId) {
      return res.status(400).json({ success: false, message: 'clerkId is required' });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.searchHistory = [];
    await user.save();

    res.json({ success: true, history: [] });
  } catch (error) {
    console.error('Clear search history error:', error);
    res.status(500).json({ success: false, message: 'Failed to clear search history' });
  }
});

export default router;
