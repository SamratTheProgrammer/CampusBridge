import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Video, XCircle, CheckCircle2, Globe, MapPin, Loader2, User, Plus, X, Briefcase, ChevronRight, ExternalLink } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import API_BASE from '../../utils/api'

const MySessions = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('available') // 'available' | 'upcoming' | 'pending' | 'completed'
  const [modeFilter, setModeFilter] = useState('all') // 'all' | 'Online' | 'Offline'
  
  // Data state
  const [availableSessions, setAvailableSessions] = useState([])
  const [userSessions, setUserSessions] = useState([]) // 1-on-1 booked sessions
  const [registeredEvents, setRegisteredEvents] = useState([]) // events user registered for
  const [isLoading, setIsLoading] = useState(true)

  // Registration Modal State
  const [selectedSession, setSelectedSession] = useState(null)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // 1. Fetch available mentor-hosted sessions
      const availableRes = await fetch(`${API_BASE}/api/events?category=session`)
      if (availableRes.ok) {
        const availableData = await availableRes.json()
        setAvailableSessions(availableData)
      }

      if (user) {
        // 2. Fetch user's booked 1-on-1 sessions
        const userRes = await fetch(`${API_BASE}/api/sessions/user/${user.id}`)
        if (userRes.ok) {
          const userData = await userRes.json()
          setUserSessions(userData)
        }

        // 3. Fetch events user has registered for
        const regRes = await fetch(`${API_BASE}/api/events/registered/${user.id}`)
        if (regRes.ok) {
          const regData = await regRes.json()
          setRegisteredEvents(regData)
        }
      }
    } catch (err) {
      console.error(err)
      toast.error('Could not load sessions')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  const handleCancelSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to cancel this session?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/sessions/${sessionId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Session cancelled')
        setUserSessions(userSessions.filter(s => s._id !== sessionId))
      } else {
        toast.error('Failed to cancel session')
      }
    } catch (err) {
      toast.error('Error cancelling session')
    }
  }

  const handleRegisterForAvailable = async (e) => {
    e.preventDefault()
    if (!user || !selectedSession) return;
    setIsRegistering(true)
    try {
      const res = await fetch(`${API_BASE}/api/events/${selectedSession._id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id })
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('Registered for session successfully!')
        setIsRegisterModalOpen(false)
        setActiveTab('upcoming') // Switch to upcoming after registration
        fetchData()
      } else {
        toast.error(data.error || 'Failed to register')
      }
    } catch (err) {
      toast.error('Could not complete registration')
    } finally {
      setIsRegistering(false)
    }
  }

  const checkIsPast = (dateStr, timeStr) => {
    if (!dateStr) return false;
    try {
      let time24 = timeStr;
      if (timeStr && timeStr.match(/AM|PM/i)) {
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          let [_, hours, mins, modifier] = match;
          hours = parseInt(hours, 10);
          if (hours === 12) hours = 0;
          if (modifier.toUpperCase() === 'PM') hours += 12;
          time24 = `${hours.toString().padStart(2, '0')}:${mins}:00`;
        }
      } else if (timeStr) {
        time24 = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
      } else {
        time24 = '23:59:59';
      }
      
      const sessionDate = new Date(`${dateStr.split('T')[0]}T${time24}`);
      return sessionDate < new Date();
    } catch (e) {
      return false;
    }
  }

  // Build the combined "My Upcoming Sessions" list: 1-on-1 sessions + registered events
  const upcomingCombined = [
    // 1-on-1 sessions that are accepted/upcoming and NOT past
    ...userSessions
      .filter(s => (s.status === 'accepted' || s.status === 'upcoming') && !checkIsPast(s.date, s.time))
      .map(s => ({ ...s, source: 'session' })),
    // Registered events (upcoming) that are actually sessions
    ...registeredEvents
      .filter(e => e.category === 'session' && !checkIsPast(e.date, e.time))
      .map(e => ({ ...e, source: 'event' }))
  ]

  // Build the combined "Completed" list
  const completedCombined = [
    ...userSessions
      .filter(s => 
        s.status === 'completed' || s.status === 'declined' || s.status === 'cancelled' ||
        ((s.status === 'accepted' || s.status === 'upcoming') && checkIsPast(s.date, s.time))
      )
      .map(s => ({ ...s, source: 'session' })),
    // Registered events (past) that are actually sessions
    ...registeredEvents
      .filter(e => e.category === 'session' && checkIsPast(e.date, e.time))
      .map(e => ({ ...e, source: 'event' }))
  ]

  const filteredUpcoming = upcomingCombined.filter(session => {
    if (modeFilter === 'Online' && session.mode !== 'Online') return false;
    if (modeFilter === 'Offline' && session.mode !== 'Offline') return false;
    return true
  })

  const filteredCompleted = completedCombined.filter(session => {
    if (modeFilter === 'Online' && session.mode !== 'Online') return false;
    if (modeFilter === 'Offline' && session.mode !== 'Offline') return false;
    return true
  })

  // Pending is for 1-on-1 requests
  const filteredPending = userSessions.filter(session => {
    if (modeFilter === 'Online' && session.mode !== 'Online') return false;
    if (modeFilter === 'Offline' && session.mode !== 'Offline') return false;
    return session.status === 'pending'
  })

  const filteredAvailableSessions = availableSessions.filter(session => {
    if (modeFilter === 'Online' && session.mode !== 'Online') return false;
    if (modeFilter === 'Offline' && session.mode !== 'Offline') return false;
    return true
  })

  // Render a single upcoming session card (works for both 1-on-1 and registered events)
  const renderUpcomingCard = (item) => {
    const isEvent = item.source === 'event'

    // For events: organizer is the mentor
    // For 1-on-1 sessions: mentor field
    const mentorInfo = isEvent ? item.organizer : item.mentor
    const mentorName = mentorInfo ? (mentorInfo.name || `${mentorInfo.firstName || ''} ${mentorInfo.lastName || ''}`.trim()) : 'Mentor'
    const mentorRole = mentorInfo?.headline || mentorInfo?.position || 'Mentor'
    const mentorImg = mentorInfo?.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentorName}`

    const sessionTitle = isEvent ? item.title : item.type
    const sessionDate = item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'
    const sessionTime = item.time || 'TBD'
    const isOffline = item.mode === 'Offline'
    const joinLink = isEvent ? item.link : item.meetingLink
    const venueLocation = item.location

    const isPast = checkIsPast(item.date, item.time)

    return (
      <motion.div 
        key={item._id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border/50 rounded-2xl shadow-sm hover:border-primary/30 transition-all"
      >
        {/* Top Section: Mentor + Session Info */}
        <div className="p-5 pb-4">
          {/* Mentor Header */}
          <div className="flex items-center gap-3 mb-4">
            <img src={mentorImg} alt={mentorName} className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/20 shrink-0" />
            <div className="overflow-hidden flex-1">
              <h4 className="font-bold text-foreground text-sm truncate">{mentorName}</h4>
              <p className="text-xs text-muted-foreground truncate">{mentorRole}</p>
            </div>
            {/* Source badge */}
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
              isEvent ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            }`}>
              {isEvent ? 'Session' : '1-on-1'}
            </span>
          </div>

          {/* Session Title */}
          <h3 className="font-bold text-foreground text-base mb-3 leading-snug line-clamp-2">{sessionTitle}</h3>

          {/* Details */}
          <div className="space-y-2 text-xs bg-muted/40 p-3 rounded-xl border border-border/40">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Mode:</span>
              <span className={`font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                isOffline
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              }`}>
                {isOffline ? <><MapPin className="w-3 h-3" /> Offline</> : <><Globe className="w-3 h-3" /> Online</>}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Date:</span>
              <span className="font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" /> {sessionDate}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Time:</span>
              <span className="font-semibold text-foreground flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" /> {sessionTime}
              </span>
            </div>

            {isOffline && venueLocation && (
              <div className="flex items-center justify-between pt-1 border-t border-border/30">
                <span className="text-muted-foreground font-medium">Venue:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400 truncate max-w-[150px] text-right flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" /> {venueLocation}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Bar: Join Button on right */}
        <div className="px-5 py-3 border-t border-border/40 flex items-center justify-between">
          {isEvent && (
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> {item.attendees?.length || 0} Registered
            </span>
          )}
          {!isEvent && (
            <span className="text-xs text-muted-foreground font-medium">
              {item.duration || 30} min session
            </span>
          )}

          <div className="flex items-center gap-2">
            {isPast || item.status === 'completed' || item.status === 'declined' || item.status === 'cancelled' ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-muted text-muted-foreground">
                {item.status === 'declined' || item.status === 'cancelled' ? item.status : 'Completed'}
              </span>
            ) : isOffline ? (
              <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-amber-500/20">
                <MapPin className="w-3.5 h-3.5" /> In-Person
              </div>
            ) : (
              <button 
                onClick={() => {
                  const mentorObj = {
                    clerkId: mentorInfo?.clerkId || mentorInfo?._id,
                    name: mentorName,
                    image: mentorImg
                  };
                  if (joinLink && joinLink.startsWith('http') && !joinLink.includes('meet.google.com')) {
                    window.open(joinLink, '_blank');
                  } else {
                    window.dispatchEvent(new CustomEvent('initiate_call', {
                      detail: { targetPartner: mentorObj, type: 'video' }
                    }));
                  }
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2 rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5" /> Join Call
              </button>
            )}

            {!isEvent && !(isPast || item.status === 'completed' || item.status === 'declined' || item.status === 'cancelled') && (
              <button 
                onClick={() => handleCancelSession(item._id)}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground border border-border/50 transition-colors" 
                title="Cancel Session"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
            
            {!(isPast || item.status === 'completed' || item.status === 'declined' || item.status === 'cancelled') && item.date && (
               <a 
                 href={`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(sessionTitle)}&dates=${format(new Date(item.date), 'yyyyMMdd')}/${format(new Date(item.date), 'yyyyMMdd')}&details=${encodeURIComponent(`Session with ${mentorName}\nTime: ${sessionTime}\nMode: ${item.mode || 'Online'}`)}&location=${encodeURIComponent(venueLocation || '')}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="p-2 rounded-xl hover:bg-primary/10 text-primary border border-primary/20 transition-colors"
                 title="Add to Google Calendar"
               >
                 <Calendar className="w-3.5 h-3.5" />
               </a>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Sessions</h1>
          <p className="text-muted-foreground text-sm">Browse available mentor sessions or manage your booked Online and Offline meetings.</p>
        </div>

        {/* Mode Filter Pills */}
        <div className="flex bg-muted p-1 rounded-xl w-fit shrink-0">
          <button
            onClick={() => setModeFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              modeFilter === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setModeFilter('Online')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              modeFilter === 'Online' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Online
          </button>
          <button
            onClick={() => setModeFilter('Offline')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              modeFilter === 'Offline' ? 'bg-background text-amber-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> Offline
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden mb-6 sm:mb-8">
        <div className="flex overflow-x-auto scrollbar-none border-b border-border/40">
          <button 
            onClick={() => setActiveTab('available')}
            className={`px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors relative shrink-0
              ${activeTab === 'available' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Available Sessions ({filteredAvailableSessions.length})
            {activeTab === 'available' && (
              <motion.div layoutId="sessionTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors relative shrink-0
              ${activeTab === 'upcoming' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            My Upcoming Sessions ({filteredUpcoming.length})
            {activeTab === 'upcoming' && (
              <motion.div layoutId="sessionTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors relative shrink-0
              ${activeTab === 'pending' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Pending Requests
            {activeTab === 'pending' && (
              <motion.div layoutId="sessionTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors relative shrink-0
              ${activeTab === 'completed' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            History / Completed
            {activeTab === 'completed' && (
              <motion.div layoutId="sessionTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>

        ) : activeTab === 'available' ? (
          /* ====== AVAILABLE MENTOR SESSIONS TAB ====== */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAvailableSessions.map((session) => {
              const mentorName = session.organizer?.name || `${session.organizer?.firstName || ''} ${session.organizer?.lastName || ''}`.trim() || 'Mentor'
              const mentorRole = session.organizer?.headline || session.organizer?.position || (session.organizer?.company ? `at ${session.organizer.company}` : '') || 'Mentor Host'
              const mentorImg = session.organizer?.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentorName}`
              const isOffline = session.mode === 'Offline' || (session.location && !session.mode)

              // Check if user already registered
              const alreadyRegistered = registeredEvents.some(re => re.eventId === session._id || re.eventId?.toString() === session._id?.toString())

              return (
                <div key={session._id} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between group">
                  <div>
                    {/* Mentor Header */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/40">
                      <img 
                        src={mentorImg} 
                        alt={mentorName} 
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
                      />
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-foreground text-sm truncate">{mentorName}</h4>
                        <p className="text-xs text-muted-foreground truncate">{mentorRole}</p>
                      </div>
                    </div>

                    {/* Session Title */}
                    <h3 className="font-bold text-foreground text-base mb-3 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {session.title}
                    </h3>

                    {/* Details */}
                    <div className="space-y-2 text-xs bg-muted/40 p-3.5 rounded-xl border border-border/40 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">Session Type:</span>
                        <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          {session.type || 'Masterclass'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">Session Mode:</span>
                        <span className={`font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          isOffline
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}>
                          {isOffline ? <><MapPin className="w-3 h-3" /> Offline</> : <><Globe className="w-3 h-3" /> Online</>}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">Date:</span>
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-primary" />
                          {session.date ? new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">Time Slot:</span>
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3 text-primary" />
                          {session.time || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-border/30">
                        <span className="text-muted-foreground font-medium">Venue / Link:</span>
                        <span className="font-semibold truncate max-w-[150px] text-right">
                          {isOffline ? (
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /> {session.location || 'Campus Venue'}</span>
                          ) : (
                            <span className="text-blue-500 flex items-center gap-1"><Globe className="w-3 h-3 shrink-0" /> Virtual Video</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-primary" /> {session.attendees?.length || 0} Registered
                    </span>
                    {alreadyRegistered ? (
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Registered ✓
                      </span>
                    ) : (
                      <button
                        onClick={() => { setSelectedSession(session); setIsRegisterModalOpen(true); }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1"
                      >
                        Register <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {filteredAvailableSessions.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-card border border-border/50 rounded-2xl">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-semibold text-foreground">No available mentor sessions found.</p>
                <p className="text-xs mt-1">Book a 1-on-1 session directly from the <button onClick={() => navigate('/dashboard/mentor')} className="text-primary underline font-bold">Mentor Directory</button>.</p>
              </div>
            )}
          </div>

        ) : activeTab === 'upcoming' ? (
          /* ====== MY UPCOMING SESSIONS TAB (1-on-1 + Registered Events) ====== */
          filteredUpcoming.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUpcoming.map(renderUpcomingCard)}
            </div>
          ) : (
            <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-foreground mb-2">No upcoming sessions</h3>
              <p className="text-muted-foreground text-sm mb-4">Register for available sessions or book a 1-on-1 mentor session to see them here.</p>
              <button
                onClick={() => setActiveTab('available')}
                className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                Browse Available Sessions
              </button>
            </div>
          )

        ) : activeTab === 'completed' ? (
          /* ====== COMPLETED SESSIONS TAB ====== */
          filteredCompleted.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompleted.map(renderUpcomingCard)}
            </div>
          ) : (
            <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-foreground mb-2">No completed sessions</h3>
              <p className="text-muted-foreground text-sm mb-4">You don't have any past mentorship meetings or events.</p>
            </div>
          )

        ) : (
          /* ====== PENDING TAB (1-on-1 sessions only) ====== */
          filteredPending.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPending.map((session) => {
                const isMentorView = session.mentor?.clerkId === user?.id
                const partnerUser = isMentorView ? session.student : session.mentor
                const partnerName = partnerUser ? (partnerUser.name || `${partnerUser.firstName || ''} ${partnerUser.lastName || ''}`.trim()) : 'Mentor/Student'
                const partnerRole = partnerUser?.position || partnerUser?.headline || (isMentorView ? 'Student' : 'Mentor')
                const partnerImage = partnerUser?.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerName}`

                return (
                  <motion.div 
                    key={session._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:border-primary/50 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      {/* Partner Header */}
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/40">
                        <img src={partnerImage} alt={partnerName} className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 shrink-0" />
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-foreground text-sm truncate">{partnerName}</h4>
                          <p className="text-xs text-muted-foreground truncate">{partnerRole}</p>
                        </div>
                      </div>

                      {/* Session Topic */}
                      <h3 className="font-bold text-foreground text-base mb-3 leading-snug line-clamp-2">{session.type}</h3>

                      {/* Line by Line Details */}
                      <div className="space-y-2 text-xs bg-muted/40 p-3.5 rounded-xl border border-border/40 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-medium">Session Mode:</span>
                          <span className={`font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            session.mode === 'Offline'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {session.mode === 'Offline' ? <><MapPin className="w-3 h-3" /> Offline</> : <><Globe className="w-3 h-3" /> Online</>}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-medium">Date:</span>
                          <span className="font-semibold text-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-primary" />
                            {session.date ? new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-medium">Time:</span>
                          <span className="font-semibold text-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3 text-primary" />
                            {session.time} ({session.duration || 30}m)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button 
                        onClick={() => handleCancelSession(session._id)}
                        className="w-full bg-background border border-destructive/50 text-destructive hover:bg-destructive/10 py-2.5 rounded-xl font-medium text-xs transition-colors"
                      >
                        Cancel Request
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-foreground mb-2">No {activeTab} sessions</h3>
              <p className="text-muted-foreground text-sm">You don't have any pending mentorship requests at the moment.</p>
            </div>
          )
        )}
      </div>

      {/* Registration Modal for Available Sessions */}
      {isRegisterModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-foreground">Confirm Session Registration</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedSession.title}</p>
              </div>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-muted-foreground hover:bg-muted p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterForAvailable} className="p-6 space-y-4">
              <div className="bg-muted/30 p-4 rounded-xl border border-border/40 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mentor:</span>
                  <span className="font-bold text-foreground">{selectedSession.organizer?.name || 'Mentor'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode:</span>
                  <span className="font-bold text-foreground">{selectedSession.mode || 'Online'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date & Time:</span>
                  <span className="font-bold text-foreground">{selectedSession.date ? new Date(selectedSession.date).toLocaleDateString() : 'TBD'} • {selectedSession.time}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-xl font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {isRegistering && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MySessions
