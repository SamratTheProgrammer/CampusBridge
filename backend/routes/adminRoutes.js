import express from 'express';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Event from '../models/Event.js';
import Message from '../models/Message.js';
import Session from '../models/Session.js';

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

    const adminToken = `admin_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const adminUser = {
      id: 'admin_master_id',
      email: normalizedEmail,
      name: 'CampusBridge Admin',
      role: role || 'super-admin',
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

// Admin Verify / Me Endpoint
router.get('/me', async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: 'admin_master_id',
      email: DEFAULT_ADMIN_EMAIL,
      name: 'CampusBridge Admin',
      role: 'super-admin'
    }
  });
});

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
      recentActivity: formattedRecentActivity
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching admin stats' });
  }
});

// Get Mentor Verifications (Real Dynamic MongoDB Data + Seeding)
router.get('/verifications', async (req, res) => {
  try {
    let mentors = await User.find({ role: { $in: ['mentor', 'alumni'] } }).sort({ createdAt: -1 });
    
    // Seed initial mentors if database has none
    if (mentors.length === 0) {
      try {
        await User.insertMany(SAMPLE_MENTORS);
        mentors = await User.find({ role: { $in: ['mentor', 'alumni'] } }).sort({ createdAt: -1 });
      } catch (seedErr) {
        console.error('Error seeding mentors:', seedErr);
      }
    }

    const formattedList = mentors.map(formatMentorVerification);

    return res.status(200).json({
      success: true,
      verifications: formattedList
    });
  } catch (error) {
    console.error('Admin Fetch Verifications Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch mentor verifications' });
  }
});

// Update Mentor Verification Status
router.put('/verifications/:id/status', async (req, res) => {
  try {
    const { status } = req.body; // 'Approved' | 'Rejected' | 'Pending'
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

// Delete User
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin Delete User Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

export default router;

