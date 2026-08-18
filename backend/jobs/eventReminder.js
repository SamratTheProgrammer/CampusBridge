import cron from 'node-cron';
import { Resend } from 'resend';
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
      const resend = new Resend(process.env.RESEND_API_KEY);
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
              await resend.emails.send({
                from: 'CampusBridge <onboarding@resend.dev>',
                to: attendee.email,
                subject: `🚀 ${event.title} starts in 15 minutes!`,
                // Resend allows sending with template ID via HTML if they used the broadcast feature?
                // Actually, if using an alias, we can pass it if we have the right API endpoint, but standard SDK might not support aliases directly in the 'html' field.
                // Wait, if it's a Resend Broadcast/Template, the SDK has:
                // resend.emails.send({ ... html: '' }) but for templates:
                // resend.emails.send({ ..., templateId: '...', templateData: { ... } })
                // Let's pass the raw HTML since that's safest, or attempt to use the html we provided earlier.
                // Actually, let's use the HTML directly to be 100% sure it works without template ID errors.
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Event Reminder</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                        .header { background-color: #4f46e5; padding: 30px 20px; text-align: center; }
                        .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
                        .content { padding: 30px; color: #333333; line-height: 1.6; }
                        .event-box { background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
                        .event-detail { margin-bottom: 10px; font-size: 15px; }
                        .event-detail strong { color: #1e293b; display: inline-block; width: 60px; }
                        .btn-container { text-align: center; margin-top: 35px; margin-bottom: 25px; }
                        .btn { background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; }
                        .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Starting in 15 Minutes! 🚀</h1>
                        </div>
                        <div class="content">
                            <p>Hi <strong>${attendee.firstName} ${attendee.lastName || ''}</strong>,</p>
                            <p>Get ready! The event you are attending is about to start in exactly 15 minutes.</p>
                            
                            <div class="event-box">
                                <div class="event-detail">
                                    <strong>Event:</strong> ${event.title}
                                </div>
                                <div class="event-detail">
                                    <strong>Time:</strong> ${event.time}
                                </div>
                            </div>
                
                            <div class="btn-container">
                                <a href="${event.link || '#'}" class="btn">Join Event Now</a>
                            </div>
                            
                            <p style="margin-top: 30px;">See you there,<br><strong>CampusBridge Team</strong></p>
                        </div>
                        <div class="footer">
                            <p>If you're having trouble clicking the button, copy and paste this link into your browser:<br>
                            <a href="${event.link || '#'}" style="color: #4f46e5; word-break: break-all;">${event.link || '#'}</a></p>
                        </div>
                    </div>
                </body>
                </html>`
              });
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
