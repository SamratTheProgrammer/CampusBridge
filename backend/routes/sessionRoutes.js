import express from 'express';
import Session from '../models/Session.js';
import User from '../models/User.js';
import { createNotificationHelper } from './notificationRoutes.js';

const router = express.Router();

// Create a new session request
router.post('/', async (req, res) => {
  try {
    const { studentClerkId, mentorClerkId, mentorId, type, mode, date, time, duration, meetingLink, location, message } = req.body;

    const studentUser = await User.findOne({ clerkId: studentClerkId });
    if (!studentUser) {
      return res.status(404).json({ error: 'Student user not found' });
    }

    let mentorUser = null;
    if (mentorClerkId) {
      mentorUser = await User.findOne({ clerkId: mentorClerkId });
    } else if (mentorId) {
      mentorUser = await User.findById(mentorId);
    }

    if (!mentorUser) {
      return res.status(404).json({ error: 'Mentor user not found' });
    }

    const newSession = new Session({
      student: studentUser._id,
      mentor: mentorUser._id,
      type: type || 'Career Guidance',
      mode: mode || 'Online',
      date,
      time,
      duration: duration || 30,
      meetingLink: meetingLink || '',
      location: location || '',
      message: message || '',
      status: 'pending'
    });

    await newSession.save();

    // Send notification to mentor
    await createNotificationHelper({
      recipientClerkId: mentorUser.clerkId,
      senderClerkId: studentUser.clerkId,
      type: 'session_booked',
      title: 'New Session Requested 📅',
      message: `${studentUser.firstName} ${studentUser.lastName || ''} requested a ${mode || 'Online'} session (${type || 'Mentorship'}) on ${new Date(date).toLocaleDateString()}.`,
      link: '/mentor-dashboard/requests'
    });

    res.status(201).json(newSession);
  } catch (error) {
    console.error('Create Session Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get sessions for a user (either student or mentor)
router.get('/user/:clerkId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const sessions = await Session.find({
      $or: [{ student: user._id }, { mentor: user._id }]
    })
      .populate('student', 'name firstName lastName email imageUrl headline phone clerkId role')
      .populate('mentor', 'name firstName lastName email imageUrl headline phone clerkId company position role')
      .sort({ date: 1, createdAt: -1 });

    res.json(sessions);
  } catch (error) {
    console.error('Get Sessions Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update session status or details
router.put('/:id', async (req, res) => {
  try {
    const { status, mode, meetingLink, location, date, time } = req.body;
    const session = await Session.findById(req.params.id)
      .populate('student', 'clerkId firstName lastName')
      .populate('mentor', 'clerkId firstName lastName');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (status !== undefined) session.status = status;
    if (mode !== undefined) session.mode = mode;
    if (meetingLink !== undefined) session.meetingLink = meetingLink;
    if (location !== undefined) session.location = location;
    if (date !== undefined) session.date = date;
    if (time !== undefined) session.time = time;

    await session.save();

    // Send notification if status changed
    if (status) {
      const recipientClerkId = session.student?.clerkId;
      if (recipientClerkId) {
        await createNotificationHelper({
          recipientClerkId,
          senderClerkId: session.mentor?.clerkId,
          type: 'session_booked',
          title: `Session ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your ${session.mode} session with ${session.mentor?.firstName || 'your mentor'} was ${status}.`,
          link: '/dashboard/sessions'
        });
      }
    }

    res.json(session);
  } catch (error) {
    console.error('Update Session Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete or cancel a session
router.delete('/:id', async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ message: 'Session cancelled/deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
