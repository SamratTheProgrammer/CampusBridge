import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  authorClerkId: { type: String, required: true },
  content: { type: String, required: true },
  likes: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
  authorClerkId: { type: String, required: true },
  content: { type: String, required: true },
  likes: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  replies: [replySchema]
});

const postSchema = new mongoose.Schema({
  authorClerkId: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },  
  imageUrl: {
    type: String,
  },
  mediaFiles: [{
    url: String,
    mediaType: String // 'image' or 'video'
  }],
  likes: [{
    type: String, // clerkId of the user who liked
  }],
  comments: [commentSchema],
  bgGradient: {
    type: String,
  },
  eventDetails: {
    title: String,
    date: Date,
    time: String,
    location: String,
    type: { type: String },
    format: String, // 'online' or 'offline'
    source: String, // 'manual' or 'campusbridge'
    campusBridgeEventId: String,
    imageUrl: String
  },
  jobDetails: {
    title: String,
    company: String,
    location: String,
    role: String,
    source: String, // 'manual' or 'campusbridge'
    campusBridgeJobId: String,
    companyLogo: String
  },
  mediaType: {
    type: String, // 'image' or 'video'
    default: 'image'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  moderationStatus: {
    type: String,
    enum: ['approved', 'paused', 'deleted'],
    default: 'approved'
  },
  moderationRemark: {
    type: String
  }
});

const Post = mongoose.model('Post', postSchema);
export default Post;
