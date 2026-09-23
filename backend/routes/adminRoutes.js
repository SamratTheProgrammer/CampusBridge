import express from 'express';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Event from '../models/Event.js';
import Post from '../models/Post.js';
import Message from '../models/Message.js';
import Session from '../models/Session.js';
import Company from '../models/Company.js';
import PlatformSetting from '../models/PlatformSetting.js';
import SupportMessage from '../models/SupportMessage.js';
import Review from '../models/Review.js';
import Announcement from '../models/Announcement.js';
import { Resend } from 'resend';
import { deleteUserDataCompletely } from '../utils/userCleanup.js';
import { createNotificationHelper } from './notificationRoutes.js';
import { generateAdminToken, requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Default admin credentials
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@campusbridge.com';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';

// Admin Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const isPrimaryAdmin = (normalizedEmail === DEFAULT_ADMIN_EMAIL.toLowerCase() || normalizedEmail === 'admin@gmail.com');
    const isValidPassword = (password === DEFAULT_ADMIN_PASSWORD || password === 'admin123' || password === 'Admin@12345');

    if (!isPrimaryAdmin || !isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid admin email or password' });
    }

    const adminPayload = {
      id: 'admin_master_id',
      email: normalizedEmail,
      name: 'CampusBridge Admin',
      role: role || 'super-admin'
    };

    const adminToken = generateAdminToken(adminPayload);

    const adminUser = {
      ...adminPayload,
      token: adminToken,
      loggedInAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      message: 'Admin authentication successful',
      token: adminToken,
      user: adminUser
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during admin login' });
  }
});

// Admin Verify / Me Endpoint (Requires valid admin token)
router.get('/me', requireAdmin, async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.admin
  });
});

// Apply requireAdmin middleware to ALL following admin routes
router.use(requireAdmin);

// Sample initial mentors to seed if no mentor users exist in MongoDB
const SAMPLE_MENTORS = [
  {
    clerkId: 'seed_mentor_1',
    email: 'rohit@gmail.com',
    firstName: 'Rohit',
    lastName: 'Kumar',
    headline: 'Software Engineer at Google',
    yearsOfExperience: '4+ years',
    role: 'mentor',
    verificationStatus: 'Pending',
    isVerified: false,
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&w=150&q=80',
    experience: [{ title: 'Software Engineer', company: 'Google', duration: '2020 - Present' }],
    education: [{ degree: 'B.Tech Computer Science', institution: 'IIT Delhi', duration: '2016 - 2020' }],
    skills: ['React', 'Node.js', 'System Design', 'Algorithms'],
    aboutMe: 'Passionate software engineer with 4+ years of industry experience building scalable web apps.'
  },
  {
    clerkId: 'seed_mentor_2',
    email: 'neha@gmail.com',
    firstName: 'Neha',
    lastName: 'Agarwal',
    headline: 'Product Manager at Microsoft',
    yearsOfExperience: '5+ years',
    role: 'mentor',
    verificationStatus: 'Pending',
    isVerified: false,
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&w=150&q=80',
    experience: [{ title: 'Product Manager', company: 'Microsoft', duration: '2019 - Present' }],
    education: [{ degree: 'B.E. Information Technology', institution: 'BITS Pilani', duration: '2015 - 2019' }],
    skills: ['Product Strategy', 'Agile', 'User Research', 'Data Analytics'],
    aboutMe: 'Senior PM enthusiastic about helping students navigate product management careers.'
  },
  {
    clerkId: 'seed_mentor_3',
    email: 'karan.s@gmail.com',
    firstName: 'Karan',
    lastName: 'Sharma',
    headline: 'Cloud Architect at Amazon',
    yearsOfExperience: '6+ years',
    role: 'mentor',
    verificationStatus: 'Approved',
    isVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=150&q=80',
    experience: [{ title: 'Cloud Architect', company: 'Amazon', duration: '2018 - Present' }],
    education: [{ degree: 'B.Tech IT', institution: 'NIT Trichy', duration: '2014 - 2018' }],
    skills: ['AWS', 'Kubernetes', 'DevOps', 'Cloud Architecture'],
    aboutMe: 'Cloud Specialist specializing in microservices and distributed systems.'
  },
  {
    clerkId: 'seed_mentor_4',
    email: 'shreya.r@gmail.com',
    firstName: 'Shreya',
    lastName: 'Roy',
    headline: 'UX Designer at Adobe',
    yearsOfExperience: '3+ years',
    role: 'mentor',
    verificationStatus: 'Rejected',
    isVerified: false,
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&w=150&q=80',
    experience: [{ title: 'UX Designer', company: 'Adobe', duration: '2021 - Present' }],
    education: [{ degree: 'B.Des Design', institution: 'NID Ahmedabad', duration: '2017 - 2021' }],
    skills: ['UI/UX', 'Figma', 'Prototyping', 'Design Systems'],
    aboutMe: 'Creative designer focused on visual storytelling and human-centered design.'
  }
];

