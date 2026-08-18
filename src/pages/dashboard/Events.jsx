
import React, { useState, useEffect } from 'react'
import { Loader2, Calendar, Clock, MapPin, Users, X, CheckCircle2, Globe, Video, Share2 } from 'lucide-react'
import { format } from 'date-fns'
import { useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import API_BASE from '../../utils/api'
import { useNavigate } from 'react-router-dom'

const Events = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

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

  const filteredEvents = events.filter(event => {
    const isPast = event.date ? new Date(event.date) < new Date(new Date().setHours(0, 0, 0, 0)) : false;
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
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
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
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map(event => {
            const registered = isRegistered(event)
            return (
              <div key={event._id} className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="w-full sm:w-32 h-32 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center">
                    {event.imageUrl ? (
                      <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-primary font-bold text-xl">{event.type?.charAt(0) || 'E'}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {event.type || 'Event'}
                      </span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        event.mode === 'Offline' || (event.location && !event.mode)
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}>
                        {event.mode === 'Offline' || (event.location && !event.mode) ? (
                          <><MapPin className="w-3 h-3" /> Offline</>
                        ) : (
                          <><Globe className="w-3 h-3" /> Online</>
                        )}
                      </span>
                      {registered && (
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Registered
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">{event.title}</h3>
                    <p className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" /> {event.date ? format(new Date(event.date), 'MMM dd, yyyy') : 'TBD'} <Clock className="w-4 h-4 text-primary ml-2" /> {event.time}
                    </p>
                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      {event.mode === 'Offline' || (event.location && !event.mode) ? (
                        <><MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {event.location || 'Campus Location'}</>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" /> 
                          {event.link && registered ? (
                            <a href={event.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-semibold transition-colors">
                              <Video className="w-3.5 h-3.5" /> Join Meeting
                            </a>
                          ) : (
                            <span>Virtual / Online Meeting</span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground bg-muted inline-block px-2 py-1 rounded border border-border/50 flex items-center gap-1 w-fit">
                      <Users className="w-3.5 h-3.5 text-primary" /> {event.attendees?.length || 0} Registered
                    </p>
                    
                    {registered && (() => {
                      const isPastEvent = event.date && new Date(event.date).getTime() < new Date().setHours(0,0,0,0);
                      return (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {event.date && !isPastEvent && (
                          <a 
                            href={`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(event.title)}&dates=${format(new Date(event.date), 'yyyyMMdd')}/${format(new Date(event.date), 'yyyyMMdd')}&details=${encodeURIComponent(`CampusBridge Event: ${event.title}\nTime: ${event.time || 'TBD'}\nLink: ${event.link || ''}`)}&location=${encodeURIComponent(event.location || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/20 px-3 py-2 rounded-lg"
                          >
                            <Calendar className="w-3.5 h-3.5" /> Add to Calendar
                          </a>
                        )}
                        <button
                          onClick={() => {
                            const role = user?.publicMetadata?.role || 'student';
                            navigate(['mentor', 'alumni'].includes(role.toLowerCase()) ? '/mentor-dashboard' : '/dashboard', { state: { shareEvent: event } });
                          }}
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold text-white transition-colors px-3 py-2 rounded-lg shadow-sm ${
                            isPastEvent 
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' 
                              : 'bg-primary hover:bg-primary/90'
                          }`}
                        >
                          <Share2 className="w-3.5 h-3.5" /> {isPastEvent ? 'Share Experience' : 'Share Thought'}
                        </button>
                      </div>
                      );
                    })()}
                  </div>
                </div>
                {event.active && !registered && (
                  <button 
                    onClick={() => handleRegisterClick(event)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm shrink-0 w-full sm:w-auto"
                  >
                    Register
                  </button>
                )}
              </div>
            )
          })
        ) : (
          <div className="py-12 text-center text-muted-foreground bg-card border border-border/50 rounded-2xl">
            {activeTab === 'upcoming' ? 'No upcoming events.' : 'No past events to show.'}
          </div>
        )}
      </div>


      <AnimatePresence>
        {showRegisterModal && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
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
        )}
      </AnimatePresence>
    </div>
  )
}

export default Events
