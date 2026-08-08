import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema(
  {
    requesterClerkId: {
      type: String,
      required: true,
    },
    recipientClerkId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
    message: {
      type: String,
    },
  },
  { timestamps: true }
);

// Prevent duplicate pending requests between the same users
connectionSchema.index({ requesterClerkId: 1, recipientClerkId: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

const Connection = mongoose.model('Connection', connectionSchema);

export default Connection;
