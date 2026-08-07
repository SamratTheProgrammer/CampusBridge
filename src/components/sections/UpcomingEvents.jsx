import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, MapPin, Users, X, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const EventCard = ({ event, index, onRegister }) => {
  // Simple countdown logic for visual purposes
  const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 12, mins: 45 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.mins > 0) return { ...prev, mins: prev.mins - 1 }
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59 }
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, mins: 59 }
        return prev
      })
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-card border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group flex flex-col"
    >
      <div className="h-48 relative overflow-hidden bg-muted">
        <img 
          src={event.image} 
          alt={event.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur text-foreground px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {event.type}
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-bold text-xl text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
          {event.title}
        </h3>
        
        <div className="space-y-2 mb-6 text-sm text-muted-foreground flex-1">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{event.location}</span>
          </div>
        </div>

        <div className="bg-muted rounded-xl p-3 mb-6 flex justify-between items-center text-sm font-medium">
          <div className="text-center">
            <span className="block text-foreground text-lg">{timeLeft.days}</span>
            <span className="text-xs text-muted-foreground uppercase">Days</span>
          </div>
          <span className="text-muted-foreground">:</span>
          <div className="text-center">
            <span className="block text-foreground text-lg">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-xs text-muted-foreground uppercase">Hrs</span>
          </div>
          <span className="text-muted-foreground">:</span>
          <div className="text-center">
            <span className="block text-foreground text-lg">{String(timeLeft.mins).padStart(2, '0')}</span>
            <span className="text-xs text-muted-foreground uppercase">Mins</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => onRegister(event)}
            className="flex-1 bg-foreground text-background py-2.5 rounded-xl font-medium hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
          >
            Register Now
          </button>
        </div>
      </div>
    </motion.div>
  )
}

const UpcomingEvents = () => {
  const [selectedEvent, setSelectedEvent] = useState(null)

  const events = [
    {
      title: 'Global Tech Hackathon 2024',
      type: 'Hackathon',
      date: 'Oct 15 - Oct 17, 2024',
      time: '48 Hours',
      location: 'Virtual',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Mentor Networking Career Fair',
      type: 'Career Fair',
      date: 'Nov 02, 2024',
      time: '10:00 AM - 4:00 PM',
      location: 'New York Campus / Hybrid',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'System Design Interview Workshop',
      type: 'Workshop',
      date: 'Sep 28, 2024',
      time: '2:00 PM - 5:00 PM',
      location: 'Zoom',
      image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    }
  ]

  const handleRegisterSubmit = (e) => {
    e.preventDefault()
    toast.success('Successfully registered for the event!')
    setSelectedEvent(null)
  }

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (selectedEvent) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selectedEvent])

  return (
    <section className="py-24 bg-muted/20 relative">
      <div className="container max-w-7xl mx-auto px-3 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Upcoming Events</h2>
            <p className="text-lg text-muted-foreground">
              Level up your skills and expand your network with our exclusive events and workshops.
            </p>
          </div>
          <button className="text-primary font-medium hover:underline w-fit">
            View All Events &rarr;
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event, index) => (
            <EventCard key={event.title} event={event} index={index} onRegister={setSelectedEvent} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setSelectedEvent(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border/50 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative z-10"
            >
              <div className="relative h-32 bg-muted shrink-0">
                <img src={selectedEvent.image} alt="Event Cover" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 p-2 bg-background/50 hover:bg-background/80 backdrop-blur rounded-full transition-colors text-foreground shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 p-6 translate-y-4">
                  <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full mb-2 w-fit uppercase tracking-wider shadow-sm">
                    {selectedEvent.type}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-tight drop-shadow-md">{selectedEvent.title}</h3>
                </div>
              </div>

              <div className="p-6 pt-8 overflow-y-auto custom-scrollbar">
                <p className="text-sm text-muted-foreground mb-6">
                  Complete your registration for this event. Space is limited, so secure your spot now!
                </p>
                
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">First Name</label>
                      <input type="text" className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all" placeholder="John" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Last Name</label>
                      <input type="text" className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all" placeholder="Doe" required />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Email Address</label>
                    <input type="email" className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all" placeholder="john@example.com" required />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">University / Organization</label>
                    <input type="text" className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all" placeholder="e.g. Stanford University" required />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Why do you want to attend?</label>
                    <textarea className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground h-24 resize-none transition-all" placeholder="Briefly describe what you hope to learn..." required></textarea>
                  </div>
                  
                  <button type="submit" className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 mt-4 active:scale-[0.98]">
                    Submit Registration <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default UpcomingEvents
