import express from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { createNotificationHelper } from './notificationRoutes.js';

const router = express.Router();

// Helper to safely extract clerkId string from a like entry
const getLikeClerkId = (likeItem) => {
  if (!likeItem) return null;
  if (typeof likeItem === 'string') return likeItem;
  if (typeof likeItem === 'object') return likeItem.clerkId || likeItem.id || null;
  return String(likeItem);
};

// Helper to enrich comments and their replies
const enrichCommentsList = async (comments) => {
  return await Promise.all(
    (comments || []).map(async (comment) => {
      const commentUser = await User.findOne({ clerkId: comment.authorClerkId });
      
      const enrichedReplies = await Promise.all(
        (comment.replies || []).map(async (reply) => {
          const replyUser = await User.findOne({ clerkId: reply.authorClerkId });
          return {
            ...reply.toObject(),
            author: replyUser ? {
              name: replyUser.firstName + (replyUser.lastName ? ' ' + replyUser.lastName : ''),
              image: replyUser.imageUrl,
              role: replyUser.role,
            } : { name: 'Unknown User', image: null, role: 'student' }
          };
        })
      );

      return {
        ...comment.toObject(),
        author: commentUser ? {
          name: commentUser.firstName + (commentUser.lastName ? ' ' + commentUser.lastName : ''),
          image: commentUser.imageUrl,
          role: commentUser.role,
        } : { name: 'Unknown User', image: null, role: 'student' },
        replies: enrichedReplies
      };
    })
  );
};

