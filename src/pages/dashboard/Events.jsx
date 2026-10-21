import EventSkeleton from '../../components/skeletons/EventSkeleton'
import React, { useState, useEffect } from 'react'
import { 
  Loader2, Calendar, Clock, MapPin, Users, X, CheckCircle2, Globe, Video, 
  Share2, ChevronRight, Wifi, ArrowRight, Laptop, Check, Star, AlertCircle, 
  CalendarCheck, MessageSquare, Mail, ExternalLink, Info, Search, Filter
} from 'lucide-react'
import { format } from 'date-fns'
import { useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import emailjs from '@emailjs/browser'
import API_BASE from '../../utils/api'
import { getAppUrl } from '../../utils/appUrl'
import { useNavigate, useLocation } from 'react-router-dom'
import ShareModal from '../../components/modals/ShareModal'
import ReviewListModal from '../../components/modals/ReviewListModal'
import ReviewModal from '../../components/modals/ReviewModal'
import ModalPortal from '../../components/modals/ModalPortal'
import defaultPP from '../../assets/default_pp.png'
import NewRibbon from '../../components/common/NewRibbon'
import EventFallbackBanner from '../../components/common/EventFallbackBanner'

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
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'active' | 'registered' | 'expired' | 'past'
  const [searchQuery, setSearchQuery] = useState('')
  const [eventType, setEventType] = useState('All')
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

  // Event Details Modal State
  const [selectedEventForDetails, setSelectedEventForDetails] = useState(null)

  const handleShareEvent = (e, eventId) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShareConfig({
      shareUrl: getAppUrl(`/dashboard/events/${eventId}`),
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

  // Auto-open registration modal when navigated from landing page with registerEventId
  useEffect(() => {
    if (location.state?.registerEventId && events.length > 0) {
      const targetEvent = events.find(e => e._id === location.state.registerEventId);
      if (targetEvent) {
        handleRegisterClick(targetEvent);
        window.history.replaceState({}, document.title);
      }
    }
  }, [events, location.state, userDbData]);

  const handleNavigateToProfile = (e, organizer) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!organizer) return;
    const identifier = organizer.username || organizer.clerkId || organizer._id;
    if (identifier) {
      navigate(`/profile/${identifier}`);
    }
  }

  const handleContactHostMail = (e, organizer, eventTitle) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!organizer) {
      toast.error('Host contact information is unavailable');
      return;
    }
    const hostEmail = organizer.email;
    if (hostEmail) {
      const subject = encodeURIComponent(`Inquiry regarding event: ${eventTitle || 'CampusBridge Event'}`);
      const body = encodeURIComponent(`Hi ${organizer.name || organizer.firstName || 'Host'},\n\nI have a question or issue regarding "${eventTitle || 'this event'}".\n\nBest regards,\n${user?.fullName || ''}`);
      window.location.href = `mailto:${hostEmail}?subject=${subject}&body=${body}`;
    } else {
      toast.error("Host's email is not available");
    }
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
          applicantDetails: registerFormData,
          clientHandledEmail: true
        })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to register')
      
      // Send event confirmation email via EmailJS
      try {
        const attendeeEmail = registerFormData.email || user.primaryEmailAddress?.emailAddress;
        const attendeeName = registerFormData.name || user.fullName || user.firstName || 'Participant';
        const eventDate = selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString() : '';

        const templateParams = {
          to_email: attendeeEmail,
          user_email: attendeeEmail,
          email: attendeeEmail,
          recipient: attendeeEmail,
          to_name: attendeeName,
          name: attendeeName,
          user_name: attendeeName,
          applicant_name: attendeeName,
          event_name: selectedEvent.title,
          event_title: selectedEvent.title,
          title: selectedEvent.title,
          event_date: eventDate,
          date: eventDate,
          event_time: selectedEvent.time || '',
          time: selectedEvent.time || '',
          event_location: selectedEvent.location || selectedEvent.type || 'Online',
          location: selectedEvent.location || selectedEvent.type || 'Online',
          event_link: selectedEvent.link || '',
          link: selectedEvent.link || '',
          phone: registerFormData.phone || '',
          roll_number: registerFormData.rollNumber || '',
          from_name: 'CampusBridge',
          message: `You have successfully registered for ${selectedEvent.title}.`
        };

        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_a3vg38b',
          import.meta.env.VITE_EMAILJS_EVENT_TEMPLATE_ID || 'template_wlyvsuf',
          templateParams,
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'JAA5yhiRssyoyqKqW'
        );
        toast.success('Successfully registered! Confirmation email sent.');
      } catch (emailErr) {
        console.error('EmailJS Event Error:', emailErr);
        toast.success('Successfully registered for event!');
      }
      
      // Update local event attendees list
      setEvents(prev => prev.map(ev => {
        if (ev._id === selectedEvent._id) {
          const attendees = ev.attendees || [];
          const currentId = userDbData?._id || user.id;
          if (!attendees.some(att => (typeof att === 'object' ? att?._id === currentId : att === currentId))) {
            return { ...ev, attendees: [...attendees, { _id: currentId, clerkId: user.id, name: registerFormData.name }] }
          }
        }
        return ev
      }))

      if (selectedEventForDetails && selectedEventForDetails._id === selectedEvent._id) {
        setSelectedEventForDetails(prev => ({
          ...prev,
          attendees: [...(prev.attendees || []), { _id: userDbData?._id || user.id, clerkId: user.id, name: registerFormData.name }]
        }))
      }
      
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

  // Check if registration deadline has passed
  const isRegistrationExpired = (event) => {
    if (!event) return false;
    const targetDate = event.lastRegDate || event.date;
    if (!targetDate) return false;
    const deadline = new Date(targetDate);
    deadline.setHours(23, 59, 59, 999);
    return deadline < new Date();
  }

  // Check if current user is registered for an event
  const isRegistered = (event) => {
    if (!event || !event.attendees) return false;
    const currentMongoId = userDbData?._id ? userDbData._id.toString() : null;
    const currentClerkId = user?.id;
    return event.attendees.some(att => {
      if (!att) return false;
      if (typeof att === 'string') {
        return (currentMongoId && att === currentMongoId) || (currentClerkId && att === currentClerkId);
      }
      return (currentMongoId && att._id && att._id.toString() === currentMongoId) || 
             (currentClerkId && att.clerkId && att.clerkId === currentClerkId);
    });
  }

  // Tab categorization
  const isPast = (ev) => checkIsPast(ev.date, ev.time);

  const upcomingEvents = events.filter(ev => !isPast(ev));
  const pastEvents = events.filter(ev => isPast(ev));
  const activeEvents = events.filter(ev => !isPast(ev) && !isRegistrationExpired(ev) && ev.active !== false);
  const expiredEvents = events.filter(ev => !isPast(ev) && isRegistrationExpired(ev));
  const registeredEvents = events.filter(ev => isRegistered(ev));

  let currentTabList = [];
  if (activeTab === 'all') {
    currentTabList = upcomingEvents;
  } else if (activeTab === 'active') {
    currentTabList = activeEvents;
  } else if (activeTab === 'registered') {
    currentTabList = registeredEvents;
  } else if (activeTab === 'expired') {
    currentTabList = expiredEvents;
  } else if (activeTab === 'past') {
    currentTabList = pastEvents;
  }

  const availableEventTypes = Array.from(new Set([
    'All',
    'Hackathon',
    'Workshop',
    'Masterclass',
    'Career Fair',
    'Tech Talk',
    'Webinar',
    'Networking',
    'AMA Session',
    'Group Mentorship',
    'Seminar',
    'Competition',
    ...events.map(e => e.type).filter(Boolean)
  ]));

  const filteredEvents = currentTabList.filter(event => {
    // Filter by Event Type
    if (eventType !== 'All') {
      if ((event.type || '').toLowerCase() !== eventType.toLowerCase()) {
        return false;
      }
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = event.title?.toLowerCase().includes(q);
    const typeMatch = event.type?.toLowerCase().includes(q);
    const locationMatch = event.location?.toLowerCase().includes(q);
    const hostMatch = (event.organizer?.name || event.organizer?.firstName || '')?.toLowerCase().includes(q);
    return titleMatch || typeMatch || locationMatch || hostMatch;
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-8">
      {/* Header, Search & Type Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Events</h1>
          <p className="text-muted-foreground text-sm">Discover, register, and connect with event organizers.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search events, host, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-card border border-border/50 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Event Type Filter Dropdown */}
          <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-3.5 py-2 shrink-0">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-medium text-foreground focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-card text-foreground">All Types</option>
              {availableEventTypes.filter(t => t !== 'All').map(type => (
                <option key={type} value={type} className="bg-card text-foreground">
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-border/40 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          All
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'all' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {upcomingEvents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'active' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Active
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'active' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
            {activeEvents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('registered')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'registered' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Registered
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'registered' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-muted text-muted-foreground'}`}>
            {registeredEvents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('expired')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'expired' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Expired
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'expired' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-muted text-muted-foreground'}`}>
            {expiredEvents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'past' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Past Events
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'past' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {pastEvents.length}
          </span>
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-4 pt-1">
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
              const isExpired = isRegistrationExpired(event);
              const isOffline = event.mode === 'Offline' || (event.location && !event.mode);
              const attendeesList = Array.isArray(event.attendees) ? event.attendees.filter(Boolean) : [];
              const attendeesCount = attendeesList.length;
              const displayedAttendees = attendeesList.slice(0, 3);
              const eventImg = event.imageUrl;

              return (
                <div 
                  key={event._id} 
                  onClick={() => setSelectedEventForDetails(event)}
                  className="bg-card border border-border dark:border-white/10 hover:border-primary/40 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-stretch justify-between gap-5 relative overflow-hidden group cursor-pointer"
                >
                  <NewRibbon createdAt={event.createdAt} id={event._id} />
                  
                  {/* Paused Admin Banner */}
                  {event.moderationStatus === 'paused' && (
                    <div className="absolute top-0 left-0 w-full bg-amber-500/10 text-amber-500 text-xs font-bold py-1.5 px-4 text-center border-b border-amber-500/20 z-10">
                      Paused by Admin: {event.moderationRemark || 'Under review'}
                    </div>
                  )}

                  {/* Left / Main Content Container */}
                  <div className={`flex flex-col sm:flex-row gap-5 flex-1 min-w-0 ${event.moderationStatus === 'paused' ? 'mt-6' : ''}`}>
                    {/* Thumbnail Image */}
                    <div className="w-full sm:w-60 md:w-64 h-48 sm:h-auto min-h-[160px] rounded-xl overflow-hidden shrink-0 bg-primary/10 border border-border dark:border-white/10 relative">
                      {eventImg ? (
                        <img 
                          src={eventImg} 
                          alt={event.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <EventFallbackBanner type={event.type} title={event.title} />
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        {/* Badges: Type, Mode, Status, Rating */}
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
                              : isExpired
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isPastEvent 
                                ? 'bg-muted-foreground' 
                                : (event.active && event.link && registered) 
                                ? 'bg-rose-500 animate-pulse' 
                                : isExpired
                                ? 'bg-rose-500'
                                : 'bg-emerald-500'
                            }`} />
                            {isPastEvent 
                              ? 'Completed' 
                              : (event.active && event.link && registered) 
                              ? 'Live Now' 
                              : isExpired
                              ? 'Registration Closed'
                              : 'Upcoming'}
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

                        {/* Description Preview */}
                        {event.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5 leading-relaxed">
                            {event.description.length > 90 
                              ? `${event.description.slice(0, 90).trim()}...` 
                              : event.description}
                          </p>
                        )}

                        {/* Schedule & Location */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-3">
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

                          {/* Last Registration Date */}
                          <span className={`flex items-center gap-1.5 font-medium ${isExpired ? 'text-rose-500 dark:text-rose-400' : 'text-muted-foreground'}`}>
                            <CalendarCheck className={`w-3.5 h-3.5 ${isExpired ? 'text-rose-500' : 'text-primary'}`} />
                            <span>Last Reg: {event.lastRegDate ? format(new Date(event.lastRegDate), 'MMM dd, yyyy') : (event.date ? format(new Date(event.date), 'MMM dd, yyyy') : 'TBD')}</span>
                            {isExpired && (
                              <span className="bg-rose-500/10 text-rose-500 text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                                Expired
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Attendees & Click for details hint */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-muted/60 border border-border dark:border-white/10 px-2.5 py-1 rounded-lg">
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

                      {/* Organizer / Event Host Section */}
                      {event.organizer && (
                        <div 
                          onClick={(e) => e.stopPropagation()} 
                          className="mt-3 pt-2.5 border-t border-border dark:border-white/10 flex items-center justify-between gap-3"
                        >
                          <div 
                            onClick={(e) => handleNavigateToProfile(e, event.organizer)}
                            className="flex items-center gap-2.5 min-w-0 cursor-pointer group/host hover:opacity-90 transition-opacity"
                            title="View Host Profile"
                          >
                            <img
                              src={event.organizer.imageUrl || defaultPP}
                              alt={event.organizer.name || 'Host'}
                              onError={(e) => { e.currentTarget.src = defaultPP; }}
                              className="w-7 h-7 rounded-full object-cover ring-1 ring-border group-hover/host:ring-primary/60 shrink-0 transition-all"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-foreground group-hover/host:text-primary group-hover/host:underline truncate transition-colors">
                                  {event.organizer.name || `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim() || 'Campus Host'}
                                </span>
                                <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary shrink-0">
                                  Host
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {event.organizer.headline || event.organizer.company || event.organizer.role || 'Event Organizer'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Action Buttons */}
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-border dark:border-white/15 sm:pl-4"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedEventForDetails(event)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted border border-border dark:border-white/15 transition-colors hidden sm:inline-flex items-center gap-1"
                    >
                      <Info className="w-3.5 h-3.5" /> View Details
                    </button>

                    {registered ? (
                      event.link && !isPastEvent ? (
                        <a
                          href={event.link.startsWith('http') ? event.link : `https://${event.link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 min-w-[106px] rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-md hover:shadow-purple-500/25 hover:opacity-95 transition-all shrink-0 text-center"
                        >
                          <Video className="w-3.5 h-3.5" /> Join Event
                        </a>
                      ) : (
                        <span className="px-4 py-2 min-w-[106px] rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold inline-flex items-center justify-center gap-1.5 border border-emerald-500/20 shrink-0 text-center">
                          <Check className="w-3.5 h-3.5" /> Enrolled
                        </span>
                      )
                    ) : (
                      isPastEvent ? (
                        <span className="px-4 py-2 min-w-[106px] rounded-xl bg-muted text-muted-foreground text-xs font-semibold shrink-0 text-center">
                          Closed
                        </span>
                      ) : isExpired ? (
                        <button
                          disabled
                          className="px-3 py-2 min-w-[106px] rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 text-[11px] font-bold cursor-not-allowed shrink-0 text-center"
                          title="Registration deadline has expired"
                        >
                          Registration Expired
                        </button>
                      ) : event.active ? (
                        <button
                          onClick={() => handleRegisterClick(event)}
                          className="px-5 py-2 min-w-[106px] rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm active:scale-95 shrink-0 text-center"
                        >
                          Register
                        </button>
                      ) : (
                        <span className="px-4 py-2 min-w-[106px] rounded-xl bg-muted text-muted-foreground text-xs font-semibold shrink-0 text-center">
                          Unavailable
                        </span>
                      )
                    )}

                    {/* Additional Registered Actions */}
                    {registered && event.date && !isPastEvent && (
                      <a 
                        href={`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(event.title)}&dates=${format(new Date(event.date), 'yyyyMMdd')}/${format(new Date(event.date), 'yyyyMMdd')}&details=${encodeURIComponent(`CampusBridge Event: ${event.title}\nTime: ${event.time || 'TBD'}\nLink: ${event.link || ''}`)}&location=${encodeURIComponent(event.location || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg shrink-0"
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
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 hover:text-amber-400 transition-colors bg-amber-500/10 px-2.5 py-1 rounded-lg shrink-0"
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
          <div className="py-14 text-center text-muted-foreground bg-card border border-border/50 rounded-2xl flex flex-col items-center justify-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">
              {activeTab === 'all' && 'No upcoming events found.'}
              {activeTab === 'active' && 'No active events currently open for registration.'}
              {activeTab === 'registered' && "You haven't registered for any events yet."}
              {activeTab === 'expired' && 'No expired events found.'}
              {activeTab === 'past' && 'No past events to show.'}
            </p>
            {activeTab !== 'all' && (
              <button
                onClick={() => setActiveTab('all')}
                className="text-xs text-primary hover:underline font-semibold"
              >
                Browse all upcoming events
              </button>
            )}
          </div>
        )}
      </div>

      {/* EVENT DETAILS MODAL */}
      <AnimatePresence>
        {selectedEventForDetails && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
              onClick={() => setSelectedEventForDetails(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border/50 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
              >
                {/* Banner Header */}
                <div className="relative w-full h-52 sm:h-64 bg-primary/10 overflow-hidden shrink-0">
                  {selectedEventForDetails.imageUrl ? (
                    <img 
                      src={selectedEventForDetails.imageUrl} 
                      alt={selectedEventForDetails.title} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <EventFallbackBanner type={selectedEventForDetails.type} title={selectedEventForDetails.title} />
                  )}

                  {/* Close button */}
                  <button
                    onClick={() => setSelectedEventForDetails(null)}
                    className="absolute top-4 right-4 p-2 text-foreground bg-black/60 hover:bg-black/80 rounded-full transition-colors z-20"
                    title="Close Details"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>

                  {/* Floating Badges */}
                  <div className="absolute bottom-3 left-4 flex items-center gap-2 flex-wrap z-10">
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/20">
                      {selectedEventForDetails.type || 'Event'}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1">
                      {selectedEventForDetails.mode === 'Offline' ? <><MapPin className="w-3 h-3 text-amber-400" /> Offline</> : <><Globe className="w-3 h-3 text-blue-400" /> Online</>}
                    </span>
                    {isRegistrationExpired(selectedEventForDetails) && !checkIsPast(selectedEventForDetails.date, selectedEventForDetails.time) && (
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-rose-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-rose-400/40">
                        Registration Expired
                      </span>
                    )}
                  </div>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
                  {/* Title & Ratings */}
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                        {selectedEventForDetails.title}
                      </h2>
                      <EventRatingBadge 
                        eventId={selectedEventForDetails._id} 
                        onClick={(reviews) => {
                          setSelectedReviews(reviews);
                          setSelectedEventTitle(`Reviews for ${selectedEventForDetails.title}`);
                          setSelectedEventForReview(selectedEventForDetails);
                          setIsReviewListModalOpen(true);
                        }} 
                      />
                    </div>
                  </div>

                  {/* Host / Organizer Card */}
                  {selectedEventForDetails.organizer && (
                    <div className="bg-muted/40 border border-border/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div 
                        onClick={(e) => handleNavigateToProfile(e, selectedEventForDetails.organizer)}
                        className="flex items-center gap-3 min-w-0 cursor-pointer group/modalhost hover:opacity-90 transition-opacity"
                        title="View Host Profile"
                      >
                        <img
                          src={selectedEventForDetails.organizer.imageUrl || defaultPP}
                          alt={selectedEventForDetails.organizer.name || 'Host'}
                          onError={(e) => { e.currentTarget.src = defaultPP; }}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 group-hover/modalhost:ring-primary/60 shrink-0 transition-all"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground group-hover/modalhost:text-primary group-hover/modalhost:underline truncate transition-colors">
                              {selectedEventForDetails.organizer.name || `${selectedEventForDetails.organizer.firstName || ''} ${selectedEventForDetails.organizer.lastName || ''}`.trim() || 'Campus Host'}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                              Event Host
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {selectedEventForDetails.organizer.headline || selectedEventForDetails.organizer.company || selectedEventForDetails.organizer.role || 'Host Organizer'}
                          </p>
                          {selectedEventForDetails.organizer.email && (
                            <p className="text-[11px] text-muted-foreground/80 truncate">
                              {selectedEventForDetails.organizer.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleContactHostMail(e, selectedEventForDetails.organizer, selectedEventForDetails.title)}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-xl transition-colors shadow-sm shrink-0"
                        title="Email the host"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Contact Host</span>
                      </button>
                    </div>
                  )}

                  {/* Key Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-muted/20 border border-border/40 p-3.5 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Event Date</span>
                        <span className="font-semibold text-foreground">
                          {selectedEventForDetails.date ? format(new Date(selectedEventForDetails.date), 'EEEE, MMM dd, yyyy') : 'TBD'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-muted/20 border border-border/40 p-3.5 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Event Time</span>
                        <span className="font-semibold text-foreground">
                          {selectedEventForDetails.time || 'Time TBD'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-muted/20 border border-border/40 p-3.5 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {selectedEventForDetails.mode === 'Offline' ? <MapPin className="w-4 h-4 text-amber-500" /> : <Globe className="w-4 h-4 text-blue-500" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Location / Platform</span>
                        <span className="font-semibold text-foreground truncate block">
                          {selectedEventForDetails.mode === 'Offline' 
                            ? (selectedEventForDetails.location || 'Campus Auditorium') 
                            : 'Online Virtual Session'}
                        </span>
                      </div>
                    </div>

                    <div className={`border p-3.5 rounded-xl flex items-center gap-3 ${
                      isRegistrationExpired(selectedEventForDetails) 
                        ? 'bg-rose-500/10 border-rose-500/30' 
                        : 'bg-muted/20 border-border/40'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isRegistrationExpired(selectedEventForDetails) ? 'bg-rose-500/20 text-rose-500' : 'bg-primary/10 text-primary'
                      }`}>
                        <CalendarCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Last Registration Date</span>
                        <span className={`font-semibold ${isRegistrationExpired(selectedEventForDetails) ? 'text-rose-500 font-bold' : 'text-foreground'}`}>
                          {selectedEventForDetails.lastRegDate 
                            ? format(new Date(selectedEventForDetails.lastRegDate), 'MMM dd, yyyy') 
                            : (selectedEventForDetails.date ? format(new Date(selectedEventForDetails.date), 'MMM dd, yyyy') : 'TBD')}
                          {isRegistrationExpired(selectedEventForDetails) && ' (Expired)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" /> About This Event
                    </h3>
                    <div className="bg-muted/30 border border-border/40 rounded-2xl p-4 text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                      {selectedEventForDetails.description || 'No detailed description provided for this event.'}
                    </div>
                  </div>

                  {/* Attendees Count & Avatars */}
                  <div className="flex items-center justify-between bg-muted/20 border border-border/40 p-4 rounded-2xl">
                    <div>
                      <span className="text-xs text-muted-foreground font-medium block">Registered Attendees</span>
                      <span className="text-sm font-bold text-foreground">
                        {(selectedEventForDetails.attendees?.length || 0)} Students Enrolled
                      </span>
                    </div>
                    <div className="flex -space-x-2 overflow-hidden">
                      {(selectedEventForDetails.attendees || []).slice(0, 5).map((att, idx) => {
                        const attImg = (typeof att === 'object' && att?.imageUrl) ? att.imageUrl : defaultPP;
                        const attName = (typeof att === 'object' && (att?.name || att?.firstName)) ? (att.name || att.firstName) : 'Attendee';
                        return (
                          <img
                            key={idx}
                            src={attImg}
                            alt={attName}
                            title={attName}
                            onError={(e) => { e.currentTarget.src = defaultPP; }}
                            className="inline-block w-8 h-8 rounded-full ring-2 ring-card object-cover"
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="p-4 sm:p-5 border-t border-border/40 bg-card flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <button
                    onClick={(e) => handleShareEvent(e, selectedEventForDetails._id)}
                    className="px-4 py-2.5 rounded-xl border border-border/50 hover:bg-muted text-xs font-semibold text-foreground transition-colors inline-flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>

                  <div className="flex items-center gap-2">
                    {isRegistered(selectedEventForDetails) ? (
                      <>
                        <span className="px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold inline-flex items-center gap-1.5 border border-emerald-500/20">
                          <Check className="w-4 h-4" /> You're Enrolled
                        </span>
                        {selectedEventForDetails.link && !checkIsPast(selectedEventForDetails.date, selectedEventForDetails.time) && (
                          <a
                            href={selectedEventForDetails.link.startsWith('http') ? selectedEventForDetails.link : `https://${selectedEventForDetails.link}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md hover:shadow-purple-500/25 transition-all"
                          >
                            <Video className="w-3.5 h-3.5" /> Join Session
                          </a>
                        )}
                      </>
                    ) : checkIsPast(selectedEventForDetails.date, selectedEventForDetails.time) ? (
                      <span className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold">
                        Event Completed
                      </span>
                    ) : isRegistrationExpired(selectedEventForDetails) ? (
                      <button
                        disabled
                        className="px-5 py-2.5 rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 text-xs font-bold cursor-not-allowed"
                      >
                        Registration Expired
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const ev = selectedEventForDetails;
                          setSelectedEventForDetails(null);
                          handleRegisterClick(ev);
                        }}
                        className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm active:scale-95"
                      >
                        Register for Event
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>

      {/* REGISTRATION MODAL */}
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
                    
                    {/* Email Address: UNCHANGEABLE as requested */}
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
                    
                    {/* Phone Number: CHANGEABLE / EDITABLE as requested */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={registerFormData.phone}
                        onChange={(e) => setRegisterFormData({ ...registerFormData, phone: e.target.value })}
                        className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                        placeholder="Enter your phone number"
                      />
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
