import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, MapPin, Users } from 'lucide-react'

const EventCard = ({ event, index }) => {
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
          <button className="flex-1 bg-foreground text-background py-2.5 rounded-xl font-medium hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm">
            Register Now
          </button>
        </div>
      </div>
    </motion.div>
  )
}

const UpcomingEvents = () => {
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
      title: 'Alumni Networking Career Fair',
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

  return (
    <section className="py-24 bg-muted/20">
      <div className="container mx-auto px-4 lg:px-8">
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
            <EventCard key={event.title} event={event} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default UpcomingEvents
