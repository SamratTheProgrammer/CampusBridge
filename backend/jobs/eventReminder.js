import cron from 'node-cron';
import { parse, isValid, differenceInMinutes, format } from 'date-fns';
import Event from '../models/Event.js';

// We will instantiate Resend inside the job function after env vars are loaded

const parseEventTime = (timeStr) => {
  if (!timeStr) return null;
  // Try to parse strings like "4:00 PM - 5:00 PM"
  try {
    const startTimeStr = timeStr.split('-')[0].trim();
    // Parse using date-fns
    const parsedDate = parse(startTimeStr, 'h:mm a', new Date());
    if (isValid(parsedDate)) return parsedDate;
    
    // Fallback for "16:00" etc
    const fallbackDate = parse(startTimeStr, 'HH:mm', new Date());
    if (isValid(fallbackDate)) return fallbackDate;
  } catch (err) {
    console.error('Error parsing time:', timeStr);
  }
  return null;
}

export const startEventReminderJob = () => {
  console.log('Event reminder cron job initialized (runs every 1 minute).');
  
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
        date: { $gte: todayStart, $lte: todayEnd }
      }).populate('attendees', 'email firstName lastName');

      for (const event of upcomingEvents) {
        if (!event.time || !event.attendees || event.attendees.length === 0) continue;
        if (event.reminderSent) continue; // Skip if already sent

        const startTime = parseEventTime(event.time);
        if (!startTime) continue;

        // Check if the event starts in exactly 15 minutes (we allow a buffer between 14 to 16 mins)
        const diffMinutes = differenceInMinutes(startTime, now);
        
        if (diffMinutes >= 14 && diffMinutes <= 16) {
          console.log(`[Event Reminder] Sending reminders for event: "${event.title}" starting in ${diffMinutes} mins.`);
          
          let successCount = 0;
          for (const attendee of event.attendees) {
            if (!attendee.email) continue;
            
            try {
              const payload = {
                service_id: process.env.EMAILJS_SERVICE_ID || 'service_a3vg38b',
                template_id: process.env.EMAILJS_EVENT_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID || 'template_wlyvsuf',
                user_id: process.env.EMAILJS_PUBLIC_KEY || 'JAA5yhiRssyoyqKqW',
                template_params: {
                  to_email: attendee.email,
                  to_name: attendee.firstName,
                  subject: `🚀 ${event.title} starts in 15 minutes!`,
                  message: `Get ready! The event "${event.title}" is about to start in exactly 15 minutes. Join here: ${event.link || '#'}`
                }
              };

              const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              if (!emailRes.ok) throw new Error('EmailJS failed to send event reminder');

              successCount++;
            } catch (err) {
              console.error(`[Event Reminder] Failed to send email to ${attendee.email}:`, err);
            }
          }
          
          console.log(`[Event Reminder] Successfully sent ${successCount} emails for "${event.title}".`);
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
