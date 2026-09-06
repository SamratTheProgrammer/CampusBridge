import express from 'express';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Event from '../models/Event.js';
import Post from '../models/Post.js';
import Job from '../models/Job.js';
import Review from '../models/Review.js';

const router = express.Router();

// Get platform statistics for landing page
router.get('/platform-stats', async (req, res) => {
  try {
    const students = await User.countDocuments({ role: 'student' });
    const mentors = await User.countDocuments({ role: 'mentor' });
    const alumni = await User.countDocuments({ role: 'alumni' });
    const jobsCount = await Job.countDocuments();
    const eventsCount = await Event.countDocuments();
    
    // Calculate unique companies from jobs
    const jobs = await Job.find().select('companyName');
    const uniqueCompanies = new Set(jobs.map(j => j.companyName).filter(Boolean));
    const companiesCount = uniqueCompanies.size;

    // Default formatting function
    const formatCount = (count, fallback) => {
      return count > 0 ? `${count.toLocaleString()}+` : fallback;
    };

    res.status(200).json({
      alumni: formatCount(alumni, '12,000+'),
      students: formatCount(students, '8,000+'),
      mentors: formatCount(mentors, '2,000+'),
      jobs: formatCount(jobsCount, '5,000+'),
      companies: formatCount(companiesCount, '300+'),
      events: formatCount(eventsCount, '200+')
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

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

    // 3. Post Engagements & Top Posts
    const mentorPosts = await Post.find({ authorClerkId: clerkId });
    let postEngagements = 0;
    
    // Sort posts by engagement (likes + comments length)
    const sortedPosts = mentorPosts.map(post => {
      const engagement = (post.likes?.length || 0) + (post.comments?.length || 0);
      postEngagements += engagement;
      return { ...post.toObject(), engagement };
    }).sort((a, b) => b.engagement - a.engagement);

    const topPosts = sortedPosts.slice(0, 3).map(p => ({
      id: p._id,
      content: p.content || (p.jobDetails ? `Shared Job: ${p.jobDetails.title}` : p.eventDetails ? `Shared Event: ${p.eventDetails.title}` : 'Media Post'),
      engagement: p.engagement,
      date: p.createdAt
    }));

    // Fetch actual reviews for the mentor
    const reviews = await Review.find({ mentor: user._id, mentorRating: { $exists: true, $ne: null } })
      .populate('reviewer', 'firstName lastName name imageUrl');
      
    const totalReviews = reviews.length;
    let averageRating = 0;
    let ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    if (totalReviews > 0) {
      const sum = reviews.reduce((acc, curr) => {
        const rating = Math.floor(curr.mentorRating);
        if (rating >= 1 && rating <= 5) {
          ratingDistribution[rating]++;
        }
        return acc + curr.mentorRating;
      }, 0);
      averageRating = parseFloat((sum / totalReviews).toFixed(1));
      
      // Convert to percentages
      for (let i = 1; i <= 5; i++) {
        ratingDistribution[i] = Math.round((ratingDistribution[i] / totalReviews) * 100);
      }
    } else {
      averageRating = 5.0; // Default if no reviews
      ratingDistribution = { 5: 100, 4: 0, 3: 0, 2: 0, 1: 0 };
    }

    // Extract student feedback from actual reviews
    const studentFeedback = reviews
      .filter(r => r.mentorComment)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4)
      .map(r => {
        const reviewer = r.reviewer;
        const studentName = reviewer ? (reviewer.name || `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim()) : 'Student';
        return {
          id: r._id,
          text: r.mentorComment,
          studentName: studentName || 'Student',
          date: r.createdAt
        };
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
      topPosts,
      studentFeedback,
      averageRating,
      totalReviews,
      ratingDistribution
    });

  } catch (error) {
    console.error('Error fetching mentor analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
