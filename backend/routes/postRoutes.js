import express from 'express';
import Post from '../models/Post.js';
import User from '../models/User.js';

const router = express.Router();

// Get all posts with author details
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    
    // We manually fetch user details since authorClerkId is a string reference
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const user = await User.findOne({ clerkId: post.authorClerkId });
        
        // Enrich comments
        const enrichedComments = await Promise.all(
          post.comments.map(async (comment) => {
            const commentUser = await User.findOne({ clerkId: comment.authorClerkId });
            return {
              ...comment.toObject(),
              author: commentUser ? {
                name: commentUser.firstName + (commentUser.lastName ? ' ' + commentUser.lastName : ''),
                image: commentUser.imageUrl,
              } : { name: 'Unknown User', image: null }
            };
          })
        );

        return {
          ...post.toObject(),
          author: user ? {
            name: user.firstName + (user.lastName ? ' ' + user.lastName : ''),
            role: user.headline || user.role,
            image: user.imageUrl,
          } : {
            name: 'Unknown User',
            role: 'Member',
            image: null
          },
          comments: enrichedComments
        };
      })
    );

    res.status(200).json(enrichedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new post
router.post('/', async (req, res) => {
  try {
    const { authorClerkId, content, imageUrl, bgGradient } = req.body;

    if (!authorClerkId || (!content && !imageUrl)) {
      return res.status(400).json({ message: 'Author and content are required' });
    }

    const post = new Post({
      authorClerkId,
      content,
      imageUrl,
      bgGradient
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle Like
router.put('/:id/like', async (req, res) => {
  try {
    const { clerkId } = req.body;
    if (!clerkId) return res.status(400).json({ message: 'clerkId is required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const likeIndex = post.likes.indexOf(clerkId);
    if (likeIndex === -1) {
      post.likes.push(clerkId);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.status(200).json(post.likes);
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add Comment
router.post('/:id/comment', async (req, res) => {
  try {
    const { authorClerkId, content } = req.body;
    if (!authorClerkId || !content) return res.status(400).json({ message: 'Missing fields' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ authorClerkId, content });
    await post.save();

    res.status(201).json(post.comments);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Post
router.put('/:id', async (req, res) => {
  try {
    const { authorClerkId, content } = req.body;
    if (!authorClerkId || !content) return res.status(400).json({ message: 'Missing fields' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.authorClerkId !== authorClerkId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    post.content = content;
    await post.save();
    res.status(200).json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Post
router.delete('/:id', async (req, res) => {
  try {
    const { authorClerkId } = req.body;
    if (!authorClerkId) return res.status(400).json({ message: 'clerkId is required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.authorClerkId !== authorClerkId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
