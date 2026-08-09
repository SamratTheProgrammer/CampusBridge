import express from 'express';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Event from '../models/Event.js';
import Post from '../models/Post.js';

const router = express.Router();

// Get mentor analytics
router.get('/mentor/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Total Students (Accepted 1-on-1 sessions unique students + Event attendees)
    // We'll count unique students in accepted sessions.
    const acceptedSessions = await Session.find({ mentorClerkId: clerkId, status: 'accepted' });
    const uniqueStudents = new Set(acceptedSessions.map(s => s.studentClerkId));
    const totalStudents = uniqueStudents.size;

    // 2. Profile Views (from User model)
    const profileViews = user.profileViews || 0;

    // 3. Post Engagements (Total likes + comments on posts by this user)
    const mentorPosts = await Post.find({ author: user._id });
    let postEngagements = 0;
    mentorPosts.forEach(post => {
      postEngagements += post.likes.length;
      postEngagements += post.comments.length;
    });

    // 4. Sessions Hosted (Total events/group sessions created by the user)
    const sessionsHosted = await Event.countDocuments({ organizer: user._id });

    // 5. Generate simulated time series data for the bar chart 
    // based on total profile views (for demo purposes)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    // Distribute profileViews randomly but with an upward trend over 8 months
    let remainingViews = profileViews;
    const performanceData = months.map((month, idx) => {
      // Create a fake upward curve
      const baseShare = profileViews / 12; 
      const trendMultiplier = 1 + (idx * 0.2); // Upward trend
      
      let val = Math.floor(baseShare * trendMultiplier);
      if (idx === months.length - 1) {
        val = remainingViews; // give all remaining to last month
      } else {
        remainingViews -= val;
      }
      
      // If negative somehow, reset
      if (val < 0) val = 0;

      return { month, value: val };
    });

    res.status(200).json({
      totalStudents,
      profileViews,
      postEngagements,
      sessionsHosted,
      performanceData,
      // Hardcode average rating for now since we don't have a Review model
      averageRating: 4.9, 
      totalReviews: 124 
    });

  } catch (error) {
    console.error('Error fetching mentor analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
