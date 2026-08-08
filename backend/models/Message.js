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
  text: {
    type: String,
    required: true,
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
