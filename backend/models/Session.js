import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      default: 'General Mentorship',
    },
    mode: {
      type: String,
      enum: ['Online', 'Offline'],
      default: 'Online',
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      default: 30, // in minutes
    },
    meetingLink: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Session = mongoose.model('Session', sessionSchema);

export default Session;
