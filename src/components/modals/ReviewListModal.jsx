import React from 'react';
import { X, Star } from 'lucide-react';
import { format } from 'date-fns';

const ReviewListModal = ({ isOpen, onClose, reviews, title, type = 'mentor' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Reviews & Ratings</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No reviews yet.
            </div>
          ) : (
            reviews.map((review) => {
              const rating = type === 'mentor' ? review.mentorRating : review.contentRating;
              const comment = type === 'mentor' ? review.mentorComment : review.contentComment;

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
                        <span className="font-bold text-gray-800 dark:text-gray-200 mr-1">{rating.toFixed(1)}</span>
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
