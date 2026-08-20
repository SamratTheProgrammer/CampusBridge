import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';
import JobApplication from '../models/JobApplication.js';

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
    const { title, company, companyLogo, location, type, salary, description, deadline, clerkId } = req.body;
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
    };
    const domain = domainMap[cleanComp] || `${cleanComp}.com`;
    const autoLogo = companyLogo || `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;

    const newJob = new Job({
      title,
      company,
      companyLogo: autoLogo,
      location,
      type,
      salary,
      description,
      deadline,
      postedBy: user._id
    });
    
    await newJob.save();
    res.status(201).json(newJob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a job
router.put('/:id', async (req, res) => {
  try {
    const { title, company, companyLogo, location, type, salary, description, deadline, clerkId, active } = req.body;
    
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

    job.title = title !== undefined ? title : job.title;
    job.company = company !== undefined ? company : job.company;
    job.companyLogo = companyLogo !== undefined ? companyLogo : job.companyLogo;
    job.location = location !== undefined ? location : job.location;
    job.type = type !== undefined ? type : job.type;
    job.salary = salary !== undefined ? salary : job.salary;
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
    const { clerkId, resumeLink, coverLetter } = req.body;
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
      .populate('applicant', 'firstName lastName email imageUrl headline clerkId')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update application status
router.put('/applications/:appId/status', async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    if (!['accepted', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const application = await JobApplication.findByIdAndUpdate(
      req.params.appId,
      { status },
      { new: true }
    ).populate('applicant', 'firstName lastName email imageUrl headline clerkId');

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
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
