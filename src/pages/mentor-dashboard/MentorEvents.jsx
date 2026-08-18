import React, { useState, useEffect } from 'react'
import { Plus, Calendar, Clock, MapPin, Users, Link as LinkIcon, Search, Loader2, X, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useUser } from '@clerk/clerk-react'
import { formatDistanceToNow, format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmModal from '../../components/modals/ConfirmModal'
import API_BASE from '../../utils/api'

const MentorEvents = () => {
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isApplicationsModalOpen, setIsApplicationsModalOpen] = useState(false)
  
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [applications, setApplications] = useState([])
  const [isLoadingApps, setIsLoadingApps] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState(null)

  const fetchEvents = async () => {
    if (!user) return
    try {
      const res = await fetch(`${API_BASE}/api/events/mentor/${user.id}`)
      if (!res.ok) throw new Error('Failed to fetch events')
      const data = await res.json()
      setEvents(data)
    } catch (err) {
      toast.error('Could not load events')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [user])

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const formData = new FormData(e.target)
    let imageUrl = null
    const file = formData.get('imageFile')
    if (file && file.size > 0) {
      toast.loading('Uploading image...', { id: 'img-upload' })
      const uploadData = new FormData()
      uploadData.append('file', file)
      try {
        const uploadRes = await fetch(`${API_BASE}/api/upload/image`, { method: 'POST', body: uploadData })
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json()
          imageUrl = uploadJson.url
        } else {
          throw new Error('Upload failed')
        }
      } catch (err) {
        toast.error('Image upload failed', { id: 'img-upload' })
        setIsSubmitting(false)
        return
      }
      toast.dismiss('img-upload')
    }

    const newEvent = {
      title: formData.get('title'),
      type: formData.get('type'),
      mode: formData.get('mode') || 'Online',
      date: formData.get('date'),
      time: formData.get('time'),
      location: formData.get('location'),
      link: formData.get('link'),
      description: formData.get('description'),
      clerkId: user.id,
      postToFeed: formData.get('postToFeed') === 'on',
      imageUrl
    }

    try {
      const res = await fetch(`${API_BASE}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      })
      if (!res.ok) throw new Error('Failed to create event')
      
      toast.success('Event created successfully!')
      setIsCreateModalOpen(false)
      fetchEvents() // refresh list
    } catch (err) {
      toast.error(err.message || 'Could not create event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditEvent = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const formData = new FormData(e.target)
    let imageUrl = selectedEvent.imageUrl
    const file = formData.get('imageFile')
    if (file && file.size > 0) {
      toast.loading('Uploading new image...', { id: 'img-upload' })
      const uploadData = new FormData()
      uploadData.append('file', file)
      try {
        const uploadRes = await fetch(`${API_BASE}/api/upload/image`, { method: 'POST', body: uploadData })
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json()
          imageUrl = uploadJson.url
        } else {
          throw new Error('Upload failed')
        }
      } catch (err) {
        toast.error('Image upload failed', { id: 'img-upload' })
        setIsSubmitting(false)
        return
      }
      toast.dismiss('img-upload')
    }

    const updatedData = {
      title: formData.get('title'),
      type: formData.get('type'),
      mode: formData.get('mode') || 'Online',
      date: formData.get('date'),
      time: formData.get('time'),
      location: formData.get('location'),
      link: formData.get('link'),
      description: formData.get('description'),
      imageUrl
    }

    try {
      const res = await fetch(`${API_BASE}/api/events/${selectedEvent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      })
      if (!res.ok) throw new Error('Failed to update event')
      
      toast.success('Event updated successfully!')
      setIsEditModalOpen(false)
      setSelectedEvent(null)
      fetchEvents()
    } catch (err) {
      toast.error(err.message || 'Could not update event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDeleteEvent = (eventId) => {
    setEventToDelete(eventId)
    setIsConfirmOpen(true)
  }

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      const res = await fetch(`${API_BASE}/api/events/${eventToDelete}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete event')
      
      toast.success('Event deleted successfully!')
      setEvents(events.filter(e => e._id !== eventToDelete))
    } catch (err) {
      toast.error(err.message || 'Could not delete event')
    } finally {
      setIsConfirmOpen(false)
      setEventToDelete(null)
    }
  }

  const handleViewApplications = async (event) => {
    setSelectedEvent(event)
    setIsApplicationsModalOpen(true)
    setIsLoadingApps(true)
    try {
      const res = await fetch(`${API_BASE}/api/events/${event._id}/applications`)
      if (!res.ok) throw new Error('Failed to fetch applications')
      const data = await res.json()
      setApplications(data)
    } catch (err) {
      toast.error('Could not load applications')
    } finally {
      setIsLoadingApps(false)
    }
  }

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    event.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Events</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage workshops, masterclasses, and group sessions.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
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

      {/* Event Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((event) => (
            <div key={event._id} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-3">
                      {event.type}
                    </span>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg leading-tight mb-2 pr-12">
                      {event.title}
                    </h3>
                  </div>
                  {event.active ? (
                    <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0 absolute top-6 right-6">Upcoming</span>
                  ) : (
                    <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0 absolute top-6 right-6">Past</span>
                  )}
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{event.date ? format(new Date(event.date), 'MMM dd, yyyy') : 'TBD'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{event.location}</span>
                  </div>
                  {event.link && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <LinkIcon className="w-4 h-4 text-primary" />
                      <a href={event.link.startsWith('http') ? event.link : `https://${event.link}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline truncate">
                        {event.link}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4 text-primary" />
                    <span>{event.attendees?.length || 0} Registered</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  Created {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setSelectedEvent(event); setIsEditModalOpen(true); }}
                    className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors"
                    title="Edit Event"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => confirmDeleteEvent(event._id)}
                    className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                    title="Delete Event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleViewApplications(event)}
                    className="text-primary text-sm font-medium hover:underline ml-2"
                  >
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredEvents.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No events found.
            </div>
          )}
        </div>
      )}

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <h2 className="text-2xl font-bold text-foreground mb-1">Create New Event</h2>
            <p className="text-sm text-muted-foreground mb-6">Schedule a session with mentees.</p>
            
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Event Title</label>
                <input name="title" required type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. System Design Masterclass" />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Event Image / Banner (Optional)</label>
                  <input name="imageFile" type="file" accept="image/*" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Event Type</label>
                  <select name="type" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>Workshop</option>
                    <option>Masterclass</option>
                    <option>AMA Session</option>
                    <option>Group Mentorship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Event Mode</label>
                  <select name="mode" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Platform / Location</label>
                  <input name="location" required type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Google Meet or Library" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
                  <input name="date" required type="date" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Time</label>
                  <input name="time" required type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. 5:00 PM - 6:00 PM" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Meeting Link</label>
                <input name="link" type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. meet.google.com/abc-xyz" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description (Optional)</label>
                <textarea name="description" rows="3" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Event agenda..."></textarea>
              </div>

              <div className="bg-muted/30 border border-border/50 p-3 rounded-lg flex items-start gap-3">
                <input type="checkbox" id="postToFeedMentor" name="postToFeed" className="mt-1 w-4 h-4 accent-primary" />
                <div>
                  <label htmlFor="postToFeedMentor" className="text-sm font-medium text-foreground cursor-pointer">Post to Feed</label>
                  <p className="text-xs text-muted-foreground mt-0.5">Share this event on the main feed so everyone can see it.</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  disabled={isSubmitting}
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {isEditModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <h2 className="text-2xl font-bold text-foreground mb-6">Edit Event</h2>
            
            <form onSubmit={handleEditEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Event Title</label>
                <input name="title" defaultValue={selectedEvent.title} required type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Event Image / Banner (Optional)</label>
                  {selectedEvent.imageUrl && (
                    <div className="mb-2">
                      <img src={selectedEvent.imageUrl} alt="Current event banner" className="h-20 w-auto rounded border border-border/50 object-cover" />
                    </div>
                  )}
                  <input name="imageFile" type="file" accept="image/*" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Event Type</label>
                  <select name="type" defaultValue={selectedEvent.type} className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>Workshop</option>
                    <option>Masterclass</option>
                    <option>AMA Session</option>
                    <option>Group Mentorship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Platform or Location</label>
                  <input name="location" defaultValue={selectedEvent.location} required type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
                  <input name="date" defaultValue={selectedEvent.date ? format(new Date(selectedEvent.date), 'yyyy-MM-dd') : ''} required type="date" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Time</label>
                  <input name="time" defaultValue={selectedEvent.time} required type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Meeting Link</label>
                <input name="link" defaultValue={selectedEvent.link} type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <textarea name="description" defaultValue={selectedEvent.description} rows="3" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  disabled={isSubmitting}
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Applications Modal */}
      <AnimatePresence>
        {isApplicationsModalOpen && selectedEvent && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/50 rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border/50 flex justify-between items-start shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Attendees for {selectedEvent.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{selectedEvent.date ? format(new Date(selectedEvent.date), 'MMM dd, yyyy') : 'TBD'}</p>
                </div>
                <button onClick={() => setIsApplicationsModalOpen(false)} className="text-muted-foreground hover:bg-muted p-2 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {isLoadingApps ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground opacity-50 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No Registrations Yet</h3>
                    <p className="text-muted-foreground text-sm">Users who register will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map(app => (
                      <div key={app._id} className="border border-border/50 rounded-xl p-4 bg-background flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img 
                            src={app.applicant?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.applicant?.name || 'User')}`} 
                            alt="Applicant" 
                            className="w-12 h-12 rounded-full border border-border/50 object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground">{app.applicant?.name || 'Unknown User'}</h4>
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded">
                                {app.applicantRole}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{app.applicant?.email}</p>
                            {app.applicant?.phone && (
                              <p className="text-xs text-muted-foreground mt-0.5">Phone: {app.applicant.phone}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteEvent}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
      />

    </div>
  )
}

export default MentorEvents
