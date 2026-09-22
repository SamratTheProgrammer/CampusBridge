import { useEffect } from 'react';
import { socket } from '../services/socket';

/**
 * Custom hook to subscribe to real-time post events (creation, likes, comments, edits, deletions).
 * Keeps post state synchronized across Feeds (Dashboard, MentorHome), Profiles, and Modals
 * without requiring any manual page reloads.
 *
 * @param {Object} options
 * @param {Function} [options.setPosts] - React state setter for posts array: setPosts(prev => ...)
 * @param {string|null} [options.userFilterId] - Optional Clerk ID to filter incoming posts for user profile views
 * @param {Function} [options.onNewPost] - Optional callback triggered on new post
 * @param {Function} [options.onPostDeleted] - Optional callback triggered on post deletion
 * @param {Function} [options.onPostUpdated] - Optional callback triggered on post edit
 * @param {Function} [options.onPostLiked] - Optional callback triggered on post like toggle
 * @param {Function} [options.onCommentsUpdated] - Optional callback triggered when comments/replies update
 */
export const useRealtimePosts = ({
  setPosts,
  userFilterId = null,
  onNewPost,
  onPostDeleted,
  onPostUpdated,
  onPostLiked,
  onCommentsUpdated,
} = {}) => {
  useEffect(() => {
    if (!socket) return;

    const handleNewPost = (newPost) => {
      if (!newPost || (!newPost._id && !newPost.id)) return;

      // If viewing a specific user profile, only show posts authored by that user
      if (userFilterId && newPost.authorClerkId !== userFilterId) {
        return;
      }

      if (setPosts) {
        setPosts((prev) => {
          if (!Array.isArray(prev)) return [newPost];
          // Prevent duplicates if already added optimistically or previously
          const exists = prev.some((p) => (p._id || p.id) === (newPost._id || newPost.id));
          if (exists) {
            return prev.map((p) => ((p._id || p.id) === (newPost._id || newPost.id) ? newPost : p));
          }
          return [newPost, ...prev];
        });
      }

      if (onNewPost) onNewPost(newPost);
    };

    const handlePostDeleted = ({ postId }) => {
      if (!postId) return;
      if (setPosts) {
        setPosts((prev) => (Array.isArray(prev) ? prev.filter((p) => (p._id || p.id) !== postId) : prev));
      }
      if (onPostDeleted) onPostDeleted(postId);
    };

    const handlePostUpdated = (data) => {
      const { postId, ...rest } = data || {};
      if (!postId) return;
      if (setPosts) {
        setPosts((prev) =>
          Array.isArray(prev)
            ? prev.map((p) => ((p._id || p.id) === postId ? { ...p, ...rest } : p))
            : prev
        );
      }
      if (onPostUpdated) onPostUpdated(data);
    };

    const handlePostLiked = ({ postId, likes }) => {
      if (!postId) return;
      if (setPosts) {
        setPosts((prev) =>
          Array.isArray(prev)
            ? prev.map((p) => ((p._id || p.id) === postId ? { ...p, likes } : p))
            : prev
        );
      }
      if (onPostLiked) onPostLiked({ postId, likes });
    };

    const handleCommentsUpdated = ({ postId, comments }) => {
      if (!postId) return;
      if (setPosts) {
        setPosts((prev) =>
          Array.isArray(prev)
            ? prev.map((p) => ((p._id || p.id) === postId ? { ...p, comments } : p))
            : prev
        );
      }
      if (onCommentsUpdated) onCommentsUpdated({ postId, comments });
    };

    socket.on('new_post', handleNewPost);
    socket.on('post_created', handleNewPost);
    socket.on('post_deleted', handlePostDeleted);
    socket.on('post_updated', handlePostUpdated);
    socket.on('post_liked', handlePostLiked);
    socket.on('post_comments_updated', handleCommentsUpdated);

    return () => {
      socket.off('new_post', handleNewPost);
      socket.off('post_created', handleNewPost);
      socket.off('post_deleted', handlePostDeleted);
      socket.off('post_updated', handlePostUpdated);
      socket.off('post_liked', handlePostLiked);
      socket.off('post_comments_updated', handleCommentsUpdated);
    };
  }, [setPosts, userFilterId, onNewPost, onPostDeleted, onPostUpdated, onPostLiked, onCommentsUpdated]);
};

export default useRealtimePosts;
