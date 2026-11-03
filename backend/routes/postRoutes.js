import express from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import { createNotificationHelper } from './notificationRoutes.js';
import { escapeRegex } from '../utils/regexHelper.js';
import { verifyAdminToken } from '../middleware/adminAuth.js';
import { fetchUrlMetadata, generateReelPosterUrl } from '../utils/linkPreviewHelper.js';

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
              username: replyUser.username,
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
          username: commentUser.username,
        } : { name: 'Unknown User', image: null, role: 'student' },
        replies: enrichedReplies
      };
    })
  );
};

// Helper to sanitize post link preview and prevent 403 Forbidden on expired/hotlinked Meta CDN URLs
const sanitizePostLinkPreview = (postObj) => {
  if (postObj?.linkPreview) {
    const lpImg = postObj.linkPreview.image || postObj.linkPreview.thumbnailUrl || '';
    if (lpImg.includes('cdninstagram.com') || lpImg.includes('fbcdn.net')) {
      const shortcode = postObj.linkPreview.shortcode || (postObj.linkPreview.url?.match(/instagram\.com\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/i)?.[1] || '');
      const isReel = postObj.linkPreview.isReel || Boolean(postObj.linkPreview.url?.includes('/reel'));
      const fallback = generateReelPosterUrl({ platform: 'instagram', shortcode, isReel, title: postObj.linkPreview.title });
      postObj.linkPreview.image = fallback;
      postObj.linkPreview.thumbnailUrl = fallback;
    }
  }
  return postObj;
};

// Get all posts with author details
router.get('/', async (req, res) => {
  try {
    const { userId, admin_override } = req.query;
    
    let isAdmin = false;
    if (admin_override === 'true') {
      const authHeader = req.headers.authorization || req.headers['x-admin-token'];
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader?.trim();
      if (token && verifyAdminToken(token)) {
        isAdmin = true;
      }
    }

    let requestingUser = null;
    let query = { moderationStatus: { $ne: 'deleted' } };
    if (isAdmin) {
      // Admin sees everything except deleted (handled above)
    } else if (userId) {
      requestingUser = await User.findOne({ clerkId: userId }).select('hiddenPosts mutedAuthors');
      const hiddenIds = requestingUser?.hiddenPosts || [];
      const mutedClerkIds = requestingUser?.mutedAuthors || [];

      query = {
        $and: [
          { moderationStatus: { $ne: 'deleted' } },
          { _id: { $nin: hiddenIds } },
          { 
            $or: [
              { authorClerkId: userId },
              { authorClerkId: { $nin: mutedClerkIds } }
            ]
          },
          { $or: [ { moderationStatus: { $ne: 'paused' } }, { authorClerkId: userId } ] }
        ]
      };
    } else {
      query.moderationStatus = { $ne: 'paused' };
    }

    const isPaginated = Boolean(req.query.page);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 6);
    const skip = (page - 1) * limit;

    const total = isPaginated ? await Post.countDocuments(query) : 0;
    const postQueryExec = Post.find(query).sort({ createdAt: -1 });
    if (isPaginated) {
      postQueryExec.skip(skip).limit(limit);
    }
    const posts = await postQueryExec;
    
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
              role: likeUser.headline || likeUser.role,
              username: likeUser.username
            } : { clerkId: likeClerkId, name: 'Unknown User', image: null };
          })
        );

        return {
          ...post.toObject(),
          author: user ? {
            clerkId: user.clerkId,
            name: user.firstName + (user.lastName ? ' ' + user.lastName : ''),
            role: user.headline || user.role,
            image: user.imageUrl,
            username: user.username || user.clerkId,
          } : {
            clerkId: post.authorClerkId,
            name: 'Unknown User',
            role: 'Member',
            image: null
          },
          comments: enrichedComments,
          likes: enrichedLikes
        };
      })
    );

    // Shuffle posts if requested (e.g. for dynamic feeds like Instagram/social media)
    if (req.query.shuffle === 'true' && admin_override !== 'true') {
      for (let i = enrichedPosts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [enrichedPosts[i], enrichedPosts[j]] = [enrichedPosts[j], enrichedPosts[i]];
      }
    }

    if (isPaginated) {
      const hasMore = skip + posts.length < total;
      return res.status(200).json({
        posts: enrichedPosts,
        hasMore,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    }

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

    const isPaginated = Boolean(req.query.page);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 6);
    const skip = (page - 1) * limit;

    const total = isPaginated ? await Post.countDocuments(postQuery) : 0;
    const postQueryExec = Post.find(postQuery).sort({ createdAt: -1 });
    if (isPaginated) {
      postQueryExec.skip(skip).limit(limit);
    }
    const posts = await postQueryExec;
    
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
              role: likeUser.headline || likeUser.role,
              username: likeUser.username
            } : { clerkId: likeClerkId, name: 'Unknown User', image: null };
          })
        );

        return sanitizePostLinkPreview({
          ...post.toObject(),
          author: postAuthor ? {
            name: postAuthor.firstName + (postAuthor.lastName ? ' ' + postAuthor.lastName : ''),
            role: postAuthor.headline || postAuthor.role,
            image: postAuthor.imageUrl,
            username: postAuthor.username,
          } : {
            name: 'Unknown User',
            role: 'Member',
            image: null
          },
          comments: enrichedComments,
          likes: enrichedLikes
        });
      })
    );

    if (isPaginated) {
      const hasMore = skip + posts.length < total;
      return res.status(200).json({
        posts: enrichedPosts,
        hasMore,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    }

    res.status(200).json(enrichedPosts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch rich link preview metadata for URLs (YouTube, Drive, FB, Insta, web links)
router.get('/link-preview', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL query parameter is required' });
    }
    const metadata = await fetchUrlMetadata(url);
    res.status(200).json(metadata);
  } catch (error) {
    console.error('Error fetching link preview:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch link metadata' });
  }
});