// Get all posts with author details
router.get('/', async (req, res) => {
  try {
    const { userId, admin_override } = req.query;
    
    let query = { moderationStatus: { $ne: 'deleted' } };
    if (admin_override === 'true') {
      // Admin sees everything except deleted (handled above)
    } else if (userId) {
      query = {
        $and: [
          { moderationStatus: { $ne: 'deleted' } },
          { $or: [ { moderationStatus: { $ne: 'paused' } }, { authorClerkId: userId } ] }
        ]
      };
    } else {
      query.moderationStatus = { $ne: 'paused' };
    }

    const posts = await Post.find(query).sort({ createdAt: -1 });
    
    // We manually fetch user details since authorClerkId is a string reference
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const user = await User.findOne({ clerkId: post.authorClerkId });
        const enrichedComments = await enrichCommentsList(post.comments);

        // Enrich likes
        const enrichedLikes = await Promise.all(
          post.likes.map(async (likeItem) => {
            const likeClerkId = getLikeClerkId(likeItem);
            if (!likeClerkId) return { clerkId: 'unknown', name: 'Unknown User', image: null };
            const likeUser = await User.findOne({ clerkId: likeClerkId });
            return likeUser ? {
              clerkId: likeClerkId,
              name: likeUser.firstName + (likeUser.lastName ? ' ' + likeUser.lastName : ''),
              image: likeUser.imageUrl,
              role: likeUser.headline || likeUser.role
            } : { clerkId: likeClerkId, name: 'Unknown User', image: null };
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
          comments: enrichedComments,
          likes: enrichedLikes
        };
      })
    );

    res.status(200).json(enrichedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get posts by a specific user (accepts clerkId, Mongo _id, or username)
router.get('/user/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    if (!clerkId || clerkId === 'undefined') {
      return res.status(200).json([]);
    }

    let targetClerkId = clerkId;
    let query = [{ clerkId }, { username: clerkId }];
    if (mongoose.Types.ObjectId.isValid(clerkId)) {
      query.push({ _id: clerkId });
    }
    const user = await User.findOne({ $or: query });
    if (user) {
      targetClerkId = user.clerkId;
    }

    const requestingUserId = req.query.requestingUserId;
    let postQuery = { authorClerkId: targetClerkId, moderationStatus: { $ne: 'deleted' } };
    
    // If someone is viewing another user's profile, hide paused posts
    if (requestingUserId !== targetClerkId) {
      postQuery.moderationStatus = { $nin: ['paused', 'deleted'] };
    }

    const posts = await Post.find(postQuery).sort({ createdAt: -1 });
    
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const postAuthor = user || await User.findOne({ clerkId: post.authorClerkId });
        const enrichedComments = await enrichCommentsList(post.comments);

        const enrichedLikes = await Promise.all(
          post.likes.map(async (likeItem) => {
            const likeClerkId = getLikeClerkId(likeItem);
            if (!likeClerkId) return { clerkId: 'unknown', name: 'Unknown User', image: null };
            const likeUser = await User.findOne({ clerkId: likeClerkId });
            return likeUser ? {
              clerkId: likeClerkId,
              name: likeUser.firstName + (likeUser.lastName ? ' ' + likeUser.lastName : ''),
              image: likeUser.imageUrl,
              role: likeUser.headline || likeUser.role
            } : { clerkId: likeClerkId, name: 'Unknown User', image: null };
          })
        );

        return {
          ...post.toObject(),
          author: postAuthor ? {
            name: postAuthor.firstName + (postAuthor.lastName ? ' ' + postAuthor.lastName : ''),
            role: postAuthor.headline || postAuthor.role,
            image: postAuthor.imageUrl,
          } : {
            name: 'Unknown User',
            role: 'Member',
            image: null
          },
          comments: enrichedComments,
          likes: enrichedLikes
        };
      })
    );

    res.status(200).json(enrichedPosts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new post
router.post('/', async (req, res) => {
  try {
    const { authorClerkId, content, imageUrl, bgGradient, eventDetails, jobDetails, mediaType } = req.body;

    if (!authorClerkId || (!content && !imageUrl && !eventDetails && !jobDetails)) {
      return res.status(400).json({ message: 'Author and content/event/job are required' });
    }

    const post = new Post({
      authorClerkId,
      content: content || '',
      imageUrl,
      bgGradient,
      eventDetails,
      jobDetails,
      mediaType
    });

    await post.save();

    // Enrich post with author details for real-time emission
    const postAuthor = await User.findOne({ clerkId: authorClerkId });
    const enrichedPost = {
      ...post.toObject(),
      author: postAuthor ? {
        name: postAuthor.firstName + (postAuthor.lastName ? ' ' + postAuthor.lastName : ''),
        role: postAuthor.headline || postAuthor.role,
        image: postAuthor.imageUrl,
      } : { name: 'Unknown User', role: 'Member', image: null },
      comments: [],
      likes: []
    };

    if (req.io) {
      req.io.emit('new_post', enrichedPost);
    }

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

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const likeIndex = post.likes.findIndex(item => getLikeClerkId(item) === clerkId);
    if (likeIndex === -1) {
      post.likes.push(clerkId);
      // Trigger notification to post author if not liking own post
      const liker = await User.findOne({ clerkId });
      const likerName = liker ? `${liker.firstName} ${liker.lastName || ''}`.trim() : 'Someone';
      await createNotificationHelper({
        recipientClerkId: post.authorClerkId,
        senderClerkId: clerkId,
        type: 'post_like',
        title: 'New Post Like',
        message: `${likerName} liked your post.`,
        link: '/dashboard'
      });
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

// Get a single post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findOne({ clerkId: post.authorClerkId });
    const enrichedComments = await enrichCommentsList(post.comments);

    const enrichedLikes = await Promise.all(
      post.likes.map(async (likeItem) => {
        const likeClerkId = getLikeClerkId(likeItem);
        if (!likeClerkId) return { clerkId: 'unknown', name: 'Unknown User', image: null };
        const likeUser = await User.findOne({ clerkId: likeClerkId });
        return likeUser ? {
          clerkId: likeClerkId,
          name: likeUser.firstName + (likeUser.lastName ? ' ' + likeUser.lastName : ''),
          image: likeUser.imageUrl,
          role: likeUser.headline || likeUser.role
        } : { clerkId: likeClerkId, name: 'Unknown User', image: null };
      })
    );

    const enrichedPost = {
      ...post.toObject(),
      author: user ? {
        name: user.firstName + (user.lastName ? ' ' + user.lastName : ''),
        image: user.imageUrl,
        role: user.headline || user.role || 'Member'
      } : {
        name: 'Unknown User',
        role: 'Member',
        image: null
      },
      comments: enrichedComments,
      likes: enrichedLikes
    };

    res.status(200).json(enrichedPost);
  } catch (error) {
    console.error('Error fetching single post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add Comment
router.post('/:id/comment', async (req, res) => {
  try {
    const { authorClerkId, content } = req.body;
    if (!authorClerkId || !content) return res.status(400).json({ message: 'Missing fields' });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ authorClerkId, content });
    await post.save();

    // Trigger notification to post author
    const commenter = await User.findOne({ clerkId: authorClerkId });
    const commenterName = commenter ? `${commenter.firstName} ${commenter.lastName || ''}`.trim() : 'Someone';
    await createNotificationHelper({
      recipientClerkId: post.authorClerkId,
      senderClerkId: authorClerkId,
      type: 'post_comment',
      title: 'New Comment',
      message: `${commenterName} commented: "${content.substring(0, 35)}${content.length > 35 ? '...' : ''}"`,
      link: '/dashboard'
    });

    res.status(201).json(post.comments);

    // After response, check for mentions
    try {
      if (content.startsWith('@')) {
        const mentionedName = content.split(' ')[0].substring(1);
        const mentionedUser = await User.findOne({ 
          $or: [
            { firstName: new RegExp(`^${mentionedName}$`, 'i') },
            { username: new RegExp(`^${mentionedName}$`, 'i') }
          ]
        });
        
        if (mentionedUser && mentionedUser.clerkId !== authorClerkId) {
          await createNotificationHelper({
            recipientClerkId: mentionedUser.clerkId,
            senderClerkId: authorClerkId,
            type: 'post_comment',
            title: 'You were mentioned',
            message: `${commenterName} mentioned you in a comment.`,
            link: '/dashboard'
          });
        }
      }
    } catch (e) {
      console.error('Error sending mention notification:', e);
    }

  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add Reply to a Comment
router.post('/:id/comment/:commentId/reply', async (req, res) => {
  try {
    const { authorClerkId, content } = req.body;
    if (!authorClerkId || !content) return res.status(400).json({ message: 'Missing fields' });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    comment.replies.push({ authorClerkId, content });
    await post.save();

    // Trigger notification to comment author
    const replier = await User.findOne({ clerkId: authorClerkId });
    const replierName = replier ? `${replier.firstName} ${replier.lastName || ''}`.trim() : 'Someone';
    await createNotificationHelper({
      recipientClerkId: comment.authorClerkId,
      senderClerkId: authorClerkId,
      type: 'post_comment',
      title: 'New Reply to your comment',
      message: `${replierName} replied: "${content.substring(0, 35)}${content.length > 35 ? '...' : ''}"`,
      link: '/dashboard'
    });

    res.status(201).json(comment.replies);

    // Check for mentions
    try {
      if (content.startsWith('@')) {
        const mentionedName = content.split(' ')[0].substring(1);
        const mentionedUser = await User.findOne({ 
          $or: [
            { firstName: new RegExp(`^${mentionedName}$`, 'i') },
            { username: new RegExp(`^${mentionedName}$`, 'i') }
          ]
        });
        
        if (mentionedUser && mentionedUser.clerkId !== authorClerkId) {
          // Trigger notification to tagged user
          await createNotificationHelper({
            recipientClerkId: mentionedUser.clerkId,
            senderClerkId: authorClerkId,
            type: 'post_comment',
            title: 'You were mentioned',
            message: `${replierName} mentioned you in a reply.`,
            link: '/dashboard'
          });
        }
      }
    } catch (e) {
      console.error('Error sending mention notification:', e);
    }

  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle Like on a Comment
router.put('/:id/comment/:commentId/like', async (req, res) => {
  try {
    const { clerkId } = req.body;
    if (!clerkId) return res.status(400).json({ message: 'clerkId is required' });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const likeIndex = comment.likes.indexOf(clerkId);
    if (likeIndex === -1) {
      comment.likes.push(clerkId);
      // Trigger notification
      if (comment.authorClerkId !== clerkId) {
        const liker = await User.findOne({ clerkId });
        const likerName = liker ? `${liker.firstName} ${liker.lastName || ''}`.trim() : 'Someone';
        await createNotificationHelper({
          recipientClerkId: comment.authorClerkId,
          senderClerkId: clerkId,
          type: 'post_like',
          title: 'New Comment Like',
          message: `${likerName} liked your comment.`,
          link: '/dashboard'
        });
      }
    } else {
      comment.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.status(200).json(comment.likes);
  } catch (error) {
    console.error('Error toggling comment like:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle Like on a Reply
router.put('/:id/comment/:commentId/reply/:replyId/like', async (req, res) => {
  try {
    const { clerkId } = req.body;
    if (!clerkId) return res.status(400).json({ message: 'clerkId is required' });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const reply = comment.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    const likeIndex = reply.likes.indexOf(clerkId);
    if (likeIndex === -1) {
      reply.likes.push(clerkId);
      // Trigger notification
      if (reply.authorClerkId !== clerkId) {
        const liker = await User.findOne({ clerkId });
        const likerName = liker ? `${liker.firstName} ${liker.lastName || ''}`.trim() : 'Someone';
        await createNotificationHelper({
          recipientClerkId: reply.authorClerkId,
          senderClerkId: clerkId,
          type: 'post_like',
          title: 'New Reply Like',
          message: `${likerName} liked your reply.`,
          link: '/dashboard'
        });
      }
    } else {
      reply.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.status(200).json(reply.likes);
  } catch (error) {
    console.error('Error toggling reply like:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Post
router.put('/:id', async (req, res) => {
  try {
    const { authorClerkId, content } = req.body;
    if (!authorClerkId || content === undefined) return res.status(400).json({ message: 'Missing fields' });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Post ID' });
    }

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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const authorClerkId = req.body?.authorClerkId || req.query?.authorClerkId;
    if (authorClerkId && post.authorClerkId !== authorClerkId) {
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