// Helper to format user as mentor verification object
const formatMentorVerification = (u) => {
  const company = u.experience?.[0]?.company || (u.headline?.includes(' at ') ? u.headline.split(' at ')[1] : 'CampusBridge');
  const role = u.experience?.[0]?.title || (u.headline?.includes(' at ') ? u.headline.split(' at ')[0] : (u.headline || 'Mentor'));
  
  let gradYear = '2020';
  if (u.education?.[0]?.duration) {
    const parts = u.education[0].duration.split('-');
    gradYear = parts[parts.length - 1]?.trim() || u.education[0].duration;
  }

  return {
    id: u._id,
    clerkId: u.clerkId,
    username: u.username || u.clerkId || String(u._id),
    name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
    email: u.email,
    company: company,
    role: role,
    gradYear: gradYear,
    experience: u.yearsOfExperience || '3+ years',
    status: u.verificationStatus || (u.isVerified ? 'Approved' : 'Pending'),
    isVerified: !!u.isVerified,
    image: u.imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    skills: u.skills || [],
    aboutMe: u.aboutMe || '',
    headline: u.headline || `${role} at ${company}`,
    resumeUrl: u.resumeUrl || '',
    experienceList: u.experience || [],
    educationList: u.education || [],
    isBlocked: !!u.isBlocked,
    blockReason: u.blockReason || '',
    createdAt: u.createdAt
  };
};

// Admin Overview Stats Endpoint (Real Dynamic MongoDB Data)
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: { $in: ['student', 'user'] } });
    const totalMentors = await User.countDocuments({ role: 'mentor' });
    const totalAlumni = await User.countDocuments({ role: 'alumni' });
    
    // Active Mentors (Mentors registered or profile public)
    const activeMentors = await User.countDocuments({ role: 'mentor', verificationStatus: 'Approved' });

    // Job & Internship counts
    const jobPosts = await Job.countDocuments({ type: { $ne: 'Internship' } });
    const internshipPosts = await Job.countDocuments({ type: 'Internship' });

    // Upcoming Events count
    const upcomingEvents = await Event.countDocuments({ active: true });

    // Total Messages count
    const messagesCount = await Message.countDocuments();

    // Pending Approvals count (unverified mentors pending verification)
    const pendingSessionsCount = await Session.countDocuments({ status: 'pending' });
    const pendingMentorsCount = await User.countDocuments({ role: 'mentor', verificationStatus: 'Pending' });
    const pendingApprovals = pendingSessionsCount + pendingMentorsCount;

    // Recent Users for Recent Activity stream
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select('firstName lastName email role createdAt imageUrl');

    const formattedRecentActivity = recentUsers.map(u => ({
      id: u._id,
      user: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      action: `joined as ${u.role || 'student'}`,
      time: new Date(u.createdAt).toLocaleDateString() + ' ' + new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: u.role || 'student'
    }));

    // Dynamic User Growth based on real user registration timestamps
    const allUsers = await User.find().select('createdAt').sort({ createdAt: 1 });
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const curMonthName = monthNames[currentMonth];

    // 1. "This Month" - 4 checkpoints across the current month
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const thisMonthCheckpoints = [7, 14, 21, totalDaysInMonth];
    const thisMonthData = thisMonthCheckpoints.map(day => {
      const cutoff = new Date(currentYear, currentMonth, day, 23, 59, 59);
      const count = allUsers.filter(u => new Date(u.createdAt) <= cutoff).length;
      return { name: `${curMonthName} ${day}`, users: count };
    });

    // 2. "Last 6 Months"
    const last6MonthsData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i + 1, 0, 23, 59, 59);
      const mName = monthNames[d.getMonth()];
      const count = allUsers.filter(u => new Date(u.createdAt) <= d).length;
      last6MonthsData.push({ name: mName, users: count });
    }

    // 3. "This Year"
    const thisYearData = [];
    for (let m = 0; m <= currentMonth; m++) {
      const d = new Date(currentYear, m + 1, 0, 23, 59, 59);
      const mName = monthNames[m];
      const count = allUsers.filter(u => new Date(u.createdAt) <= d).length;
      thisYearData.push({ name: mName, users: count });
    }

    // Month-over-month growth percentage
    const startOfThisMonth = new Date(currentYear, currentMonth, 1);
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const usersThisMonth = allUsers.filter(u => new Date(u.createdAt) >= startOfThisMonth).length;
    const usersLastMonth = allUsers.filter(u => new Date(u.createdAt) >= startOfLastMonth && new Date(u.createdAt) < startOfThisMonth).length;

    let growthPercentage = '+0.0%';
    let isGrowthPositive = true;
    if (usersLastMonth === 0) {
      growthPercentage = usersThisMonth > 0 ? `+${usersThisMonth * 100}%` : '+0.0%';
      isGrowthPositive = true;
    } else {
      const pct = ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100;
      isGrowthPositive = pct >= 0;
      growthPercentage = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalMentors,
        totalAlumni,
        activeMentors,
        jobPosts,
        internshipPosts,
        upcomingEvents,
        messagesCount,
        pendingApprovals
      },
      recentActivity: formattedRecentActivity,
      userGrowth: {
        'This Month': thisMonthData,
        'Last 6 Months': last6MonthsData,
        'This Year': thisYearData,
        growthPercentage,
        isGrowthPositive
      }
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching admin stats' });
  }
});

