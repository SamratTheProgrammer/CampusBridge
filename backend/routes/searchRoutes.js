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

// Hydrate recent search items that are users with their latest DP, name, role, etc.
async function hydrateSearchHistory(historyItems) {
  if (!Array.isArray(historyItems) || historyItems.length === 0) {
    return { hydratedHistory: historyItems || [], hasChanges: false };
  }

  const clerkIds = new Set();
  const usernames = new Set();
  const objectIds = new Set();

  for (const item of historyItems) {
    const isUser = item.type === 'user' || (item.path && item.path.startsWith('/profile/')) || item.role;
    if (!isUser) continue;

    if (item.targetId) {
      const tid = String(item.targetId).trim();
      if (tid.startsWith('user_')) {
        clerkIds.add(tid);
      } else if (/^[0-9a-fA-F]{24}$/.test(tid)) {
        objectIds.add(tid);
      }
    }

    if (item.path && item.path.startsWith('/profile/')) {
      const slug = item.path.replace(/^\/profile\//, '').split('?')[0].split('#')[0].trim();
      if (slug) {
        if (slug.startsWith('user_')) {
          clerkIds.add(slug);
        } else if (/^[0-9a-fA-F]{24}$/.test(slug)) {
          objectIds.add(slug);
        } else {
          usernames.add(slug.toLowerCase());
        }
      }
    }
  }

  if (clerkIds.size === 0 && usernames.size === 0 && objectIds.size === 0) {
    return { hydratedHistory: historyItems, hasChanges: false };
  }

  const queryOr = [];
  if (clerkIds.size > 0) queryOr.push({ clerkId: { $in: Array.from(clerkIds) } });
  if (usernames.size > 0) queryOr.push({ username: { $in: Array.from(usernames) } });
  if (objectIds.size > 0) queryOr.push({ _id: { $in: Array.from(objectIds) } });

  try {
    const matchedUsers = await User.find({ $or: queryOr })
      .select('firstName lastName username clerkId imageUrl role headline company')
      .lean();

    const userByClerkId = {};
    const userByUsername = {};
    const userById = {};

    for (const u of matchedUsers) {
      if (u.clerkId) userByClerkId[u.clerkId] = u;
      if (u.username) userByUsername[u.username.toLowerCase()] = u;
      if (u._id) userById[u._id.toString()] = u;
    }

    let hasChanges = false;
    const hydratedHistory = historyItems.map(item => {
      const isUser = item.type === 'user' || (item.path && item.path.startsWith('/profile/')) || item.role;
      if (!isUser) return item;

      let matched = null;
      if (item.targetId) {
        matched = userByClerkId[item.targetId] || userById[item.targetId];
      }

      if (!matched && item.path && item.path.startsWith('/profile/')) {
        const slug = item.path.replace(/^\/profile\//, '').split('?')[0].split('#')[0].trim();
        if (slug) {
          matched = userByClerkId[slug] || userById[slug] || userByUsername[slug.toLowerCase()];
        }
      }

      if (matched) {
        const latestFullName = `${matched.firstName || ''} ${matched.lastName || ''}`.trim() || matched.username || item.title;
        const latestImage = matched.imageUrl !== undefined ? matched.imageUrl : item.image;
        const latestRole = (matched.role || item.role || '').toLowerCase();
        const latestDesc = matched.headline || (matched.company ? `At ${matched.company}` : item.description || '');
        const latestBadge = latestRole === 'mentor' ? 'Mentor' : (latestRole === 'alumni' ? 'Alumni' : 'Student');
        const latestPath = `/profile/${matched.username || matched.clerkId}`;

        if (
          item.image !== latestImage ||
          item.title !== latestFullName ||
          item.role !== latestRole ||
          item.description !== latestDesc ||
          item.path !== latestPath
        ) {
          hasChanges = true;
        }

        return {
          ...item,
          type: 'user',
          title: latestFullName,
          image: latestImage,
          role: latestRole,
          description: latestDesc,
          badge: latestBadge,
          path: latestPath,
          targetId: matched.clerkId || item.targetId
        };
      }

      return item;
    });

    return { hydratedHistory, hasChanges };
  } catch (err) {
    console.error('Error hydrating search history users:', err);
    return { hydratedHistory: historyItems, hasChanges: false };
  }
}

// GET /api/search/history - Fetch search history for a user from DB (hydrated with current DP & name)
router.get('/history', async (req, res) => {
  try {
    const { clerkId } = req.query;
    if (!clerkId) {
      return res.status(200).json({ success: true, history: [] });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(200).json({ success: true, history: [] });
    }

    const history = (user.searchHistory || []).map(h => typeof h.toObject === 'function' ? h.toObject() : h).sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    const { hydratedHistory, hasChanges } = await hydrateSearchHistory(history);

    if (hasChanges) {
      await User.updateOne({ clerkId }, { $set: { searchHistory: hydratedHistory } }).catch(err => {
        console.error('Failed to persist refreshed search history:', err);
      });
    }

    res.json({ success: true, history: hydratedHistory });
  } catch (error) {
    console.error('Fetch search history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch search history' });
  }
});

// POST /api/search/history - Add search item to DB history (Instagram style, with latest user data)
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

    let initialImage = item.image || item.imageUrl || '';
    let initialTitle = item.title || queryStr;
    let initialRole = item.role || '';
    let initialDesc = item.description || '';
    let initialPath = item.path || '';
    let initialBadge = item.badge || '';
    let targetId = item.id || item.targetId || '';

    const isUserItem = item.type === 'user' || (initialPath && initialPath.startsWith('/profile/')) || initialRole;
    if (isUserItem) {
      let targetUser = null;
      if (targetId && String(targetId).startsWith('user_')) {
        targetUser = await User.findOne({ clerkId: targetId }).select('firstName lastName username clerkId imageUrl role headline company').lean();
      } else if (targetId && /^[0-9a-fA-F]{24}$/.test(String(targetId))) {
        targetUser = await User.findById(targetId).select('firstName lastName username clerkId imageUrl role headline company').lean();
      }
      if (!targetUser && initialPath.startsWith('/profile/')) {
        const slug = initialPath.replace(/^\/profile\//, '').split('?')[0].split('#')[0].trim();
        if (slug) {
          targetUser = await User.findOne({
            $or: [
              { clerkId: slug },
              { username: slug },
              ...(/^[0-9a-fA-F]{24}$/.test(slug) ? [{ _id: slug }] : [])
            ]
          }).select('firstName lastName username clerkId imageUrl role headline company').lean();
        }
      }

      if (targetUser) {
        initialImage = targetUser.imageUrl || initialImage;
        initialTitle = `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.username || initialTitle;
        initialRole = (targetUser.role || initialRole || '').toLowerCase();
        initialDesc = targetUser.headline || (targetUser.company ? `At ${targetUser.company}` : initialDesc);
        initialBadge = initialRole === 'mentor' ? 'Mentor' : (initialRole === 'alumni' ? 'Alumni' : 'Student');
        initialPath = `/profile/${targetUser.username || targetUser.clerkId}`;
        targetId = targetUser.clerkId || targetId;
      }
    }

    // Add new item at the top
    user.searchHistory.unshift({
      query: queryStr,
      title: initialTitle,
      description: initialDesc,
      image: initialImage,
      type: isUserItem ? 'user' : (item.type || (initialPath ? 'nav' : 'text')),
      path: initialPath,
      role: initialRole,
      badge: initialBadge,
      targetId: targetId,
      createdAt: new Date()
    });

    // Keep max 20 items
    if (user.searchHistory.length > 20) {
      user.searchHistory = user.searchHistory.slice(0, 20);
    }

    const historyList = (user.searchHistory || []).map(h => typeof h.toObject === 'function' ? h.toObject() : h);
    const { hydratedHistory } = await hydrateSearchHistory(historyList);
    user.searchHistory = hydratedHistory;

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
