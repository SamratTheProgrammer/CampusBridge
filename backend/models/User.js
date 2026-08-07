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
  headline: {
    type: String,
  },
  location: {
    type: String,
  },
  aboutMe: {
    type: String,
  },
  resumeUrl: {
    type: String,
  },
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
  }
});

const User = mongoose.model('User', userSchema);
export default User;
