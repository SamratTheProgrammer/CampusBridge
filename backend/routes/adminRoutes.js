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

// Admin Overview Stats Endpoint (Real Dynamic MongoDB Data)
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: { $in: ['student', 'user'] } });
    const totalMentors = await User.countDocuments({ role: 'mentor' });
    const totalAlumni = await User.countDocuments({ role: 'alumni' });
    
    // Active Mentors (Mentors registered or profile public)
    const activeMentors = await User.countDocuments({ role: 'mentor' });

    // Job & Internship counts
    const jobPosts = await Job.countDocuments({ type: { $ne: 'Internship' } });
    const internshipPosts = await Job.countDocuments({ type: 'Internship' });

    // Upcoming Events count
    const upcomingEvents = await Event.countDocuments({ active: true });

    // Total Messages count
    const messagesCount = await Message.countDocuments();

    // Pending Approvals count (pending sessions or unverified mentors)
    const pendingApprovals = await Session.countDocuments({ status: 'pending' });

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
