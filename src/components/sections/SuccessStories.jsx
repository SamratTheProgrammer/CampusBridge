import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Quote, Send, Heart, MessageSquare, ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import API_BASE from '../../utils/api'

const LEGACY_STORAGE_KEY = 'campusbridge_platform_reviews'
const STORAGE_KEY = 'campusbridge_platform_reviews_v2'

const suggestedComments = [
  "CampusBridge connected me with an amazing mentor who helped me land my dream offer!",
  "The 1-on-1 mock interviews and resume reviews were game changers for my placement.",
  "Incredible platform! I gained practical career guidance that college courses never covered.",
  "The mentorship sessions gave me the exact roadmap I needed to transition into tech.",
  "Found supportive alumni mentors who truly care about student growth. Highly recommend!"
]

const staticNames = new Set(['Michael Chang', 'Jessica Taylor', 'Ahmad Rahman'])

const getVisitorId = () => {
  let id = localStorage.getItem('campusbridge_visitor_id')
  if (!id) {
    id = 'visitor_' + Math.random().toString(36).substring(2, 9)
    localStorage.setItem('campusbridge_visitor_id', id)
  }
  return id
}

const getInitialStories = () => {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Array.isArray(parsed)) {
        return parsed.filter(s => 
          !s.isSeed && 
          !String(s.id || s._id).startsWith('seed-') &&
          !staticNames.has(s.name)
        )
      }
    }
  } catch (e) {
    console.error('Error reading cached stories:', e)
  }
  return []
}

