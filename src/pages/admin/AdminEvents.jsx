import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, Calendar, Video, MapPin, Loader2, Globe, Clock, X } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/modals/ConfirmModal'
import { useUser } from '@clerk/clerk-react'
import API_BASE from '../../utils/api'

const AdminEvents = () => {
  const { user } = useUser()
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  
  // Confirm Modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Form fields state
  const [title, setTitle] = useState('')
  const [type, setType] = useState('Workshop')
  const [mode, setMode] = useState('Online') // 'Online' | 'Offline'
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [link, setLink] = useState('')
  const [description, setDescription] = useState('')
  const [postToFeed, setPostToFeed] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchEvents = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE}/api/events?category=event`)
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
      } else {
        toast.error('Failed to load events')
      }
    } catch (err) {
      toast.error('Error fetching events')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const resetForm = () => {
    setTitle('')
    setType('Workshop')
    setMode('Online')
    setDate('')
    setTime('')
    setLocation('')
    setLink('')
    setDescription('')
    setPostToFeed(false)
    setImageFile(null)
    setEditingEvent(null)
  }

  const handleOpenCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (event) => {
    setEditingEvent(event)
    setTitle(event.title || '')
    setType(event.type || 'Workshop')
    setMode(event.mode || (event.location ? 'Offline' : 'Online'))
    setDate(event.date ? new Date(event.date).toISOString().split('T')[0] : '')
    setTime(event.time || '')
    setLocation(event.location || '')
    setLink(event.link || '')
    setDescription(event.description || '')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !date || !time) {
      toast.error('Please fill in title, date, and time.')
      return
    }

    setIsSubmitting(true)
    try {
      let uploadedImageUrl = editingEvent?.imageUrl || null;
      
      if (imageFile) {
        toast.loading('Uploading image...', { id: 'img-upload' })
        const uploadData = new FormData()
        uploadData.append('file', imageFile)
        try {
          const uploadRes = await fetch(`${API_BASE}/api/upload/image`, { method: 'POST', body: uploadData })
          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json()
            uploadedImageUrl = uploadJson.url
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

      const payload = {
        title,
        type,
        mode,
        date,
        time,
        location: mode === 'Offline' ? location : '',
        link: mode === 'Online' ? link : '',
        description,
        clerkId: user?.id,
        postToFeed,
        imageUrl: uploadedImageUrl
      }

      let res;
      if (editingEvent) {
        res = await fetch(`${API_BASE}/api/events/${editingEvent._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch(`${API_BASE}/api/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      if (res.ok) {
        toast.success(editingEvent ? 'Event updated successfully!' : 'Event created successfully!')
        setIsModalOpen(false)
        resetForm()
        fetchEvents()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || 'Operation failed')
      }
    } catch (err) {
      toast.error('Failed to save event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = (id, name) => {
    setDeleteTarget({ id, name })
    setIsConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API_BASE}/api/events/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Event cancelled & deleted successfully.')
        setEvents(events.filter(e => e._id !== deleteTarget.id))
      } else {
        toast.error('Failed to delete event')
      }
    } catch (err) {
      toast.error('Error deleting event')
    } finally {
      setIsConfirmOpen(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Events Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage both Online and Offline campus events.</p>
        </div>
        <button 
          onClick={handleOpenCreateModal}
          className="bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 flex items-center gap-2 transition-all shadow-md shadow-primary/10 text-sm self-start sm:self-auto"
        >
          <Plus className="w-4.5 h-4.5" /> Create Event
        </button>
      </div>

      {/* Events Table */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Mode & Type</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Registrations</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {events.map((event) => (
                  <tr key={event._id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="font-bold text-foreground">{event.title}</p>
                          <p className="text-xs text-muted-foreground font-normal line-clamp-1">{event.description || 'No description'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 w-fit px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          event.mode === 'Offline' || (event.location && !event.mode)
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {event.mode === 'Offline' || (event.location && !event.mode) ? (
                            <><MapPin className="w-3 h-3" /> Offline ({event.location || 'Campus Venue'})</>
                          ) : (
                            <><Globe className="w-3 h-3" /> Online {event.link ? 'Meeting' : ''}</>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">{event.type || 'Event'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <p className="font-medium text-foreground">{event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}</p>
                      <p className="text-xs">{event.time || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-foreground font-semibold">
                      {event.attendees?.length || 0} Registered
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button 
                        onClick={() => handleOpenEditModal(event)}
                        className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Edit Event"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => confirmDelete(event._id, event.title)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Cancel Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-muted-foreground">
                      No events found. Create your first event!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Create / Edit Event */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Event Image / Banner (Optional)</label>
                {editingEvent?.imageUrl && (
                  <div className="mb-2">
                    <img src={editingEvent.imageUrl} alt="Current event banner" className="h-20 w-auto rounded border border-border/50 object-cover" />
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full bg-background border border-border/50 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AI & ML Workshop"
                  className="w-full bg-background border border-border/50 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Event Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-background border border-border/50 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Masterclass">Masterclass</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Career Fair">Career Fair</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Seminar">Seminar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Event Mode</label>
                  <div className="flex bg-muted p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setMode('Online')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
                        mode === 'Online' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" /> Online
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('Offline')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
                        mode === 'Offline' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" /> Offline
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-background border border-border/50 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Time</label>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. 10:00 AM - 12:00 PM"
                    className="w-full bg-background border border-border/50 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {mode === 'Offline' ? (
                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Campus Location / Venue</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Auditorium Hall A, Block 3, Main Campus"
                    className="w-full bg-background border border-border/50 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Meeting Link (Optional)</label>
                  <input
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="e.g. https://meet.google.com/abc-defg-hij"
                    className="w-full bg-background border border-border/50 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Description / Agenda</label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe event details, agenda, requirements..."
                  className="w-full bg-background border border-border/50 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                ></textarea>
              </div>

              {!editingEvent && (
                <div className="bg-muted/30 border border-border/50 p-3 rounded-lg flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="postToFeedAdmin" 
                    checked={postToFeed}
                    onChange={(e) => setPostToFeed(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-primary" 
                  />
                  <div>
                    <label htmlFor="postToFeedAdmin" className="text-sm font-medium text-foreground cursor-pointer">Post to Feed</label>
                    <p className="text-xs text-muted-foreground mt-0.5">Share this event on the main feed so everyone can see it.</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-xl font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Cancel Event"
        message={`Are you sure you want to cancel event "${deleteTarget?.name}"?`}
      />
    </div>
  )
}

export default AdminEvents
