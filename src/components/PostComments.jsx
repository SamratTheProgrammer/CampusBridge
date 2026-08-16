import React, { useState } from 'react';
import { Send, Loader2, CornerDownRight } from 'lucide-react';
import toast from 'react-hot-toast';
import API_BASE from '../utils/api';
import { useNavigate, useLocation } from 'react-router-dom';

const PostComments = ({ post, currentUser, onRefresh, formatTime, getAvatarFallback }) => {
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  const [replyingCommentId, setReplyingCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleUserClick = (userId, userRole) => {
    if (!userId) return;
    if (userId === currentUser?.id) {
      navigate(location.pathname.includes('/mentor-dashboard') ? '/mentor-dashboard/profile' : '/dashboard/profile');
      return;
    }
    const basePath = location.pathname.includes('/mentor-dashboard') ? '/mentor-dashboard' : '/dashboard';
    if (userRole?.toLowerCase() === 'mentor' || userRole?.toLowerCase() === 'alumni') {
      navigate(`${basePath}/mentor/${userId}`);
    } else {
      navigate(`${basePath}/student/${userId}`);
    }
  };

  const commentsArray = post.comments || [];

  const handleComment = async (e) => {
    if (e) e.preventDefault();
    if (!commentText.trim() || !currentUser) return;
    setIsCommenting(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post._id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorClerkId: currentUser.id, content: commentText })
      });
      if (res.ok) {
        setCommentText('');
        if (onRefresh) onRefresh();
      } else {
        toast.error('Failed to post comment');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to post comment');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleReply = async (commentId) => {
    if (!replyText.trim() || !currentUser) return;
    setIsReplying(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post._id}/comment/${commentId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorClerkId: currentUser.id, content: replyText })
      });
      if (res.ok) {
        setReplyText('');
        setReplyingCommentId(null);
        toast.success('Reply added!');
        if (onRefresh) onRefresh();
      } else {
        toast.error('Failed to post reply');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to post reply');
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Existing Comments List */}
      <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
        {commentsArray.map((comment) => {
          const replies = comment.replies || [];
          const isReplyingThis = replyingCommentId === comment._id;

          return (
            <div key={comment._id} className="space-y-2">
              {/* Main Comment */}
              <div className="flex gap-3">
                <img
                  src={comment.author?.image || getAvatarFallback(comment.author?.name)}
                  alt={comment.author?.name}
                  className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleUserClick(comment.authorClerkId, comment.author?.role)}
                />
                <div className="flex-1 min-w-0">
                  <div className="bg-background border border-border/50 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-2xs">
                    <h4 
                      className="font-bold text-xs text-foreground cursor-pointer hover:underline"
                      onClick={() => handleUserClick(comment.authorClerkId, comment.author?.role)}
                    >
                      {comment.author?.name}
                    </h4>
                    <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap break-words">{comment.content}</p>
                  </div>

                  {/* Comment Meta (Time & Reply Button) */}
                  <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] text-muted-foreground font-medium">
                    <span>{formatTime ? formatTime(comment.createdAt) : 'Recently'}</span>
                    {currentUser && (
                      <button
                        onClick={() => {
                          if (isReplyingThis) {
                            setReplyingCommentId(null);
                            setReplyText('');
                          } else {
                            setReplyingCommentId(comment._id);
                            setReplyText('');
                          }
                        }}
                        className="font-bold hover:underline hover:text-primary transition-colors cursor-pointer"
                      >
                        Reply
                      </button>
                    )}
                  </div>

                  {/* Nested Replies List */}
                  {replies.length > 0 && (
                    <div className="mt-2.5 ml-2 pl-3 border-l-2 border-primary/20 space-y-2.5">
                      {replies.map((reply) => (
                        <div key={reply._id} className="flex gap-2.5 items-start">
                          <img
                            src={reply.author?.image || getAvatarFallback(reply.author?.name)}
                            alt={reply.author?.name}
                            className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleUserClick(reply.authorClerkId, reply.author?.role)}
                          />
                          <div className="flex-1 min-w-0 bg-muted/30 border border-border/40 rounded-xl px-3 py-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <h5 
                                className="font-bold text-[11px] text-foreground cursor-pointer hover:underline"
                                onClick={() => handleUserClick(reply.authorClerkId, reply.author?.role)}
                              >
                                {reply.author?.name}
                              </h5>
                              <span className="text-[10px] text-muted-foreground/70">{formatTime ? formatTime(reply.createdAt) : ''}</span>
                            </div>
                            <p className="text-xs text-foreground/90 mt-0.5 break-words">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input Form */}
                  {isReplyingThis && (
                    <div className="mt-2 ml-2 pl-3 border-l-2 border-primary/40 flex gap-2 items-center animate-in fade-in duration-200">
                      <CornerDownRight className="w-4 h-4 text-primary shrink-0" />
                      <input
                        type="text"
                        autoFocus
                        placeholder={`Reply to ${comment.author?.name || 'comment'}...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1 bg-background border border-border/50 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleReply(comment._id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleReply(comment._id)}
                        disabled={isReplying || !replyText.trim()}
                        className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
                      >
                        {isReplying ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Reply'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {commentsArray.length === 0 && (
          <p className="text-xs text-muted-foreground text-center italic py-2">No comments yet. Be the first!</p>
        )}
      </div>

      {/* Main Comment Input Form */}
      {currentUser && (
        <div className="flex gap-3 pt-2">
          <img
            src={currentUser.imageUrl || getAvatarFallback(currentUser.fullName)}
            alt="You"
            className="w-8 h-8 rounded-full object-cover shrink-0 mt-1"
          />
          <div className="flex-1 relative">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="w-full bg-background border border-border/50 rounded-xl pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:border-primary resize-none min-h-[44px]"
              rows="1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleComment();
                }
              }}
            ></textarea>
            <button
              onClick={handleComment}
              disabled={isCommenting || !commentText.trim()}
              className="absolute right-2 top-2 p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
            >
              {isCommenting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostComments;
