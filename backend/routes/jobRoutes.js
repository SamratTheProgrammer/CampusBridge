import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';
import JobApplication from '../models/JobApplication.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get all active jobs (for student dashboard)
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ active: true, moderationStatus: { $nin: ['paused', 'deleted'] } })
      .populate('postedBy', 'name email imageUrl role clerkId')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get jobs by mentor (for mentor dashboard)
router.get('/mentor/:clerkId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const jobs = await Job.find({ postedBy: user._id, moderationStatus: { $ne: 'deleted' } })
      .populate('postedBy', 'name email imageUrl role clerkId')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new job
router.post('/', async (req, res) => {
  try {
    const { title, company, companyLogo, location, type, salary, eligibility, description, deadline, clerkId } = req.body;

    if (!title?.trim() || !company?.trim() || !location?.trim() || !type?.trim() || !salary?.trim() || !deadline || !description?.trim()) {
      return res.status(400).json({ error: 'Title, company, location, type, salary, deadline, and description are mandatory.' });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const cleanComp = (company || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const domainMap = {
      swiggy: 'swiggy.com',
      zomato: 'zomato.com',
      google: 'google.com',
      microsoft: 'microsoft.com',
      amazon: 'amazon.com',
      apple: 'apple.com',
      adobe: 'adobe.com',
      meta: 'meta.com',
      facebook: 'facebook.com',
      netflix: 'netflix.com',
      tcs: 'tcs.com',
      infosys: 'infosys.com',
      wipro: 'wipro.com',
      flipkart: 'flipkart.com',
      deloitte: 'deloitte.com',
      wns: 'wns.com',
      blinkit: 'blinkit.com',
      zepto: 'zeptonow.com',
    };
    const domain = domainMap[cleanComp];
    const autoLogo = companyLogo || (domain
      ? `https://www.google.com/s2/favicons?sz=128&domain=${domain}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&size=128&background=7c3aed&color=fff&bold=true`);

    const newJob = new Job({
      title,
      company,
      companyLogo: autoLogo,
      location,
      type,
      salary,
      eligibility,
      description,
      deadline,
      postedBy: user._id
    });
    
    await newJob.save();
    
    // Notify all students and alumni about the new job
    const recipients = await User.find({
      role: { $in: ['student', 'alumni'] },
      clerkId: { $ne: user.clerkId }
    });
    const senderFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'CampusBridge Mentor';
    const notifications = recipients.map(recipient => ({
      recipientClerkId: recipient.clerkId,
      senderClerkId: user.clerkId,
      senderName: senderFullName,
      senderImage: user.imageUrl,
      type: 'job_posted',
      title: 'New Job Posted!',
      message: `${company} is hiring for ${title}!`,
      link: `/dashboard/jobs/${newJob._id}`
    }));
    if (notifications.length > 0) {
      const inserted = await Notification.insertMany(notifications);
      const io = req.app.get('io');
      if (io) {
        inserted.forEach(notif => {
          io.emit('new_notification', notif);
        });
      }
    }

    res.status(201).json(newJob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a job
router.put('/:id', async (req, res) => {
  try {
    const { title, company, companyLogo, location, type, salary, eligibility, description, deadline, clerkId, active } = req.body;
    
    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Verify ownership
    if (job.postedBy.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this job' });
    }

    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ error: 'Job Title cannot be empty.' });
    }
    if (company !== undefined && !company.trim()) {
      return res.status(400).json({ error: 'Company cannot be empty.' });
    }
    if (location !== undefined && !location.trim()) {
      return res.status(400).json({ error: 'Location cannot be empty.' });
    }
    if (type !== undefined && !type.trim()) {
      return res.status(400).json({ error: 'Job Type cannot be empty.' });
    }
    if (salary !== undefined && !salary.trim()) {
      return res.status(400).json({ error: 'Salary cannot be empty.' });
    }
    if (deadline !== undefined && !deadline) {
      return res.status(400).json({ error: 'Deadline cannot be empty.' });
    }
    if (description !== undefined && !description.trim()) {
      return res.status(400).json({ error: 'Job Description cannot be empty.' });
    }

    job.title = title !== undefined ? title : job.title;
    job.company = company !== undefined ? company : job.company;
    job.companyLogo = companyLogo !== undefined ? companyLogo : job.companyLogo;
    job.location = location !== undefined ? location : job.location;
    job.type = type !== undefined ? type : job.type;
    if (eligibility !== undefined) {
      job.eligibility = eligibility;
      job.markModified('eligibility');
    }
    job.description = description !== undefined ? description : job.description;
    job.deadline = deadline !== undefined ? deadline : job.deadline;
    job.active = active !== undefined ? active : job.active;

    await job.save();
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single job by id
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'firstName lastName email imageUrl role clerkId')
      .populate('notifiedUsers', 'clerkId');
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a job
router.delete('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    await Job.findByIdAndDelete(req.params.id);
    
    // Optionally remove all related applications
    await JobApplication.deleteMany({ job: req.params.id });

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply for a job
router.post('/:id/apply', async (req, res) => {
  try {
    const { clerkId, resumeLink, coverLetter, clientHandledEmail } = req.body;
    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if already applied
    const existingApp = await JobApplication.findOne({ job: job._id, applicant: user._id });
    if (existingApp) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

    const application = new JobApplication({
      job: job._id,
      applicant: user._id,
      resumeLink,
      coverLetter
    });
    await application.save();

    // Add to job applicants array for quick count
    if (!job.applicants.includes(user._id)) {
      job.applicants.push(user._id);
      await job.save();
    }

    // Notify the mentor (job poster)
    const mentor = await User.findById(job.postedBy);
    if (mentor) {
      const notif = await Notification.create({
        recipientClerkId: mentor.clerkId,
        senderClerkId: user.clerkId,
        senderName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Applicant',
        senderImage: user.imageUrl,
        type: 'system',
        title: 'New Job Application',
        message: `${user.firstName || 'A candidate'} applied for ${job.title}`,
        link: `/mentor-dashboard/jobs`
      });
      const io = req.app.get('io');
      if (io) {
        io.emit('new_notification', notif);
      }
    }

    // Send Job Confirmation Email using EmailJS ONLY if not already sent by client
    if (!clientHandledEmail) {
      try {
        const recruiterName = mentor 
          ? (`${mentor.firstName || ''} ${mentor.lastName || ''}`.trim() || mentor.username)
          : `${job.company} Recruitment Team`;

        const emailPayload = {
          service_id: process.env.EMAILJS_SERVICE_ID || 'service_a3vg38b',
          template_id: process.env.EMAILJS_JOB_TEMPLATE_ID || 'template_c45j16i',
          user_id: process.env.EMAILJS_PUBLIC_KEY || 'JAA5yhiRssyoyqKqW',
          template_params: {
            to_email: user.email,
            user_email: user.email,
            email: user.email,
            recipient: user.email,
            to_name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Applicant',
            user_name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Applicant',
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Applicant',
            applicant_name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Applicant',
            applicant_email: user.email,
            from_name: 'CampusBridge',
            recruiter_name: recruiterName,
            recruiter: recruiterName,
            recruiter_email: mentor?.email || 'support@campusbridge.com',
            job_title: job.title,
            title: job.title,
            job_company: job.company,
            company: job.company,
            company_name: job.company,
            job_location: job.location,
            location: job.location,
            job_type: job.type,
            type: job.type,
            job_salary: job.salary || 'Not specified',
            salary: job.salary || 'Not specified',
            resume_link: resumeLink,
            cover_letter: coverLetter || 'No cover letter provided.',
            applied_date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            message: `You have successfully applied for the ${job.title} role at ${job.company}.`
          }
        };

        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:5173'
          },
          body: JSON.stringify(emailPayload)
        });
      } catch (emailErr) {
        console.error('Failed to send job confirmation email via EmailJS:', emailErr);
      }
    }

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get applications for a specific job (mentor only)
router.get('/:id/applications', async (req, res) => {
  try {
    // Ideally we should verify if the requester is the poster of the job
    const applications = await JobApplication.find({ job: req.params.id })
      .populate('applicant', 'name firstName lastName email imageUrl headline clerkId username')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update application status
router.put('/applications/:appId/status', async (req, res) => {
  try {
    const { status, clientHandledEmail } = req.body; // 'accepted', 'rejected', 'pending'
    if (!['accepted', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const application = await JobApplication.findByIdAndUpdate(
      req.params.appId,
      { status },
      { new: true }
    )
      .populate('applicant', 'name firstName lastName email imageUrl headline clerkId username')
      .populate('job');

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // In-app notification to applicant
    if (application.applicant) {
      const jobTitle = application.job?.title || 'Job';
      const companyName = application.job?.company || 'CampusBridge Partner';
      const statusCapitalized = status.charAt(0).toUpperCase() + status.slice(1);

      try {
        const notif = await Notification.create({
          recipientClerkId: application.applicant.clerkId,
          senderClerkId: 'system',
          senderName: companyName,
          senderImage: application.job?.companyLogo || '',
          type: 'system',
          title: `Application ${statusCapitalized}!`,
          message: status === 'accepted'
            ? `🎉 Great news! Your application for ${jobTitle} at ${companyName} has been ACCEPTED!`
            : status === 'rejected'
            ? `Update: Your application for ${jobTitle} at ${companyName} was not selected.`
            : `Your application for ${jobTitle} at ${companyName} is currently ${status}.`,
          link: `/dashboard/applications?tab=${status === 'accepted' ? 'Accepted' : status === 'rejected' ? 'Rejected' : 'Active'}`
        });

        const io = req.app.get('io');
        if (io) {
          io.emit('new_notification', notif);
        }
      } catch (notifErr) {
        console.error('Error creating status notification:', notifErr);
      }
    }

    // Send EmailJS email to the applicant if not client-handled
    if (!clientHandledEmail && application.applicant?.email) {
      try {
        const applicantName = application.applicant.name || `${application.applicant.firstName || ''} ${application.applicant.lastName || ''}`.trim() || 'Applicant';
        const jobTitle = application.job?.title || 'Position';
        const companyName = application.job?.company || 'CampusBridge Partner';
        const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);
        const targetTab = status === 'accepted' ? 'Accepted' : status === 'rejected' ? 'Rejected' : 'Active';
        const applicationUrl = `https://campus-bridge-x5rl.vercel.app/dashboard/applications?tab=${targetTab}`;

        const emailPayload = {
          service_id: process.env.EMAILJS_STATUS_SERVICE_ID || 'service_uykuh7j',
          template_id: process.env.EMAILJS_STATUS_TEMPLATE_ID || 'template_t8ne25d',
          user_id: process.env.EMAILJS_STATUS_PUBLIC_KEY || 'BtfZJ-Xb0-sDmtRxr',
          template_params: {
            to_email: application.applicant.email,
            user_email: application.applicant.email,
            email: application.applicant.email,
            recipient: application.applicant.email,
            to_name: applicantName,
            name: applicantName,
            user_name: applicantName,
            applicant_name: applicantName,
            job_title: jobTitle,
            title: jobTitle,
            job_company: companyName,
            company: companyName,
            company_name: companyName,
            application_status: statusDisplay,
            status: statusDisplay,
            status_message: status === 'accepted'
              ? 'Congratulations! We are delighted to inform you that your application has been ACCEPTED. The hiring team will reach out with the next steps soon.'
              : status === 'rejected'
              ? 'Thank you for your interest and effort. Unfortunately, the hiring team has decided to proceed with other candidates at this stage.'
              : `Your application status has been updated to ${statusDisplay}.`,
            action_url: applicationUrl,
            link: applicationUrl,
            application_url: applicationUrl
          }
        };

        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:5173'
          },
          body: JSON.stringify(emailPayload)
        });
      } catch (emailErr) {
        console.error('Failed to send status update email via EmailJS:', emailErr);
      }
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all applications for a specific student
router.get('/student/applications/:clerkId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const applications = await JobApplication.find({ applicant: user._id })
      .populate({
        path: 'job',
        populate: { path: 'postedBy', select: 'name company' }
      })
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle/update archive status for an application
router.put('/applications/:appId/archive', async (req, res) => {
  try {
    const { archived } = req.body;
    const application = await JobApplication.findById(req.params.appId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    application.archived = typeof archived === 'boolean' ? archived : !application.archived;
    await application.save();
    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle Job notification subscription
router.put('/:id/notify', async (req, res) => {
  try {
    const { clerkId } = req.body;
    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const isSubscribed = job.notifiedUsers.includes(user._id);

    if (isSubscribed) {
      job.notifiedUsers = job.notifiedUsers.filter(id => id.toString() !== user._id.toString());
    } else {
      job.notifiedUsers.push(user._id);
    }

    await job.save();

    res.json({ isNotified: !isSubscribed, message: !isSubscribed ? 'You will be notified 3 days before the deadline.' : 'Notification removed.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
