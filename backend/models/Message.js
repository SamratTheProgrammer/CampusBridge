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
    enum: ['text', 'call_log', 'image', 'video', 'document', 'file', 'share'],
    default: 'text',
  },
  text: {
    type: String,
    // Required only for text/call_log, can be empty for pure file attachments
  },
  attachment: {
    url: String,
    name: String,
    type: { type: String }, // 'image', 'video', 'document'
    size: Number
  },
  replyTo: {
    messageId: String,
    text: String,
    senderName: String
  },
  share: {
    type: { type: String, enum: ['post', 'job', 'event'] },
    itemId: { type: mongoose.Schema.Types.ObjectId, refPath: 'share.typeModel' },
    typeModel: { type: String, enum: ['Post', 'Job', 'Event'] },
    title: String,
    description: String,
    imageUrl: String
  },
  callInfo: {
    callType: { type: String, enum: ['video', 'audio'] },
    status: { type: String, enum: ['completed', 'missed', 'rejected'] },
    duration: { type: Number, default: 0 } // in seconds
  },
  deletedFor: [{
    type: String // Clerk IDs of users who deleted this for themselves
  }],
  isDeleted: {
    type: Boolean,
    default: false // True if sender deleted it for everyone
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  isDelivered: {
    type: Boolean,
    default: false,
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
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
