import cron from 'node-cron';
import { Resend } from 'resend';
import { differenceInDays, format } from 'date-fns';
import Job from '../models/Job.js';

export const startJobReminderJob = () => {
  console.log('Job reminder cron job initialized (runs daily at 8 AM).');
  
  // Run every day at 08:00 AM
  cron.schedule('0 8 * * *', async () => {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const now = new Date();
      
      // Get active jobs with a deadline in the future, and where reminder hasn't been sent
      const upcomingJobs = await Job.find({
        active: true,
        deadline: { $gte: now },
        reminderSent: false,
        notifiedUsers: { $exists: true, $not: { $size: 0 } }
      }).populate('notifiedUsers', 'email firstName lastName');

      for (const job of upcomingJobs) {
        if (!job.deadline || !job.notifiedUsers || job.notifiedUsers.length === 0) continue;

        // Check if the job deadline is exactly 3 days away
        const diffDays = differenceInDays(job.deadline, now);
        
        if (diffDays <= 3 && diffDays >= 0) {
          console.log(`[Job Reminder] Sending reminders for job: "${job.title}" closing in ${diffDays} days.`);
          
          let successCount = 0;
          for (const student of job.notifiedUsers) {
            if (!student.email) continue;
            
            try {
              await resend.emails.send({
                from: 'CampusBridge <onboarding@resend.dev>',
                to: student.email,
                subject: `⚠️ Reminder: 3 Days left to apply for ${job.title} at ${job.company}`,
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Job Deadline Reminder</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                        .header { background-color: #ef4444; padding: 30px 20px; text-align: center; }
                        .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
                        .content { padding: 30px; color: #333333; line-height: 1.6; }
                        .event-box { background-color: #f8fafc; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
                        .event-detail { margin-bottom: 10px; font-size: 15px; }
                        .event-detail strong { color: #1e293b; display: inline-block; width: 80px; }
                        .btn-container { text-align: center; margin-top: 35px; margin-bottom: 25px; }
                        .btn { background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; }
                        .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Application Deadline Approaching! ⚠️</h1>
                        </div>
                        <div class="content">
                            <p>Hi <strong>${student.firstName} ${student.lastName || ''}</strong>,</p>
                            <p>This is a reminder that the deadline to apply for a job you are watching is in just 3 days.</p>
                            
                            <div class="event-box">
                                <div class="event-detail">
                                    <strong>Job:</strong> ${job.title}
                                </div>
                                <div class="event-detail">
                                    <strong>Company:</strong> ${job.company}
                                </div>
                                <div class="event-detail">
                                    <strong>Last Date:</strong> ${format(job.deadline, 'MMMM d, yyyy')}
                                </div>
                            </div>
                
                            <div class="btn-container">
                                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/jobs/${job._id}" class="btn">Apply Now</a>
                            </div>
                            
                            <p style="margin-top: 30px;">Best of luck,<br><strong>CampusBridge Team</strong></p>
                        </div>
                    </div>
                </body>
                </html>`
              });
              successCount++;
            } catch (err) {
              console.error(`[Job Reminder] Failed to send email to ${student.email}:`, err);
            }
          }
          
          console.log(`[Job Reminder] Successfully sent ${successCount} emails for "${job.title}".`);
          
          // Mark as sent so we don't send again
          job.reminderSent = true;
          await job.save();
        }
      }

    } catch (error) {
      console.error('[Job Reminder] Error in cron job:', error);
    }
  });
};
