import mongoose from 'mongoose';

const supportMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    default: 'General Inquiry / Help Request',
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Replied', 'Resolved'],
    default: 'Pending',
  },
  adminReply: {
    type: String,
    default: '',
  },
  repliedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SupportMessage = mongoose.model('SupportMessage', supportMessageSchema);

export default SupportMessage;
