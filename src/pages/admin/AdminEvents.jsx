import AdminSpinner from '../../components/admin/AdminSpinner'
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Calendar, MapPin, Loader2, Globe, X, Pause, CheckCircle2, Search, Eye, AlertTriangle, Clock, Users, ExternalLink, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import RemarkModal from '../../components/modals/RemarkModal'
import ModalPortal from '../../components/modals/ModalPortal'
import { useUser } from '@clerk/clerk-react'
import API_BASE from '../../utils/api'
import ImageInputWithUrl from '../../components/common/ImageInputWithUrl'


const isEventExpired = (event) => {
  if (!event || !event.date) return false;
  const eventDate = new Date(event.date);
  return eventDate.getTime() < new Date().setHours(0, 0, 0, 0);
};

const isRegistrationClosed = (event) => {
  if (!event) return false;
  if (event.lastRegDate) {
    const deadline = new Date(event.lastRegDate);
    deadline.setHours(23, 59, 59, 999);
    return deadline.getTime() < Date.now();
  }
  return isEventExpired(event);
};

const AdminEvents = () => {
  const navigate = useNavigate()
  const { user } = useUser()
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  
  // Remark Modal state
  const [remarkModal, setRemarkModal] = useState({ isOpen: false, action: null, target: null, title: '', placeholder: '', buttonText: '' })
  const [viewEventModal, setViewEventModal] = useState({ isOpen: false, event: null })
  const [eventApplications, setEventApplications] = useState([])
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)

  // Form fields state
  const [title, setTitle] = useState('')
  const [type, setType] = useState('Workshop')
  const [mode, setMode] = useState('Online') // 'Online' | 'Offline'
  const [date, setDate] = useState('')
  const [lastRegDate, setLastRegDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [link, setLink] = useState('')
  const [description, setDescription] = useState('')
  const [postToFeed, setPostToFeed] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchEvents = async () => {
    try {
      setIsLoading(true)
      // First try dedicated admin events endpoint
      const adminRes = await fetch(`${API_BASE}/api/admin/events`)
      if (adminRes.ok) {
        const adminData = await adminRes.json()
        if (adminData.success && Array.isArray(adminData.events)) {
          setEvents(adminData.events)
          return
        }
      }
      const res = await fetch(`${API_BASE}/api/events?category=all&admin_override=true`)
      if (res.ok) {
        const data = await res.json()
        setEvents(Array.isArray(data) ? data : [])
      } else {
        toast.error('Failed to load events')
      }
    } catch (err) {
      console.error(err)
      toast.error('Error fetching events')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (!viewEventModal.isOpen || !viewEventModal.event) {
      setEventApplications([])
      return
    }
    const eventId = viewEventModal.event._id || viewEventModal.event.id
    if (!eventId) return

    let isMounted = true
    setIsLoadingApplications(true)

    // Try admin attendees endpoint first
    fetch(`${API_BASE}/api/admin/events/${eventId}/attendees`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!isMounted) return
        if (data && data.success) {
          if (data.event) {
            setViewEventModal(prev => ({
              ...prev,
              event: { ...prev.event, ...data.event }
            }))
          }
          setEventApplications(Array.isArray(data.applications) ? data.applications : [])
        } else {
          // Fallback to /api/events/:id/applications
          fetch(`${API_BASE}/api/events/${eventId}/applications?admin_override=true`)
            .then(r => r.ok ? r.json() : [])
            .then(appData => {
              if (isMounted) setEventApplications(Array.isArray(appData) ? appData : [])
            })
        }
      })
      .catch(err => console.error('Error loading event attendees:', err))
      .finally(() => {
        if (isMounted) setIsLoadingApplications(false)
      })

    return () => { isMounted = false }
  }, [viewEventModal.isOpen, viewEventModal.event?._id, viewEventModal.event?.id])

  const resetForm = () => {
    setTitle('')
    setType('Workshop')
    setMode('Online')
    setDate('')
    setLastRegDate('')
    setStartTime('')
    setEndTime('')
    setLocation('')
    setLink('')
    setDescription('')
    setPostToFeed(false)
    setImageFile(null)
    setImageUrl('')
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
    setLastRegDate(event.lastRegDate ? new Date(event.lastRegDate).toISOString().split('T')[0] : '')
    
    // Parse existing time string
    let parsedStartTime = '';
    let parsedEndTime = '';
    if (event.time && event.time.includes('-')) {
      const parts = event.time.split('-');
      parsedStartTime = parts[0].trim().replace(/\s*(AM|PM)/i, '');
      parsedEndTime = parts[1].trim().replace(/\s*(AM|PM)/i, '');
    }
    setStartTime(parsedStartTime)
    setEndTime(parsedEndTime)
    
    setLocation(event.location || '')
    setLink(event.link || '')
    setDescription(event.description || '')
    setImageUrl(event.imageUrl || '')
    setImageFile(null)
    setOrganizerId(event.organizer?._id || event.organizer?.id || '')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !date || !startTime || !endTime) {
      toast.error('Please fill in title, date, and times.')
      return
    }

    setIsSubmitting(true)
    try {
      let uploadedImageUrl = imageUrl.trim() || editingEvent?.imageUrl || null;
      
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
          console.error(err)
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
        lastRegDate: lastRegDate || null,
        time: `${startTime} - ${endTime}`,
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
      console.error(err)
      toast.error('Failed to save event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = (id, name) => {
    setRemarkModal({
      isOpen: true,
      action: 'delete',
      target: { id, name },
      title: 'Delete Event',
      placeholder: 'Enter reason for deletion...',
      buttonText: 'Delete'
    })
  }

  const handleStatusChange = (id, nextStatus) => {
    setRemarkModal({
      isOpen: true,
      action: nextStatus,
      target: { id },
      title: `Confirm Action: ${nextStatus}`,
      placeholder: `Enter remark for ${nextStatus}...`,
      buttonText: 'Confirm'
    })
  }

  const handleRemarkSubmit = async (remark) => {
    const { action, target } = remarkModal
    
    if (action === 'delete') {
      try {
        const res = await fetch(`${API_BASE}/api/admin/moderate/event/${target.id}?remark=${encodeURIComponent(remark)}`, { method: 'DELETE' })
        if (res.ok) {
          toast.success('Event cancelled & deleted successfully.')
          setEvents(events.filter(e => e._id !== target.id))
        } else {
          toast.error('Failed to delete event')
        }
      } catch (err) {
        console.error(err)
        toast.error('Error deleting event')
      }
    } else {
      try {
        const res = await fetch(`${API_BASE}/api/admin/moderate/event/${target.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: action, remark })
        })

        const data = await res.json()
        if (res.ok && data.success) {
          setEvents(prev => prev.map(e => e._id === target.id ? { ...e, moderationStatus: action } : e))
          toast.success(`Event status changed to ${action}`)
        } else {
          toast.error(data.message || 'Failed to update event status')
        }
      } catch (err) {
        console.error('Error updating status:', err)
        toast.error('Failed to communicate with server')
      }
    }
    
    setRemarkModal({ isOpen: false, action: null, target: null, title: '', placeholder: '', buttonText: '' })
  }

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title?.toLowerCase().includes(search.toLowerCase()) || 
                          e.description?.toLowerCase().includes(search.toLowerCase()) ||
                          e.location?.toLowerCase().includes(search.toLowerCase()) ||
                          (e.organizer?.name && e.organizer.name.toLowerCase().includes(search.toLowerCase()))
    
    let matchesStatus = true
    if (statusFilter === 'Active') matchesStatus = e.moderationStatus !== 'paused' && !isEventExpired(e)
    else if (statusFilter === 'Paused') matchesStatus = e.moderationStatus === 'paused'
    else if (statusFilter === 'Expired') matchesStatus = isEventExpired(e)
    else if (statusFilter === 'Upcoming') matchesStatus = !isEventExpired(e)
    else if (statusFilter === 'RegClosed') matchesStatus = isRegistrationClosed(e)

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Events Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Create, pause/hold, and manage campus events and workshops.</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button 
            onClick={fetchEvents}
            disabled={isLoading}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-muted border border-border/60 text-foreground hover:bg-muted/80 transition-all flex items-center gap-1.5"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Refresh
          </button>
          <button 
            onClick={handleOpenCreateModal}
            className="bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 flex items-center gap-2 transition-all shadow-md shadow-primary/10 text-sm"
          >
            <Plus className="w-4.5 h-4.5" /> Create Event
          </button>
        </div>
      </div>

      {/* Sticky Header: Search & Filter Bar */}
      <div className="sticky top-16 z-30 bg-background pt-2 pb-3 -mx-4 sm:-mx-8 px-4 sm:px-8 border-b border-border/40 shadow-sm transition-all">
        <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search events by title, location, or organizer..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-foreground text-xs font-semibold focus:outline-none cursor-pointer appearance-none min-w-[150px] w-full md:w-auto"
          >
            <option value="All">All Events &amp; Status</option>
            <option value="Upcoming">🟢 Upcoming Events</option>
            <option value="Expired">🔴 Expired Events</option>
            <option value="RegClosed">⚠️ Registration Closed</option>
            <option value="Active">Active (Unpaused)</option>
            <option value="Paused">Paused / Held</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <AdminSpinner message="Loading events from database..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto">
              <thead className="bg-card border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground shadow-sm">
                <tr className="bg-muted/40">
                  <th className="px-4 py-3.5">Event</th>
                  <th className="px-3 py-3.5 whitespace-nowrap">Mode &amp; Type</th>
                  <th className="px-3 py-3.5 whitespace-nowrap">Schedule &amp; Reg Deadline</th>
                  <th className="px-3 py-3.5 whitespace-nowrap">Registrations</th>
                  <th className="px-3 py-3.5 whitespace-nowrap">Status &amp; Expiry</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <tr 
                      key={event._id} 
                      onClick={() => setViewEventModal({ isOpen: true, event })}
                      className="hover:bg-muted/10 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-bold text-foreground">
                        <div className="flex items-center gap-3 min-w-0">
                          {event.imageUrl ? (
                            <img 
                              src={event.imageUrl} 
                              alt={event.title} 
                              className="rounded-xl object-cover border border-border/40 shrink-0" 
                              style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' }}
                            />
                          ) : (
                            <div 
                              className="rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0"
                              style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' }}
                            >
                              <Calendar className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0 max-w-[200px] sm:max-w-[260px]">
                            <p className="font-bold text-foreground truncate text-sm" title={event.title}>{event.title}</p>
                            {event.organizer ? (
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const target = event.organizer.username || event.organizer.clerkId || event.organizer._id || event.organizer.id;
                                  if (target) navigate(`/admin/users/${target}`);
                                }}
                                className="text-xs text-primary hover:underline font-semibold block truncate cursor-pointer transition-colors"
                                title="Click to view organizer profile"
                              >
                                Hosted by {event.organizer.firstName || event.organizer.name || 'Mentor'}
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground block truncate">
                                Hosted by CampusBridge
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            event.mode === 'Offline' || (event.location && !event.mode)
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {event.mode === 'Offline' || (event.location && !event.mode) ? (
                              <><MapPin className="w-3 h-3" /> Offline</>
                            ) : (
                              <><Globe className="w-3 h-3" /> Online</>
                            )}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-medium">{event.type || 'Event'}</span>
                        </div>
                      </td>
                      {/* Schedule & Reg Deadline */}
                      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}</span>
                            {event.time && <span className="text-[11px] text-muted-foreground font-normal">({event.time})</span>}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                            {event.lastRegDate ? (
                              (() => {
                                const isRegEnded = new Date(event.lastRegDate).setHours(23, 59, 59, 999) < Date.now();
                                return isRegEnded ? (
                                  <span className="text-rose-500 dark:text-rose-400 font-bold">
                                    Last Reg: {new Date(event.lastRegDate).toLocaleDateString()} (Closed)
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    Last Reg: {new Date(event.lastRegDate).toLocaleDateString()}
                                  </span>
                                );
                              })()
                            ) : (
                              <span className="text-muted-foreground/60">No deadline set</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Registrations count */}
                      <td className="px-3 py-3 whitespace-nowrap text-foreground text-xs font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1 rounded-md bg-primary/10 text-primary">
                            <Users className="w-3.5 h-3.5" />
                          </span>
                          <span>{event.attendees?.length || 0} Registered</span>
                        </div>
                      </td>

                      {/* Status & Expiry */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {/* Expiry Pill */}
                          {isEventExpired(event) ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Expired
                            </span>
                          ) : isRegistrationClosed(event) ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Reg Closed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Upcoming
                            </span>
                          )}

                          {/* Moderation Pill */}
                          {event.moderationStatus === 'paused' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              Paused
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-muted-foreground">
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right space-x-1 shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setViewEventModal({ isOpen: true, event }); }}
                          className="p-1.5 text-sky-500 hover:bg-sky-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {event.moderationStatus !== 'paused' ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(event._id, 'paused'); }}
                            className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Pause / Hold Event"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(event._id, 'approved'); }}
                            className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Resume Event"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); confirmDelete(event._id, event.title); }}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-muted-foreground">
                      No events found matching current filter.
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
        <ModalPortal>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-card border border-border/50 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center shrink-0 bg-card">
                <h2 className="text-xl font-bold text-foreground">
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </h2>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                <div>
                  <ImageInputWithUrl
                    label="Event Image / Banner (Optional)"
                    value={imageUrl}
                    onChangeUrl={(val) => setImageUrl(val)}
                    onChangeFile={(file) => setImageFile(file)}
                    onClear={() => { setImageUrl(''); setImageFile(null); }}
                    placeholder="https://images.unsplash.com/..."
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Event Date</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-background border border-border/50 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                      Last Registration Date <span className="lowercase font-normal text-muted-foreground/80">(Deadline)</span>
                    </label>
                    <input
                      type="date"
                      value={lastRegDate}
                      onChange={(e) => setLastRegDate(e.target.value)}
                      className="w-full bg-background border border-border/50 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-background border border-border/50 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">End Time</label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
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
              </div>

              {/* Modal Footer with Actions */}
              <div className="px-6 py-4 border-t border-border/50 flex gap-3 shrink-0 bg-card">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* View Details Modal */}
      {viewEventModal.isOpen && viewEventModal.event && (
        <ModalPortal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden border border-border/50">
              <div className="flex items-center justify-between p-5 border-b border-border/50 bg-muted/20 shrink-0">
                <h2 className="text-lg font-bold text-foreground">Event Details</h2>
                <button 
                  onClick={() => setViewEventModal({ isOpen: false, event: null })}
                  className="p-1.5 hover:bg-muted rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              <div className="p-0 overflow-y-auto flex-1">
                {/* Event Banner */}
                {viewEventModal.event.imageUrl && (
                  <div className="w-full h-48 bg-muted shrink-0 relative border-b border-border/30">
                    <img 
                      src={viewEventModal.event.imageUrl} 
                      alt={viewEventModal.event.title} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute top-4 right-4 p-3 bg-black/50 backdrop-blur-md rounded-full text-3xl leading-none shadow-sm">📅</div>
                  </div>
                )}

                <div className="p-6 space-y-6">
                  {(() => {
                    const isExp = isEventExpired(viewEventModal.event);
                    const isRegDone = isRegistrationClosed(viewEventModal.event);

                    return (
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-black text-foreground leading-tight">{viewEventModal.event.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className="inline-block text-xs uppercase font-bold tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                            {viewEventModal.event.type || 'Event'}
                          </span>
                          <span className={`inline-block text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full border ${viewEventModal.event.mode === 'Offline' || (!viewEventModal.event.mode && viewEventModal.event.location) ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-sky-500/10 text-sky-500 border-sky-500/20'}`}>
                            {viewEventModal.event.mode === 'Offline' || (!viewEventModal.event.mode && viewEventModal.event.location) ? 'Offline' : 'Online'}
                          </span>
                          
                          {/* Expiration Status Badge */}
                          {isExp ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Event Expired
                            </span>
                          ) : isRegDone ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              <span className="w-2 h-2 rounded-full bg-amber-500" /> Registration Closed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active &amp; Upcoming
                            </span>
                          )}

                          {viewEventModal.event.moderationStatus === 'paused' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              Paused / Held
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 4 Key Details Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Event Date & Time */}
                    <div className="bg-muted/30 p-4 rounded-xl border border-border/40">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="w-4 h-4 text-primary"/> 
                        <span className="text-xs font-bold uppercase tracking-wider">Event Date &amp; Time</span>
                      </div>
                      <p className="font-semibold text-foreground text-sm">
                        {viewEventModal.event.date ? new Date(viewEventModal.event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                        {viewEventModal.event.time ? ` at ${viewEventModal.event.time}` : ''}
                      </p>
                      <p className="text-[11px] mt-1">
                        {isEventExpired(viewEventModal.event) ? (
                          <span className="text-rose-500 font-bold">Event date has passed (Expired)</span>
                        ) : (
                          <span className="text-emerald-500 font-medium">Scheduled in future</span>
                        )}
                      </p>
                    </div>

                    {/* Registration Deadline (lastRegDate) */}
                    <div className="bg-muted/30 p-4 rounded-xl border border-border/40">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Clock className="w-4 h-4 text-amber-500"/> 
                        <span className="text-xs font-bold uppercase tracking-wider">Registration Deadline (Last Date)</span>
                      </div>
                      <p className="font-semibold text-foreground text-sm">
                        {viewEventModal.event.lastRegDate 
                          ? new Date(viewEventModal.event.lastRegDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) 
                          : 'No Deadline Specified (Open until Event)'}
                      </p>
                      <p className="text-[11px] mt-1">
                        {isRegistrationClosed(viewEventModal.event) ? (
                          <span className="text-rose-500 font-bold">Registration has ended</span>
                        ) : (
                          <span className="text-emerald-500 font-medium">Currently accepting registrations</span>
                        )}
                      </p>
                    </div>

                    {/* Location or Meeting Link */}
                    <div className="bg-muted/30 p-4 rounded-xl border border-border/40">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <MapPin className="w-4 h-4 text-sky-500"/> 
                        <span className="text-xs font-bold uppercase tracking-wider">Location / Meeting Link</span>
                      </div>
                      <p className="font-semibold text-foreground truncate text-sm" title={viewEventModal.event.location || viewEventModal.event.link}>
                        {viewEventModal.event.location || viewEventModal.event.link || 'TBD'}
                      </p>
                      {viewEventModal.event.link && (
                        <a 
                          href={viewEventModal.event.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-1 font-medium"
                        >
                          Join URL <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Registration Status Count */}
                    <div className="bg-muted/30 p-4 rounded-xl border border-border/40">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Users className="w-4 h-4 text-purple-500"/> 
                        <span className="text-xs font-bold uppercase tracking-wider">Total Registered Users</span>
                      </div>
                      <p className="font-bold text-foreground text-lg">
                        {viewEventModal.event.attendees?.length || eventApplications?.length || 0}
                        <span className="text-xs font-normal text-muted-foreground ml-1.5">Registered</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {isRegistrationClosed(viewEventModal.event) ? 'Registration Closed' : 'Accepting participants'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/20 p-5 rounded-xl border border-border/40 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/20 shrink-0 flex items-center justify-center">
                      {viewEventModal.event.organizer?.imageUrl ? (
                        <img src={viewEventModal.event.organizer.imageUrl} alt="Host" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-primary text-xl">
                          {(viewEventModal.event.organizer?.name || 'M')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Hosted By</p>
                      <p className="font-bold text-foreground text-lg">{viewEventModal.event.organizer?.name || 'CampusBridge Mentor'}</p>
                    </div>
                  </div>

                  {viewEventModal.event.description && (
                    <div>
                      <h4 className="font-bold text-foreground mb-2">About Event</h4>
                      <div className="bg-muted/10 p-4 rounded-xl border border-border/20 text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                        {viewEventModal.event.description}
                      </div>
                    </div>
                  )}

                  {/* Registered Attendees Section ("ke ke reg krlo") */}
                  {(() => {
                    const attendeesMap = new Map();

                    // 1. Process attendees array from event object
                    if (Array.isArray(viewEventModal.event.attendees)) {
                      viewEventModal.event.attendees.forEach(att => {
                        if (att && typeof att === 'object') {
                          const key = att.clerkId || att._id || att.id || att.username;
                          if (key) {
                            attendeesMap.set(String(key), {
                              ...att,
                              name: att.name || `${att.firstName || ''} ${att.lastName || ''}`.trim() || att.username || 'Participant',
                              email: att.email || '',
                              imageUrl: att.imageUrl || '',
                              role: att.role || 'Attendee',
                              headline: att.headline || '',
                              username: att.username || att.clerkId || att._id
                            });
                          }
                        }
                      });
                    }

                    // 2. Process applications list from backend
                    if (Array.isArray(eventApplications)) {
                      eventApplications.forEach(app => {
                        const userObj = app.applicant || {};
                        const key = userObj.clerkId || userObj._id || userObj.id || userObj.username || app._id;
                        if (key) {
                          const existing = attendeesMap.get(String(key)) || {};
                          attendeesMap.set(String(key), {
                            ...existing,
                            ...userObj,
                            name: app.applicantDetails?.name || existing.name || userObj.name || `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || 'Participant',
                            email: app.applicantDetails?.email || existing.email || userObj.email || '',
                            phone: app.applicantDetails?.phone || existing.phone || userObj.phone || '',
                            rollNumber: app.applicantDetails?.rollNumber || existing.rollNumber || '',
                            role: app.applicantRole || existing.role || userObj.role || 'Student',
                            appliedAt: app.createdAt || existing.appliedAt,
                            status: app.status || existing.status || 'Registered'
                          });
                        }
                      });
                    }

                    const allAttendees = Array.from(attendeesMap.values());

                    return (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <span>👥 Registered Users &amp; Participants</span>
                            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                              {allAttendees.length}
                            </span>
                          </h4>
                          {isLoadingApplications && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> Loading registrations...
                            </span>
                          )}
                        </div>

                        {allAttendees.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                            {allAttendees.map((att, attIdx) => {
                              const dp = att.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(att.name || att.firstName || 'User')}&background=random`;
                              const targetUser = att.username || att.clerkId || att._id || att.id;
                              return (
                                <div 
                                  key={att._id || att.clerkId || attIdx}
                                  className="flex items-center justify-between gap-3 p-3 bg-muted/20 hover:bg-muted/40 rounded-xl border border-border/40 transition-colors"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <img 
                                      src={dp} 
                                      alt={att.name || 'User'} 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (targetUser) navigate(`/admin/users/${targetUser}`);
                                      }}
                                      className="w-10 h-10 rounded-full object-cover border border-border/50 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/60 transition-all shadow-xs"
                                      title="Click to view user profile"
                                    />
                                    <div className="min-w-0">
                                      <p 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (targetUser) navigate(`/admin/users/${targetUser}`);
                                        }}
                                        className="font-bold text-foreground text-sm truncate hover:text-primary cursor-pointer transition-colors"
                                        title={att.name || 'Participant'}
                                      >
                                        {att.name || 'Participant'}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground truncate" title={att.email || att.headline || att.role}>
                                        {att.email || att.headline || (att.role ? `Role: ${att.role}` : 'Registered Participant')}
                                      </p>
                                      {att.phone && (
                                        <p className="text-[10px] text-muted-foreground/70 truncate">📞 {att.phone}</p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                      Confirmed
                                    </span>
                                    {att.appliedAt && (
                                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                                        {new Date(att.appliedAt).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-6 rounded-xl bg-muted/10 border border-border/30 text-center text-xs text-muted-foreground space-y-1">
                            <Users className="w-6 h-6 mx-auto opacity-40 mb-1" />
                            <p className="font-semibold text-foreground/80">No users have registered for this event yet.</p>
                            <p className="text-[11px] text-muted-foreground">When users apply or register, they will appear here with clickable profiles.</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              <div className="p-4 border-t border-border/50 bg-muted/10 flex justify-end shrink-0">
                <button 
                  onClick={() => setViewEventModal({ isOpen: false, event: null })}
                  className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all cursor-pointer shadow-md shadow-primary/10"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      <RemarkModal
        isOpen={remarkModal.isOpen}
        onClose={() => setRemarkModal({ ...remarkModal, isOpen: false })}
        onSubmit={handleRemarkSubmit}
        title={remarkModal.title}
        placeholder={remarkModal.placeholder}
        actionLabel={remarkModal.buttonText}
      />
    </div>
  )
}

export default AdminEvents
