import React, { useState, useEffect } from 'react';
import { X, Star, ThumbsUp, MessageCircle, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import API_BASE from '../../utils/api';

const ReviewListModal = ({ isOpen, onClose, reviews: initialReviews, title, type = 'mentor', mentorId, onAddReview }) => {
  const { user } = useUser();
  const [reviews, setReviews] = useState(initialReviews);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Sync reviews when prop changes
  useEffect(() => {
    if (initialReviews) setReviews(initialReviews);
  }, [initialReviews]);

  if (!isOpen) return null;

  const isOwner = user?.id && user.id === mentorId;

  const handleLike = async (reviewId) => {
    if (!user) return toast.error('Please login to like');
    try {
      const res = await fetch(`${API_BASE}/api/reviews/${reviewId}/like`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id })
      });
      if (res.ok) {
        const updated = await res.json();
        setReviews(reviews.map(r => r._id === reviewId ? { ...r, likes: updated.likes } : r));
      }
    } catch (e) {
      toast.error('Failed to like review');
    }
  };

  const submitReply = async (reviewId) => {
    if (!replyText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id, text: replyText })
      });
      if (res.ok) {
        const updated = await res.json();
        setReviews(reviews.map(r => r._id === reviewId ? { ...r, reply: updated.reply } : r));
        setReplyingTo(null);
        setReplyText('');
        toast.success('Reply added!');
      }
    } catch (e) {
      toast.error('Failed to add reply');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <div className="flex-1 flex justify-between items-center mr-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Reviews & Ratings</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            </div>
            {onAddReview && (
              <button 
                onClick={() => { onClose(); onAddReview(); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                Add Review
              </button>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {(!reviews || reviews.length === 0) ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No reviews yet.
            </div>
          ) : (
            reviews.map((review) => {
              const rating = type === 'mentor' ? review.mentorRating : review.contentRating;
              const comment = type === 'mentor' ? review.mentorComment : review.contentComment;
              const likes = review.likes || [];
              const hasLiked = user && likes.includes(user.id);

              // Only show if there's an actual rating or comment to display
              if (!rating && !comment) return null;

              return (
                <div key={review._id} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={review.reviewer?.imageUrl || `https://ui-avatars.com/api/?name=${review.reviewer?.firstName || 'U'}&background=random`} 
                        alt="Avatar" 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                          {review.reviewer?.firstName} {review.reviewer?.lastName}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(review.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    {rating && (
                      <div className="flex items-center bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <span className="font-bold text-gray-800 dark:text-gray-200 mr-1">{Number(rating).toFixed(1)}</span>
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      </div>
                    )}
                  </div>
                  {comment ? (
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mt-2 whitespace-pre-wrap">
                      {comment}
                    </p>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 text-sm italic mt-2">
                      No comment provided.
                    </p>
                  )}

                  {/* Likes and Actions */}
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700/50 flex items-center justify-between">
                    <button onClick={() => handleLike(review._id)} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${hasLiked ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                      <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                      {likes.length} {likes.length === 1 ? 'Like' : 'Likes'}
                    </button>
                    
                    {isOwner && !review.reply && (
                      <button onClick={() => { setReplyingTo(replyingTo === review._id ? null : review._id); setReplyText(''); }} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <MessageCircle className="w-4 h-4" /> Reply
                      </button>
                    )}
                  </div>

                  {/* Reply Block */}
                  {review.reply && (
                    <div className="mt-3 bg-blue-50 dark:bg-blue-900/10 border-l-2 border-blue-500 p-3 rounded-r-lg">
                      <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">Mentor's Reply:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{review.reply.text}</p>
                    </div>
                  )}

                  {/* Replying Input */}
                  {replyingTo === review._id && (
                    <div className="mt-3 flex gap-2">
                      <input 
                        type="text" 
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                        autoFocus
                      />
                      <button onClick={() => submitReply(review._id)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewListModal;
