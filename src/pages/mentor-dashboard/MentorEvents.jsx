import React, { useState } from 'react'
import { Plus, Calendar, Clock, MapPin, Users, Link as LinkIcon, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const MOCK_EVENTS = [
  {
    id: 1,
    title: 'Resume Review & Mock Interviews',
    type: 'Workshop',
    date: 'Oct 25, 2026',
    time: '4:00 PM - 6:00 PM',
    location: 'Google Meet',
    attendees: 34,
    link: 'meet.google.com/abc-xyz',
    active: true
  },
  {
    id: 2,
    title: 'System Design 101',
    type: 'Masterclass',
    date: 'Oct 18, 2026',
    time: '5:00 PM - 6:00 PM',
    location: 'Zoom',
    attendees: 156,
    link: 'zoom.us/j/123456',
    active: false
  }
]

const MentorEvents = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [events, setEvents] = useState(MOCK_EVENTS)

  const handleCreateEvent = (e) => {
    e.preventDefault()
    toast.success('Event created successfully!')
    setIsModalOpen(false)
  }

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Events & Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">Schedule masterclasses, workshops, and 1:1s for your students.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Event
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
        />
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEvents.map((event) => (
          <div key={event.id} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
            
            {/* Upcoming Indicator */}
            {event.active && (
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-2xl">
                <div className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest text-center py-1 w-24 transform rotate-45 translate-x-[14px] translate-y-[14px] shadow-sm">
                  Upcoming
                </div>
              </div>
            )}

            <div>
              <div className="flex gap-4 items-start mb-5 pr-8">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0">
                  <span className="text-xs font-semibold">{event.date.split(' ')[0]}</span>
                  <span className="text-lg font-bold leading-none">{event.date.split(' ')[1].replace(',', '')}</span>
                </div>
                <div>
                  <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider mb-1.5 inline-block">{event.type}</span>
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg leading-tight">{event.title}</h3>
                </div>
              </div>
              
              <div className="space-y-2.5 mb-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 shrink-0 text-foreground/60" /> {event.time}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0 text-foreground/60" /> {event.location}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <LinkIcon className="w-4 h-4 shrink-0 text-foreground/60" /> 
                  <a href="#" className="text-primary hover:underline truncate">{event.link}</a>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/40 pt-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Users className="w-4 h-4 text-primary" /> {event.attendees} Registered
              </div>
              <button className="text-sm font-medium text-primary hover:underline">
                Manage →
              </button>
            </div>
          </div>
        ))}

        {filteredEvents.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No events found.
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-foreground mb-1">Create Event</h2>
            <p className="text-sm text-muted-foreground mb-6">Host a session, workshop, or masterclass.</p>
            
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Event Title</label>
                <input required type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. System Design 101" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Event Type</label>
                  <select className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>Workshop</option>
                    <option>Masterclass</option>
                    <option>AMA Session</option>
                    <option>1:1 Mentorship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
                  <input required type="date" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Start Time</label>
                  <input required type="time" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Duration</label>
                  <select className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>30 Minutes</option>
                    <option>1 Hour</option>
                    <option>1.5 Hours</option>
                    <option>2+ Hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
                  <select className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>Google Meet</option>
                    <option>Zoom</option>
                    <option>Teams</option>
                    <option>In-Person</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Meeting Link</label>
                  <input type="url" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="https://" />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-medium transition-colors shadow-sm"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default MentorEvents

