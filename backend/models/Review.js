import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Optional because an event might not have a specific mentor to review
  },
  type: {
    type: String,
    enum: ['session', 'event', 'mentor'],
    required: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'typeModel'
  },
  typeModel: {
    type: String,
    required: true,
    enum: ['Session', 'Event', 'User']
  },
  mentorRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  mentorComment: {
    type: String,
  },
  contentRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  contentComment: {
    type: String,
  },
  likes: [{
    type: String // Clerk IDs
  }],
  reply: {
    text: String,
    createdAt: { type: Date, default: Date.now }
  }
}, { timestamps: true });

// Prevent multiple reviews from the same user for the same session/event
reviewSchema.index({ reviewer: 1, referenceId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
