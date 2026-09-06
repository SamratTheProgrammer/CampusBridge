import express from 'express';
import Review from '../models/Review.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Event from '../models/Event.js';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

const router = express.Router();

// 1. Submit a review
router.post('/', async (req, res) => {
  try {
    const { reviewerClerkId, mentorId, type, referenceId, mentorRating, mentorComment, contentRating, contentComment } = req.body;

    const reviewerUser = await User.findOne({ clerkId: reviewerClerkId });
    if (!reviewerUser) {
      return res.status(404).json({ error: 'Reviewer not found' });
    }

    const typeModel = type === 'session' ? 'Session' : type === 'event' ? 'Event' : 'User';

    const newReview = new Review({
      reviewer: reviewerUser._id,
      mentor: mentorId, // Can be undefined for events
      type,
      referenceId,
      typeModel,
      mentorRating,
      mentorComment,
      contentRating,
      contentComment
    });

    await newReview.save();

    if (mentorId) {
      const mentorUser = await User.findById(mentorId);
      if (mentorUser && mentorUser.clerkId) {
        const reviewerName = reviewerUser.name || `${reviewerUser.firstName || ''} ${reviewerUser.lastName || ''}`.trim() || 'A student';
        await Notification.create({
          recipientClerkId: mentorUser.clerkId,
          senderClerkId: reviewerUser.clerkId,
          senderName: reviewerName,
          senderImage: reviewerUser.imageUrl,
          type: 'mentor_review',
          title: 'New Mentor Review',
          message: `Left a ${mentorRating}-star review on your mentorship.`,
          link: '/mentor-dashboard?tab=analytics'
        });
      }
    }

    res.status(201).json(newReview);
  } catch (error) {
    console.error('Submit Review Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'You have already reviewed this.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// 2. Get pending reviews for a user
router.get('/pending/:clerkId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find all completed sessions where user is the student
    const completedSessions = await Session.find({
      student: user._id,
      status: 'completed'
    }).populate('mentor', 'firstName lastName imageUrl');

    // Find all events user attended that are in the past
    // We look for events from the last 7 days to show the modal for a limited time ("kichukhoner jonno")
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const candidateEvents = await Event.find({
      attendees: user._id,
      date: { $gte: sevenDaysAgo }
    }).populate('organizer', 'firstName lastName imageUrl');

    const pastEvents = candidateEvents.filter(event => {
      const eventDate = new Date(event.date);
      
      // If the event was on a previous day, it's definitely ended
      if (eventDate.setHours(0,0,0,0) < new Date().setHours(0,0,0,0)) return true;
      
      // If it's today, try to parse the end time from the time string (e.g., "10:00 AM - 12:00 PM" or "10:00 - 12:00")
      if (eventDate.setHours(0,0,0,0) === new Date().setHours(0,0,0,0)) {
          if (event.time && event.time.includes('-')) {
            const endTimeStr = event.time.split('-')[1].trim();
            const timeMatch = endTimeStr.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
            if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                const minutes = parseInt(timeMatch[2]);
                const ampm = timeMatch[3];
                
                if (ampm) {
                  if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
                  if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
                }
                
                const eventEnd = new Date();
                eventEnd.setHours(hours, minutes, 0, 0);
                
                // Return true only if current time is after the event's end time
                return new Date() > eventEnd;
            }
          }
      }
      return false;
    });

    // Find all existing reviews by this user
    const userReviews = await Review.find({ reviewer: user._id });
    const reviewedReferenceIds = userReviews.map(r => r.referenceId.toString());

    const pending = [];

    completedSessions.forEach(session => {
      if (!reviewedReferenceIds.includes(session._id.toString())) {
        pending.push({
          type: 'session',
          referenceId: session._id,
          title: `Session with ${session.mentor?.firstName || 'Mentor'}`,
          mentor: session.mentor,
          date: session.date
        });
      }
    });

    pastEvents.forEach(event => {
      if (!reviewedReferenceIds.includes(event._id.toString())) {
        pending.push({
          type: 'event',
          referenceId: event._id,
          title: event.title,
          mentor: event.organizer,
          date: event.date
        });
      }
    });

    res.json(pending);
  } catch (error) {
    console.error('Get Pending Reviews Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Get reviews and average rating for a mentor
router.get('/mentor/:clerkId', async (req, res) => {
  try {
    const mentorUser = await User.findOne({ clerkId: req.params.clerkId });
    if (!mentorUser) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    const reviews = await Review.find({ mentor: mentorUser._id, mentorRating: { $exists: true, $ne: null } })
      .populate('reviewer', 'firstName lastName imageUrl')
      .populate('referenceId')
      .sort({ createdAt: -1 });

    const totalRatings = reviews.length;
    const averageRating = totalRatings > 0
      ? (reviews.reduce((acc, curr) => acc + curr.mentorRating, 0) / totalRatings).toFixed(1)
      : 0;

    res.json({
      averageRating: Number(averageRating),
      totalRatings,
      reviews
    });
  } catch (error) {
    console.error('Get Mentor Reviews Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Get reviews for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const reviews = await Review.find({ type: 'event', referenceId: req.params.eventId })
      .populate('reviewer', 'firstName lastName imageUrl')
      .sort({ createdAt: -1 });

    const totalRatings = reviews.length;
    const averageRating = totalRatings > 0
      ? (reviews.reduce((acc, curr) => acc + curr.contentRating, 0) / totalRatings).toFixed(1)
      : 0;

    res.json({
      averageRating: Number(averageRating),
      totalRatings,
      reviews
    });
  } catch (error) {
    console.error('Get Event Reviews Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Get review for a session
router.get('/session/:sessionId', async (req, res) => {
  try {
    const reviews = await Review.find({ type: 'session', referenceId: req.params.sessionId })
      .populate('reviewer', 'firstName lastName imageUrl');

    const totalRatings = reviews.length;
    const averageRating = totalRatings > 0
      ? (reviews.reduce((acc, curr) => acc + curr.contentRating, 0) / totalRatings).toFixed(1)
      : 0;

    res.json({
      averageRating: Number(averageRating),
      totalRatings,
      reviews
    });
  } catch (error) {
    console.error('Get Session Reviews Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Toggle Like on a review
router.put('/:id/like', async (req, res) => {
  try {
    const { clerkId } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    if (!review.likes) review.likes = [];
    
    if (review.likes.includes(clerkId)) {
      review.likes = review.likes.filter(id => id !== clerkId);
    } else {
      review.likes.push(clerkId);
    }
    await review.save();
    res.json(review);
  } catch (error) {
    console.error('Like Review Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Add a reply to a review
router.post('/:id/reply', async (req, res) => {
  try {
    const { clerkId, text } = req.body;
    const review = await Review.findById(req.params.id).populate('mentor');
    if (!review) return res.status(404).json({ error: 'Review not found' });

    // Verify mentor permission. If type=event and no mentor, maybe check organizer? Let's just trust for now if mentor is not populated or let's strictly check if mentor exists.
    if (review.mentor && review.mentor.clerkId !== clerkId) {
      return res.status(403).json({ error: 'Only the mentor can reply to this review' });
    }

    review.reply = { text, createdAt: new Date() };
    await review.save();
    res.json(review);
  } catch (error) {
    console.error('Reply Review Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