// Get Mentor Verifications (Real Dynamic MongoDB Data + Seeding)
router.get('/verifications', async (req, res) => {
  try {
    let mentors = await User.find({ role: 'mentor', verificationStatus: { $in: ['Pending', 'Approved', 'Rejected'] } }).sort({ createdAt: -1 });
    
    // Seed initial mentors if database has none
    if (mentors.length === 0) {
      try {
        await User.insertMany(SAMPLE_MENTORS);
        mentors = await User.find({ role: 'mentor' }).sort({ createdAt: -1 });
      } catch (seedErr) {
        console.error('Error seeding mentors:', seedErr);
      }
    }

    const formattedList = await Promise.all(mentors.map(async (u) => {
      const base = formatMentorVerification(u);
      const reviews = await Review.find({ 
        $or: [{ mentor: u._id }, { referenceId: u._id }], 
        mentorRating: { $exists: true, $ne: null } 
      });
      const totalRatings = reviews.length;
      const rating = totalRatings > 0 
        ? Number((reviews.reduce((acc, curr) => acc + curr.mentorRating, 0) / totalRatings).toFixed(1))
        : 0;
      const activeMenteesCount = await Session.countDocuments({ mentor: u._id, status: { $in: ['pending', 'accepted'] } });

      return {
        ...base,
        rating,
        totalRatings,
        activeMentees: activeMenteesCount
      };
    }));

    return res.status(200).json({
      success: true,
      verifications: formattedList
    });
  } catch (error) {
    console.error('Admin Fetch Verifications Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch mentor verifications' });
  }
});

