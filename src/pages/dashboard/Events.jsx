import EventSkeleton from '../../components/skeletons/EventSkeleton'

import React, { useState, useEffect } from 'react'
import { Loader2, Calendar, Clock, MapPin, Users, X, CheckCircle2, Globe, Video, Share2, ChevronRight, Wifi, ArrowRight, Laptop, Check } from 'lucide-react'
import { format } from 'date-fns'
import { useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import API_BASE from '../../utils/api'
import { useNavigate } from 'react-router-dom'
import ShareModal from '../../components/modals/ShareModal'
import ReviewListModal from '../../components/modals/ReviewListModal'
import ReviewModal from '../../components/modals/ReviewModal'
import ModalPortal from '../../components/modals/ModalPortal'
import defaultPP from '../../assets/default_pp.png'
import { Star } from 'lucide-react'

const EventRatingBadge = ({ eventId, onClick }) => {
  const [stats, setStats] = useState({ averageRating: 0, totalRatings: 0, reviews: [] })
  
  useEffect(() => {
    fetch(`${API_BASE}/api/reviews/event/${eventId}`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {})
  }, [eventId])

  return (
    <button 
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(stats.reviews, stats.averageRating); }}
      className="flex items-center gap-1 bg-amber-400/10 text-amber-600 dark:text-amber-400 hover:bg-amber-400/20 px-2 py-1 rounded-lg transition-colors border border-amber-400/20 shrink-0"
      title="View Reviews"
    >
      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
      <span className="font-bold text-xs">{stats.averageRating ? Number(stats.averageRating).toFixed(1) : '0.0'}</span>
      <span className="text-[10px] text-muted-foreground">({stats.totalRatings || 0})</span>
    </button>
  )
}

