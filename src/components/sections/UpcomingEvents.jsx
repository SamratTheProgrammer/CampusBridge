import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, Users, ArrowRight } from 'lucide-react'
import API_BASE from '../../utils/api'
import NewRibbon from '../common/NewRibbon'
import EventFallbackBanner from '../common/EventFallbackBanner'
import defaultPP from '../../assets/default_pp.png'

const EventCard = ({ event, index, onRegister }) => {
  const navigate = useNavigate()
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0 })

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!event.date) return { days: 0, hours: 0, mins: 0 };
      
      let timeStr = event.time || '00:00';
      if (timeStr.includes('-')) timeStr = timeStr.split('-')[0].trim();
      
      let eventDateStr = event.date.split('T')[0];
      let targetTime = new Date(`${eventDateStr}T${timeStr}`);
      
      // Handle AM/PM if present
      if (timeStr.match(/AM|PM/i)) {
         const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
         if (match) {
            let [_, hours, mins, modifier] = match;
            hours = parseInt(hours, 10);
            if (hours === 12) hours = 0;
            if (modifier.toUpperCase() === 'PM') hours += 12;
            targetTime = new Date(`${eventDateStr}T${hours.toString().padStart(2, '0')}:${mins}:00`);
         }
      } else if (!timeStr.includes(':')) {
        targetTime = new Date(`${eventDateStr}T00:00:00`);
      }
      
      const now = new Date();
      const diffMs = targetTime.getTime() - now.getTime();
      
      if (diffMs <= 0 || isNaN(diffMs)) {
        return { days: 0, hours: 0, mins: 0 };
      }
      
      return {
        days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      };
    };

    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);
    
    return () => clearInterval(timer);
  }, [event.date, event.time]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      onClick={() => onRegister(event)}
      className="bg-card border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group flex flex-col relative cursor-pointer"
    >
      <NewRibbon createdAt={event.createdAt} id={event._id} />
      <div className="h-48 relative overflow-hidden bg-muted">
        {event.imageUrl || event.image ? (
          <img 
            src={event.imageUrl || event.image} 
            alt={event.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <EventFallbackBanner type={event.type} title={event.title} />
        )}
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur text-foreground px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {event.type || 'Event'}
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-bold text-xl text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
          {event.title}
        </h3>
        
        <div className="space-y-2 mb-6 text-sm text-muted-foreground flex-1">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
            <span>{event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span>{event.time || 'TBD'}</span>
          </div>
          
          {/* Host Display: DP and Name (NO meet URL or location as requested) */}
          {event.organizer && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                const identifier = event.organizer.username || event.organizer.clerkId || event.organizer._id;
                if (identifier) navigate(`/profile/${identifier}`);
              }}
              className="flex items-center gap-2 pt-1 cursor-pointer group/host hover:opacity-90 transition-opacity"
              title="View Host Profile"
            >
              <img
                src={event.organizer.imageUrl || defaultPP}
                alt={event.organizer.name || 'Host'}
                onError={(e) => { e.currentTarget.src = defaultPP; }}
                className="w-5 h-5 rounded-full object-cover ring-1 ring-border group-hover/host:ring-primary/60 shrink-0"
              />
              <span className="text-xs font-semibold text-foreground group-hover/host:text-primary group-hover/host:underline truncate">
                {event.organizer.name || `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim() || 'Campus Host'}
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary shrink-0">
                Host
              </span>
            </div>
          )}
        </div>

        {/* Countdown Timer */}
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
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRegister(event);
            }}
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
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/events?category=event`)
        if (res.ok) {
          let data = await res.json()
          data = data.filter(e => {
            const isPast = e.date ? new Date(e.date) < new Date(new Date().setHours(0, 0, 0, 0)) : false;
            return !isPast;
          })
          setEvents(data.slice(0, 3))
        }
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const handleRegisterClick = (event) => {
    if (!isLoaded) return;
    if (!user) {
      // If not logged in, take them to login
      navigate('/login', { state: { returnTo: '/dashboard/events', registerEventId: event._id } });
      return;
    }
    // If logged in, navigate to /dashboard/events and automatically open the register modal!
    navigate('/dashboard/events', { state: { registerEventId: event._id } });
  }

  return (
    <section className="py-20 bg-background/50 border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
              Happening Soon
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Upcoming Campus Events</h2>
            <p className="text-muted-foreground mt-2 text-base sm:text-lg max-w-xl">
              Join workshops, masterclasses, and networking sessions hosted by industry leaders and alumni.
            </p>
          </div>
          <button 
            onClick={() => navigate(user ? '/dashboard/events' : '/login')}
            className="mt-6 md:mt-0 flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all cursor-pointer self-start md:self-auto"
          >
            <span>View All Events</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-card border rounded-2xl h-96 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-card border rounded-2xl p-8">
            <h3 className="text-lg font-bold text-foreground mb-2">No Upcoming Events</h3>
            <p className="text-muted-foreground">Check back later for new workshops, webinars, and networking events.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event, index) => (
              <EventCard key={event._id || index} event={event} index={index} onRegister={handleRegisterClick} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default UpcomingEvents
