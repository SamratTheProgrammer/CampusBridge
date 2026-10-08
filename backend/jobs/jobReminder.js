import cron from 'node-cron';
import { differenceInDays, format } from 'date-fns';
import Job from '../models/Job.js';

export const startJobReminderJob = () => {
  console.log('Job reminder cron job initialized (runs daily at 8 AM).');
  
  // Run every day at 08:00 AM
  cron.schedule('0 8 * * *', async () => {
    try {
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
              const payload = {
                service_id: process.env.EMAILJS_SERVICE_ID || 'service_a3vg38b',
                template_id: process.env.EMAILJS_JOB_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID || 'template_c45j16i',
                user_id: process.env.EMAILJS_PUBLIC_KEY || 'JAA5yhiRssyoyqKqW',
                template_params: {
                  to_email: student.email,
                  to_name: student.firstName,
                  subject: `⚠️ Reminder: 3 Days left to apply for ${job.title} at ${job.company}`,
                  message: `This is a reminder that the deadline to apply for ${job.title} at ${job.company} is in just 3 days! Last date: ${format(job.deadline, 'MMMM d, yyyy')}. Apply here: ${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/jobs/${job._id}`
                }
              };

              const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              if (!emailRes.ok) throw new Error('EmailJS failed to send reminder');

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