// Get a single post by ID
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Post ID' });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

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
          role: likeUser.headline || likeUser.role,
          username: likeUser.username
        } : { clerkId: likeClerkId, name: 'Unknown User', image: null };
      })
    );

    const enrichedPost = {
      ...post.toObject(),
      author: user ? {
        clerkId: user.clerkId,
        name: user.firstName + (user.lastName ? ' ' + user.lastName : ''),
        role: user.headline || user.role,
        image: user.imageUrl,
        username: user.username || user.clerkId,
      } : {
        clerkId: post.authorClerkId,
        name: 'Unknown User',
        role: 'Member',
        image: null
      },
      comments: enrichedComments,
      likes: enrichedLikes
    };

    res.status(200).json(sanitizePostLinkPreview(enrichedPost));
  } catch (error) {
    console.error('Error fetching single post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new post
router.post('/', async (req, res) => {
  try {
    const { authorClerkId, content, imageUrl, mediaFiles, bgGradient, eventDetails, jobDetails, mediaType, linkPreview } = req.body;

    if (!authorClerkId || (!content && !imageUrl && (!mediaFiles || mediaFiles.length === 0) && !eventDetails && !jobDetails && !linkPreview)) {
      return res.status(400).json({ message: 'Author and content/event/job/media/link are required' });
    }

    const post = new Post({
      authorClerkId,
      content: content || '',
      imageUrl,
      mediaFiles: mediaFiles || [],
      linkPreview: linkPreview || undefined,
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
        username: postAuthor.username,
      } : { name: 'Unknown User', role: 'Member', image: null },
      comments: [],
      likes: []
    };

    const io = req.app?.get('io') || req.io;
    if (io) {
      io.emit('new_post', enrichedPost);
      io.emit('post_created', enrichedPost);
    }

    res.status(201).json(enrichedPost);
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
      const postAuthor = await User.findOne({ clerkId: post.authorClerkId });
      const basePath = (postAuthor?.role === 'mentor' || postAuthor?.role === 'alumni') ? '/mentor-dashboard' : '/dashboard';
      const io = req.app?.get('io') || req.io;
      await createNotificationHelper({
        recipientClerkId: post.authorClerkId,
        senderClerkId: clerkId,
        type: 'post_like',
        title: 'New Post Like',
        message: `${likerName} liked your post.`,
        link: `${basePath}?post=${post._id}`,
        io
      });
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();

    const enrichedLikes = await Promise.all(
      post.likes.map(async (likeItem) => {
        const likeClerkId = getLikeClerkId(likeItem);
        if (!likeClerkId) return { clerkId: 'unknown', name: 'Unknown User', image: null };
        const likeUser = await User.findOne({ clerkId: likeClerkId });
        return likeUser ? {
          clerkId: likeClerkId,
          name: likeUser.firstName + (likeUser.lastName ? ' ' + likeUser.lastName : ''),
          image: likeUser.imageUrl,
          role: likeUser.headline || likeUser.role,
          username: likeUser.username
        } : { clerkId: likeClerkId, name: 'Unknown User', image: null };
      })
    );

    const io = req.app?.get('io') || req.io;
    if (io) {
      io.emit('post_liked', { postId: post._id.toString(), likes: enrichedLikes });
    }

    res.status(200).json(enrichedLikes);
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
          role: likeUser.headline || likeUser.role,
          username: likeUser.username
        } : { clerkId: likeClerkId, name: 'Unknown User', image: null };
      })
    );

    const enrichedPost = {
      ...post.toObject(),
      author: user ? {
        name: user.firstName + (user.lastName ? ' ' + user.lastName : ''),
        image: user.imageUrl,
        role: user.headline || user.role || 'Member',
        username: user.username
      } : {
        name: 'Unknown User',
        role: 'Member',
        image: null
      },
      comments: enrichedComments,
      likes: enrichedLikes
    };

    res.status(200).json(sanitizePostLinkPreview(enrichedPost));
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

    if (post.commentsDisabled) {
      return res.status(403).json({ message: 'Comments are turned off for this post' });
    }

    post.comments.push({ authorClerkId, content });
    await post.save();

    const addedComment = post.comments[post.comments.length - 1];
    const commentId = addedComment ? addedComment._id : '';

    // Trigger notification to post author
    const commenter = await User.findOne({ clerkId: authorClerkId });
    const commenterName = commenter ? `${commenter.firstName} ${commenter.lastName || ''}`.trim() : 'Someone';
    const postAuthor = await User.findOne({ clerkId: post.authorClerkId });
    const basePath = (postAuthor?.role === 'mentor' || postAuthor?.role === 'alumni') ? '/mentor-dashboard' : '/dashboard';
    const io = req.app?.get('io') || req.io;

    await createNotificationHelper({
      recipientClerkId: post.authorClerkId,
      senderClerkId: authorClerkId,
      type: 'post_comment',
      title: 'New Comment',
      message: `${commenterName} commented: "${content.substring(0, 35)}${content.length > 35 ? '...' : ''}"`,
      link: `${basePath}?post=${post._id}&comment=${commentId}`,
      io
    });

    const enrichedComments = await enrichCommentsList(post.comments);
    if (io) {
      io.emit('post_comments_updated', { postId: post._id.toString(), comments: enrichedComments });
    }

    res.status(201).json(enrichedComments);

    // After response, check for mentions
    try {
      if (content.startsWith('@')) {
        const mentionedName = content.split(' ')[0].substring(1);
        const safeMentioned = escapeRegex(mentionedName);
        const mentionedUser = await User.findOne({ 
          $or: [
            { firstName: new RegExp(`^${safeMentioned}$`, 'i') },
            { username: new RegExp(`^${safeMentioned}$`, 'i') }
          ]
        });
        
        if (mentionedUser && mentionedUser.clerkId !== authorClerkId) {
          const mentionBasePath = (mentionedUser?.role === 'mentor' || mentionedUser?.role === 'alumni') ? '/mentor-dashboard' : '/dashboard';
          await createNotificationHelper({
            recipientClerkId: mentionedUser.clerkId,
            senderClerkId: authorClerkId,
            type: 'post_comment',
            title: 'You were mentioned',
            message: `${commenterName} mentioned you in a comment.`,
            link: `${mentionBasePath}?post=${post._id}&comment=${commentId}`,
            io
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

    if (post.commentsDisabled) {
      return res.status(403).json({ message: 'Commenting is turned off for this post' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    comment.replies.push({ authorClerkId, content });
    await post.save();

    const addedReply = comment.replies[comment.replies.length - 1];
    const replyId = addedReply ? addedReply._id : '';

    // Trigger notification to comment author
    const replier = await User.findOne({ clerkId: authorClerkId });
    const replierName = replier ? `${replier.firstName} ${replier.lastName || ''}`.trim() : 'Someone';
    const commentAuthor = await User.findOne({ clerkId: comment.authorClerkId });
    const basePath = (commentAuthor?.role === 'mentor' || commentAuthor?.role === 'alumni') ? '/mentor-dashboard' : '/dashboard';
    const io = req.app?.get('io') || req.io;

    await createNotificationHelper({
      recipientClerkId: comment.authorClerkId,
      senderClerkId: authorClerkId,
      type: 'post_comment',
      title: 'New Reply to your comment',
      message: `${replierName} replied: "${content.substring(0, 35)}${content.length > 35 ? '...' : ''}"`,
      link: `${basePath}?post=${post._id}&comment=${comment._id}&reply=${replyId}`,
      io
    });

    const enrichedComments = await enrichCommentsList(post.comments);
    if (io) {
      io.emit('post_comments_updated', { postId: post._id.toString(), comments: enrichedComments });
    }

    res.status(201).json(comment.replies);

    // Check for mentions
    try {
      if (content.startsWith('@')) {
        const mentionedName = content.split(' ')[0].substring(1);
        const safeMentioned = escapeRegex(mentionedName);
        const mentionedUser = await User.findOne({ 
          $or: [
            { firstName: new RegExp(`^${safeMentioned}$`, 'i') },
            { username: new RegExp(`^${safeMentioned}$`, 'i') }
          ]
        });
        
        if (mentionedUser && mentionedUser.clerkId !== authorClerkId) {
          const mentionBasePath = (mentionedUser?.role === 'mentor' || mentionedUser?.role === 'alumni') ? '/mentor-dashboard' : '/dashboard';
          // Trigger notification to tagged user
          await createNotificationHelper({
            recipientClerkId: mentionedUser.clerkId,
            senderClerkId: authorClerkId,
            type: 'post_comment',
            title: 'You were mentioned',
            message: `${replierName} mentioned you in a reply.`,
            link: `${mentionBasePath}?post=${post._id}&comment=${comment._id}&reply=${replyId}`,
            io
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

// Toggle Turn Off / On Comments
router.put('/:id/toggle-comments', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.authorClerkId !== userId) {
      return res.status(403).json({ message: 'Only author can modify post settings' });
    }

    post.commentsDisabled = !post.commentsDisabled;
    await post.save();

    const io = req.app?.get('io') || req.io;
    if (io) {
      io.emit('post_updated', { postId: post._id.toString(), commentsDisabled: post.commentsDisabled });
    }

    res.status(200).json({ success: true, commentsDisabled: post.commentsDisabled });
  } catch (error) {
    console.error('Error toggling comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle Hide / Unhide Likes Count
router.put('/:id/toggle-likes-visibility', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.authorClerkId !== userId) {
      return res.status(403).json({ message: 'Only author can modify post settings' });
    }

    post.hideLikes = !post.hideLikes;
    await post.save();

    const io = req.app?.get('io') || req.io;
    if (io) {
      io.emit('post_updated', { postId: post._id.toString(), hideLikes: post.hideLikes });
    }

    res.status(200).json({ success: true, hideLikes: post.hideLikes });
  } catch (error) {
    console.error('Error toggling likes visibility:', error);
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
        const commentAuthor = await User.findOne({ clerkId: comment.authorClerkId });
        const basePath = (commentAuthor?.role === 'mentor' || commentAuthor?.role === 'alumni') ? '/mentor-dashboard' : '/dashboard';
        const io = req.app?.get('io') || req.io;
        await createNotificationHelper({
          recipientClerkId: comment.authorClerkId,
          senderClerkId: clerkId,
          type: 'post_like',
          title: 'New Comment Like',
          message: `${likerName} liked your comment.`,
          link: `${basePath}?post=${post._id}&comment=${comment._id}`,
          io
        });
      }
    } else {
      comment.likes.splice(likeIndex, 1);
    }

    await post.save();

    const enrichedComments = await enrichCommentsList(post.comments);
    const io = req.app?.get('io') || req.io;
    if (io) {
      io.emit('post_comments_updated', { postId: post._id.toString(), comments: enrichedComments });
    }

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
        const replyAuthor = await User.findOne({ clerkId: reply.authorClerkId });
        const basePath = (replyAuthor?.role === 'mentor' || replyAuthor?.role === 'alumni') ? '/mentor-dashboard' : '/dashboard';
        const io = req.app?.get('io') || req.io;
        await createNotificationHelper({
          recipientClerkId: reply.authorClerkId,
          senderClerkId: clerkId,
          type: 'post_like',
          title: 'New Reply Like',
          message: `${likerName} liked your reply.`,
          link: `${basePath}?post=${post._id}&comment=${comment._id}&reply=${reply._id}`,
          io
        });
      }
    } else {
      reply.likes.splice(likeIndex, 1);
    }

    await post.save();

    const enrichedComments = await enrichCommentsList(post.comments);
    const io = req.app?.get('io') || req.io;
    if (io) {
      io.emit('post_comments_updated', { postId: post._id.toString(), comments: enrichedComments });
    }

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

    const io = req.app?.get('io') || req.io;
    if (io) {
      io.emit('post_updated', { postId: post._id.toString(), content: post.content });
    }

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

    const authorClerkId = String(req.body?.authorClerkId || req.query?.authorClerkId || req.headers['x-user-id'] || '').trim();
    
    let isAuthorized = authorClerkId && String(post.authorClerkId).trim() === authorClerkId;
    if (!isAuthorized && authorClerkId) {
      const user = await User.findOne({
        $or: [
          { clerkId: authorClerkId },
          ...(mongoose.Types.ObjectId.isValid(authorClerkId) ? [{ _id: authorClerkId }] : [])
        ]
      });
      if (user && (user.clerkId === post.authorClerkId || user.role === 'admin')) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Unauthorized: You can only delete your own posts' });
    }

    await Post.findByIdAndDelete(req.params.id);

    // Also mark any shared messages referencing this post as deleted/unavailable
    await Message.updateMany(
      { type: 'share', 'share.itemId': req.params.id },
      { $set: { 'share.isDeleted': true } }
    ).catch((err) => console.error('Error updating shared messages on post delete:', err));

    const io = req.app?.get('io') || req.io;
    if (io) {
      io.emit('post_deleted', { postId: req.params.id.toString() });
    }

    res.status(200).json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Track post share (e.g. copied link or external share)
router.post('/:id/share', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Post ID' });
    }

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { sharesCount: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const io = req.app?.get('io') || req.io;
    if (io) {
      io.emit('post_shares_updated', {
        postId: post._id.toString(),
        sharesCount: post.sharesCount || 0
      });
    }

    res.status(200).json({ success: true, sharesCount: post.sharesCount || 0 });
  } catch (error) {
    console.error('Error tracking post share:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Report a post
router.post('/:id/report', async (req, res) => {
  try {
    const { reporterClerkId, reason, details } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, error: 'Reason for report is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    let reporterName = 'User';
    let reporterUsername = '';
    if (reporterClerkId) {
      const reporter = await User.findOne({ clerkId: reporterClerkId });
      if (reporter) {
        reporterName = reporter.firstName + (reporter.lastName ? ' ' + reporter.lastName : '');
        reporterUsername = reporter.username || reporter.clerkId;
        if (!reporter.hiddenPosts) reporter.hiddenPosts = [];
        if (!reporter.hiddenPosts.some(id => id.toString() === post._id.toString())) {
          reporter.hiddenPosts.push(post._id);
          await reporter.save();
        }
      }
    }

    if (!post.reports) post.reports = [];
    
    // Check if this user already reported this post
    const existingIndex = post.reports.findIndex(r => r.reporterClerkId === reporterClerkId);
    if (existingIndex >= 0) {
      post.reports[existingIndex].reason = reason;
      post.reports[existingIndex].details = details || '';
      post.reports[existingIndex].createdAt = new Date();
    } else {
      post.reports.push({
        reporterClerkId: reporterClerkId || 'anonymous',
        reporterName,
        reporterUsername,
        reason,
        details: details || '',
        createdAt: new Date()
      });
    }

    post.reportCount = post.reports.length;
    await post.save();

    // Broadcast realtime event so Admin dashboard updates live
    const io = req.app?.get('io') || req.io;
    if (io) {
      io.emit('post_reported', {
        postId: post._id.toString(),
        reportCount: post.reportCount,
        report: post.reports[post.reports.length - 1]
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Post reported successfully and submitted for moderation',
      reportCount: post.reportCount
    });
  } catch (error) {
    console.error('Report post error:', error);
    return res.status(500).json({ success: false, error: 'Failed to report post' });
  }
});

// Dismiss all reports on a post (Admin action)
router.post('/:id/dismiss-reports', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Preserve reports into dismissedReports so dismissal can be undone
    post.dismissedReports = Array.isArray(post.reports) && post.reports.length > 0 
      ? [...post.reports] 
      : (post.dismissedReports || []);
    post.reports = [];
    post.reportCount = 0;
    await post.save();

    const io = req.app?.get('io') || req.io;
    if (io) {
      io.emit('post_reports_dismissed', { 
        postId: post._id.toString(),
        dismissedReports: post.dismissedReports
      });
    }

    return res.status(200).json({
      success: true,
      message: 'All reports on this post have been dismissed',
      post
    });
  } catch (error) {
    console.error('Dismiss reports error:', error);
    return res.status(500).json({ success: false, error: 'Failed to dismiss reports' });
  }
});

// Undo dismiss reports on a post (Restore reports)
router.post('/:id/undo-dismiss-reports', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    if (!post.dismissedReports || post.dismissedReports.length === 0) {
      return res.status(400).json({ success: false, error: 'No dismissed reports found to restore' });
    }

    // Restore reports from dismissedReports
    post.reports = [...post.dismissedReports];
    post.reportCount = post.reports.length;
    post.dismissedReports = [];
    await post.save();

    const io = req.app?.get('io') || req.io;
    if (io) {
      io.emit('post_reports_restored', { 
        postId: post._id.toString(), 
        reports: post.reports,
        reportCount: post.reportCount 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Dismissed reports restored successfully',
      post
    });
  } catch (error) {
    console.error('Undo dismiss reports error:', error);
    return res.status(500).json({ success: false, error: 'Failed to restore reports' });
  }
});

// Hide a post for a specific user
router.post('/:id/hide', async (req, res) => {
  try {
    const { userClerkId } = req.body;
    if (!userClerkId) return res.status(400).json({ success: false, error: 'User ID is required' });

    const user = await User.findOne({ clerkId: userClerkId });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (!user.hiddenPosts) user.hiddenPosts = [];
    if (!user.hiddenPosts.some(id => id.toString() === req.params.id)) {
      user.hiddenPosts.push(req.params.id);
      await user.save();
    }

    return res.status(200).json({ success: true, message: 'Post hidden from your feed' });
  } catch (error) {
    console.error('Hide post error:', error);
    return res.status(500).json({ success: false, error: 'Failed to hide post' });
  }
});

// Mute an author for a specific user
router.post('/mute-author', async (req, res) => {
  try {
    const { userClerkId, targetClerkId } = req.body;
    if (!userClerkId || !targetClerkId) {
      return res.status(400).json({ success: false, error: 'Both userClerkId and targetClerkId are required' });
    }

    const user = await User.findOne({ clerkId: userClerkId });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (!user.mutedAuthors) user.mutedAuthors = [];
    if (!user.mutedAuthors.includes(targetClerkId)) {
      user.mutedAuthors.push(targetClerkId);
      await user.save();
    }

    return res.status(200).json({ success: true, message: 'Author muted successfully' });
  } catch (error) {
    console.error('Mute author error:', error);
    return res.status(500).json({ success: false, error: 'Failed to mute author' });
  }
});

// Unmute an author
router.post('/unmute-author', async (req, res) => {
  try {
    const { userClerkId, targetClerkId } = req.body;
    if (!userClerkId || !targetClerkId) {
      return res.status(400).json({ success: false, error: 'Both userClerkId and targetClerkId are required' });
    }

    const user = await User.findOne({ clerkId: userClerkId });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (user.mutedAuthors) {
      user.mutedAuthors = user.mutedAuthors.filter(id => id !== targetClerkId);
      await user.save();
    }

    return res.status(200).json({ success: true, message: 'Author unmuted successfully' });
  } catch (error) {
    console.error('Unmute author error:', error);
    return res.status(500).json({ success: false, error: 'Failed to unmute author' });
  }
});

// Unhide a post for a specific user
router.post('/:id/unhide', async (req, res) => {
  try {
    const { userClerkId } = req.body;
    if (!userClerkId) {
      return res.status(400).json({ success: false, error: 'userClerkId is required' });
    }

    const user = await User.findOne({ clerkId: userClerkId });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (user.hiddenPosts) {
      user.hiddenPosts = user.hiddenPosts.filter(id => id.toString() !== req.params.id);
      await user.save();
    }

    return res.status(200).json({ success: true, message: 'Post unhidden' });
  } catch (error) {
    console.error('Unhide post error:', error);
    return res.status(500).json({ success: false, error: 'Failed to unhide post' });
  }
});

// Unreport a post (Undo report)
router.post('/:id/unreport', async (req, res) => {
  try {
    const { reporterClerkId } = req.body;
    if (!reporterClerkId) {
      return res.status(400).json({ success: false, error: 'reporterClerkId is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    if (post.reports) {
      post.reports = post.reports.filter(r => r.reporterClerkId !== reporterClerkId);
      post.reportCount = post.reports.length;
      await post.save();
    }

    // Also unhide the post for this reporter
    const user = await User.findOne({ clerkId: reporterClerkId });
    if (user && user.hiddenPosts) {
      user.hiddenPosts = user.hiddenPosts.filter(id => id.toString() !== post._id.toString());
      await user.save();
    }

    // Emit realtime event if io available
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('post_reported', {
          postId: post._id,
          reportCount: post.reportCount,
          reports: post.reports
        });
      }
    } catch (e) {
      console.error('Socket emit error on unreport:', e);
    }

    return res.status(200).json({ success: true, message: 'Report removed successfully' });
  } catch (error) {
    console.error('Unreport post error:', error);
    return res.status(500).json({ success: false, error: 'Failed to cancel report' });
  }
});

// Get muted authors details for a user
router.get('/muted-authors', async (req, res) => {
  try {
    const { userClerkId } = req.query;
    if (!userClerkId) {
      return res.status(400).json({ success: false, error: 'userClerkId is required' });
    }
    const user = await User.findOne({ clerkId: userClerkId });
    if (!user || !user.mutedAuthors || user.mutedAuthors.length === 0) {
      return res.status(200).json({ success: true, mutedAuthors: [] });
    }

    const mutedUsers = await User.find({ clerkId: { $in: user.mutedAuthors } })
      .select('clerkId firstName lastName username imageUrl profilePicture role headline');

    return res.status(200).json({
      success: true,
      mutedAuthors: mutedUsers.map(u => ({
        clerkId: u.clerkId,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || 'User',
        username: u.username,
        image: u.imageUrl || u.profilePicture,
        role: u.role,
        headline: u.headline
      }))
    });
  } catch (error) {
    console.error('Get muted authors error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch muted authors' });
  }
});

export default router;
