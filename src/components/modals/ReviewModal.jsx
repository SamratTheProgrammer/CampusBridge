import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import API_BASE from '../../utils/api';

const ReviewModal = ({ isOpen, onClose, pendingReview, onReviewSubmitted }) => {
  const { user } = useUser();
  const [contentRating, setContentRating] = useState(0);
  const [contentHover, setContentHover] = useState(0);
  const [contentComment, setContentComment] = useState('');

  const [mentorRating, setMentorRating] = useState(0);
  const [mentorHover, setMentorHover] = useState(0);
  const [mentorComment, setMentorComment] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const demoReviews = [
    "Incredibly helpful! The guidance provided was exactly what I needed.",
    "Very knowledgeable and patient. I learned a lot.",
    "Great insights and actionable advice. Highly recommend!",
    "A wonderful experience. They really took the time to understand my goals."
  ];

  if (!isOpen || !pendingReview) return null;

  const { type, referenceId, title, mentor } = pendingReview;
  const isSession = type === 'session';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (contentRating === 0 || (mentor && (type === 'session' || type === 'event') && mentorRating === 0)) {
      toast.error('Please provide a star rating.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerClerkId: user.id,
          mentorId: mentor?._id || (type === 'mentor' ? referenceId : undefined),
          type,
          referenceId,
          mentorRating: mentor ? mentorRating : (type === 'mentor' ? contentRating : undefined),
          mentorComment: mentor ? mentorComment : (type === 'mentor' ? contentComment : undefined),
          contentRating,
          contentComment
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      toast.success('Thank you for your feedback!');
      onReviewSubmitted(referenceId);
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ rating, hover, setRating, setHover }) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(rating)}
          className={`focus:outline-none transition-colors duration-200 ${star <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
            }`}
        >
          <Star className="w-8 h-8 fill-current" />
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card text-card-foreground border border-border/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/30">
          <h2 className="text-xl font-bold text-foreground">Rate your experience</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-muted-foreground mb-6 text-center">
            You recently completed: <strong className="text-foreground">{title}</strong>
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Content Rating */}
            <div className="space-y-3">
              <label className="block text-base font-semibold text-foreground">
                How would you rate this {type}?
              </label>
              <div className="flex justify-center py-2">
                <StarRating rating={contentRating} hover={contentHover} setRating={setContentRating} setHover={setContentHover} />
              </div>
              <textarea
                value={contentComment}
                onChange={(e) => setContentComment(e.target.value)}
                placeholder={`Leave a comment about the ${type} (optional)`}
                className="w-full p-3 rounded-xl border border-border/50 bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={3}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {demoReviews.map((demo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setContentComment(demo)}
                    className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded-full transition-colors text-left"
                  >
                    "{demo}"
                  </button>
                ))}
              </div>
            </div>

            {/* Mentor Rating */}
            {mentor && (type === 'session' || type === 'event') && (
              <div className="space-y-3 pt-6 border-t border-border/50">
                <label className="block text-base font-semibold text-foreground">
                  How would you rate {mentor.firstName || 'the mentor'}?
                </label>
                <div className="flex justify-center py-2">
                  <StarRating rating={mentorRating} hover={mentorHover} setRating={setMentorRating} setHover={setMentorHover} />
                </div>
                <textarea
                  value={mentorComment}
                  onChange={(e) => setMentorComment(e.target.value)}
                  placeholder={`Leave a comment about ${mentor.firstName || 'the mentor'} (optional)`}
                  className="w-full p-3 rounded-xl border border-border/50 bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
