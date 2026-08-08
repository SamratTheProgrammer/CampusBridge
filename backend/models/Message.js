import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true,
  },
  senderClerkId: {
    type: String,
    required: true,
    index: true,
  },
  recipientClerkId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['text', 'call_log'],
    default: 'text',
  },
  text: {
    type: String,
    required: true,
  },
  callInfo: {
    callType: { type: String, enum: ['video', 'audio'] },
    status: { type: String, enum: ['completed', 'missed', 'rejected'] },
    duration: { type: Number, default: 0 } // in seconds
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

// Helper static method to generate consistent conversation ID for two users
messageSchema.statics.getConversationId = function(user1ClerkId, user2ClerkId) {
  return [user1ClerkId, user2ClerkId].sort().join('_');
};

const Message = mongoose.model('Message', messageSchema);
export default Message;
