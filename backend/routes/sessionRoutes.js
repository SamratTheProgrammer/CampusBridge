import express from 'express';
import mongoose from 'mongoose';
import Session from '../models/Session.js';
import User from '../models/User.js';
import { createNotificationHelper } from './notificationRoutes.js';

const router = express.Router();

// Helper to query user by clerkId, _id, username, or email
const findUserByIdentifier = async (identifier) => {
  if (!identifier || identifier === 'undefined') return null;
  let query = [{ clerkId: identifier }, { username: identifier }, { email: identifier.toLowerCase().trim() }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.push({ _id: identifier });
  }
  return await User.findOne({ $or: query });
};

// Handler for creating a session
const createSessionHandler = async (req, res) => {
  try {
    const {
      studentClerkId,
      studentId,
      student,
      mentorClerkId,
      mentorId,
      mentor,
      type,
      sessionType,
      mode,
      date,
      time,
      duration,
      meetingLink,
      location,
      message,
      notes,
      studentNotes,
      goals,
      studentGoals,
      attachmentUrl,
      projectLink,
      resumeLink
    } = req.body;

    const studentTarget = studentClerkId || studentId || student;
    const studentUser = await findUserByIdentifier(studentTarget);
    if (!studentUser) {
      return res.status(404).json({ error: 'Student user not found' });
    }

    const mentorTarget = mentorClerkId || mentorId || mentor;
    const mentorUser = await findUserByIdentifier(mentorTarget);
    if (!mentorUser) {
      return res.status(404).json({ error: 'Mentor user not found' });
    }

    // Prevent self-booking
    if (studentUser._id.toString() === mentorUser._id.toString()) {
      return res.status(400).json({ error: 'You cannot book a mentorship session with yourself.' });
    }

    if (!date || !time) {
      return res.status(400).json({ error: 'Session date and time are required.' });
    }

    const finalType = type || sessionType || '1-on-1 Mentorship';
    const finalMode = mode || 'Online';
    const finalMessage = message || notes || studentNotes || '';
    const finalGoals = goals || studentGoals || '';
    const finalAttachment = attachmentUrl || projectLink || resumeLink || '';

    const newSession = new Session({
      student: studentUser._id,
      mentor: mentorUser._id,
      type: finalType,
      mode: finalMode,
      date: new Date(date),
      time,
      duration: Number(duration) || 30,
      meetingLink: meetingLink || '',
      location: location || '',
      message: finalMessage,
      goals: finalGoals,
      attachmentUrl: finalAttachment,
      status: 'pending'
    });

    await newSession.save();

    const populatedSession = await Session.findById(newSession._id)
      .populate('student', 'name firstName lastName username email imageUrl headline phone clerkId role course department semester github linkedin resume bio')
      .populate('mentor', 'name firstName lastName username email imageUrl headline phone clerkId company position role skills rating reviewsCount bio');

    const studentDisplayName = populatedSession.student?.firstName
      ? `${populatedSession.student.firstName} ${populatedSession.student.lastName || ''}`.trim()
      : (populatedSession.student?.name || 'A student');

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Send notification to mentor with rich details
    await createNotificationHelper({
      recipientClerkId: mentorUser.clerkId,
      senderClerkId: studentUser.clerkId,
      type: 'session_booked',
      title: 'New Session Requested 📅',
      message: `${studentDisplayName} requested a ${finalMode} session (${finalType}) on ${formattedDate} at ${time}.`,
      link: '/mentor-dashboard/requests'
    });

    res.status(201).json({
      success: true,
      message: 'Session requested successfully',
      session: populatedSession,
      ...populatedSession.toObject()
    });
  } catch (error) {
    console.error('Create Session Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create a new session request (both / and /book)
router.post('/', createSessionHandler);
router.post('/book', createSessionHandler);

// Get sessions for a user (either student or mentor)
router.get('/user/:clerkId', async (req, res) => {
  try {
    const user = await findUserByIdentifier(req.params.clerkId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const sessions = await Session.find({
      $or: [{ student: user._id }, { mentor: user._id }]
    })
      .populate('student', 'name firstName lastName username email imageUrl headline phone clerkId role course department semester github linkedin resume bio')
      .populate('mentor', 'name firstName lastName username email imageUrl headline phone clerkId company position role skills rating reviewsCount bio')
      .sort({ date: 1, createdAt: -1 });

    res.json(sessions);
  } catch (error) {
    console.error('Get Sessions Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single session by id
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('student', 'name firstName lastName username email imageUrl headline phone clerkId role course department semester github linkedin resume bio')
      .populate('mentor', 'name firstName lastName username email imageUrl headline phone clerkId company position role skills rating reviewsCount bio');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Get Single Session Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update session status or details
router.put('/:id', async (req, res) => {
  try {
    const { status, mode, meetingLink, location, date, time, declineReason } = req.body;
    const session = await Session.findById(req.params.id)
      .populate('student', 'clerkId firstName lastName name email')
      .populate('mentor', 'clerkId firstName lastName name');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (status !== undefined) session.status = status;
    if (mode !== undefined) session.mode = mode;
    if (meetingLink !== undefined) session.meetingLink = meetingLink;
    if (location !== undefined) session.location = location;
    if (date !== undefined) session.date = new Date(date);
    if (time !== undefined) session.time = time;
    if (declineReason !== undefined) session.declineReason = declineReason;

    await session.save();

    // Send notification if status changed
    if (status) {
      const recipientClerkId = session.student?.clerkId;
      if (recipientClerkId) {
        const mentorName = session.mentor?.firstName || session.mentor?.name || 'Your mentor';
        const formattedDate = session.date ? new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

        let notifTitle = `Session ${status.charAt(0).toUpperCase() + status.slice(1)}`;
        let notifMessage = `Your ${session.mode} session with ${mentorName} was ${status}.`;

        if (status === 'accepted') {
          notifTitle = 'Session Accepted! 🎉';
          notifMessage = `${mentorName} accepted your ${session.mode} session (${session.type}) for ${formattedDate} at ${session.time}.${session.meetingLink ? ' Meeting link is now available.' : ''}`;
        } else if (status === 'declined') {
          notifTitle = 'Session Request Declined';
          notifMessage = `${mentorName} was unable to accept your session request${session.declineReason ? `: "${session.declineReason}"` : '.'}`;
        }

        await createNotificationHelper({
          recipientClerkId,
          senderClerkId: session.mentor?.clerkId,
          type: 'session_booked',
          title: notifTitle,
          message: notifMessage,
          link: '/dashboard/sessions'
        });
      }
    }

    const updatedSession = await Session.findById(session._id)
      .populate('student', 'name firstName lastName email imageUrl headline phone clerkId role course department semester github linkedin resume bio')
      .populate('mentor', 'name firstName lastName email imageUrl headline phone clerkId company position role skills rating reviewsCount bio');

    res.json(updatedSession);
  } catch (error) {
    console.error('Update Session Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete or cancel a session
router.delete('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('student', 'clerkId firstName lastName name')
      .populate('mentor', 'clerkId firstName lastName name');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await Session.findByIdAndDelete(req.params.id);

    // Notify mentor or student about cancellation
    const mentorClerkId = session.mentor?.clerkId;
    const studentName = session.student?.firstName || session.student?.name || 'A student';
    if (mentorClerkId) {
      await createNotificationHelper({
        recipientClerkId: mentorClerkId,
        senderClerkId: session.student?.clerkId,
        type: 'session_booked',
        title: 'Session Request Cancelled',
        message: `${studentName} cancelled their session request for ${session.time} on ${new Date(session.date).toLocaleDateString()}.`,
        link: '/mentor-dashboard/requests'
      });
    }

    res.json({ message: 'Session cancelled/deleted successfully' });
  } catch (error) {
    console.error('Delete Session Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
