import mongoose from 'mongoose';

const eventApplicationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  applicantRole: {
    type: String,
    enum: ['student', 'alumni'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  }
}, { timestamps: true });

const EventApplication = mongoose.model('EventApplication', eventApplicationSchema);

export default EventApplication;
