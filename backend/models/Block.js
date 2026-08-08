import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  blockerClerkId: {
    type: String,
    required: true,
    index: true,
  },
  blockedClerkId: {
    type: String,
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Ensure a user cannot block the same person twice
blockSchema.index({ blockerClerkId: 1, blockedClerkId: 1 }, { unique: true });

const Block = mongoose.model('Block', blockSchema);
export default Block;
