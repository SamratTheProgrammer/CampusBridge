import express from 'express';
import { Resend } from 'resend';
import Event from '../models/Event.js';
import User from '../models/User.js';
import EventApplication from '../models/EventApplication.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
import Review from '../models/Review.js';
import { verifyAdminToken } from '../middleware/adminAuth.js';

const router = express.Router();


// Helper to enrich event with organizer fallback and rating
async function enrichEvent(evDoc, defaultMentor) {
  const ev = evDoc.toObject ? evDoc.toObject() : { ...evDoc };
  if (!ev.organizer) {
    if (defaultMentor) {
      ev.organizer = {
        _id: defaultMentor._id,
        id: defaultMentor._id,
        name: defaultMentor.name || `${defaultMentor.firstName || ''} ${defaultMentor.lastName || ''}`.trim() || defaultMentor.username || 'Mentor Host',
        firstName: defaultMentor.firstName || 'Mentor',
        lastName: defaultMentor.lastName || 'Host',
        email: defaultMentor.email || 'mentor@campusbridge.com',
        imageUrl: defaultMentor.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(defaultMentor.firstName || 'Host')}`,
        role: defaultMentor.role || 'mentor',
        clerkId: defaultMentor.clerkId || '',
        username: defaultMentor.username || defaultMentor.clerkId || String(defaultMentor._id),
        headline: defaultMentor.headline || 'CampusBridge Mentor',
        company: defaultMentor.company || 'CampusBridge',
        rating: defaultMentor.rating || 4.9
      };
      Event.updateOne({ _id: ev._id }, { $set: { organizer: defaultMentor._id } }).exec().catch(() => {});
    }
  } else if (typeof ev.organizer === 'object') {
    ev.organizer.name = ev.organizer.name || `${ev.organizer.firstName || ''} ${ev.organizer.lastName || ''}`.trim() || ev.organizer.username || 'Host';
    if (!ev.organizer.imageUrl) {
      ev.organizer.imageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(ev.organizer.firstName || 'Host')}`;
    }
  }

  try {
    const reviews = await Review.find({ referenceId: ev._id })
      .populate('reviewer', 'name firstName lastName email imageUrl username clerkId')
      .sort({ createdAt: -1 });

    if (reviews && reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + (r.contentRating || r.mentorRating || 5), 0);
      ev.rating = Number((sum / reviews.length).toFixed(1));
      ev.reviewsCount = reviews.length;
      ev.reviews = reviews;
    } else {
      ev.rating = Number((ev.organizer?.rating || 4.9).toFixed(1));
      ev.reviewsCount = Math.max(ev.attendees?.length || 0, 8);
      ev.reviews = [];
    }
  } catch (e) {
    ev.rating = Number((ev.organizer?.rating || 4.9).toFixed(1));
    ev.reviewsCount = Math.max(ev.attendees?.length || 0, 8);
    ev.reviews = [];
  }
  return ev;
}

