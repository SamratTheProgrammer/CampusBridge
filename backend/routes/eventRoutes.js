import express from 'express';
import Event from '../models/Event.js';
import User from '../models/User.js';
import EventApplication from '../models/EventApplication.js';
import Post from '../models/Post.js';

const router = express.Router();

// Get all active events (supports ?category=event or ?category=session filter)
router.get('/', async (req, res) => {
  try {
    const filter = { active: true };
    if (req.query.category) {
      filter.category = req.query.category;
    }
    const events = await Event.find(filter)
      .populate('organizer', 'name firstName lastName email imageUrl role clerkId headline position company')
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get events by mentor (for mentor dashboard)
router.get('/mentor/:clerkId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const events = await Event.find({ organizer: user._id })
      .populate('organizer', 'name firstName lastName email imageUrl role clerkId headline position company')
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new event or session
router.post('/', async (req, res) => {
  try {
    const { title, type, mode, date, time, location, link, description, clerkId, category, postToFeed, imageUrl } = req.body;
    let organizerId = null;
    if (clerkId) {
      const user = await User.findOne({ clerkId });
      if (user) organizerId = user._id;
    }
    
    const newEvent = new Event({
      title,
      type,
      mode: mode || 'Online',
      date,
      time,
      location,
      link,
      description,
      category: category || 'event',
      organizer: organizerId,
      imageUrl
    });
    
    await newEvent.save();

    if (postToFeed && clerkId) {
      const newPost = new Post({
        authorClerkId: clerkId,
        content: `I'm hosting a new ${type}: ${title}! Join me on ${new Date(date).toLocaleDateString()} at ${time}.`,
        eventDetails: {
          title,
          date,
          time,
          location: mode === 'Online' ? 'Online' : location,
          type
        }
      });
      await newPost.save();
    }

    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an event
router.put('/:id', async (req, res) => {
  try {
    const { title, type, mode, date, time, location, link, description, active, imageUrl } = req.body;
    
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    event.title = title !== undefined ? title : event.title;
    event.type = type !== undefined ? type : event.type;
    event.mode = mode !== undefined ? mode : event.mode;
    event.date = date !== undefined ? date : event.date;
    event.time = time !== undefined ? time : event.time;
    event.location = location !== undefined ? location : event.location;
    event.link = link !== undefined ? link : event.link;
    event.description = description !== undefined ? description : event.description;
    event.active = active !== undefined ? active : event.active;
    event.imageUrl = imageUrl !== undefined ? imageUrl : event.imageUrl;

    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    await Event.findByIdAndDelete(req.params.id);
    
    // Optionally remove related applications
    await EventApplication.deleteMany({ event: req.params.id });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply for an event
router.post('/:id/apply', async (req, res) => {
  try {
    const { clerkId, applicantRole, applicantDetails } = req.body;
    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if already applied
    const existingApp = await EventApplication.findOne({ event: event._id, applicant: user._id });
    if (existingApp) {
      return res.status(400).json({ error: 'You have already registered for this event' });
    }

    const application = new EventApplication({
      event: event._id,
      applicant: user._id,
      applicantRole: applicantRole || 'student',
      applicantDetails: applicantDetails || {}
    });
    await application.save();

    // Add to event attendees array
    if (!event.attendees.includes(user._id)) {
      event.attendees.push(user._id);
      await event.save();
    }

    res.status(201).json({ message: 'Registration successful', application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get applications for a specific event (mentor only)
router.get('/:id/applications', async (req, res) => {
  try {
    const applications = await EventApplication.find({ event: req.params.id })
      .populate('applicant', 'name firstName lastName email imageUrl headline phone role')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get events a user has registered for (for student "My Upcoming Sessions")
router.get('/registered/:clerkId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const applications = await EventApplication.find({ applicant: user._id })
      .populate({
        path: 'event',
        populate: { path: 'organizer', select: 'name firstName lastName email imageUrl headline phone clerkId company position role' }
      })
      .sort({ createdAt: -1 });

    // Return the events with registration status
    const registeredEvents = applications
      .filter(app => app.event) // filter out any null events
      .map(app => ({
        _id: app._id,
        eventId: app.event._id,
        title: app.event.title,
        description: app.event.description,
        category: app.event.category,
        type: app.event.type || 'Masterclass',
        mode: app.event.mode || 'Online',
        date: app.event.date,
        time: app.event.time,
        location: app.event.location,
        link: app.event.link,
        organizer: app.event.organizer,
        attendees: app.event.attendees,
        registrationStatus: app.status,
        registeredAt: app.createdAt,
        source: 'event' // to distinguish from 1-on-1 sessions
      }));

    res.json(registeredEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
