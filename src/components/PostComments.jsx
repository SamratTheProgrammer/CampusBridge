import React, { useState, useEffect } from 'react';
import { Send, Loader2, CornerDownRight, Heart, Smile } from 'lucide-react';
import toast from 'react-hot-toast';
import API_BASE from '../utils/api';
import { useNavigate, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import EmojiPicker from 'emoji-picker-react';

const PostComments = ({ post, currentUser, onRefresh, formatTime, getAvatarFallback, fullHeight = false, postCaptionNode, showCommentInput = true, beforeInputNode }) => {
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [replyingCommentId, setReplyingCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const emojiPickerRef = React.useRef(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const findMentionedUser = (nameStr, currentComment, currentReplies) => {
    const cleanName = nameStr.replace('@', '');
    if (currentComment.author?.name === cleanName) {
      return { id: currentComment.authorClerkId, role: currentComment.author?.role };
    }
    const foundReply = currentReplies.find(r => r.author?.name === cleanName);
    if (foundReply) {
      return { id: foundReply.authorClerkId, role: foundReply.author?.role };
    }
    return null;
  };

  // Fire confetti if the author opens comments and someone congratulated them
  useEffect(() => {
    if (currentUser?.id === post.authorClerkId) {
      const hasCongo = commentsArray.some(c => /congrat|congo|🎉|🎊/i.test(c.content));
      if (hasCongo) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    }
  }, []); // Run once when comments section opens

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
        if (/congrat|congo|🎉|🎊/i.test(commentText)) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
        setCommentText('');
        setShowEmojiPicker(false);
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

  const handleLikeComment = async (commentId) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post._id}/comment/${commentId}/like`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: currentUser.id })
      });
      if (res.ok && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikeReply = async (commentId, replyId) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post._id}/comment/${commentId}/reply/${replyId}/like`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: currentUser.id })
      });
      if (res.ok && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`p-4 sm:p-5 ${fullHeight ? 'flex flex-col flex-1 overflow-hidden' : 'space-y-4'}`}>
      {postCaptionNode && (
        <div className="mb-2 shrink-0">
          {postCaptionNode}
        </div>
      )}
      
      {/* Existing Comments List */}
      <div className={`space-y-4 overflow-y-auto pr-2 custom-scrollbar ${fullHeight ? 'flex-1' : 'max-h-[380px]'}`}>
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
                      className="font-bold text-xs text-foreground cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleUserClick(comment.authorClerkId, comment.author?.role)}
                    >
                      {comment.author?.name}
                    </h4>
                    <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap break-words">{comment.content}</p>
                  </div>

                  {/* Comment Meta (Time & Actions) */}
                  <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] text-muted-foreground font-medium">
                    <span>{formatTime ? formatTime(comment.createdAt) : 'Recently'}</span>
                    
                    {currentUser && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleLikeComment(comment._id)}
                          className={`font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                            comment.likes?.includes(currentUser.id) ? 'text-red-500' : 'hover:text-primary'
                          }`}
                        >
                          <Heart className={`w-3 h-3 ${comment.likes?.includes(currentUser.id) ? 'fill-current' : ''}`} />
                          {comment.likes?.length > 0 && <span>{comment.likes.length}</span>}
                        </button>
                        <button
                          onClick={() => {
                            if (isReplyingThis) {
                              setReplyingCommentId(null);
                              setReplyText('');
                            } else {
                              setReplyingCommentId(comment._id);
                              setReplyText(`@${comment.author?.name} `);
                            }
                          }}
                          className="font-bold hover:underline hover:text-primary transition-colors cursor-pointer"
                        >
                          Reply
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Nested Replies List */}
                  {replies.length > 0 && (
                    <div className="mt-2.5 ml-2 pl-3 border-l-2 border-primary/20 space-y-2.5">
                      {replies.map((reply) => (
                        <div key={reply._id} className="mb-2">
                          <div className="flex gap-2.5 items-start">
                          <img
                            src={reply.author?.image || getAvatarFallback(reply.author?.name)}
                            alt={reply.author?.name}
                            className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleUserClick(reply.authorClerkId, reply.author?.role)}
                          />
                          <div className="flex-1 min-w-0 bg-muted/30 border border-border/40 rounded-xl px-3 py-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <h5 
                                className="font-bold text-[11px] text-foreground cursor-pointer hover:text-primary transition-colors"
                                onClick={() => handleUserClick(reply.authorClerkId, reply.author?.role)}
                              >
                                {reply.author?.name}
                              </h5>
                              <span className="text-[10px] text-muted-foreground/70">{formatTime ? formatTime(reply.createdAt) : ''}</span>
                            </div>
                            <p className="text-xs text-foreground/90 mt-0.5 break-words">
                              {reply.content.startsWith('@') ? (
                                <>
                                  <span 
                                    className="text-primary font-medium cursor-pointer hover:underline"
                                    onClick={() => {
                                      const mentionedName = reply.content.split(' ')[0];
                                      const mentionedUser = findMentionedUser(mentionedName, comment, replies);
                                      if (mentionedUser) {
                                        handleUserClick(mentionedUser.id, mentionedUser.role);
                                      }
                                    }}
                                  >
                                    {reply.content.split(' ')[0]}
                                  </span>
                                  {' '}{reply.content.substring(reply.content.indexOf(' ') + 1)}
                                </>
                              ) : reply.content}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 ml-9 text-[10px] text-muted-foreground font-medium">
                          {currentUser && (
                            <>
                              <button
                                onClick={() => handleLikeReply(comment._id, reply._id)}
                                className={`transition-colors cursor-pointer flex items-center gap-1 ${
                                  reply.likes?.includes(currentUser.id) ? 'text-red-500' : 'hover:text-primary'
                                }`}
                              >
                                <Heart className={`w-2.5 h-2.5 ${reply.likes?.includes(currentUser.id) ? 'fill-current' : ''}`} />
                                {reply.likes?.length > 0 && <span>{reply.likes.length}</span>}
                              </button>
                              <button
                                onClick={() => {
                                  setReplyingCommentId(comment._id);
                                  setReplyText(`@${reply.author?.name} `);
                                }}
                                className="hover:underline hover:text-primary transition-colors cursor-pointer"
                              >
                                Reply
                              </button>
                            </>
                          )}
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

      {/* Content injected before the input (e.g. engagement buttons) */}
      {beforeInputNode && (
        <div className="shrink-0">
          {beforeInputNode}
        </div>
      )}

      {/* Main Comment Input Form */}
      {currentUser && showCommentInput && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border/40 mt-2">
          {/* Quick Replies for Job/Event posts */}
          {(post.jobDetails?.title || post.eventDetails?.title) && (
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {["Congratulations! 🎉", "So happy for you! 🎊", "Well deserved! 👏", "Amazing news! 🚀"].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setCommentText(suggestion)}
                  className="whitespace-nowrap px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-full text-xs font-medium transition-colors border border-primary/20"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3 relative" ref={emojiPickerRef}>
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
              className="w-full bg-background border border-border/50 rounded-xl pl-4 pr-20 py-2.5 text-sm focus:outline-none focus:border-primary resize-none min-h-[44px]"
              rows="1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleComment();
                }
              }}
            ></textarea>
            <div className="absolute right-2 top-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                onClick={handleComment}
                disabled={isCommenting || !commentText.trim()}
                className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
              >
                {isCommenting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <EmojiPicker 
                  onEmojiClick={(emoji) => setCommentText(prev => prev + emoji.emoji)}
                  theme="auto"
                />
              </div>
            )}
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostComments;
