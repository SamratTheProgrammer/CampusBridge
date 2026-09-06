import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Quote, Send, Heart, MessageSquare, ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import API_BASE from '../../utils/api'

const SuccessStories = () => {
  const { user, isSignedIn } = useUser();
  const [dbUser, setDbUser] = useState(null);
  const [stories, setStories] = useState([]);
  const [newReview, setNewReview] = useState({
    quote: '',
    rating: 0,
    beforeStatus: '',
    afterStatus: ''
  });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const scrollRef = useRef(null);
  
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      if (user) {
        try {
          const res = await fetch(`${API_BASE}/api/users/${user.id}`);
          if (res.ok) {
            const data = await res.json();
            setDbUser(data);
          }
        } catch (error) {
          console.error("Error fetching DB user:", error);
        }
      }
    };
    fetchUser();
  }, [user]);

  const averageRating = stories.length > 0 
    ? (stories.reduce((acc, story) => acc + story.rating, 0) / stories.length).toFixed(1)
    : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newReview.quote.trim() || newReview.rating === 0) return; // Prevent submitting with 0 rating
    
    const newStory = {
      id: Date.now(),
      name: isSignedIn && user ? user.fullName : 'Anonymous',
      role: isSignedIn && (dbUser || user) ? (dbUser?.role || user?.publicMetadata?.role || 'Student') : 'Student', 
      qualification: isSignedIn && (dbUser || user) ? (dbUser?.education?.[0]?.degree || dbUser?.headline || user?.publicMetadata?.qualification || user?.publicMetadata?.degree || '') : '',
      before: newReview.beforeStatus,
      after: newReview.afterStatus,
      image: isSignedIn && user ? user.imageUrl : `https://ui-avatars.com/api/?name=Anonymous&background=random`,
      quote: newReview.quote,
      rating: newReview.rating,
      likes: 0,
      hasLiked: false,
      replies: [],
      isCurrentUser: true // Flag to ensure it can be sorted to the top
    };

    // Current user's reviews go to the top
    setStories(prev => [newStory, ...prev]);
    setNewReview({ quote: '', rating: 0, beforeStatus: '', afterStatus: '' });
    setIsFormOpen(false); // Close form after submit
  };

  const handleLike = (id) => {
    setStories(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          hasLiked: !s.hasLiked,
          likes: s.hasLiked ? s.likes - 1 : s.likes + 1
        };
      }
      return s;
    }));
  };

  const handleReplySubmit = (id) => {
    if (!replyText.trim()) return;
    setStories(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          replies: [...(s.replies || []), {
            id: Date.now(),
            name: isSignedIn && user ? user.fullName : 'You',
            image: isSignedIn && user ? user.imageUrl : `https://ui-avatars.com/api/?name=You&background=random`,
            text: replyText,
          }]
        };
      }
      return s;
    }));
    setReplyingTo(null);
    setReplyText('');
  };

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
  };
  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
  };

  const ReviewCard = ({ story }) => (
    <div className="bg-card border rounded-2xl p-6 relative flex flex-col min-w-[320px] max-w-[400px] flex-shrink-0 h-full">
      <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/10" />
      
      <div className="flex items-center gap-1 text-yellow-500 mb-4">
        {[1,2,3,4,5].map(star => (
          <Star key={star} className={`w-4 h-4 ${star <= story.rating ? 'fill-current' : 'text-muted-foreground opacity-30'}`} />
        ))}
      </div>

      <p className="text-muted-foreground mb-6 relative z-10 italic flex-grow">"{story.quote}"</p>

      {/* Transformation / Success Story Status */}
      {(story.before || story.after) && (
        <div className="mb-6 space-y-1">
          {story.before && <p className="line-through text-muted-foreground/70 text-sm font-medium">{story.before}</p>}
          {story.after && <p className="font-bold text-primary text-base">{story.after}</p>}
        </div>
      )}

      <div className="flex flex-col gap-4 mt-auto">
        <div className="flex items-center gap-3">
          <img 
            src={story.image} 
            alt={story.name} 
            className="w-10 h-10 rounded-full object-cover border"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-foreground text-sm truncate">
              {story.name}
              {story.isCurrentUser && <span className="ml-2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">You</span>}
            </h4>
            {story.qualification && (
              <p className="text-[11px] font-medium text-foreground/80 mt-0.5 truncate">{story.qualification}</p>
            )}
            <p className="text-xs text-muted-foreground capitalize">{story.role}</p>
          </div>
        </div>

        {/* Interaction Bar */}
        <div className="flex items-center gap-4 border-t pt-3">
          <button 
            onClick={() => handleLike(story.id)}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${story.hasLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Heart className={`w-4 h-4 ${story.hasLiked ? 'fill-current' : ''}`} />
            {story.likes > 0 ? story.likes : 'Like'}
          </button>
          <button 
            onClick={() => setReplyingTo(replyingTo === story.id ? null : story.id)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Reply
          </button>
        </div>

        {/* Replies Section */}
        {story.replies && story.replies.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-3 space-y-3 mt-2">
            {story.replies.map(reply => (
              <div key={reply.id} className="flex gap-2">
                <img src={reply.image} alt={reply.name} className="w-6 h-6 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground">{reply.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{reply.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply Input */}
        {replyingTo === story.id && (
          <div className="flex gap-2 items-center mt-2">
            <input 
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 bg-background border border-input rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={e => e.key === 'Enter' && handleReplySubmit(story.id)}
            />
            <button 
              onClick={() => handleReplySubmit(story.id)}
              className="bg-primary text-primary-foreground p-1.5 rounded-md hover:bg-primary/90"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section className="py-24 bg-muted/20 relative">
      <div className="container max-w-7xl mx-auto px-3 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Success Stories & Reviews</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Don't just take our word for it. Hear from students who transformed their careers through our platform.
          </p>
          
          <div className="flex items-center justify-center gap-4 bg-card w-max mx-auto px-6 py-3 rounded-full shadow-sm border border-border">
             <div className="flex gap-1 text-yellow-500">
                {[1,2,3,4,5].map(star => (
                   <Star key={star} className={`w-5 h-5 ${star <= Math.round(averageRating) && averageRating > 0 ? 'fill-current' : 'text-muted-foreground opacity-30'}`} />
                ))}
             </div>
             <div className="font-semibold text-foreground">
                {averageRating} <span className="text-muted-foreground font-normal">out of 5</span>
             </div>
             <div className="w-1.5 h-1.5 rounded-full bg-border"></div>
             <div className="text-muted-foreground">
                <span className="font-semibold text-foreground">{stories.length}</span> ratings
             </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mb-16 bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          <div 
            className="flex items-center justify-between cursor-pointer group"
            onClick={() => setIsFormOpen(!isFormOpen)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                <Star className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Write a Review</h3>
            </div>
            {isFormOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </div>
          
          <AnimatePresence>
            {isFormOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleSubmit} className="space-y-6 mt-6 border-t pt-6">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground">Rating</label>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <Star 
                          key={star} 
                          className={`w-8 h-8 cursor-pointer transition-all ${star <= newReview.rating ? 'fill-yellow-500 text-yellow-500 hover:scale-110' : 'text-muted-foreground hover:text-yellow-500/50'}`}
                          onClick={() => setNewReview({...newReview, rating: star})}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground">Your Success Story / Comment</label>
                    <textarea 
                      value={newReview.quote}
                      onChange={e => setNewReview({...newReview, quote: e.target.value})}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Share your experience..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-foreground">Before (Optional)</label>
                      <input 
                        type="text"
                        value={newReview.beforeStatus}
                        onChange={e => setNewReview({...newReview, beforeStatus: e.target.value})}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="e.g. CS Student"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-foreground">After (Optional)</label>
                      <input 
                        type="text"
                        value={newReview.afterStatus}
                        onChange={e => setNewReview({...newReview, afterStatus: e.target.value})}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="e.g. Placed at Google"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={newReview.rating === 0}
                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    Submit Review
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stories Display Section */}
        {stories.length === 0 ? (
          <div className="text-center py-12 bg-card border border-dashed rounded-2xl max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No Ratings Yet</h3>
            <p className="text-muted-foreground">Be the first to share your experience with CampusBridge!</p>
          </div>
        ) : (
          <div className="relative">
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-xl font-bold text-foreground">Recent Reviews</h3>
              <button 
                onClick={() => setShowAllModal(true)}
                className="text-sm font-medium text-primary hover:underline"
              >
                Show all ({stories.length})
              </button>
            </div>
            
            <div className="relative group">
              <button 
                onClick={scrollLeft}
                className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 z-10 bg-background border shadow-md w-10 h-10 rounded-full flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div 
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <AnimatePresence>
                  {stories.map((story) => (
                    <motion.div
                      key={story.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="snap-center h-auto"
                    >
                      <ReviewCard story={story} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <button 
                onClick={scrollRight}
                className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 z-10 bg-background border shadow-md w-10 h-10 rounded-full flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Show All Modal */}
      <AnimatePresence>
        {showAllModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowAllModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="bg-card border shadow-xl rounded-2xl w-full max-w-5xl max-h-[85vh] flex flex-col relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">All Reviews</h2>
                  <p className="text-sm text-muted-foreground mt-1">Based on {stories.length} ratings</p>
                </div>
                <button 
                  onClick={() => setShowAllModal(false)}
                  className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-muted/10">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stories.map((story) => (
                    <ReviewCard key={story.id} story={story} />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default SuccessStories