const Events = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareConfig, setShareConfig] = useState(null)
  
  // Review List Modal State
  const [isReviewListModalOpen, setIsReviewListModalOpen] = useState(false)
  const [selectedReviews, setSelectedReviews] = useState([])
  const [selectedEventTitle, setSelectedEventTitle] = useState('')
  const [selectedEventForReview, setSelectedEventForReview] = useState(null)
  
  // Manual Review Modal State
  const [isManualReviewModalOpen, setIsManualReviewModalOpen] = useState(false)

  const handleShareEvent = (e, eventId) => {
    e.preventDefault();
    e.stopPropagation();
    setShareConfig({
      shareUrl: `${window.location.origin}/dashboard/events/${eventId}`,
      shareType: 'event',
      itemId: eventId
    });
    setIsShareModalOpen(true);
  }

  // Registration State
  const [applicantRole, setApplicantRole] = useState('student')
  const [isRegistering, setIsRegistering] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [registerFormData, setRegisterFormData] = useState({
    name: '',
    email: '',
    phone: '',
    rollNumber: ''
  })
  
  // User DB data for phone
  const [userDbData, setUserDbData] = useState(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/events?category=event`)
        if (!res.ok) throw new Error('Failed to fetch events')
        const data = await res.json()
        setEvents(data)
      } catch (err) {
        toast.error('Could not load events')
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvents()
  }, [])

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/users/${user.id}`)
          if (res.ok) {
            const data = await res.json()
            setUserDbData(data)
            if (data.role) {
              setApplicantRole(data.role.toLowerCase() === 'alumni' ? 'alumni' : 'student')
            }
          }
        } catch (err) {
          console.error(err)
        }
      }
      fetchUserData()
    }
  }, [user])

  const handleRegisterClick = (event) => {
    setSelectedEvent(event)
    setRegisterFormData({
      name: userDbData?.name || `${userDbData?.firstName || ''} ${userDbData?.lastName || ''}`.trim() || user?.fullName || '',
      email: userDbData?.email || user?.primaryEmailAddress?.emailAddress || '',
      phone: userDbData?.phone || '',
      rollNumber: userDbData?.rollNumber || ''
    })
    setShowRegisterModal(true)
  }

  const handleConfirmRegistration = async (e) => {
    e.preventDefault()
    if (!user || !selectedEvent) return
    setIsRegistering(true)
    
    try {
      const res = await fetch(`${API_BASE}/api/events/${selectedEvent._id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          applicantRole,
          applicantDetails: registerFormData
        })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to register')
      
      toast.success('Successfully registered for event!')
      
      // Update local event attendees count if not already in it
      setEvents(events.map(ev => {
        if (ev._id === selectedEvent._id) {
          const attendees = ev.attendees || [];
          if (!attendees.includes(userDbData?._id)) {
            return { ...ev, attendees: [...attendees, userDbData?._id || 'new'] }
          }
        }
        return ev
      }))
      
      setShowRegisterModal(false)
    } catch (err) {
      toast.error(err.message || 'Could not register')
    } finally {
      setIsRegistering(false)
    }
  }

  const checkIsPast = (dateStr, timeStr) => {
    if (!dateStr) return false;
    try {
      let actualTimeStr = timeStr || '';
      if (actualTimeStr.includes('-')) {
        const parts = actualTimeStr.split('-');
        actualTimeStr = parts[1].trim() || parts[0].trim();
      }
      
      let time24 = actualTimeStr;
      if (actualTimeStr && actualTimeStr.match(/AM|PM/i)) {
        const match = actualTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          let [_, hours, mins, modifier] = match;
          hours = parseInt(hours, 10);
          if (hours === 12) hours = 0;
          if (modifier.toUpperCase() === 'PM') hours += 12;
          time24 = `${hours.toString().padStart(2, '0')}:${mins}:00`;
        }
      } else if (actualTimeStr) {
        let parts = actualTimeStr.split(':');
        let hours = parts[0].padStart(2, '0');
        let mins = (parts[1] || '00').padStart(2, '0');
        time24 = `${hours}:${mins}:00`;
      } else {
        time24 = '23:59:59';
      }
      
      const sessionDate = new Date(`${dateStr.split('T')[0]}T${time24}`);
      if (isNaN(sessionDate.getTime())) return false;
      return sessionDate < new Date();
    } catch (e) {
      return false;
    }
  }

  const filteredEvents = events.filter(event => {
    const isPast = checkIsPast(event.date, event.time);
    const isActive = event.active && !isPast;
    
    if (activeTab === 'upcoming') return isActive;
    return !isActive;
  })

  // Check if current user is already registered for an event
  const isRegistered = (event) => {
    if (!userDbData || !event.attendees) return false;
    // check by mongo ObjectId if possible, or assume if we have applied. 
    // Usually we return this state from backend, but simple check:
    return event.attendees.some(id => id === userDbData._id || (typeof id === 'object' && id._id === userDbData._id));
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Events</h1>
        <p className="text-muted-foreground">Discover and register for upcoming events.</p>
      </div>

      <div className="flex items-center gap-6 border-b border-border/40">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'upcoming' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Upcoming Events
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`pb-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'past' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Past Events
        </button>
      </div>

      <div className="space-y-4 pt-2">
        {isLoading ? (
          <div className="w-full space-y-4">
            {[...Array(4)].map((_, i) => (
              <EventSkeleton key={i} />
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {filteredEvents.map(event => {
              const registered = isRegistered(event);
              const isPastEvent = checkIsPast(event.date, event.time);
              const isOffline = event.mode === 'Offline' || (event.location && !event.mode);
              const attendeesList = Array.isArray(event.attendees) ? event.attendees.filter(Boolean) : [];
              const attendeesCount = attendeesList.length;
              const displayedAttendees = attendeesList.slice(0, 3);
              const eventImg = event.imageUrl;

              return (
                <div 
                  key={event._id} 
                  className="bg-card border border-border/50 hover:border-primary/40 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden group"
                >
                  {/* Paused Admin Banner */}
                  {event.moderationStatus === 'paused' && (
                    <div className="absolute top-0 left-0 w-full bg-amber-500/10 text-amber-500 text-xs font-bold py-1.5 px-4 text-center border-b border-amber-500/20">
                      Paused by Admin: {event.moderationRemark || 'Under review'}
                    </div>
                  )}

                  {/* Left / Main info */}
                  <div className={`flex flex-col sm:flex-row sm:items-center gap-5 flex-1 min-w-0 ${event.moderationStatus === 'paused' ? 'mt-6' : ''}`}>
                    {/* Thumbnail Image */}
                    <div className="w-full sm:w-44 h-36 sm:h-32 rounded-xl overflow-hidden shrink-0 bg-primary/10 border border-border/40 relative">
                      {eventImg ? (
                        <img 
                          src={eventImg} 
                          alt={event.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary font-bold text-2xl">
                          {event.type?.charAt(0) || 'E'}
                        </div>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      {/* Badges: Type, Mode (Online/Offline), Status, Rating */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                          {event.type || 'Event'}
                        </span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          isOffline
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}>
                          {isOffline ? (
                            <><MapPin className="w-3 h-3" /> Offline</>
                          ) : (
                            <><Globe className="w-3 h-3" /> Online</>
                          )}
                        </span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          isPastEvent 
                            ? 'bg-muted text-muted-foreground' 
                            : (event.active && event.link && registered) 
                            ? 'bg-rose-500/10 text-rose-500' 
                            : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPastEvent ? 'bg-muted-foreground' : (event.active && event.link && registered) ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                          {isPastEvent ? 'Completed' : (event.active && event.link && registered) ? 'Live Now' : 'Upcoming'}
                        </span>
                        <EventRatingBadge 
                          eventId={event._id} 
                          onClick={(reviews) => {
                            setSelectedReviews(reviews);
                            setSelectedEventTitle(`Reviews for ${event.title}`);
                            setSelectedEventForReview(event);
                            setIsReviewListModalOpen(true);
                          }} 
                        />
                      </div>

                      {/* Title & Share */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {event.title}
                        </h3>
                        <button 
                          onClick={(e) => handleShareEvent(e, event._id)}
                          className="text-muted-foreground hover:text-primary transition-colors p-1 shrink-0"
                          title="Share Event"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Date, Time & Mode/Location */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2.5">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          {event.date ? format(new Date(event.date), 'MMM dd, yyyy') : 'TBD'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          {event.time || 'TBD'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          {isOffline ? (
                            <><MapPin className="w-3.5 h-3.5 text-amber-500" /> {event.location || 'Campus Location'}</>
                          ) : (
                            <><Globe className="w-3.5 h-3.5 text-blue-500" /> Virtual / Online</>
                          )}
                        </span>
                      </div>

                      {/* Attendees Avatars Stack & Count */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-muted/60 border border-border/40 px-2.5 py-1 rounded-lg">
                          {attendeesCount > 0 ? (
                            <>
                              <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                                {displayedAttendees.map((att, attIdx) => {
                                  const imgSrc = (typeof att === 'object' && att?.imageUrl) ? att.imageUrl : defaultPP;
                                  const attName = (typeof att === 'object' && (att?.name || att?.firstName)) ? (att.name || att.firstName) : 'Attendee';
                                  return (
                                    <img 
                                      key={attIdx} 
                                      src={imgSrc} 
                                      alt={attName}
                                      title={attName}
                                      onError={(e) => { e.currentTarget.src = defaultPP; }}
                                      className="inline-block w-5 h-5 rounded-full ring-2 ring-card object-cover shrink-0" 
                                    />
                                  );
                                })}
                              </div>
                              <span className="text-xs font-semibold text-muted-foreground">
                                {attendeesCount > 3 ? `+${attendeesCount - 3} attending` : `${attendeesCount} attending`}
                              </span>
                            </>
                          ) : (
                            <>
                              <Users className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs font-semibold text-muted-foreground">0 attending</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Action Buttons */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/40">
                    {registered ? (
                      event.link && !isPastEvent ? (
                        <a
                          href={event.link.startsWith('http') ? event.link : `https://${event.link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md hover:shadow-purple-500/25 hover:opacity-95 transition-all shrink-0"
                        >
                          <Video className="w-3.5 h-3.5" /> Join Event
                        </a>
                      ) : (
                        <span className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold inline-flex items-center gap-1.5 border border-emerald-500/20 shrink-0">
                          <Check className="w-3.5 h-3.5" /> Enrolled
                        </span>
                      )
                    ) : (
                      event.active && !isPastEvent ? (
                        <button
                          onClick={() => handleRegisterClick(event)}
                          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm active:scale-95 shrink-0"
                        >
                          Register
                        </button>
                      ) : (
                        <span className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold shrink-0">
                          Closed
                        </span>
                      )
                    )}

                    {/* Additional Registered Actions: Calendar & Experience */}
                    {registered && event.date && !isPastEvent && (
                      <a 
                        href={`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(event.title)}&dates=${format(new Date(event.date), 'yyyyMMdd')}/${format(new Date(event.date), 'yyyyMMdd')}&details=${encodeURIComponent(`CampusBridge Event: ${event.title}\nTime: ${event.time || 'TBD'}\nLink: ${event.link || ''}`)}&location=${encodeURIComponent(event.location || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg"
                      >
                        <Calendar className="w-3 h-3" /> Add to Calendar
                      </a>
                    )}
                    {registered && isPastEvent && (
                      <button
                        onClick={() => {
                          const role = user?.publicMetadata?.role || 'student';
                          navigate(['mentor', 'alumni'].includes(role.toLowerCase()) ? '/mentor-dashboard' : '/dashboard', { state: { shareEvent: event } });
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 hover:text-amber-400 transition-colors bg-amber-500/10 px-2.5 py-1 rounded-lg"
                      >
                        <Share2 className="w-3 h-3" /> Share Experience
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground bg-card border border-border/50 rounded-2xl">
            {activeTab === 'upcoming' ? 'No upcoming events.' : 'No past events to show.'}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showRegisterModal && selectedEvent && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border/50 rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
            >
              <button
                onClick={() => setShowRegisterModal(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-2">Register for Event</h2>
                <p className="text-sm text-muted-foreground mb-6 line-clamp-1">{selectedEvent.title}</p>
                
                <form onSubmit={handleConfirmRegistration} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <input
                      type="text"
                      required
                      value={registerFormData.name}
                      onChange={(e) => setRegisterFormData({ ...registerFormData, name: e.target.value })}
                      className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Email Address</label>
                    <input
                      type="email"
                      value={registerFormData.email}
                      readOnly
                      className="w-full bg-muted border border-border/50 rounded-xl px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground/70">Email cannot be changed.</p>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Phone Number</label>
                    <input
                      type="tel"
                      value={registerFormData.phone}
                      readOnly
                      className="w-full bg-muted border border-border/50 rounded-xl px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground/70">Phone number cannot be changed.</p>
                  </div>
                  
                  {applicantRole === 'student' && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Roll Number (Optional)</label>
                      <input
                        type="text"
                        value={registerFormData.rollNumber}
                        onChange={(e) => setRegisterFormData({ ...registerFormData, rollNumber: e.target.value })}
                        className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                        placeholder="Enter your roll number"
                      />
                    </div>
                  )}
                  
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowRegisterModal(false)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-border/50 font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isRegistering}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center disabled:opacity-70"
                    >
                      {isRegistering ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={shareConfig?.shareUrl}
        shareType={shareConfig?.shareType || 'event'}
        itemId={shareConfig?.itemId}
        title="Share this event!"
      />
      <ReviewListModal
        isOpen={isReviewListModalOpen}
        onClose={() => setIsReviewListModalOpen(false)}
        reviews={selectedReviews}
        title={selectedEventTitle}
        type="event"
        mentorId={selectedEventForReview?.organizer?._id || selectedEventForReview?.organizer}
        onAddReview={selectedEventForReview && isRegistered(selectedEventForReview) ? () => {
          setIsReviewListModalOpen(false);
          setIsManualReviewModalOpen(true);
        } : undefined}
      />
      <ReviewModal 
        isOpen={isManualReviewModalOpen}
        onClose={() => setIsManualReviewModalOpen(false)}
        pendingReview={selectedEventForReview ? {
          type: 'event',
          referenceId: selectedEventForReview._id,
          title: selectedEventForReview.title,
          mentor: selectedEventForReview.organizer
        } : null}
        onReviewSubmitted={(referenceId) => {
           setIsManualReviewModalOpen(false);
           toast.success("Review added!");
        }}
      />
    </div>
  )
}

export default Events
