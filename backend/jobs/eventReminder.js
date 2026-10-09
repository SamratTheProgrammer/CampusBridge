import cron from 'node-cron';
import { parse, isValid, differenceInMinutes } from 'date-fns';
import Event from '../models/Event.js';
import { createNotificationHelper } from '../routes/notificationRoutes.js';

const parseEventTime = (timeStr, eventDate) => {
  if (!timeStr) return null;
  try {
    const startTimeStr = timeStr.split('-')[0].trim();
    const baseDate = eventDate ? new Date(eventDate) : new Date();

    const formats = ['h:mm a', 'h:mma', 'hh:mm a', 'hh:mma', 'HH:mm', 'H:mm', 'h a', 'ha'];
    for (const fmt of formats) {
      const parsed = parse(startTimeStr, fmt, baseDate);
      if (isValid(parsed)) {
        parsed.setFullYear(baseDate.getFullYear());
        parsed.setMonth(baseDate.getMonth());
        parsed.setDate(baseDate.getDate());
        return parsed;
      }
    }
  } catch (err) {
    console.error('[Event Reminder] Error parsing time:', timeStr, err);
  }
  return null;
};

export const startEventReminderJob = (io) => {
  console.log('Event reminder cron job initialized (runs every 1 minute for 15-minute start alert).');

  // Run every 1 minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Get events scheduled for today that are active
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const upcomingEvents = await Event.find({
        active: true,
        reminderSent: { $ne: true },
        date: { $gte: todayStart, $lte: todayEnd }
      }).populate('attendees', 'email firstName lastName clerkId role');

      for (const event of upcomingEvents) {
        if (!event.time || !event.attendees || event.attendees.length === 0) continue;
        if (event.reminderSent) continue;

        const startTime = parseEventTime(event.time, event.date);
        if (!startTime) continue;

        // Check if the event starts in 15 minutes or less (within 0 to 15 mins window)
        const diffMinutes = differenceInMinutes(startTime, now);

        if (diffMinutes <= 15 && diffMinutes >= 0) {
          console.log(`[Event Reminder] Sending 15-min reminders for event: "${event.title}" starting in ${diffMinutes} mins.`);

          const serviceId = process.env.EMAILJS_EVENT_REMINDER_SERVICE_ID || process.env.EMAILJS_SERVICE_ID || 'service_j8idhaa';
          const templateId = process.env.EMAILJS_EVENT_REMINDER_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID || 'template_d5wk0ng';
          const publicKey = process.env.EMAILJS_EVENT_REMINDER_PUBLIC_KEY || process.env.EMAILJS_PUBLIC_KEY || 'BtfZJ-Xb0-sDmtRxr';

          const formattedEventDate = event.date ? new Date(event.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }) : 'Today';

          let successEmailCount = 0;
          let successAppNotifCount = 0;

          for (const attendee of event.attendees) {
            const attendeeName = `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim() || 'Participant';
            const attendeeEmail = attendee.email;

            // 1. Send Email Notification via EmailJS
            if (attendeeEmail) {
              try {
                const payload = {
                  service_id: serviceId,
                  template_id: templateId,
                  user_id: publicKey,
                  template_params: {
                    to_email: attendeeEmail,
                    user_email: attendeeEmail,
                    email: attendeeEmail,
                    recipient: attendeeEmail,
                    to_name: attendeeName,
                    name: attendeeName,
                    user_name: attendeeName,
                    event_title: event.title,
                    event_name: event.title,
                    title: event.title,
                    event_date: formattedEventDate,
                    date: formattedEventDate,
                    event_time: event.time || '',
                    time: event.time || '',
                    event_location: event.location || event.mode || 'Online',
                    location: event.location || event.mode || 'Online',
                    event_link: event.link || '',
                    link: event.link || '',
                    time_remaining: `${diffMinutes} minutes`,
                    from_name: 'CampusBridge',
                    subject: `🚀 "${event.title}" starts in 15 minutes!`,
                    message: `Get ready! The event "${event.title}" is about to start in ${diffMinutes} minutes. Join the session or review details here: ${event.link || '#'}`
                  }
                };

                const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Origin': 'http://localhost:5173'
                  },
                  body: JSON.stringify(payload)
                });

                if (!emailRes.ok) {
                  const errorText = await emailRes.text();
                  console.error(`[Event Reminder] EmailJS returned error for ${attendeeEmail}:`, errorText);
                } else {
                  successEmailCount++;
                }
              } catch (err) {
                console.error(`[Event Reminder] Failed to send email to ${attendeeEmail}:`, err);
              }
            }

            // 2. Send In-App Notification (Stored in DB + Socket real-time push)
            if (attendee.clerkId) {
              try {
                const attendeeRole = attendee.role || 'student';
                const basePath = ['mentor', 'alumni'].includes(attendeeRole) ? '/mentor-dashboard' : '/dashboard';
                const eventLink = event.link || `${basePath}/events`;

                await createNotificationHelper({
                  recipientClerkId: attendee.clerkId,
                  senderClerkId: 'system',
                  type: 'event_reminder',
                  title: '⏰ Event Starting in 15 Minutes!',
                  message: `"${event.title}" starts in ${diffMinutes} minutes (${event.time || ''}). Click to join or view details!`,
                  link: eventLink,
                  io
                });
                successAppNotifCount++;
              } catch (appErr) {
                console.error(`[Event Reminder] Failed to create in-app notification for ${attendee.clerkId}:`, appErr);
              }
            }
          }

          console.log(`[Event Reminder] Successfully processed "${event.title}": ${successEmailCount} emails, ${successAppNotifCount} in-app alerts.`);

          // Mark as sent so we don't send again
          event.reminderSent = true;
          await event.save();
        }
      }
    } catch (error) {
      console.error('[Event Reminder] Error in cron job:', error);
    }
  });
};