// Get all active events (supports ?category=event or ?category=session filter, with auto-seeding)
router.get('/', async (req, res) => {
  try {
    let filter = {};
    let isAdmin = false;
    if (req.query.admin_override === 'true') {
      const authHeader = req.headers.authorization || req.headers['x-admin-token'];
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader?.trim();
      if (token && verifyAdminToken(token)) {
        isAdmin = true;
      }
    }
    if (!isAdmin) {
      filter.active = true;
      filter.moderationStatus = { $nin: ['paused', 'deleted'] };
    }
    
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }

    let events = await Event.find(filter)
      .populate('organizer', 'name firstName lastName email imageUrl role clerkId headline position company username')
      .populate('attendees', 'name firstName lastName email imageUrl username clerkId headline role')
      .sort({ createdAt: -1 });

    // Seed sample events if none exist in database
    if (events.length === 0 && !isAdmin) {
      try {
        const SAMPLE_EVENTS = [
          {
            title: 'AI & Deep Learning Masterclass',
            type: 'Masterclass',
            mode: 'Online',
            date: new Date('2026-08-25'),
            time: '6:00 PM - 8:00 PM',
            link: 'https://meet.google.com/campusbridge-ai',
            description: 'Join top AI researchers for an interactive deep dive into Generative AI, Neural Networks, and LLM Fine-Tuning.',
            category: 'event',
            active: true,
            imageUrl: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=600&q=80'
          },
          {
            title: 'Global Placement & Internship Fair 2026',
            type: 'Career Fair',
            mode: 'Offline',
            location: 'Main Campus Auditorium, Block C',
            date: new Date('2026-09-10'),
            time: '10:00 AM - 5:00 PM',
            description: 'Connect directly with hiring managers from Google, Microsoft, Amazon, Swiggy, and 50+ top tech startups.',
            category: 'event',
            active: true,
            imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80'
          },
          {
            title: 'Web3 & Full-Stack Development Bootcamp',
            type: 'Workshop',
            mode: 'Online',
            date: new Date('2026-09-02'),
            time: '4:00 PM - 6:30 PM',
            link: 'https://meet.google.com/campusbridge-web3',
            description: 'Hands-on workshop building production-ready React + Node.js full-stack applications with live Q&A.',
            category: 'event',
            active: true,
            imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&q=80'
          }
        ];
        await Event.insertMany(SAMPLE_EVENTS);
        events = await Event.find(filter)
          .populate('organizer', 'name firstName lastName email imageUrl role clerkId headline position company username')
          .populate('attendees', 'name firstName lastName email imageUrl username clerkId headline role')
          .sort({ createdAt: -1 });
      } catch (seedErr) {
        console.error('Error seeding initial events:', seedErr);
      }
    }

    let defaultMentor = await User.findOne({ role: 'mentor' }) || await User.findOne();
    const enrichedEvents = await Promise.all(events.map(ev => enrichEvent(ev, defaultMentor)));
    res.json(enrichedEvents);
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
    const events = await Event.find({ organizer: user._id, moderationStatus: { $ne: 'deleted' } })
      .populate('organizer', 'name firstName lastName email imageUrl role clerkId headline position company username')
      .populate('attendees', 'name firstName lastName imageUrl username clerkId')
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new event or session
router.post('/', async (req, res) => {
  try {
    const { title, type, mode, date, lastRegDate, time, location, link, description, clerkId, organizerId: customOrganizerId, category, postToFeed, imageUrl } = req.body;
    let organizerId = customOrganizerId || null;
    if (!organizerId && clerkId) {
      const user = await User.findOne({ clerkId });
      if (user) organizerId = user._id;
    }
    if (!organizerId) {
      const defaultMentor = await User.findOne({ role: 'mentor' }) || await User.findOne();
      if (defaultMentor) organizerId = defaultMentor._id;
    }
    
    const newEvent = new Event({
      title,
      type,
      mode: mode || 'Online',
      date,
      lastRegDate: lastRegDate || null,
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
          type,
          format: mode === 'Online' ? 'online' : 'offline',
          source: 'campusbridge',
          campusBridgeEventId: newEvent._id.toString(),
          imageUrl: imageUrl || ''
        }
      });
      await newPost.save();
    }
    
    // Notify all users about the new event
    if (clerkId) {
      const user = await User.findOne({ clerkId });
      if (user) {
        const allUsers = await User.find({ clerkId: { $ne: clerkId } });
        const notifications = allUsers.map(u => ({
          recipientClerkId: u.clerkId,
          senderClerkId: user.clerkId,
          senderName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Event Host',
          senderImage: user.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.firstName || 'Host')}`,
          type: 'event_posted',
          title: 'New Event Scheduled!',
          message: `${user.firstName} is hosting a new ${type}: ${title}`,
          link: `/dashboard/events`
        }));
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
    }

    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an event
router.put('/:id', async (req, res) => {
  try {
    const { title, type, mode, date, lastRegDate, time, location, link, description, active, imageUrl, organizerId } = req.body;
    
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    event.title = title !== undefined ? title : event.title;
    event.type = type !== undefined ? type : event.type;
    event.mode = mode !== undefined ? mode : event.mode;
    event.date = date !== undefined ? date : event.date;
    event.lastRegDate = lastRegDate !== undefined ? lastRegDate : event.lastRegDate;
    event.time = time !== undefined ? time : event.time;
    event.location = location !== undefined ? location : event.location;
    event.link = link !== undefined ? link : event.link;
    event.description = description !== undefined ? description : event.description;
    event.active = active !== undefined ? active : event.active;
    event.imageUrl = imageUrl !== undefined ? imageUrl : event.imageUrl;
    if (organizerId !== undefined) {
      event.organizer = organizerId;
    }

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

    // Check if registration deadline has passed
    if (event.lastRegDate) {
      const deadline = new Date(event.lastRegDate);
      deadline.setHours(23, 59, 59, 999);
      if (deadline < new Date()) {
        return res.status(400).json({ error: 'Registration deadline for this event has passed' });
      }
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

    // Sync phone number from registration form to user profile if available
    if (applicantDetails?.phone && (!user.phone || user.phone !== applicantDetails.phone)) {
      user.phone = applicantDetails.phone;
      await user.save();
    }

    // Add to event attendees array
    if (!event.attendees.includes(user._id)) {
      event.attendees.push(user._id);
      await event.save();
    }

    // Send Event Confirmation Email using EmailJS ONLY if not already sent by client
    if (!req.body.clientHandledEmail) {
      try {
        const eventDate = new Date(event.date).toLocaleDateString();
        
        const payload = {
          service_id: process.env.EMAILJS_SERVICE_ID || 'service_a3vg38b',
          template_id: process.env.EMAILJS_EVENT_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID || 'template_wlyvsuf',
          user_id: process.env.EMAILJS_PUBLIC_KEY || 'JAA5yhiRssyoyqKqW',
          template_params: {
            to_email: user.email,
            user_email: user.email,
            email: user.email,
            to_name: user.firstName || user.name || 'Participant',
            name: user.firstName || user.name || 'Participant',
            user_name: user.firstName || user.name || 'Participant',
            event_name: event.title,
            event_title: event.title,
            title: event.title,
            event_date: eventDate,
            date: eventDate,
            event_time: event.time || '',
            time: event.time || '',
            event_location: event.location || event.type || 'Online',
            location: event.location || event.type || 'Online',
            event_link: event.link || '',
            link: event.link || ''
          }
        };

        const emailjsRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:5173'
          },
          body: JSON.stringify(payload)
        });

        if (!emailjsRes.ok) {
          const errorText = await emailjsRes.text();
          console.error('EmailJS Error:', errorText);
        }
      } catch (emailErr) {
        console.error('Failed to send confirmation email via EmailJS:', emailErr);
      }
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
      .populate('applicant', 'name firstName lastName email imageUrl headline phone role clerkId username')
      .sort({ createdAt: -1 });

    const event = await Event.findById(req.params.id)
      .populate('attendees', 'name firstName lastName email imageUrl headline phone role clerkId username');

    // If any attendee registered without an explicit EventApplication, synthesize fallback entry
    if (event && Array.isArray(event.attendees)) {
      const existingApplicantIds = new Set(
        applications.map(a => String(a.applicant?._id || a.applicant?.id || a.applicant))
      );
      for (const att of event.attendees) {
        if (att && att._id && !existingApplicantIds.has(String(att._id))) {
          applications.push({
            _id: `att_${att._id}`,
            event: event._id,
            applicant: att,
            applicantRole: att.role || 'student',
            applicantDetails: {
              name: att.name || `${att.firstName || ''} ${att.lastName || ''}`.trim() || att.username,
              email: att.email || '',
              phone: att.phone || ''
            },
            status: 'accepted',
            createdAt: event.createdAt
          });
        }
      }
    }

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
        _id: app.event._id, // Use the event ID as _id so selectors work
        applicationId: app._id,
        eventId: app.event._id,
        title: app.event.title,
        description: app.event.description,
        category: app.event.category,
        type: app.event.type || 'Masterclass',
        mode: app.event.mode || 'Online',
        format: app.event.mode === 'Offline' ? 'offline' : 'online',
        date: app.event.date,
        lastRegDate: app.event.lastRegDate,
        time: app.event.time,
        location: app.event.location,
        link: app.event.link,
        imageUrl: app.event.imageUrl || '',
        posterUrl: app.event.posterUrl || app.event.imageUrl || '',
        active: app.event.active,
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

// Get a single event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name firstName lastName email imageUrl role clerkId headline position company username')
      .populate('attendees', 'name firstName lastName email imageUrl username clerkId headline role');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    let defaultMentor = await User.findOne({ role: 'mentor' }) || await User.findOne();
    const enriched = await enrichEvent(event, defaultMentor);
    res.status(200).json(enriched);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
