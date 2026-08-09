
import React, { useState, useEffect } from 'react'
import { Loader2, Calendar, Clock, MapPin, Users, X, CheckCircle2, Globe } from 'lucide-react'
import { format } from 'date-fns'
import { useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'

const Events = () => {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Registration Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [applicantRole, setApplicantRole] = useState('student')
  const [isRegistering, setIsRegistering] = useState(false)
  
  // User DB data for phone
  const [userDbData, setUserDbData] = useState(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events?category=event')
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
          const res = await fetch(`/api/users/${user.id}`)
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
    setIsModalOpen(true)
  }

  const handleConfirmRegistration = async (e) => {
    e.preventDefault()
    if (!user) return
    setIsRegistering(true)
    
    try {
      const res = await fetch(`/api/events/${selectedEvent._id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          applicantRole
        })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to register')
      
      toast.success('Successfully registered for event!')
      setIsModalOpen(false)
      
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
      
    } catch (err) {
      toast.error(err.message || 'Could not register')
    } finally {
      setIsRegistering(false)
    }
  }

  const filteredEvents = events.filter(event => {
    if (activeTab === 'upcoming') return event.active
    return !event.active
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
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      {event.mode === 'Offline' || (event.location && !event.mode) ? (
                        <><MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {event.location || 'Campus Location'}</>
                      ) : (
                        <><Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {event.link ? <a href={event.link} target="_blank" rel="noreferrer" className="underline text-primary">Join Online Link</a> : 'Virtual / Online Meeting'}</>
                      )}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground bg-muted inline-block px-2 py-1 rounded border border-border/50 flex items-center gap-1 w-fit">
                      <Users className="w-3.5 h-3.5 text-primary" /> {event.attendees?.length || 0} Registered
                    </p>
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

      {/* Registration Modal */}
      <AnimatePresence>
        {isModalOpen && selectedEvent && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/50 rounded-2xl w-full max-w-md shadow-xl flex flex-col"
            >
              <div className="p-6 border-b border-border/50 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Complete Registration</h2>
                  <p className="text-sm text-muted-foreground mt-1 truncate max-w-[280px]">{selectedEvent.title}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleConfirmRegistration} className="space-y-6">
                  
                  {/* Profile Summary */}
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Your Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Name</span>
                        <span className="font-medium text-foreground">{user?.fullName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Email</span>
                        <span className="font-medium text-foreground">{user?.primaryEmailAddress?.emailAddress}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="font-medium text-foreground">
                          {userDbData?.phone || <span className="text-red-400 italic">Not provided in settings</span>}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">I am attending as a:</label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={`border rounded-xl p-4 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${applicantRole === 'student' ? 'border-primary bg-primary/5 text-primary' : 'border-border/50 text-foreground hover:bg-muted/50'}`}>
                        <input 
                          type="radio" 
                          name="role" 
                          value="student" 
                          checked={applicantRole === 'student'}
                          onChange={() => setApplicantRole('student')}
                          className="sr-only"
                        />
                        <span className="font-semibold text-sm">Student</span>
                      </label>
                      <label className={`border rounded-xl p-4 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${applicantRole === 'alumni' ? 'border-primary bg-primary/5 text-primary' : 'border-border/50 text-foreground hover:bg-muted/50'}`}>
                        <input 
                          type="radio" 
                          name="role" 
                          value="alumni" 
                          checked={applicantRole === 'alumni'}
                          onChange={() => setApplicantRole('alumni')}
                          className="sr-only"
                        />
                        <span className="font-semibold text-sm">Alumni</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button" 
                      disabled={isRegistering}
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-xl font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isRegistering}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isRegistering && <Loader2 className="w-4 h-4 animate-spin" />}
                      Confirm Registration
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Events
