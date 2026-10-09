import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Send, Loader2, CornerDownRight, Heart, Smile } from 'lucide-react';
import toast from 'react-hot-toast';
import API_BASE from '../utils/api';
import { useNavigate, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import EmojiPicker from 'emoji-picker-react';
import { useTheme } from './ThemeProvider';
import { socket } from '../services/socket';

const PostComments = ({ post, currentUser, onRefresh, formatTime, getAvatarFallback, fullHeight = false, postCaptionNode, showCommentInput = true, beforeInputNode, highlightCommentId, highlightReplyId }) => {
  const { theme } = useTheme();
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Live real-time synchronization for comments
  useEffect(() => {
    const postId = post?._id || post?.id;
    if (!socket || !postId) return;

    const handleCommentsUpdated = (payload) => {
      if (payload?.postId === postId && onRefresh) {
        onRefresh(payload.comments);
      }
    };

    socket.on('post_comments_updated', handleCommentsUpdated);
    return () => {
      socket.off('post_comments_updated', handleCommentsUpdated);
    };
  }, [post?._id, post?.id, onRefresh]);

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const [replyingCommentId, setReplyingCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const [pickerPosition, setPickerPosition] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const emojiPickerRef = React.useRef(null);
  const smileButtonRef = useRef(null);
  const commentsContainerRef = useRef(null);

  // Auto-scroll to highlighted comment/reply from notification deep link
  useEffect(() => {
    const targetId = highlightReplyId || highlightCommentId;
    if (!targetId) return;
    setHighlightedId(targetId);
    const timer = setTimeout(() => {
      const el = document.getElementById(`comment-${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 400);
    // Clear highlight after 4 seconds
    const clearTimer = setTimeout(() => setHighlightedId(null), 5000);
    return () => { clearTimeout(timer); clearTimeout(clearTimer); };
  }, [highlightCommentId, highlightReplyId, post?.comments]);

  // Close emoji picker when clicking outside or scrolling
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target) &&
        smileButtonRef.current &&
        !smileButtonRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    const handleScrollOrResize = () => {
      setShowEmojiPicker(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [showEmojiPicker]);

  const toggleEmojiPicker = (e) => {
    e?.stopPropagation();
    if (!showEmojiPicker && smileButtonRef.current) {
      const rect = smileButtonRef.current.getBoundingClientRect();
      const pickerHeight = 380;
      const pickerWidth = Math.min(320, window.innerWidth - 32);
      
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      let top = null;
      let bottom = null;
      
      if (spaceAbove >= pickerHeight + 12 || spaceAbove > spaceBelow) {
        bottom = window.innerHeight - rect.top + 8;
      } else {
        top = rect.bottom + 8;
      }
      
      let right = window.innerWidth - rect.right;
      if (right < 16) right = 16;
      if (right + pickerWidth > window.innerWidth) {
        right = Math.max(16, window.innerWidth - pickerWidth - 16);
      }
      
      setPickerPosition({ top, bottom, right });
    }
    setShowEmojiPicker(prev => !prev);
  };

  const handleUserClick = (userId, userRole, username) => {
    const target = username || userId;
    if (!target) return;
    if (userId === currentUser?.id || target === currentUser?.id || (currentUser?.username && target === currentUser.username)) {
      navigate(location.pathname.includes('/mentor-dashboard') ? '/mentor-dashboard/profile' : '/dashboard/profile');
      return;
    }
    if (location.pathname.includes('/mentor-dashboard')) {
      navigate(`/mentor-dashboard/profile/${target}`);
    } else {
      navigate(`/dashboard/profile/${target}`);
    }
  };

  const commentsArray = post.comments || [];

  const renderFormattedCommentText = (text, currentComment, currentReplies) => {
    if (!text) return '';
    // Collect potential candidate users in this comment thread
    const candidates = [];
    if (currentComment?.author?.name) {
      candidates.push({
        name: currentComment.author.name,
        id: currentComment.authorClerkId,
        role: currentComment.author.role,
        username: currentComment.author.username
      });
    }
    if (Array.isArray(currentReplies)) {
      currentReplies.forEach(r => {
        if (r?.author?.name && !candidates.some(c => c.name.toLowerCase() === r.author.name.toLowerCase())) {
          candidates.push({
            name: r.author.name,
            id: r.authorClerkId,
            role: r.author.role,
            username: r.author.username
          });
        }
      });
    }
    // Sort candidate names by length descending so multi-word full names match first
    candidates.sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));

    for (const cand of candidates) {
      const mentionPrefix = `@${cand.name}`;
      if (text.startsWith(mentionPrefix)) {
        const rest = text.slice(mentionPrefix.length);
        return (
          <>
            <span
              className="text-primary font-semibold cursor-pointer hover:underline inline-block mr-0.5"
              onClick={(e) => {
                e.stopPropagation();
                handleUserClick(cand.id, cand.role, cand.username);
              }}
            >
              {mentionPrefix}
            </span>
            {rest}
          </>
        );
      }
    }

    if (text.startsWith('@')) {
      const firstWord = text.split(' ')[0];
      const cleanName = firstWord.slice(1);
      const matched = candidates.find(c => 
        c.name?.toLowerCase() === cleanName.toLowerCase() || 
        (c.username && c.username.toLowerCase() === cleanName.toLowerCase()) ||
        c.name?.split(' ')[0].toLowerCase() === cleanName.toLowerCase()
      );
      const rest = text.slice(firstWord.length);
      return (
        <>
          <span
            className="text-primary font-semibold cursor-pointer hover:underline inline-block mr-0.5"
            onClick={(e) => {
              e.stopPropagation();
              if (matched) {
                handleUserClick(matched.id, matched.role, matched.username);
              } else {
                handleUserClick(null, null, cleanName);
              }
            }}
          >
            {firstWord}
          </span>
          {rest}
        </>
      );
    }

    return text;
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
        const enrichedComments = await res.json();
        if (/congrat|congo|🎉|🎊/i.test(commentText)) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
        setCommentText('');
        setShowEmojiPicker(false);
        if (onRefresh) onRefresh(enrichedComments);
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
        const enrichedComments = await res.json();
        setReplyText('');
        setReplyingCommentId(null);
        toast.success('Reply added!');
        if (onRefresh) onRefresh(enrichedComments);
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
    const prevComments = post?.comments || [];
    const optimisticComments = prevComments.map(c => {
      if (c._id === commentId) {
        const safeLikes = Array.isArray(c.likes) ? [...c.likes] : [];
        const hasLiked = safeLikes.includes(currentUser.id);
        const newLikes = hasLiked
          ? safeLikes.filter(id => id !== currentUser.id)
          : [...safeLikes, currentUser.id];
        return { ...c, likes: newLikes };
      }
      return c;
    });

    if (onRefresh) onRefresh(optimisticComments);

    try {
      const res = await fetch(`${API_BASE}/api/posts/${post._id}/comment/${commentId}/like`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: currentUser.id })
      });
      if (!res.ok) {
        if (onRefresh) onRefresh(prevComments);
      }
    } catch (err) {
      console.error(err);
      if (onRefresh) onRefresh(prevComments);
    }
  };

  const handleLikeReply = async (commentId, replyId) => {
    if (!currentUser) return;
    const prevComments = post?.comments || [];
    const optimisticComments = prevComments.map(c => {
      if (c._id === commentId) {
        const updatedReplies = (c.replies || []).map(r => {
          if (r._id === replyId) {
            const safeLikes = Array.isArray(r.likes) ? [...r.likes] : [];
            const hasLiked = safeLikes.includes(currentUser.id);
            const newLikes = hasLiked
              ? safeLikes.filter(id => id !== currentUser.id)
              : [...safeLikes, currentUser.id];
            return { ...r, likes: newLikes };
          }
          return r;
        });
        return { ...c, replies: updatedReplies };
      }
      return c;
    });

    if (onRefresh) onRefresh(optimisticComments);

    try {
      const res = await fetch(`${API_BASE}/api/posts/${post._id}/comment/${commentId}/reply/${replyId}/like`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: currentUser.id })
      });
      if (!res.ok) {
        if (onRefresh) onRefresh(prevComments);
      }
    } catch (err) {
      console.error(err);
      if (onRefresh) onRefresh(prevComments);
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
      <div ref={commentsContainerRef} className={`space-y-4 overflow-y-auto pr-2 custom-scrollbar ${fullHeight ? 'flex-1' : 'max-h-[380px]'}`}>
        {commentsArray.map((comment) => {
          const replies = comment.replies || [];
          const isReplyingThis = replyingCommentId === comment._id;

          return (
            <div key={comment._id} id={`comment-${comment._id}`} className={`space-y-2 transition-all duration-700 rounded-xl ${highlightedId === comment._id ? 'bg-primary/10 ring-2 ring-primary/30 p-2 -m-2' : ''}`}>
              {/* Main Comment */}
              <div className="flex gap-3">
                <img
                  src={comment.author?.image || getAvatarFallback(comment.author?.name)}
                  alt={comment.author?.name}
                  className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleUserClick(comment.authorClerkId, comment.author?.role, comment.author?.username)}
                />
                <div className="flex-1 min-w-0">
                  <div className="bg-background border border-border/50 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-2xs">
                    <h4 
                      className="font-bold text-xs text-foreground cursor-pointer hover:underline hover:text-primary transition-colors inline-block"
                      onClick={() => handleUserClick(comment.authorClerkId, comment.author?.role, comment.author?.username)}
                    >
                      {comment.author?.name}
                    </h4>
                    <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap break-words">
                      {renderFormattedCommentText(comment.content, comment, replies)}
                    </p>
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
                        {!post?.commentsDisabled && (
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
                        )}
                      </div>
                    )}
                  </div>

                  {/* Nested Replies List */}
                  {replies.length > 0 && (
                    <div className="mt-2.5 ml-2 pl-3 border-l-2 border-primary/20 space-y-2.5">
                      {replies.map((reply) => (
                        <div key={reply._id} id={`comment-${reply._id}`} className={`mb-2 transition-all duration-700 rounded-lg ${highlightedId === reply._id ? 'bg-primary/10 ring-2 ring-primary/30 p-1.5 -m-1.5' : ''}`}>
                          <div className="flex gap-2.5 items-start">
                          <img
                            src={reply.author?.image || getAvatarFallback(reply.author?.name)}
                            alt={reply.author?.name}
                            className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleUserClick(reply.authorClerkId, reply.author?.role, reply.author?.username)}
                          />
                          <div className="flex-1 min-w-0 bg-muted/30 border border-border/40 rounded-xl px-3 py-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <h5 
                                className="font-bold text-[11px] text-foreground cursor-pointer hover:underline hover:text-primary transition-colors inline-block"
                                onClick={() => handleUserClick(reply.authorClerkId, reply.author?.role, reply.author?.username)}
                              >
                                {reply.author?.name}
                              </h5>
                              <span className="text-[10px] text-muted-foreground/70">{formatTime ? formatTime(reply.createdAt) : ''}</span>
                            </div>
                            <p className="text-xs text-foreground/90 mt-0.5 break-words">
                              {renderFormattedCommentText(reply.content, comment, replies)}
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
        post?.commentsDisabled ? (
          <div className="p-3 text-center text-xs text-muted-foreground italic bg-muted/20 border border-border/40 rounded-xl my-2">
            Commenting is turned off for this post.
          </div>
        ) : (
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
                ref={smileButtonRef}
                type="button"
                onClick={toggleEmojiPicker}
                className="p-1.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                title="Add emoji"
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
            
            {showEmojiPicker && typeof document !== 'undefined' && createPortal(
              <>
                {/* Backdrop to catch clicks outside and close */}
                <div 
                  className="fixed inset-0 z-[9998] bg-black/25 sm:bg-transparent"
                  onClick={() => setShowEmojiPicker(false)}
                />

                {/* Emoji Picker Popup: mobile centered bottom sheet, desktop anchored without clipping */}
                <div 
                  ref={emojiPickerRef}
                  className={`fixed z-[9999] shadow-2xl rounded-2xl overflow-hidden border border-border/80 bg-card transition-all ${
                    typeof window !== 'undefined' && window.innerWidth < 640
                      ? 'left-1/2 -translate-x-1/2 bottom-4 max-w-[calc(100vw-32px)]'
                      : ''
                  }`}
                  style={
                    typeof window !== 'undefined' && window.innerWidth >= 640 && pickerPosition
                      ? {
                          top: pickerPosition.top ? `${pickerPosition.top}px` : 'auto',
                          bottom: pickerPosition.bottom ? `${pickerPosition.bottom}px` : 'auto',
                          right: `${pickerPosition.right}px`,
                          width: '320px',
                          height: '380px'
                        }
                      : {}
                  }
                  onClick={(e) => e.stopPropagation()}
                >
                  <EmojiPicker 
                    onEmojiClick={(emoji) => {
                      setCommentText(prev => prev + emoji.emoji);
                    }}
                    theme={isDark ? 'dark' : 'light'}
                    previewConfig={{ showPreview: false }}
                    width={typeof window !== 'undefined' && window.innerWidth < 640 ? Math.min(window.innerWidth - 32, 320) : 320}
                    height={380}
                    lazyLoadEmojis={true}
                    searchPlaceHolder="Search emoji..."
                  />
                </div>
              </>,
              document.body
            )}
          </div>
          </div>
        </div>
        )
      )}
    </div>
  );
};

export default PostComments;
