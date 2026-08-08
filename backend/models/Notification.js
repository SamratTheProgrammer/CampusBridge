import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientClerkId: {
    type: String,
    required: true,
    index: true,
  },
  senderClerkId: {
    type: String,
  },
  senderName: {
    type: String,
  },
  senderImage: {
    type: String,
  },
  type: {
    type: String,
    enum: ['connection_request', 'connection_accepted', 'connection_declined', 'post_like', 'post_comment', 'session_booked', 'system'],
    default: 'system',
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  link: {
    type: String,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
