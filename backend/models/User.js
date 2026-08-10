import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    unique: true,
  },
  imageUrl: {
    type: String,
  },
  coverPhoto: {
    type: String,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
  },
  role: {
    type: String,
    enum: ['student', 'mentor', 'alumni', 'admin'],
    default: 'student',
  },
  profileVisibility: {
    type: String,
    enum: ['public', 'restricted', 'hidden'],
    default: 'public',
  },
  headline: {
    type: String,
  },
  location: {
    type: String,
  },
  address: {
    type: String,
  },
  phone: {
    type: String,
  },
  yearsOfExperience: {
    type: String,
  },
  aboutMe: {
    type: String,
  },
  resumeUrl: {
    type: String,
  },
  socialLinks: [{
    platform: String,
    url: String
  }],
  experience: [{
    title: String,
    company: String,
    duration: String,
    description: String
  }],
  education: [{
    degree: String,
    institution: String,
    duration: String,
    grade: String
  }],
  skills: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  verificationStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  savedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  profileViews: {
    type: Number,
    default: 0
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  blockReason: {
    type: String,
    default: '',
  }
});

const User = mongoose.model('User', userSchema);
export default User;
