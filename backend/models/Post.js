import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  authorClerkId: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
  authorClerkId: { type: String, required: true },
  content: { type: String, required: true },
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
  likes: [{
    type: String, // clerkId of the user who liked
  }],
  comments: [commentSchema],
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