const SuccessStories = () => {
  const { user, isSignedIn } = useUser()
  const [dbUser, setDbUser] = useState(null)
  const [stories, setStories] = useState(getInitialStories)
  const [newReview, setNewReview] = useState({
    quote: '',
    rating: 0,
    beforeStatus: '',
    afterStatus: ''
  })
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [showAllModal, setShowAllModal] = useState(false)
  const scrollRef = useRef(null)
  
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch DB User if logged in
  useEffect(() => {
    const fetchUser = async () => {
      if (user) {
        try {
          const res = await fetch(`${API_BASE}/api/users/${user.id}`)
          if (res.ok) {
            const data = await res.json()
            setDbUser(data)
          }
        } catch (error) {
          console.error('Error fetching DB user:', error)
        }
      }
    }
    fetchUser()
  }, [user])

  // Sync real dynamic reviews directly from backend MongoDB database on mount
  useEffect(() => {
    // Purge old legacy cache completely from user's browser
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY)
    } catch (e) {}

    const fetchPlatformReviews = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/reviews/platform`)
        if (res.ok) {
          const serverStories = await res.json()
          if (Array.isArray(serverStories)) {
            // Keep only real dynamic reviews from DB, never static reviews
            const realStories = serverStories.filter(s => 
              !s.isSeed && 
              !String(s.id || s._id).startsWith('seed-') &&
              !staticNames.has(s.name)
            )
            setStories(realStories)
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(realStories))
            } catch (e) {
              console.error('Error caching stories:', e)
            }
          }
        }
      } catch (err) {
        console.warn('Backend offline or unreachable, using local storage cache for reviews')
      }
    }
    fetchPlatformReviews()
  }, [])

  const averageRating = stories.length > 0 
    ? (stories.reduce((acc, story) => acc + (Number(story.rating) || 0), 0) / stories.length).toFixed(1)
    : '0.0'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newReview.quote.trim() || newReview.rating === 0) {
      toast.error('Please provide both a star rating and your review quote.')
      return
    }
    
    setIsSubmitting(true)
    const newStoryId = 'rev_' + Date.now()
    const authorName = isSignedIn && user ? (user.fullName || user.firstName || 'Student') : 'Anonymous Member'
    const authorRole = isSignedIn && (dbUser || user) ? (dbUser?.role || user?.publicMetadata?.role || 'Student') : 'Student'
    const authorQual = isSignedIn && (dbUser || user) ? (dbUser?.education?.[0]?.degree || dbUser?.headline || user?.publicMetadata?.qualification || user?.publicMetadata?.degree || '') : ''
    const authorImg = isSignedIn && user ? user.imageUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random`

    const newStory = {
      id: newStoryId,
      _id: newStoryId,
      name: authorName,
      role: authorRole,
      qualification: authorQual,
      before: newReview.beforeStatus.trim(),
      after: newReview.afterStatus.trim(),
      image: authorImg,
      quote: newReview.quote.trim(),
      rating: Number(newReview.rating),
      likes: [],
      replies: [],
      userClerkId: user?.id || null,
      isCurrentUser: true
    }

    // 1. Instantly update React state and LocalStorage so it never vanishes on refresh
    const updated = [newStory, ...stories]
    setStories(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (err) {
      console.error('Failed to save in localStorage', err)
    }

    setNewReview({ quote: '', rating: 0, beforeStatus: '', afterStatus: '' })
    setIsFormOpen(false)
    toast.success('Thank you! Your review has been published.')

    // 2. Persist directly to MongoDB backend
    try {
      const res = await fetch(`${API_BASE}/api/reviews/platform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStory.name,
          role: newStory.role,
          qualification: newStory.qualification,
          before: newStory.before,
          after: newStory.after,
          image: newStory.image,
          quote: newStory.quote,
          rating: newStory.rating,
          userClerkId: user?.id || null
        })
      })
      if (res.ok) {
        const saved = await res.json()
        if (saved && saved._id) {
          setStories(prev => {
            const remapped = prev.map(s => (s.id === newStoryId || s._id === newStoryId) ? { ...saved, id: saved._id, isCurrentUser: true } : s)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remapped))
            return remapped
          })
        }
      }
    } catch (error) {
      console.error('Error saving review to backend:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLike = async (storyId) => {
    const userIdentifier = user?.id || getVisitorId()

    setStories(prev => {
      const updated = prev.map(s => {
        const currentId = s._id || s.id
        if (currentId === storyId) {
          const likesList = Array.isArray(s.likes) ? [...s.likes] : []
          const alreadyLiked = s.hasLiked || likesList.includes(userIdentifier)
          
          let newLikes = []
          if (alreadyLiked) {
            newLikes = likesList.filter(id => id !== userIdentifier)
          } else {
            newLikes = [...likesList, userIdentifier]
          }

          return {
            ...s,
            likes: newLikes,
            hasLiked: !alreadyLiked
          }
        }
        return s
      })
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (err) {}
      return updated
    })

    // Sync like with backend
    try {
      await fetch(`${API_BASE}/api/reviews/platform/${storyId}/like`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: userIdentifier })
      })
    } catch (err) {
      console.error('Error syncing like to backend:', err)
    }
  }

  const handleReplySubmit = async (storyId) => {
    if (!replyText.trim()) return

    const replyAuthor = isSignedIn && user ? (user.fullName || user.firstName || 'You') : 'Community Member'
    const replyImg = isSignedIn && user ? user.imageUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(replyAuthor)}&background=random`
    const submittedText = replyText.trim()

    const newReplyItem = {
      id: 'rep_' + Date.now(),
      name: replyAuthor,
      image: replyImg,
      text: submittedText,
      createdAt: new Date().toISOString()
    }

    setStories(prev => {
      const updated = prev.map(s => {
        const currentId = s._id || s.id
        if (currentId === storyId) {
          return {
            ...s,
            replies: [...(s.replies || []), newReplyItem]
          }
        }
        return s
      })
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (err) {}
      return updated
    })

    setReplyingTo(null)
    setReplyText('')
    toast.success('Reply added!')

    // Sync reply with backend
    try {
      await fetch(`${API_BASE}/api/reviews/platform/${storyId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: replyAuthor,
          image: replyImg,
          text: submittedText
        })
      })
    } catch (err) {
      console.error('Error syncing reply to backend:', err)
    }
  }

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -400, behavior: 'smooth' })
  }
  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 400, behavior: 'smooth' })
  }

  const ReviewCard = ({ story }) => {
    const storyKey = story._id || story.id
    const userIdentifier = user?.id || getVisitorId()
    const likesCount = Array.isArray(story.likes) 
      ? story.likes.length 
      : (typeof story.likes === 'number' ? story.likes : 0)
    const isLiked = story.hasLiked || (Array.isArray(story.likes) && story.likes.includes(userIdentifier))
    const isCurrentReviewer = story.isCurrentUser || (user && story.userClerkId === user.id)

    return (
      <div className="bg-card border rounded-2xl p-6 relative flex flex-col min-w-[320px] max-w-[400px] flex-shrink-0 h-full shadow-sm hover:shadow-md transition-shadow">
        <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/10" />
        
        <div className="flex items-center gap-1 text-yellow-500 mb-4">
          {[1,2,3,4,5].map(star => (
            <Star 
              key={star} 
              className={`w-4 h-4 ${star <= (story.rating || 5) ? 'fill-current' : 'text-muted-foreground opacity-30'}`} 
            />
          ))}
        </div>

        {/* Scrollable comment text area for long comments */}
        <div 
          className="max-h-36 min-h-[64px] overflow-y-auto pr-2 mb-6 relative z-10 flex-grow"
          style={{ scrollbarWidth: 'thin' }}
        >
          <p className="text-muted-foreground italic text-sm leading-relaxed break-words whitespace-pre-line">
            "{story.quote}"
          </p>
        </div>

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
              src={story.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(story.name || 'Student')}&background=random`} 
              alt={story.name} 
              className="w-10 h-10 rounded-full object-cover border"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-foreground text-sm truncate flex items-center gap-2">
                <span className="truncate">{story.name}</span>
                {isCurrentReviewer && (
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0 font-medium">You</span>
                )}
              </h4>
              {story.qualification && (
                <p className="text-[11px] font-medium text-foreground/80 mt-0.5 truncate">{story.qualification}</p>
              )}
              <p className="text-xs text-muted-foreground capitalize truncate">{story.role || 'Student'}</p>
            </div>
          </div>

          {/* Interaction Bar */}
          <div className="flex items-center gap-4 border-t pt-3">
            <button 
              onClick={() => handleLike(storyKey)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />
              {likesCount > 0 ? likesCount : 'Like'}
            </button>
            <button 
              onClick={() => setReplyingTo(replyingTo === storyKey ? null : storyKey)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Reply {story.replies && story.replies.length > 0 ? `(${story.replies.length})` : ''}
            </button>
          </div>

          {/* Replies Section */}
          {story.replies && story.replies.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-3 mt-2">
              {story.replies.map(reply => (
                <div key={reply.id || reply._id} className="flex gap-2">
                  <img 
                    src={reply.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.name || 'User')}&background=random`} 
                    alt={reply.name} 
                    className="w-6 h-6 rounded-full object-cover shrink-0" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{reply.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 break-words">{reply.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply Input */}
          {replyingTo === storyKey && (
            <div className="flex gap-2 items-center mt-2">
              <input 
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 bg-background border border-input rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={e => e.key === 'Enter' && handleReplySubmit(storyKey)}
                autoFocus
              />
              <button 
                onClick={() => handleReplySubmit(storyKey)}
                className="bg-primary text-primary-foreground p-1.5 rounded-md hover:bg-primary/90 transition-colors"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <section className="py-24 bg-muted/20 relative">
      <div className="container max-w-7xl mx-auto px-3 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Success Stories & Reviews</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Hear genuine experiences from students and mentors who transformed their careers through our platform.
          </p>
          
          <div className="flex items-center justify-center gap-4 bg-card w-max mx-auto px-6 py-3 rounded-full shadow-sm border border-border">
             <div className="flex gap-1 text-yellow-500">
                {[1,2,3,4,5].map(star => (
                   <Star key={star} className={`w-5 h-5 ${star <= Math.round(Number(averageRating)) && Number(averageRating) > 0 ? 'fill-current' : 'text-muted-foreground opacity-30'}`} />
                ))}
             </div>
             <div className="font-semibold text-foreground">
                {averageRating} <span className="text-muted-foreground font-normal">out of 5</span>
             </div>
             <div className="w-1.5 h-1.5 rounded-full bg-border"></div>
             <div className="text-muted-foreground">
                <span className="font-semibold text-foreground">{stories.length}</span> {stories.length === 1 ? 'rating' : 'ratings'}
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

                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-foreground">Your Success Story / Comment</label>
                      <span className="text-[11px] text-muted-foreground">{newReview.quote.length} chars</span>
                    </div>
                    
                    <div className="relative w-full rounded-xl overflow-hidden">
                      <textarea 
                        value={newReview.quote}
                        onChange={e => setNewReview({...newReview, quote: e.target.value})}
                        className="box-border w-full max-w-full rounded-xl border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-y min-h-[110px] max-h-[220px] block shadow-sm"
                        placeholder="Share your experience..."
                        required
                      />
                    </div>

                    {/* Suggested Comments */}
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        Suggested comments (click to auto-fill):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestedComments.map((comment, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setNewReview(prev => ({ 
                              ...prev, 
                              quote: comment, 
                              rating: prev.rating === 0 ? 5 : prev.rating 
                            }))}
                            className="text-[11px] bg-muted/60 hover:bg-primary/10 hover:text-primary text-foreground/80 border border-border/70 hover:border-primary/40 px-2.5 py-1 rounded-full text-left transition-all cursor-pointer truncate max-w-full"
                            title={comment}
                          >
                            "{comment.length > 50 ? comment.substring(0, 48) + '...' : comment}"
                          </button>
                        ))}
                      </div>
                    </div>
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
                    disabled={newReview.rating === 0 || isSubmitting}
                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
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
                className="text-sm font-medium text-primary hover:underline cursor-pointer"
              >
                Show all ({stories.length})
              </button>
            </div>
            
            <div className="relative group">
              <button 
                onClick={scrollLeft}
                className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 z-10 bg-background border shadow-md w-10 h-10 rounded-full flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted cursor-pointer"
                aria-label="Previous Reviews"
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
                      key={story._id || story.id}
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
                className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 z-10 bg-background border shadow-md w-10 h-10 rounded-full flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted cursor-pointer"
                aria-label="Next Reviews"
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
                  className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-muted/10">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stories.map((story) => (
                    <ReviewCard key={story._id || story.id} story={story} />
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
