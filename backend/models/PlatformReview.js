import mongoose from 'mongoose';

const platformReviewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    default: 'Student',
    trim: true,
  },
  qualification: {
    type: String,
    default: '',
    trim: true,
  },
  before: {
    type: String,
    default: '',
    trim: true,
  },
  after: {
    type: String,
    default: '',
    trim: true,
  },
  image: {
    type: String,
    default: '',
  },
  quote: {
    type: String,
    required: true,
    trim: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  likes: [{
    type: String,
  }],
  replies: [{
    id: {
      type: String,
      default: () => Date.now().toString(),
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    }
  }],
  userClerkId: {
    type: String,
    default: null,
  },
  isSeed: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

const PlatformReview = mongoose.model('PlatformReview', platformReviewSchema);

export default PlatformReview;
