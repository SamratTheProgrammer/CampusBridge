import React, { useState, useEffect } from 'react'
import SessionSkeleton from '../../components/skeletons/SessionSkeleton'
import { Plus, Calendar, Clock, MapPin, Users, Link as LinkIcon, Search, Loader2, X, Edit, Trash2, Globe, Video, BookOpen, Check, Upload, CheckCircle2, ExternalLink, Share2, ChevronRight, Wifi, ArrowRight, Laptop } from 'lucide-react'
import toast from 'react-hot-toast'
import { useUser } from '@clerk/clerk-react'
import { formatDistanceToNow, format } from 'date-fns'
import { formatPendingRequestTime } from '../../utils/dateFormatter'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmModal from '../../components/modals/ConfirmModal'
import ModalPortal from '../../components/modals/ModalPortal'
import ShareModal from '../../components/modals/ShareModal'
import ImageCropModal from '../../components/ImageCropModal'
import defaultPP from '../../assets/default_pp.png'
import API_BASE from '../../utils/api'

const MentorSessions = () => {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('events') // 'events' | 'available-events' | 'sessions' | 'one-on-one'
  const [timeFilter, setTimeFilter] = useState('upcoming') // 'upcoming' | 'completed'
  const [searchQuery, setSearchQuery] = useState('')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareConfig, setShareConfig] = useState(null)

  const handleShareEvent = (e, event) => {
    e.preventDefault();
    e.stopPropagation();
    setShareConfig({
      shareUrl: `${window.location.origin}/dashboard/events/${event._id}`,
      shareType: 'event',
      itemId: event._id
    });
    setIsShareModalOpen(true);
  };

  const checkIsPast = (dateStr, timeStr) => {
    if (!dateStr) return false;
    try {
      let actualTimeStr = timeStr || '';
      if (actualTimeStr.includes('-')) {
        const parts = actualTimeStr.split('-');
        actualTimeStr = parts[1].trim() || parts[0].trim();
      }
      
      let time24 = actualTimeStr;
      if (actualTimeStr && actualTimeStr.match(/AM|PM/i)) {
        const match = actualTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          let [_, hours, mins, modifier] = match;
          hours = parseInt(hours, 10);
          if (hours === 12) hours = 0;
          if (modifier.toUpperCase() === 'PM') hours += 12;
          time24 = `${hours.toString().padStart(2, '0')}:${mins}:00`;
        }
      } else if (actualTimeStr) {
        let parts = actualTimeStr.split(':');
        let hours = parts[0].padStart(2, '0');
        let mins = (parts[1] || '00').padStart(2, '0');
        time24 = `${hours}:${mins}:00`;
      } else {
        time24 = '23:59:59';
      }
      
      const sessionDate = new Date(`${dateStr.split('T')[0]}T${time24}`);
      if (isNaN(sessionDate.getTime())) return false;
      return sessionDate < new Date();
    } catch (e) {
      return false;
    }
  }
  
  // Available platform events
  const [availableEvents, setAvailableEvents] = useState([])
  const [isLoadingAvailableEvents, setIsLoadingAvailableEvents] = useState(false)
  const [selectedAvailableEvent, setSelectedAvailableEvent] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [userDbData, setUserDbData] = useState(null)
  const [isRegistering, setIsRegistering] = useState(false)

  // Hosted group sessions / events created by mentor
  const [hostedSessions, setHostedSessions] = useState([])
  // 1-on-1 booked sessions
  const [individualSessions, setIndividualSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createCategory, setCreateCategory] = useState(null)
  const [sessionMode, setSessionMode] = useState('Online')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isApplicationsModalOpen, setIsApplicationsModalOpen] = useState(false)
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false)
  
  const [sessionToAccept, setSessionToAccept] = useState(null)
  const [selectedSession, setSelectedSession] = useState(null)
  const [registeredStudents, setRegisteredStudents] = useState([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState(null)
  
  // Image cropping state
  const [cropModalData, setCropModalData] = useState(null)
  const [croppedImageBlob, setCroppedImageBlob] = useState(null)
  const [croppedImagePreview, setCroppedImagePreview] = useState(null)
  const [sessionImageUrl, setSessionImageUrl] = useState('')
  const [editSessionImageUrl, setEditSessionImageUrl] = useState('')

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setCropModalData({
          src: reader.result,
          fileType: file.type
        })
      }
      reader.readAsDataURL(file)
    }
    // Clear input so selecting same file again triggers onChange
    e.target.value = ''
  }

  const handleCropComplete = async (croppedBlob) => {
    setCroppedImageBlob(croppedBlob)
    const previewUrl = URL.createObjectURL(croppedBlob)
    setCroppedImagePreview(previewUrl)
    setCropModalData(null)
  }

  const fetchSessions = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      // Fetch mentor's hosted sessions / masterclasses
      const hostedRes = await fetch(`${API_BASE}/api/events/mentor/${user.id}`)
      if (hostedRes.ok) {
        const hostedData = await hostedRes.json()
        setHostedSessions(hostedData)
      }

      // Fetch 1-on-1 sessions
      const indivRes = await fetch(`${API_BASE}/api/sessions/user/${user.id}`)
      if (indivRes.ok) {
        const indivData = await indivRes.json()
        setIndividualSessions(indivData)
      }
    } catch (err) {
      toast.error('Could not load sessions')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableEvents = async () => {
    try {
      setIsLoadingAvailableEvents(true)
      const res = await fetch(`${API_BASE}/api/events?category=event`)
      if (res.ok) {
        const data = await res.json()
        setAvailableEvents(data)
      }
    } catch (err) {
      console.error('Failed to load available events:', err)
    } finally {
      setIsLoadingAvailableEvents(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetch(`${API_BASE}/api/users/${user.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setUserDbData(data) })
        .catch(() => {})
    }
  }, [user])

  useEffect(() => {
    fetchSessions()
    fetchAvailableEvents()
  }, [user])

  const handleSessionAction = async (id, status, meetingLink = '') => {
    try {
      const payload = { status };
      if (meetingLink) payload.meetingLink = meetingLink;

      const res = await fetch(`${API_BASE}/api/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success(`Session ${status} successfully!`)
        fetchSessions()
      } else {
        toast.error('Failed to update session status')
      }
    } catch (err) {
      toast.error('An error occurred')
    }
  }

  const handleAcceptSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const meetingLink = formData.get('meetingLink');
    await handleSessionAction(sessionToAccept._id, 'accepted', meetingLink);
    setIsAcceptModalOpen(false);
    setSessionToAccept(null);
  }

  const handleCreateSession = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const formData = new FormData(e.target)
    let imageUrl = sessionImageUrl.trim() || formData.get('imageUrl')?.trim() || null
    
    if (croppedImageBlob) {
      toast.loading('Uploading image...', { id: 'img-upload' })
      const uploadData = new FormData()
      uploadData.append('file', croppedImageBlob, 'banner.jpg')
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

    const newSession = {
      title: formData.get('title'),
      type: formData.get('type'),
      mode: formData.get('mode') || 'Online',
      date: formData.get('date'),
      time: `${formData.get('startTime')} - ${formData.get('endTime')}`,
      location: formData.get('location') || '',
      link: formData.get('link') || '',
      description: formData.get('description'),
      category: formData.get('category') || 'session',
      clerkId: user.id,
      postToFeed: formData.get('postToFeed') === 'on',
      imageUrl
    }

    try {
      const res = await fetch(`${API_BASE}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession)
      })
      if (!res.ok) throw new Error('Failed to create session')
      
      toast.success('Session created successfully!')
      setIsCreateModalOpen(false)
      setCroppedImageBlob(null)
      setCroppedImagePreview(null)
      fetchSessions()
    } catch (err) {
      toast.error(err.message || 'Could not create session')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSession = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const formData = new FormData(e.target)
    let imageUrl = editSessionImageUrl.trim() || formData.get('imageUrl')?.trim() || selectedSession.imageUrl || null
    
    if (croppedImageBlob) {
      toast.loading('Uploading new image...', { id: 'img-upload' })
      const uploadData = new FormData()
      uploadData.append('file', croppedImageBlob, 'banner.jpg')
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
      time: `${formData.get('startTime')} - ${formData.get('endTime')}`,
      location: formData.get('location'),
      link: formData.get('link'),
      description: formData.get('description'),
      postToFeed: formData.get('postToFeed') === 'on',
      imageUrl
    }

    try {
      const res = await fetch(`${API_BASE}/api/events/${selectedSession._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      })
      if (!res.ok) throw new Error('Failed to update session')
      
      toast.success('Session updated successfully!')
      setIsEditModalOpen(false)
      setSelectedSession(null)
      setCroppedImageBlob(null)
      setCroppedImagePreview(null)
      fetchSessions()
    } catch (err) {
      toast.error(err.message || 'Could not update session')
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDeleteSession = (sessionId) => {
    setSessionToDelete(sessionId)
    setIsConfirmOpen(true)
  }

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      const res = await fetch(`${API_BASE}/api/events/${sessionToDelete}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete session')
      
      toast.success('Session deleted successfully!')
      setHostedSessions(hostedSessions.filter(e => e._id !== sessionToDelete))
    } catch (err) {
      toast.error(err.message || 'Could not delete session')
    } finally {
      setIsConfirmOpen(false)
      setSessionToDelete(null)
    }
  }

  const handleViewStudents = async (session) => {
    setSelectedSession(session)
    setIsApplicationsModalOpen(true)
    setIsLoadingStudents(true)
    try {
      const res = await fetch(`${API_BASE}/api/events/${session._id}/applications`)
      if (!res.ok) throw new Error('Failed to fetch registered students')
      const data = await res.json()
      setRegisteredStudents(data)
    } catch (err) {
      toast.error('Could not load registered students')
    } finally {
      setIsLoadingStudents(false)
    }
  }

  const isUserRegisteredForEvent = (event) => {
    if (!event?.attendees) return false;
    const currentUserId = userDbData?._id;
    const currentClerkId = user?.id;
    return event.attendees.some(att => {
      if (typeof att === 'string') {
        return att === currentUserId || att === currentClerkId;
      }
      return att?._id === currentUserId || att?.clerkId === currentClerkId;
    });
  }

  const handleRegisterForEvent = async (event) => {
    if (!user) {
      toast.error('Please log in to register');
      return;
    }
    try {
      setIsRegistering(true);
      const res = await fetch(`${API_BASE}/api/events/${event._id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          applicantRole: 'mentor',
          applicantDetails: {
            name: userDbData?.name || user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Mentor',
            email: userDbData?.email || user?.primaryEmailAddress?.emailAddress || '',
            phone: userDbData?.phone || ''
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register');

      toast.success('Successfully registered for event!');
      setAvailableEvents(prev => prev.map(ev => {
        if (ev._id === event._id) {
          const attendees = ev.attendees || [];
          return { ...ev, attendees: [...attendees, userDbData?._id || user.id] };
        }
        return ev;
      }));
      if (selectedAvailableEvent && selectedAvailableEvent._id === event._id) {
        setSelectedAvailableEvent(prev => ({
          ...prev,
          attendees: [...(prev.attendees || []), userDbData?._id || user.id]
        }));
      }
    } catch (err) {
      toast.error(err.message || 'Could not register for event');
    } finally {
      setIsRegistering(false);
    }
  }

  const eventsList = hostedSessions.filter(session => session.category === 'event')
  const groupSessionsList = hostedSessions.filter(session => session.category === 'session' || !session.category)

  // Strictly ONLY available/upcoming events (past events excluded)
  const filteredAvailableEvents = availableEvents.filter(event => {
    const isPast = checkIsPast(event.date, event.time);
    if (isPast || event.active === false) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatches = event.title?.toLowerCase().includes(query) || false;
    const typeMatches = event.type?.toLowerCase().includes(query) || false;
    const locationMatches = event.location?.toLowerCase().includes(query) || false;
    const orgName = event.organizer ? (event.organizer.name || `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim()) : '';
    const organizerMatches = orgName.toLowerCase().includes(query);
    return titleMatches || typeMatches || locationMatches || organizerMatches;
  });

  const applyFilters = (list) => {
    return list.filter(session => {
      const isPast = checkIsPast(session.date, session.time);
      const matchesTime = timeFilter === 'upcoming' ? !isPast : isPast;
      const titleMatches = session.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      const typeMatches = session.type?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      return matchesTime && (titleMatches || typeMatches);
    });
  }

  const filteredEvents = applyFilters(eventsList)
  const filteredGroupSessions = applyFilters(groupSessionsList)

  const filtered1on1 = individualSessions.filter(session => {
    const isPast = checkIsPast(session.date, session.time);
    const matchesTime = timeFilter === 'upcoming' ? !isPast : isPast;
    const typeMatches = session.type?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const studentMatches = session.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const studentFirstName = session.student?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    return matchesTime && (typeMatches || studentMatches || studentFirstName);
  })

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {activeTab === 'available-events' ? 'Available Events' : 'Events & Sessions'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTab === 'available-events'
              ? 'Explore and join upcoming events and masterclasses happening across CampusBridge.'
              : 'Manage your 1-on-1 and group mentorship sessions (Online & Offline).'}
          </p>
        </div>
        <button 
          onClick={() => { setIsCreateModalOpen(true); setCreateCategory(null); setSessionMode('Online'); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Add a New Session or Event
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="flex space-x-1 bg-muted p-1 rounded-xl w-full sm:w-fit overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('events')}
            className={`whitespace-nowrap flex-1 sm:flex-none px-3.5 sm:px-5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 ${
              activeTab === 'events' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Hosted Events ({eventsList.length})
          </button>
          <button
            onClick={() => setActiveTab('available-events')}
            className={`whitespace-nowrap flex-1 sm:flex-none px-3.5 sm:px-5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 ${
              activeTab === 'available-events' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Available Events ({filteredAvailableEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`whitespace-nowrap flex-1 sm:flex-none px-3.5 sm:px-5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 ${
              activeTab === 'sessions' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Group Sessions ({groupSessionsList.length})
          </button>
          <button
            onClick={() => setActiveTab('one-on-one')}
            className={`whitespace-nowrap flex-1 sm:flex-none px-3.5 sm:px-5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 ${
              activeTab === 'one-on-one' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            1-on-1 Bookings ({individualSessions.length})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          {activeTab !== 'available-events' ? (
            <div className="flex bg-muted p-1 rounded-lg self-start sm:self-auto">
              <button
                onClick={() => setTimeFilter('upcoming')}
                className={`px-3.5 sm:px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                  timeFilter === 'upcoming' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setTimeFilter('completed')}
                className={`px-3.5 sm:px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                  timeFilter === 'completed' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                History
              </button>
            </div>
          ) : (
            <span className="hidden sm:inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Only Available Events
            </span>
          )}

          <div className="relative max-w-md w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={activeTab === 'available-events' ? "Search available events..." : "Search sessions..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border/50 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {(isLoading || (activeTab === 'available-events' && isLoadingAvailableEvents)) ? (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <SessionSkeleton key={i} />
          ))}
        </div>
      ) : activeTab === 'available-events' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAvailableEvents.map((event) => {
            const isYours = event.clerkId === user?.id || event.organizer?.clerkId === user?.id;
            const registered = isUserRegisteredForEvent(event);
            const organizerName = event.organizer ? (event.organizer.name || `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim()) : 'CampusBridge Host';
            const isPast = checkIsPast(event.date, event.time);
            const isOffline = event.mode === 'Offline' || (event.location && !event.mode);
            const attendeesList = Array.isArray(event.attendees) ? event.attendees.filter(Boolean) : [];
            const attendeesCount = attendeesList.length;
            const displayedAttendees = attendeesList.slice(0, 3);
            const eventImg = event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60';

            return (
              <div 
                key={event._id} 
                className="bg-card border border-border/50 hover:border-primary/50 rounded-3xl p-3 sm:p-3.5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group overflow-hidden relative"
              >
                {/* 1. Cover Image Banner with Floating Glassmorphic Badges */}
                <div className="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden mb-4 shrink-0 bg-gradient-to-br from-purple-950/20 via-card to-indigo-950/20 border border-border/40">
                  <img 
                    src={eventImg} 
                    alt={event.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

                  {/* Floating Category Pill (Top-Left) */}
                  <div className="absolute top-3 left-3 backdrop-blur-md bg-black/60 border border-white/15 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold text-white shadow-sm z-10">
                    {event.type?.toLowerCase().includes('webinar') ? (
                      <Video className="w-3.5 h-3.5 text-blue-400" />
                    ) : event.type?.toLowerCase().includes('workshop') ? (
                      <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    )}
                    <span>{event.type || 'Webinar'}</span>
                  </div>

                  {/* Floating Status Pill (Top-Right) */}
                  <div className={`absolute top-3 right-3 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-sm z-10 ${
                    isPast 
                      ? 'bg-black/60 border border-white/15 text-slate-300' 
                      : (event.active && event.link) 
                      ? 'bg-rose-500/25 border border-rose-500/40 text-rose-300' 
                      : 'bg-emerald-500/25 border border-emerald-500/40 text-emerald-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isPast ? 'bg-slate-400' : (event.active && event.link) ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
                    <span>{isPast ? 'Completed' : (event.active && event.link) ? 'Live Now' : 'Upcoming'}</span>
                  </div>
                </div>

                {/* 2. Card Content */}
                <div className="flex-1 flex flex-col justify-between">
                  {/* Title & Chevron Details Button Row */}
                  <div className="flex items-start justify-between gap-3 mb-2 px-1">
                    <h3 className="font-bold text-foreground text-base sm:text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <button 
                      onClick={() => { setSelectedAvailableEvent(event); setIsDetailModalOpen(true); }}
                      className="w-8 h-8 rounded-full bg-muted/60 hover:bg-primary hover:text-primary-foreground border border-border/60 flex items-center justify-center text-muted-foreground transition-all shrink-0 hover:scale-105 active:scale-95 shadow-xs"
                      title="View Event Details"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 2-line Subtitle/Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4 px-1 min-h-[2rem]">
                    {event.description || 'Learn from industry professionals and get actionable insights for your academic and career journey.'}
                  </p>

                  {/* Host Pill */}
                  <p className="text-xs font-medium text-foreground/80 mb-2 px-1 flex items-center gap-1.5 truncate">
                    <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Hosted by <span className="font-semibold text-foreground">{organizerName}</span>
                  </p>

                  {/* 2-Column Info Matrix (Date/Time & Mode/Venue) */}
                  <div className="grid grid-cols-2 gap-2.5 mb-3 p-3 bg-muted/30 border border-border/40 rounded-2xl">
                    {/* Date & Time */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">
                          {event.date ? format(new Date(event.date), 'MMM dd, yyyy') : 'TBD'}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{event.time || 'TBD'}</p>
                      </div>
                    </div>

                    {/* Mode / Venue */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
                        {isOffline ? <MapPin className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{isOffline ? 'Venue' : 'Mode'}</p>
                        <p className="text-xs font-semibold text-foreground truncate">
                          {isOffline ? (event.location || 'Campus') : 'Online'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Bottom Row: Attendee Avatars Stack & Primary Action */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-2">
                    {attendeesCount > 0 ? (
                      <>
                        <div className="flex -space-x-2 overflow-hidden">
                          {displayedAttendees.map((att, attIdx) => {
                            const imgSrc = (typeof att === 'object' && att?.imageUrl) ? att.imageUrl : defaultPP;
                            const attName = (typeof att === 'object' && (att?.name || att?.firstName)) ? (att.name || att.firstName) : 'Attendee';
                            return (
                              <img 
                                key={attIdx} 
                                src={imgSrc} 
                                alt={attName}
                                title={attName}
                                onError={(e) => { e.currentTarget.src = defaultPP; }}
                                className="inline-block w-7 h-7 rounded-full ring-2 ring-card object-cover shrink-0" 
                              />
                            );
                          })}
                        </div>
                        <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
                          {attendeesCount > 3 ? `+${attendeesCount - 3} attending` : `${attendeesCount} attending`}
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        0 attending
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleShareEvent(e, event)}
                      className="p-2 rounded-full bg-muted/60 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors border border-border/40"
                      title="Share Event"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {isYours ? (
                      <button
                        onClick={() => { setSelectedSession(event); setIsEditModalOpen(true); }}
                        className="px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all shadow-sm"
                      >
                        Edit
                      </button>
                    ) : registered ? (
                      event.link ? (
                        <a
                          href={event.link.startsWith('http') ? event.link : `https://${event.link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md hover:shadow-purple-500/25 hover:opacity-95 transition-all"
                        >
                          <Video className="w-3.5 h-3.5" /> Join Event
                        </a>
                      ) : (
                        <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold inline-flex items-center gap-1 border border-emerald-500/20">
                          <Check className="w-3 h-3" /> Enrolled
                        </span>
                      )
                    ) : (
                      <button
                        onClick={() => handleRegisterForEvent(event)}
                        disabled={isRegistering}
                        className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md hover:shadow-purple-500/25 hover:opacity-95 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isRegistering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>Register <ArrowRight className="w-3.5 h-3.5" /></>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredAvailableEvents.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card border border-border/50 rounded-2xl">
              No available events found matching your search.
            </div>
          )}
        </div>
      ) : (activeTab === 'events' || activeTab === 'sessions') ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeTab === 'events' ? filteredEvents : filteredGroupSessions).map((session) => {
            const isPast = checkIsPast(session.date, session.time);
            const isOffline = session.mode === 'Offline' || (session.location && !session.mode);
            const attendeesList = Array.isArray(session.attendees) ? session.attendees.filter(Boolean) : [];
            const attendeesCount = attendeesList.length;
            const displayedAttendees = attendeesList.slice(0, 3);
            const sessionImg = session.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60';

            return (
              <div 
                key={session._id} 
                className="bg-card border border-border/50 hover:border-primary/50 rounded-3xl p-3 sm:p-3.5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group overflow-hidden relative"
              >
                {/* 1. Cover Image Banner with Floating Glassmorphic Badges */}
                <div className="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden mb-4 shrink-0 bg-gradient-to-br from-purple-950/20 via-card to-indigo-950/20 border border-border/40">
                  <img 
                    src={sessionImg} 
                    alt={session.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

                  {/* Floating Category Pill (Top-Left) */}
                  <div className="absolute top-3 left-3 backdrop-blur-md bg-black/60 border border-white/15 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold text-white shadow-sm z-10">
                    {session.type?.toLowerCase().includes('webinar') ? (
                      <Video className="w-3.5 h-3.5 text-blue-400" />
                    ) : session.type?.toLowerCase().includes('workshop') ? (
                      <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    )}
                    <span>{session.type || (activeTab === 'events' ? 'Event' : 'Session')}</span>
                  </div>

                  {/* Floating Status Pill (Top-Right) */}
                  <div className={`absolute top-3 right-3 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-sm z-10 ${
                    isPast 
                      ? 'bg-black/60 border border-white/15 text-slate-300' 
                      : (session.active && session.link) 
                      ? 'bg-rose-500/25 border border-rose-500/40 text-rose-300' 
                      : 'bg-emerald-500/25 border border-emerald-500/40 text-emerald-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isPast ? 'bg-slate-400' : (session.active && session.link) ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
                    <span>{isPast ? 'Completed' : (session.active && session.link) ? 'Live Now' : 'Upcoming'}</span>
                  </div>
                </div>

                {/* 2. Card Content */}
                <div className="flex-1 flex flex-col justify-between">
                  {/* Title & Chevron Details Button Row */}
                  <div className="flex items-start justify-between gap-3 mb-2 px-1">
                    <h3 className="font-bold text-foreground text-base sm:text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {session.title}
                    </h3>
                    <button 
                      onClick={() => handleViewStudents(session)}
                      className="w-8 h-8 rounded-full bg-muted/60 hover:bg-primary hover:text-primary-foreground border border-border/60 flex items-center justify-center text-muted-foreground transition-all shrink-0 hover:scale-105 active:scale-95 shadow-xs"
                      title="View Registered Students"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 2-line Subtitle/Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4 px-1 min-h-[2rem]">
                    {session.description || 'Interactive mentorship event hosted by you on the CampusBridge platform.'}
                  </p>

                  {/* 2-Column Info Matrix (Date/Time & Mode/Venue) */}
                  <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-muted/30 border border-border/40 rounded-2xl">
                    {/* Date & Time */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">
                          {session.date ? format(new Date(session.date), 'MMM dd, yyyy') : 'TBD'}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{session.time || 'TBD'}</p>
                      </div>
                    </div>

                    {/* Mode / Venue */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
                        {isOffline ? <MapPin className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{isOffline ? 'Venue' : 'Mode'}</p>
                        <p className="text-xs font-semibold text-foreground truncate">
                          {isOffline ? (session.location || 'Campus') : 'Online'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Bottom Row: Attendee Avatars Stack & Mentor Controls */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-3 px-1">
                  <div 
                    onClick={() => handleViewStudents(session)}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    title="View attendees list"
                  >
                    <div className="flex items-center gap-2">
                      {attendeesCount > 0 ? (
                        <>
                          <div className="flex -space-x-2 overflow-hidden">
                            {displayedAttendees.map((att, attIdx) => {
                              const imgSrc = (typeof att === 'object' && att?.imageUrl) ? att.imageUrl : defaultPP;
                              const attName = (typeof att === 'object' && (att?.name || att?.firstName)) ? (att.name || att.firstName) : 'Attendee';
                              return (
                                <img 
                                  key={attIdx} 
                                  src={imgSrc} 
                                  alt={attName}
                                  title={attName}
                                  onError={(e) => { e.currentTarget.src = defaultPP; }}
                                  className="inline-block w-7 h-7 rounded-full ring-2 ring-card object-cover shrink-0" 
                                />
                              );
                            })}
                          </div>
                          <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
                            {attendeesCount > 3 ? `+${attendeesCount - 3} attending` : `${attendeesCount} attending`}
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          0 attending
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={(e) => handleShareEvent(e, session)}
                      className="p-2 rounded-full bg-muted/60 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors border border-border/40"
                      title="Share Event"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {session.link && !isPast && (
                      <a 
                        href={session.link.startsWith('http') ? session.link : `https://${session.link}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-purple-500/25 hover:opacity-95 transition-all"
                        title="Start Call"
                      >
                        <Video className="w-3.5 h-3.5" /> <span>Start</span>
                      </a>
                    )}

                    <button 
                      onClick={() => { setSelectedSession(session); setIsEditModalOpen(true); }}
                      className="p-2 rounded-full bg-muted/60 hover:bg-muted text-foreground transition-colors border border-border/40"
                      title="Edit Session"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button 
                      onClick={() => confirmDeleteSession(session._id)}
                      className="p-2 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors border border-destructive/20"
                      title="Delete Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {(activeTab === 'events' ? filteredEvents : filteredGroupSessions).length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card border border-border/50 rounded-2xl">
              No {timeFilter} {activeTab === 'events' ? 'events' : 'group sessions'} found. {timeFilter === 'upcoming' ? 'Click "+ Add New Session or Event" to create one!' : ''}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered1on1.map((session) => {
            const student = session.student
            const studentName = student ? (student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim()) : 'Student'
            const studentImg = student?.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentName}`

            return (
              <div key={session._id} className="bg-card border border-border/30 hover:border-border/60 rounded-2xl p-4 sm:p-5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group overflow-hidden">
                <div className="relative z-10 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
                      {session.type || '1-on-1 Mentorship'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                      session.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-muted-foreground'
                    }`}>
                      {session.status}
                    </span>
                  </div>

                  {/* Session Title (Gigantic) */}
                  <h3 className="font-black text-foreground text-xl mb-4 leading-tight line-clamp-2">
                    {session.type || 'Mentorship Session'}
                  </h3>

                  {/* Middle Block (Ticket Style) */}
                  <div className="relative bg-muted/50 rounded-2xl p-4 mb-4 border border-border/20 flex-1 flex flex-col justify-center">
                    {/* Floating Avatar Overlapping Top Border */}
                    <div className="absolute -top-5 right-4 w-10 h-10 rounded-full border-[3px] border-card bg-muted overflow-hidden shadow-sm transition-transform group-hover:scale-110 duration-300">
                      <img src={studentImg} alt={studentName} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex flex-col gap-3 pt-1">
                      {/* Date & Time */}
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Date & Time</p>
                        <p className="text-sm font-bold text-foreground">
                          {session.date ? new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'} • {session.time}
                        </p>
                      </div>
                      
                      {/* Mode & Duration */}
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Mode & Duration</p>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                          <span className={session.mode === 'Offline' ? 'text-amber-500' : 'text-blue-500'}>
                            {session.mode === 'Offline' ? <MapPin className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                          </span>
                          <span>
                            {session.mode} • {session.duration || 30} min
                          </span>
                        </div>
                      </div>

                      {/* Student Name */}
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Student</p>
                        <p className="text-sm font-bold text-foreground truncate">{studentName}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex flex-col gap-2 mt-auto pt-2">
                  {session.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSessionAction(session._id, 'declined')}
                        className="flex-1 bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive py-2.5 rounded-xl text-xs font-bold transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => { setSessionToAccept(session); setIsAcceptModalOpen(true); }}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
                      >
                        Accept
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      {session.mode === 'Online' && session.status === 'accepted' && !checkIsPast(session.date, session.time) && (
                        <button 
                          onClick={() => {
                            const studentObj = {
                              clerkId: student?.clerkId || student?._id,
                              name: studentName,
                              image: studentImg
                            };
                            if (session.meetingLink && session.meetingLink.startsWith('http') && !session.meetingLink.includes('meet.google.com')) {
                              window.open(session.meetingLink, '_blank');
                            } else {
                              window.dispatchEvent(new CustomEvent('initiate_call', {
                                detail: { targetPartner: studentObj, type: 'video' }
                              }));
                            }
                          }}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-sm shrink-0"
                        >
                          <Video className="w-4 h-4" /> <span className="hidden sm:inline">Start Call</span>
                        </button>
                      )}
                      
                      {!checkIsPast(session.date, session.time) && session.status === 'accepted' && session.date && (
                         <a 
                           href={`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent('Session with ' + studentName)}&dates=${format(new Date(session.date), 'yyyyMMdd')}/${format(new Date(session.date), 'yyyyMMdd')}&details=${encodeURIComponent(`Session with ${studentName}\nTime: ${session.time}\nMode: ${session.mode || 'Online'}`)}&location=${encodeURIComponent(session.location || '')}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors shrink-0"
                           title="Add to Google Calendar"
                         >
                           <Calendar className="w-4 h-4" />
                         </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {filtered1on1.length === 0 && (
            <div className="py-12 text-center text-muted-foreground bg-card border border-border/50 rounded-2xl">
              No 1-on-1 bookings found.
            </div>
          )}
        </div>
      )}

      {/* Available Event Details Modal */}
      {isDetailModalOpen && selectedAvailableEvent && (
        <ModalPortal>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-thin">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary px-2.5 py-0.5 rounded-md">
                      {selectedAvailableEvent.type || 'Event'}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-md">
                      Available
                    </span>
                    {isUserRegisteredForEvent(selectedAvailableEvent) && (
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        <Check className="w-3 h-3" /> Registered
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    {selectedAvailableEvent.title}
                  </h2>
                </div>
                <button 
                  onClick={() => { setIsDetailModalOpen(false); setSelectedAvailableEvent(null); }} 
                  className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedAvailableEvent.imageUrl && (
                <div className="w-full h-48 rounded-xl overflow-hidden mb-5 border border-border/30">
                  <img src={selectedAvailableEvent.imageUrl} alt={selectedAvailableEvent.title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Host Information */}
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl mb-4 border border-border/20">
                <img 
                  src={selectedAvailableEvent.organizer?.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedAvailableEvent.organizer?.name || 'Host')}`} 
                  alt="Host" 
                  className="w-10 h-10 rounded-full object-cover border border-border/40 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Organized by</p>
                  <p className="text-sm font-bold text-foreground truncate">
                    {selectedAvailableEvent.organizer?.name || `${selectedAvailableEvent.organizer?.firstName || ''} ${selectedAvailableEvent.organizer?.lastName || ''}`.trim() || 'CampusBridge Host'}
                  </p>
                  {selectedAvailableEvent.organizer?.headline && (
                    <p className="text-xs text-muted-foreground truncate">{selectedAvailableEvent.organizer.headline}</p>
                  )}
                </div>
              </div>

              {/* Event Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-3 bg-muted/30 rounded-xl border border-border/20">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> Date & Time
                  </span>
                  <p className="text-xs font-bold text-foreground">
                    {selectedAvailableEvent.date ? format(new Date(selectedAvailableEvent.date), 'MMM dd, yyyy') : 'TBD'}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedAvailableEvent.time}</p>
                </div>

                <div className="p-3 bg-muted/30 rounded-xl border border-border/20">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" /> Mode & Location
                  </span>
                  <p className="text-xs font-bold text-foreground truncate">
                    {selectedAvailableEvent.mode || 'Online'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedAvailableEvent.location || (selectedAvailableEvent.mode === 'Offline' ? 'Campus Location' : 'Virtual Session')}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedAvailableEvent.description && (
                <div className="mb-6">
                  <h4 className="text-xs uppercase font-bold text-muted-foreground mb-1.5">About This Event</h4>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/20 p-3 rounded-xl border border-border/20">
                    {selectedAvailableEvent.description}
                  </p>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/40">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" /> {selectedAvailableEvent.attendees?.length || 0} Registered
                </span>

                <div className="flex items-center gap-2">
                  {selectedAvailableEvent.link && (isUserRegisteredForEvent(selectedAvailableEvent) || selectedAvailableEvent.clerkId === user?.id) && (
                    <a
                      href={selectedAvailableEvent.link.startsWith('http') ? selectedAvailableEvent.link : `https://${selectedAvailableEvent.link}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Video className="w-4 h-4" /> Join Link
                    </a>
                  )}

                  {!isUserRegisteredForEvent(selectedAvailableEvent) && selectedAvailableEvent.clerkId !== user?.id && (
                    <button
                      onClick={() => handleRegisterForEvent(selectedAvailableEvent)}
                      disabled={isRegistering}
                      className="px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                    >
                      {isRegistering ? 'Registering...' : 'Register for Event'}
                    </button>
                  )}
                  {isUserRegisteredForEvent(selectedAvailableEvent) && (
                    <span className="px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl inline-flex items-center gap-1">
                      <Check className="w-4 h-4" /> Enrolled
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Create Session Modal */}
      {isCreateModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">
                {!createCategory ? 'What do you want to create?' : `Create New ${createCategory === 'event' ? 'Event' : 'Session'}`}
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-muted-foreground hover:bg-muted p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {!createCategory ? (
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button 
                  onClick={() => setCreateCategory('session')}
                  className="p-6 bg-muted/50 hover:bg-muted border border-border/50 rounded-xl flex flex-col items-center gap-3 transition-colors"
                >
                  <BookOpen className="w-8 h-8 text-primary" />
                  <span className="font-bold text-foreground">Session</span>
                  <span className="text-xs text-muted-foreground text-center">Workshops, Masterclasses, etc.</span>
                </button>
                <button 
                  onClick={() => setCreateCategory('event')}
                  className="p-6 bg-muted/50 hover:bg-muted border border-border/50 rounded-xl flex flex-col items-center gap-3 transition-colors"
                >
                  <Calendar className="w-8 h-8 text-pink-500" />
                  <span className="font-bold text-foreground">Event</span>
                  <span className="text-xs text-muted-foreground text-center">Hackathons, Career Fairs, etc.</span>
                </button>
              </div>
            ) : (
            <form onSubmit={handleCreateSession} className="space-y-4">
              <input type="hidden" name="category" value={createCategory} />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{createCategory === 'event' ? 'Event Title' : 'Session Title'}</label>
                <input name="title" required type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder={`e.g. ${createCategory === 'event' ? 'Annual Tech Career Fair' : 'System Design Masterclass'}`} />
              </div>

              {createCategory === 'event' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Event Image / Banner (Optional)</label>
                  {(croppedImagePreview || sessionImageUrl) && (
                    <div className="relative rounded-2xl overflow-hidden border border-border/60 bg-muted/30 p-2 flex items-center justify-center min-h-[100px] max-h-[180px] group">
                      <img src={croppedImagePreview || sessionImageUrl} alt="Banner Preview" className="max-h-[160px] w-auto max-w-full object-contain rounded-xl" />
                      <button
                        type="button"
                        onClick={() => { setCroppedImagePreview(null); setCroppedImageBlob(null); setSessionImageUrl(''); }}
                        className="absolute top-2 right-2 p-1.5 bg-black/75 hover:bg-rose-600 text-white rounded-xl transition-all cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label className="flex items-center justify-center gap-2 p-2.5 sm:p-3 border-2 border-dashed border-border/70 hover:border-primary/60 rounded-xl bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer">
                      <Upload className="w-4 h-4 text-primary shrink-0" />
                      <div className="text-left overflow-hidden">
                        <span className="block text-xs font-semibold truncate text-foreground">{croppedImageBlob ? 'Image Selected' : 'Upload File'}</span>
                        <span className="block text-[10px] text-muted-foreground leading-tight">Crop & Resize</span>
                      </div>
                      <input onChange={handleImageSelect} type="file" accept="image/*" className="hidden" />
                    </label>

                    <div className="flex flex-col justify-center">
                      <div className="relative flex items-center">
                        <LinkIcon className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
                        <input
                          name="imageUrl"
                          type="url"
                          value={sessionImageUrl}
                          onChange={(e) => { setSessionImageUrl(e.target.value); setCroppedImageBlob(null); setCroppedImagePreview(null); }}
                          placeholder="Or paste image URL..."
                          className="w-full pl-9 pr-3 py-2.5 bg-background border border-border/60 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 ml-1">Paste direct image URL</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{createCategory === 'event' ? 'Event Type' : 'Session Type'}</label>
                  <select name="type" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    {createCategory === 'event' ? (
                      <>
                        <option>Hackathon</option>
                        <option>Career Fair</option>
                        <option>Tech Talk</option>
                        <option>Networking</option>
                      </>
                    ) : (
                      <>
                        <option>Workshop</option>
                        <option>Masterclass</option>
                        <option>Group Mentorship</option>
                        <option>Career Guidance</option>
                        <option>Mock Interview</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Mode</label>
                  <select name="mode" value={sessionMode} onChange={(e) => setSessionMode(e.target.value)} className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
                  <input name="date" required type="date" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Start Time</label>
                  <input name="startTime" required type="time" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">End Time</label>
                  <input name="endTime" required type="time" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              {sessionMode === 'Offline' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Location or Venue</label>
                  <input name="location" required type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Auditorium Block A" />
                </div>
              )}

              {sessionMode === 'Online' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Meeting Link</label>
                  <input name="link" required type="url" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. https://meet.google.com/abc-xyz" />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description / Agenda</label>
                <textarea name="description" rows="3" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" placeholder="Add some details..."></textarea>
              </div>

              <div className="bg-muted/30 border border-border/50 p-3 rounded-lg flex items-start gap-3 mt-4 mb-2">
                <input type="checkbox" id="postToFeedCreate" name="postToFeed" className="mt-1 w-4 h-4 accent-primary" />
                <div>
                  <label htmlFor="postToFeedCreate" className="text-sm font-medium text-foreground cursor-pointer">Post to Feed</label>
                  <p className="text-xs text-muted-foreground mt-0.5">Share this on the main feed so everyone can see it.</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  disabled={isSubmitting}
                  onClick={() => setCreateCategory(null)}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-xl font-medium transition-colors"
                >
                  Back
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create {createCategory === 'event' ? 'Event' : 'Session'}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
        </ModalPortal>
      )}

      {/* View Registered Students Modal */}
      {isApplicationsModalOpen && selectedSession && (
        <ModalPortal>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 w-full max-w-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Registered Students</h2>
                <p className="text-sm text-muted-foreground">{selectedSession.title}</p>
              </div>
              <button 
                onClick={() => setIsApplicationsModalOpen(false)}
                className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingStudents ? (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <SessionSkeleton key={i}  />
              ))}
            </div>
            ) : registeredStudents.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {registeredStudents.map((app) => (
                  <div key={app._id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/40">
                    <div className="flex items-center gap-3">
                      <Link to={`/profile/${app.applicant?.username || app.applicant?.clerkId || app.applicant?._id}`} className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsApplicationsModalOpen(false)}>
                        <img 
                          src={app.applicant?.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.applicant?.name}`} 
                          alt="Student" 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </Link>
                      <div>
                        <Link to={`/profile/${app.applicant?.username || app.applicant?.clerkId || app.applicant?._id}`} className="hover:underline" onClick={() => setIsApplicationsModalOpen(false)}>
                          <h4 className="font-bold text-sm text-foreground">{app.applicant?.name || app.applicant?.firstName}</h4>
                        </Link>
                        <p className="text-xs text-muted-foreground">{app.applicant?.email}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary capitalize">
                      {app.applicantRole || 'Student'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No students registered for this session yet.
              </div>
            )}
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Accept Session Modal */}
      {isAcceptModalOpen && sessionToAccept && (
        <ModalPortal>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-foreground">Provide Meeting URL</h2>
              <button onClick={() => { setIsAcceptModalOpen(false); setSessionToAccept(null); }} className="text-muted-foreground hover:bg-muted p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              You are accepting the session with <span className="font-semibold text-foreground">{sessionToAccept.student?.name || sessionToAccept.student?.firstName || 'the student'}</span>. Please provide a video meeting link for this session.
            </p>
            <form onSubmit={handleAcceptSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Meeting Link (e.g. Google Meet, Zoom)</label>
                <input name="meetingLink" required type="url" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="https://meet.google.com/abc-xyz" />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setIsAcceptModalOpen(false); setSessionToAccept(null); }}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Accept & Save
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Edit Session Modal */}
      {isEditModalOpen && selectedSession && (
        <ModalPortal>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">Edit Session</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:bg-muted p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Session Title</label>
                <input name="title" defaultValue={selectedSession.title} required type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {selectedSession.category === 'event' && (
                <div className="col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-foreground">Event Image / Banner (Optional)</label>
                  {(croppedImagePreview || editSessionImageUrl || selectedSession.imageUrl) && (
                    <div className="relative rounded-2xl overflow-hidden border border-border/60 bg-muted/30 p-2 flex items-center justify-center min-h-[100px] max-h-[180px] group">
                      <img src={croppedImagePreview || (editSessionImageUrl !== '' ? editSessionImageUrl : selectedSession.imageUrl)} alt="Banner Preview" className="max-h-[160px] w-auto max-w-full object-contain rounded-xl" />
                      <button
                        type="button"
                        onClick={() => { setCroppedImagePreview(null); setCroppedImageBlob(null); setEditSessionImageUrl(''); setSelectedSession(prev => ({ ...prev, imageUrl: '' })); }}
                        className="absolute top-2 right-2 p-1.5 bg-black/75 hover:bg-rose-600 text-white rounded-xl transition-all cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label className="flex items-center justify-center gap-2 p-2.5 sm:p-3 border-2 border-dashed border-border/70 hover:border-primary/60 rounded-xl bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer">
                      <Upload className="w-4 h-4 text-primary shrink-0" />
                      <div className="text-left overflow-hidden">
                        <span className="block text-xs font-semibold truncate text-foreground">{croppedImageBlob ? 'New Image Selected' : 'Upload New File'}</span>
                        <span className="block text-[10px] text-muted-foreground leading-tight">Crop & Resize</span>
                      </div>
                      <input onChange={handleImageSelect} type="file" accept="image/*" className="hidden" />
                    </label>

                    <div className="flex flex-col justify-center">
                      <div className="relative flex items-center">
                        <LinkIcon className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
                        <input
                          name="imageUrl"
                          type="url"
                          value={editSessionImageUrl !== '' ? editSessionImageUrl : (selectedSession.imageUrl || '')}
                          onChange={(e) => { setEditSessionImageUrl(e.target.value); setCroppedImageBlob(null); setCroppedImagePreview(null); }}
                          placeholder="Or paste image URL..."
                          className="w-full pl-9 pr-3 py-2.5 bg-background border border-border/60 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 ml-1">Paste direct image URL</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Session Type</label>
                  <select name="type" defaultValue={selectedSession.type} className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>Workshop</option>
                    <option>Masterclass</option>
                    <option>Group Mentorship</option>
                    <option>Career Guidance</option>
                    <option>Mock Interview</option>
                    <option>Hackathon</option>
                    <option>Career Fair</option>
                    <option>Tech Talk</option>
                    <option>Networking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Mode</label>
                  <select name="mode" defaultValue={selectedSession.mode || 'Online'} className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
                  <input name="date" defaultValue={selectedSession.date ? new Date(selectedSession.date).toISOString().split('T')[0] : ''} required type="date" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Start Time</label>
                  <input name="startTime" defaultValue={selectedSession.time ? selectedSession.time.split(' - ')[0] : ''} required type="time" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">End Time</label>
                  <input name="endTime" defaultValue={selectedSession.time ? (selectedSession.time.split(' - ')[1] || selectedSession.time.split(' - ')[0]) : ''} required type="time" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Location or Meeting Link</label>
                <input name="location" defaultValue={selectedSession.location || selectedSession.link} type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description / Agenda</label>
                <textarea name="description" defaultValue={selectedSession.description} rows="3" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"></textarea>
              </div>

              <div className="bg-muted/30 border border-border/50 p-3 rounded-lg flex items-start gap-3 mt-4 mb-2">
                <input type="checkbox" id="postToFeedEdit" name="postToFeed" className="mt-1 w-4 h-4 accent-primary" />
                <div>
                  <label htmlFor="postToFeedEdit" className="text-sm font-medium text-foreground cursor-pointer">Post to Feed</label>
                  <p className="text-xs text-muted-foreground mt-0.5">Share this on the main feed so everyone can see it.</p>
                </div>
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
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteSession}
        title="Delete Session"
        message="Are you sure you want to delete this session?"
      />

      {/* Render Image Crop Modal if active */}
      <AnimatePresence>
        {cropModalData && (
          <ImageCropModal 
            imageSrc={cropModalData.src}
            aspectRatio={NaN}
            onCropComplete={handleCropComplete}
            onCancel={() => setCropModalData(null)}
          />
        )}
      </AnimatePresence>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        shareUrl={shareConfig?.shareUrl} 
        shareType={shareConfig?.shareType} 
        itemId={shareConfig?.itemId} 
      />
    </div>
  )
}

export default MentorSessions
