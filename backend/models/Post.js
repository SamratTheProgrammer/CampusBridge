import mongoose from 'mongoose';

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
  likes: [{
    type: String, // clerkId of the user who liked
  }],
  comments: [{
    authorClerkId: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  bgGradient: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Post = mongoose.model('Post', postSchema);
export default Post;