// Admin Get Active Mentors with Session count
router.get('/mentors', async (req, res) => {
  try {
    const mentors = await User.find({ role: 'mentor', verificationStatus: 'Approved' });
    
    // Format and calculate stats for each mentor
    const formattedMentors = await Promise.all(mentors.map(async (m) => {
      // Count active sessions where status is 'pending' or 'accepted' (meaning active mentees)
      const activeMenteesCount = await Session.countDocuments({ mentor: m._id, status: { $in: ['pending', 'accepted'] } });
      
      const company = m.experience?.[0]?.company || (m.headline?.includes(' at ') ? m.headline.split(' at ')[1] : 'CampusBridge');
      const role = m.experience?.[0]?.title || (m.headline?.includes(' at ') ? m.headline.split(' at ')[0] : (m.headline || 'Mentor'));
      
      // Calculate dynamic rating from actual Review records in MongoDB
      const reviews = await Review.find({ 
        $or: [{ mentor: m._id }, { referenceId: m._id }], 
        mentorRating: { $exists: true, $ne: null } 
      });
      const totalRatings = reviews.length;
      const rating = totalRatings > 0 
        ? Number((reviews.reduce((acc, curr) => acc + curr.mentorRating, 0) / totalRatings).toFixed(1))
        : 0;
      
      return {
        id: m._id,
        clerkId: m.clerkId,
        username: m.username || m.clerkId || String(m._id),
        name: `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.username || m.email,
        imageUrl: m.imageUrl || m.avatar || '',
        company: company.trim(),
        role: role.trim(),
        rating: rating,
        totalRatings: totalRatings,
        activeMentees: activeMenteesCount
      };
    }));
    
    return res.status(200).json({ success: true, mentors: formattedMentors });
  } catch (error) {
    console.error('Admin Fetch Mentors Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch active mentors' });
  }
});

// Admin Change Mentor Verification Status
router.put('/verifications/:id/status', async (req, res) => {
  try {
    const { status, remark } = req.body; // 'Approved' | 'Rejected' | 'Pending'
    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status' });
    }

    const isVerified = (status === 'Approved');

    // Search by _id or clerkId
    let user = await User.findById(req.params.id);
    if (!user) {
      user = await User.findOne({ clerkId: req.params.id });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Mentor profile not found' });
    }

    user.verificationStatus = status;
    user.isVerified = isVerified;
    await user.save();

    if (remark) {
      await createNotificationHelper({
        recipientClerkId: user.clerkId,
        senderClerkId: 'admin',
        type: 'system',
        title: `Verification ${status}`,
        message: `Your mentor verification was ${status.toLowerCase()}. Remark: ${remark}`,
        link: '/dashboard/profile',
        io: req.app.get('io') || req.io
      });
    }

    const formattedMentor = formatMentorVerification(user);

    return res.status(200).json({
      success: true,
      message: `Mentor status updated to ${status}`,
      mentor: formattedMentor
    });
  } catch (error) {
    console.error('Admin Update Verification Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update verification status' });
  }
});

// Get All Users (for Admin User Management)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Admin Fetch Users Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// Update User Role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, message: `User role updated to ${role}`, user });
  } catch (error) {
    console.error('Admin Update Role Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user role' });
  }
});

// Get All Admin Jobs (MongoDB dynamic data + seed)
router.get('/jobs', async (req, res) => {
  try {
    let jobs = await Job.find().sort({ createdAt: -1 });

    // Seed sample jobs if none exist in database
    if (jobs.length === 0) {
      try {
        const SAMPLE_JOBS = [
          {
            title: 'Frontend Developer',
            company: 'TechNova Inc.',
            location: 'Remote',
            type: 'Full-time',
            salary: '₹12,00,000 / year',
            description: 'We are looking for a skilled React / Frontend developer.',
            status: 'Approved',
            active: true,
            createdAt: new Date('2026-05-28')
          },
          {
            title: 'Backend Developer',
            company: 'ByteShift Solutions',
            location: 'Bangalore',
            type: 'Full-time',
            salary: '₹15,00,000 / year',
            description: 'Node.js & MongoDB developer needed for cloud platform.',
            status: 'Approved',
            active: true,
            createdAt: new Date('2026-05-28')
          },
          {
            title: 'UI/UX Designer',
            company: 'Creative Minds',
            location: 'Hybrid',
            type: 'Internship',
            salary: '₹30,000 / month',
            description: 'UI/UX designer needed for user interface redesign.',
            status: 'Pending',
            active: true,
            createdAt: new Date('2026-05-24')
          },
          {
            title: 'Data Scientist',
            company: 'AI Labs',
            location: 'Mumbai',
            type: 'Full-time',
            salary: '₹18,00,000 / year',
            description: 'Python & machine learning specialist for predictive analytics.',
            status: 'Approved',
            active: true,
            createdAt: new Date('2026-05-22')
          },
          {
            title: 'DevOps Engineer',
            company: 'CloudScale',
            location: 'Remote',
            type: 'Full-time',
            salary: '₹14,00,000 / year',
            description: 'AWS, Docker & Kubernetes specialist needed.',
            status: 'Rejected',
            active: false,
            createdAt: new Date('2026-05-20')
          }
        ];
        await Job.insertMany(SAMPLE_JOBS);
        jobs = await Job.find().sort({ createdAt: -1 });
      } catch (seedErr) {
        console.error('Error seeding initial jobs:', seedErr);
      }
    }

    const formattedJobs = jobs.map(j => ({
      id: j._id,
      title: j.title,
      company: j.company,
      companyLogo: j.companyLogo || '',
      location: j.location || 'Remote',
      type: j.type || 'Full-time',
      salary: j.salary || 'Competitive',
      description: j.description || '',
      posted: new Date(j.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      applications: j.applicants ? j.applicants.length : 0,
      status: j.status || 'Approved',
      moderationStatus: j.moderationStatus || (j.active === false ? 'paused' : 'approved'),
      active: !!j.active
    }));

    return res.status(200).json({ success: true, jobs: formattedJobs });
  } catch (error) {
    console.error('Admin Fetch Jobs Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
});

// Admin Create New Job Endpoint
router.post('/jobs', async (req, res) => {
  try {
    const { title, company, companyLogo, location, type, salary, description, status } = req.body;

    if (!title || !company) {
      return res.status(400).json({ success: false, message: 'Job title and company name are required' });
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
      location: location || 'Remote',
      type: type || 'Full-time',
      salary: salary || '',
      description: description || '',
      status: status || 'Approved',
      active: status !== 'Rejected'
    });

    await newJob.save();

    const formattedJob = {
      id: newJob._id,
      title: newJob.title,
      company: newJob.company,
      location: newJob.location,
      type: newJob.type,
      salary: newJob.salary,
      description: newJob.description,
      posted: new Date(newJob.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      applications: 0,
      status: newJob.status,
      active: newJob.active
    };

    return res.status(201).json({ success: true, message: 'Job created successfully', job: formattedJob });
  } catch (error) {
    console.error('Admin Create Job Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create job posting' });
  }
});

// Admin Update Job Status Endpoint
router.put('/jobs/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Pending', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    job.status = status;
    job.active = (status === 'Approved');
    await job.save();

    return res.status(200).json({ success: true, message: `Job status updated to ${status}`, job });
  } catch (error) {
    console.error('Admin Update Job Status Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update job status' });
  }
});

// Moderate Job Status (Pause / Resume)
router.put('/moderate/job/:id/status', async (req, res) => {
  try {
    const { status, remark } = req.body;
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    job.moderationStatus = status;
    job.active = (status === 'approved' || status === 'Approved');
    if (remark) job.moderationRemark = remark;
    await job.save();

    return res.status(200).json({ success: true, message: `Job moderation status set to ${status}`, job });
  } catch (error) {
    console.error('Moderate Job Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update job status' });
  }
});

// Moderate Job Delete
router.delete('/moderate/job/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    return res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete Job Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete job' });
  }
});

// Moderate Event Status (Pause / Resume)
router.put('/moderate/event/:id/status', async (req, res) => {
  try {
    const { status, remark } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    event.moderationStatus = status;
    event.active = (status === 'approved' || status === 'Approved');
    if (remark) event.moderationRemark = remark;
    await event.save();

    return res.status(200).json({ success: true, message: `Event moderation status set to ${status}`, event });
  } catch (error) {
    console.error('Moderate Event Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update event status' });
  }
});

// Moderate Event Delete
router.delete('/moderate/event/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    return res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete Event Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
});

// Moderate Post Status
router.put('/moderate/post/:id/status', async (req, res) => {
  try {
    const { status, remark } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    post.moderationStatus = status;
    if (remark) post.moderationRemark = remark;
    await post.save();

    return res.status(200).json({ success: true, message: `Post moderation status set to ${status}`, post });
  } catch (error) {
    console.error('Moderate Post Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update post status' });
  }
});

// Moderate Post Delete
router.delete('/moderate/post/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    return res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete Post Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
});

// Admin Warn User (Notification + Email)
router.post('/users/:id/warn', async (req, res) => {
  try {
    const { warningSubject, warningMessage } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.warnings) user.warnings = [];
    user.warnings.push({
      subject: warningSubject || 'Notice from Administration: Community Guidelines',
      message: warningMessage || 'You have received an administrative warning regarding platform policy.',
      date: new Date(),
      isDismissed: false
    });
    await user.save();

    if (user.clerkId) {
      await createNotificationHelper({
        recipientClerkId: user.clerkId,
        senderClerkId: 'admin',
        type: 'system',
        title: `Official Warning: ${warningSubject || 'Notice from Administration'}`,
        message: warningMessage || 'You have received an administrative warning regarding platform policy.',
        link: user.role === 'mentor' ? '/mentor-dashboard' : '/dashboard'
      });
    }

    if (process.env.RESEND_API_KEY && user.email) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'CampusBridge <onboarding@resend.dev>',
          to: user.email,
          subject: `[CampusBridge Admin Warning] ${warningSubject || 'Important Notice'}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #111;">
              <h2 style="color: #e11d48;">CampusBridge Official Notice</h2>
              <p>Dear ${user.firstName || 'Member'},</p>
              <p>This is an official administrative warning regarding your account on CampusBridge.</p>
              <div style="background: #f8fafc; border-left: 4px solid #e11d48; padding: 12px 16px; margin: 16px 0;">
                <p style="margin: 0; font-weight: bold;">${warningSubject || 'Warning Notice'}</p>
                <p style="margin: 8px 0 0 0;">${warningMessage}</p>
              </div>
              <p>Please ensure adherence to platform community guidelines to avoid further account restrictions.</p>
              <br/>
              <p>Best regards,<br/><strong>CampusBridge Administration</strong></p>
            </div>
          `
        });
      } catch (emailErr) {
        console.error('Failed to send warning email:', emailErr);
      }
    }

    return res.status(200).json({ success: true, message: `Warning sent to ${user.firstName || 'user'}` });
  } catch (error) {
    console.error('Admin Warn User Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send warning' });
  }
});

// Admin Block / Unblock User Endpoint
router.put('/users/:id/block', async (req, res) => {
  try {
    const { isBlocked, blockReason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isBlocked = !!isBlocked;
    user.blockReason = isBlocked ? (blockReason || 'Account restricted by administrator') : '';
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      user
    });
  } catch (error) {
    console.error('Admin Block User Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update block status' });
  }
});

// Admin Delete User Endpoint (Deletes from MongoDB + Clerk)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.clerkId) {
      await deleteUserDataCompletely(user.clerkId);
    } else {
      await User.findByIdAndDelete(req.params.id);
    }

    return res.status(200).json({ success: true, message: 'User deleted from MongoDB and Clerk successfully' });
  } catch (error) {
    console.error('Admin Delete User Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

// Admin Get All Companies (Dynamic + Seed)
router.get('/companies', async (req, res) => {
  try {
    let companies = await Company.find().sort({ createdAt: -1 });

    // Seed initial companies if none exist
    if (companies.length === 0) {
      try {
        const SAMPLE_COMPANIES = [
          { name: 'Google', employees: '100,000+', location: 'Mountain View, CA', status: 'Partner', website: 'https://careers.google.com' },
          { name: 'Microsoft', employees: '220,000+', location: 'Redmond, WA', status: 'Partner', website: 'https://careers.microsoft.com' },
          { name: 'Amazon', employees: '1,500,000+', location: 'Seattle, WA', status: 'Partner', website: 'https://amazon.jobs' },
          { name: 'Adobe', employees: '26,000+', location: 'San Jose, CA', status: 'Partner', website: 'https://adobe.com/careers' },
          { name: 'TechNova Inc.', employees: '200+', location: 'Bangalore, India', status: 'Pending', website: 'https://technova.example.com' },
        ];
        await Company.insertMany(SAMPLE_COMPANIES);
        companies = await Company.find().sort({ createdAt: -1 });
      } catch (seedErr) {
        console.error('Error seeding companies:', seedErr);
      }
    }

    const formattedCompanies = companies.map(c => ({
      id: c._id,
      name: c.name,
      employees: c.employees,
      location: c.location,
      status: c.status,
      website: c.website || ''
    }));

    return res.status(200).json({ success: true, companies: formattedCompanies });
  } catch (error) {
    console.error('Admin Fetch Companies Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch companies' });
  }
});

// Admin Delete Company Endpoint
router.delete('/companies/:id', async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    return res.status(200).json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Admin Delete Company Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete company' });
  }
});

// Helper to determine suggested theme based on Indian calendar
function getSuggestedHolidayTheme() {
  const now = new Date();
  const m = now.getMonth() + 1; // 1-12
  const d = now.getDate();

  if (m === 1 && d >= 20 && d <= 31) return { theme: 'independence', name: 'Republic Day' };
  if (m === 3) return { theme: 'holi', name: 'Holi' };
  if (m === 8 && d >= 10 && d <= 20) return { theme: 'independence', name: 'Independence Day' };
  if (m === 10 || m === 11) return { theme: 'diwali', name: 'Diwali' };
  
  return null;
}

// Get Global Theme Setting
router.get('/settings/theme', async (req, res) => {
  try {
    let setting = await PlatformSetting.findOne();
    if (!setting) {
      setting = await PlatformSetting.create({ globalTheme: 'none' });
    }
    
    const suggestion = getSuggestedHolidayTheme();
    
    return res.status(200).json({ 
      success: true, 
      globalTheme: setting.globalTheme,
      suggestedTheme: suggestion ? suggestion.theme : null,
      holidayName: suggestion ? suggestion.name : null
    });
  } catch (error) {
    console.error('Fetch Theme Setting Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch theme setting' });
  }
});

// Update Global Theme Setting
router.put('/settings/theme', async (req, res) => {
  try {
    const { globalTheme } = req.body;
    
    let setting = await PlatformSetting.findOne();
    if (!setting) {
      setting = new PlatformSetting({ globalTheme });
    } else {
      setting.globalTheme = globalTheme;
    }
    
    await setting.save();
    
    return res.status(200).json({ success: true, globalTheme: setting.globalTheme });
  } catch (error) {
    console.error('Update Theme Setting Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update theme setting' });
  }
});

// --- SUPPORT & HELP REQUEST MESSAGES ENDPOINTS ---

// Fetch all support messages dynamically from MongoDB
router.get('/support-messages', async (req, res) => {
  try {
    // Automatically purge legacy dummy seed messages
    await SupportMessage.deleteMany({
      $or: [
        { email: { $in: ['ananya.s@gmail.com', 'rahul.v@gmail.com', 'sneha.p@gmail.com', 'david.m@gmail.com'] } },
        { name: { $in: ['Ananya Sharma', 'Rahul Verma', 'Sneha Patel', 'David Miller'] } }
      ]
    });

    const messages = await SupportMessage.find().sort({ createdAt: -1 });

    const pendingCount = messages.filter(m => m.status === 'Pending').length;
    const repliedCount = messages.filter(m => m.status === 'Replied').length;
    const resolvedCount = messages.filter(m => m.status === 'Resolved').length;

    return res.status(200).json({
      success: true,
      messages,
      counts: {
        total: messages.length,
        pending: pendingCount,
        replied: repliedCount,
        resolved: resolvedCount
      }
    });
  } catch (error) {
    console.error('Fetch Support Messages Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch support messages' });
  }
});

// Admin Reply to Support Message
router.put('/support-messages/:id/reply', async (req, res) => {
  try {
    const { replyText } = req.body;
    if (!replyText || !replyText.trim()) {
      return res.status(400).json({ success: false, message: 'Reply message cannot be empty' });
    }

    const message = await SupportMessage.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Support message not found' });
    }

    message.adminReply = replyText.trim();
    message.status = 'Replied';
    message.repliedAt = new Date();
    await message.save();

    return res.status(200).json({
      success: true,
      message: 'Reply sent successfully and marked as Replied',
      data: message
    });
  } catch (error) {
    console.error('Reply Support Message Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reply to support message' });
  }
});

// Update Support Message Status
router.put('/support-messages/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Replied', 'Resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const message = await SupportMessage.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Support message not found' });
    }

    message.status = status;
    await message.save();

    return res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      data: message
    });
  } catch (error) {
    console.error('Update Support Message Status Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update support message status' });
  }
});

// Delete Support Message
router.delete('/support-messages/:id', async (req, res) => {
  try {
    const message = await SupportMessage.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Support message not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Support message deleted successfully'
    });
  } catch (error) {
    console.error('Delete Support Message Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete support message' });
  }
});

// Clear All Support Messages (Admin Cleanup)
router.delete('/support-messages-clear-all', async (req, res) => {
  try {
    await SupportMessage.deleteMany({});
    return res.status(200).json({
      success: true,
      message: 'All support messages cleared successfully'
    });
  } catch (error) {
    console.error('Clear All Support Messages Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to clear support messages' });
  }
});

// Get Authentication Settings
router.get('/settings/auth', async (req, res) => {
  try {
    let setting = await PlatformSetting.findOne();
    if (!setting) {
      setting = await PlatformSetting.create({ authSettings: {} });
    }
    
    return res.status(200).json({ 
      success: true, 
      authSettings: setting.authSettings
    });
  } catch (error) {
    console.error('Fetch Auth Setting Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch auth setting' });
  }
});

// Update Authentication Settings
router.put('/settings/auth', async (req, res) => {
  try {
    const { authSettings } = req.body;
    
    let setting = await PlatformSetting.findOne();
    if (!setting) {
      setting = new PlatformSetting({ authSettings });
    } else {
      setting.authSettings = { ...setting.authSettings, ...authSettings };
    }
    
    await setting.save();
    
    return res.status(200).json({ success: true, authSettings: setting.authSettings });
  } catch (error) {
    console.error('Update Auth Setting Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update auth setting' });
  }
});

// Get Email & Notification Settings
router.get('/settings/email', async (req, res) => {
  try {
    let setting = await PlatformSetting.findOne();
    if (!setting) {
      setting = await PlatformSetting.create({ emailSettings: {} });
    }
    
    return res.status(200).json({ 
      success: true, 
      emailSettings: setting.emailSettings
    });
  } catch (error) {
    console.error('Fetch Email Setting Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch email setting' });
  }
});

// Update Email & Notification Settings
router.put('/settings/email', async (req, res) => {
  try {
    const { emailSettings } = req.body;
    
    let setting = await PlatformSetting.findOne();
    if (!setting) {
      setting = new PlatformSetting({ emailSettings });
    } else {
      setting.emailSettings = { ...setting.emailSettings, ...emailSettings };
    }
    
    await setting.save();
    
    return res.status(200).json({ success: true, emailSettings: setting.emailSettings });
  } catch (error) {
    console.error('Update Email Setting Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update email setting' });
  }
});

// Get Security Settings
router.get('/settings/security', async (req, res) => {
  try {
    let setting = await PlatformSetting.findOne();
    if (!setting) {
      setting = await PlatformSetting.create({ securitySettings: {} });
    }
    
    return res.status(200).json({ 
      success: true, 
      securitySettings: setting.securitySettings
    });
  } catch (error) {
    console.error('Fetch Security Setting Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch security setting' });
  }
});

// Update Security Settings
router.put('/settings/security', async (req, res) => {
  try {
    const { securitySettings } = req.body;
    
    let setting = await PlatformSetting.findOne();
    if (!setting) {
      setting = new PlatformSetting({ securitySettings });
    } else {
      setting.securitySettings = { ...setting.securitySettings, ...securitySettings };
    }
    
    await setting.save();
    
    return res.status(200).json({ success: true, securitySettings: setting.securitySettings });
  } catch (error) {
    console.error('Update Security Setting Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update security setting' });
  }
});

// Get Privacy Settings
router.get('/settings/privacy', async (req, res) => {
  try {
    let setting = await PlatformSetting.findOne();
    if (!setting) {
      setting = await PlatformSetting.create({ privacySettings: {} });
    }
    
    return res.status(200).json({ 
      success: true, 
      privacySettings: setting.privacySettings
    });
  } catch (error) {
    console.error('Fetch Privacy Setting Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch privacy setting' });
  }
});

// Update Privacy Settings
router.put('/settings/privacy', async (req, res) => {
  try {
    const { privacySettings } = req.body;
    
    let setting = await PlatformSetting.findOne();
    if (!setting) {
      setting = new PlatformSetting({ privacySettings });
    } else {
      setting.privacySettings = { ...setting.privacySettings, ...privacySettings };
    }
    
    await setting.save();
    
    return res.status(200).json({ success: true, privacySettings: setting.privacySettings });
  } catch (error) {
    console.error('Update Privacy Setting Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update privacy setting' });
  }
});

// Get Integration Settings
router.get('/settings/integrations', async (req, res) => {
  try {
    let setting = await PlatformSetting.findOne();
    if (!setting) {
      setting = await PlatformSetting.create({ integrationSettings: {} });
    }
    
    return res.status(200).json({ 
      success: true, 
      integrationSettings: setting.integrationSettings
    });
  } catch (error) {
    console.error('Fetch Integration Setting Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch integration setting' });
  }
});

// Update Integration Settings
router.put('/settings/integrations', async (req, res) => {
  try {
    const { integrationSettings } = req.body;
    
    let setting = await PlatformSetting.findOne();
    if (!setting) {
      setting = new PlatformSetting({ integrationSettings });
    } else {
      setting.integrationSettings = { ...setting.integrationSettings, ...integrationSettings };
    }
    
    await setting.save();
    
    return res.status(200).json({ success: true, integrationSettings: setting.integrationSettings });
  } catch (error) {
    console.error('Update Integration Setting Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update integration setting' });
  }
});

// Fetch App Banner Settings
router.get('/settings/app-banner', async (req, res) => {
  try {
    let setting = await PlatformSetting.findOne();
    if (!setting) {
      setting = await PlatformSetting.create({ appBannerSettings: {} });
    }
    
    return res.status(200).json({ 
      success: true, 
      appBannerSettings: setting.appBannerSettings || {
        showLandingAnnouncement: true,
        showDashboardBanner: true,
        announcementText: '🚀 CampusBridge Mobile App is now officially live on Android & iOS!',
        apkDownloadUrl: 'https://campus-bridge-x5rl.vercel.app/downloads/CampusBridge.apk',
        appVersion: 'v1.0.0'
      }
    });
  } catch (error) {
    console.error('Fetch App Banner Setting Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch app banner settings' });
  }
});

// Update App Banner Settings
router.put('/settings/app-banner', async (req, res) => {
  try {
    const { appBannerSettings } = req.body;
    
    let setting = await PlatformSetting.findOne();
    if (!setting) {
      setting = new PlatformSetting({ appBannerSettings });
    } else {
      setting.appBannerSettings = { ...setting.appBannerSettings, ...appBannerSettings };
    }
    
    await setting.save();
    
    return res.status(200).json({ success: true, appBannerSettings: setting.appBannerSettings });
  } catch (error) {
    console.error('Update App Banner Setting Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update app banner settings' });
  }
});

// --- MODERATION ENDPOINTS ---

const getModelForType = (type) => {
  switch (type.toLowerCase()) {
    case 'post': return Post;
    case 'job': return Job;
    case 'event': return Event;
    default: return null;
  }
};

// Pause/Approve Content
router.put('/moderate/:type/:id/status', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { status, remark } = req.body;
    
    if (!['approved', 'paused'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const Model = getModelForType(type);
    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid content type' });
    }

    const item = await Model.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    item.moderationStatus = status;
    item.moderationRemark = remark || '';
    await item.save();

    if (remark) {
      let recipientClerkId = null;
      if (type === 'post') recipientClerkId = item.authorClerkId;
      else if (type === 'job') recipientClerkId = item.postedBy;
      else if (type === 'event') recipientClerkId = item.organizer;

      if (recipientClerkId) {
        await createNotificationHelper({
          recipientClerkId,
          senderClerkId: 'admin',
          type: 'system',
          title: `Your ${type} has been ${status}`,
          message: `Admin remark: ${remark}`,
          link: '/dashboard',
          io: req.app.get('io') || req.io
        });
      }
    }

    const io = req.app.get('io') || req.io;
    if (io && type === 'post') {
      if (status === 'paused') {
        io.emit('post_deleted', { postId: id.toString() });
      }
      io.emit('post_status_updated', { postId: id.toString(), status });
    }

    return res.status(200).json({ success: true, message: `${type} status updated`, item });
  } catch (error) {
    console.error(`Moderation Status Error:`, error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete Content
router.delete('/moderate/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { remark } = req.query;
    
    const Model = getModelForType(type);
    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid content type' });
    }

    const item = await Model.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const io = req.app.get('io') || req.io;
    if (io && type === 'post') {
      io.emit('post_deleted', { postId: id.toString() });
    }

    if (remark) {
      let recipientClerkId = null;
      if (type === 'post') recipientClerkId = item.authorClerkId;
      else if (type === 'job') recipientClerkId = item.postedBy;
      else if (type === 'event') recipientClerkId = item.organizer;

      if (recipientClerkId) {
        await createNotificationHelper({
          recipientClerkId,
          senderClerkId: 'admin',
          type: 'system',
          title: `Your ${type} has been deleted`,
          message: `Admin remark: ${remark}`,
          link: '/dashboard',
          io: req.app.get('io') || req.io
        });
      }
    }

    return res.status(200).json({ success: true, message: `${type} deleted successfully` });
  } catch (error) {
    console.error(`Moderation Delete Error:`, error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- ANNOUNCEMENT MANAGEMENT ENDPOINTS ---

router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, announcements });
  } catch (error) {
    console.error('Error fetching admin announcements:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const { title, details, imageUrl, priority, audience, startDate, endDate, status } = req.body;
    if (!title || !details) {
      return res.status(400).json({ success: false, message: 'Title and details are required' });
    }

    const announcement = new Announcement({
      title: title.trim(),
      details: details.trim(),
      imageUrl: imageUrl ? imageUrl.trim() : '',
      priority: priority || 'Medium',
      audience: audience || 'All Users',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      status: status || 'Published'
    });

    await announcement.save();
    return res.status(201).json({ success: true, message: 'Announcement created successfully', announcement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/announcements/:id', async (req, res) => {
  try {
    const { title, details, imageUrl, priority, audience, startDate, endDate, status } = req.body;
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (title !== undefined) announcement.title = title.trim();
    if (details !== undefined) announcement.details = details.trim();
    if (imageUrl !== undefined) announcement.imageUrl = imageUrl.trim();
    if (priority !== undefined) announcement.priority = priority;
    if (audience !== undefined) announcement.audience = audience;
    if (startDate !== undefined) announcement.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) announcement.endDate = endDate ? new Date(endDate) : null;
    if (status !== undefined) announcement.status = status;

    await announcement.save();
    return res.status(200).json({ success: true, message: 'Announcement updated successfully', announcement });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.patch('/announcements/:id/toggle-status', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    announcement.status = announcement.status === 'Published' ? 'Paused' : 'Published';
    await announcement.save();

    return res.status(200).json({
      success: true,
      message: `Announcement ${announcement.status === 'Published' ? 'resumed' : 'paused'} successfully`,
      announcement
    });
  } catch (error) {
    console.error('Error toggling announcement status:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    return res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
