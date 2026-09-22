import React, { useState, useEffect } from 'react'
import SessionSkeleton from '../../components/skeletons/SessionSkeleton'
import { Plus, Calendar, Clock, MapPin, Users, Link as LinkIcon, Search, Loader2, X, Edit, Trash2, Globe, Video, BookOpen, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useUser } from '@clerk/clerk-react'
import { formatDistanceToNow, format } from 'date-fns'
import { formatPendingRequestTime } from '../../utils/dateFormatter'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmModal from '../../components/modals/ConfirmModal'
import ImageCropModal from '../../components/ImageCropModal'
import API_BASE from '../../utils/api'

const MentorSessions = () => {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('events') // 'events' | 'sessions' | 'one-on-one'
  const [timeFilter, setTimeFilter] = useState('upcoming') // 'upcoming' | 'completed'
  const [searchQuery, setSearchQuery] = useState('')

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

  useEffect(() => {
    fetchSessions()
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
    let imageUrl = null
    
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
    let imageUrl = selectedSession.imageUrl
    
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

  const eventsList = hostedSessions.filter(session => session.category === 'event')
  const groupSessionsList = hostedSessions.filter(session => session.category === 'session' || !session.category)

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
          <h1 className="text-2xl font-bold text-foreground">Events & Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your 1-on-1 and group mentorship sessions (Online & Offline).</p>
        </div>
        <button 
          onClick={() => { setIsCreateModalOpen(true); setCreateCategory(null); setSessionMode('Online'); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-sm"
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
            Events ({eventsList.length})
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

          <div className="relative max-w-md w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border/50 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <SessionSkeleton key={i}  />
              ))}
            </div>
      ) : (activeTab === 'events' || activeTab === 'sessions') ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeTab === 'events' ? filteredEvents : filteredGroupSessions).map((session) => (
            <div key={session._id} className="bg-card border border-border/30 hover:border-border/60 rounded-2xl p-4 sm:p-5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group overflow-hidden">
              {session.imageUrl && (
                <div className="w-full h-32 sm:h-40 rounded-xl mb-4 shrink-0 overflow-hidden relative">
                  <img src={session.imageUrl} alt={session.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
              
              <div className="relative z-10 flex-1 flex flex-col">
                {/* Header: Session Type Badge & Status */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
                    {session.type}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                    session.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                  }`}>
                    {session.active ? 'Active' : 'Past'}
                  </span>
                </div>

                {/* Session Title (Gigantic) */}
                <h3 className="font-black text-foreground text-xl mb-4 leading-tight line-clamp-2">
                  {session.title}
                </h3>

                {/* Middle Block (Ticket Style) */}
                <div className="relative bg-muted/50 rounded-2xl p-4 mb-4 border border-border/20 flex-1 flex flex-col justify-center">
                  <div className="flex flex-col gap-3 pt-1">
                    {/* Date & Time */}
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Date & Time</p>
                      <p className="text-sm font-bold text-foreground">
                        {session.date ? format(new Date(session.date), 'MMM dd, yyyy') : 'TBD'} • {session.time}
                      </p>
                    </div>
                    
                    {/* Mode & Venue */}
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Mode & Venue</p>
                      <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                        <span className={session.mode === 'Offline' || (session.location && !session.mode) ? 'text-amber-500' : 'text-blue-500'}>
                          {session.mode === 'Offline' || (session.location && !session.mode) ? <MapPin className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                        </span>
                        <span className="truncate">
                          {session.location || (session.mode === 'Offline' ? 'Campus Location' : 'Online Platform')}
                        </span>
                      </div>
                    </div>
                    
                    {/* Link */}
                    {session.link && (
                      <div className="mt-2">
                        <a 
                          href={session.link.startsWith('http') ? session.link : `https://${session.link}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
                        >
                          <Video className="w-4 h-4" />
                          Join Meeting
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/40">
                <button 
                  onClick={() => handleViewStudents(session)}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Users className="w-3.5 h-3.5" /> {session.attendees?.length || 0} Students
                </button>

                <div className="flex items-center gap-2">
                  {session.link && !checkIsPast(session.date, session.time) && (
                    <a 
                      href={session.link.startsWith('http') ? session.link : `https://${session.link}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-sm shrink-0"
                      title="Start Call"
                    >
                      <Video className="w-4 h-4" /> <span className="hidden sm:inline">Start Call</span>
                    </a>
                  )}
                  <button 
                    onClick={() => { setSelectedSession(session); setIsEditModalOpen(true); }}
                    className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors shrink-0"
                    title="Edit Session"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => confirmDeleteSession(session._id)}
                    className="p-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors shrink-0"
                    title="Delete Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

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

      {/* Create Session Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Event Image / Banner (Optional)</label>
                  {croppedImagePreview && (
                    <div className="mb-2">
                      <img src={croppedImagePreview} alt="Cropped banner" className="h-20 w-auto rounded border border-border/50 object-cover" />
                    </div>
                  )}
                  <input onChange={handleImageSelect} type="file" accept="image/*" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
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
      )}

      {/* View Registered Students Modal */}
      {isApplicationsModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
      )}

      {/* Accept Session Modal */}
      {isAcceptModalOpen && sessionToAccept && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
      )}

      {/* Edit Session Modal */}
      {isEditModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Event Image / Banner (Optional)</label>
                  {(croppedImagePreview || selectedSession.imageUrl) && (
                    <div className="mb-2">
                      <img src={croppedImagePreview || selectedSession.imageUrl} alt="Event banner" className="h-20 w-auto rounded border border-border/50 object-cover" />
                    </div>
                  )}
                  <input onChange={handleImageSelect} type="file" accept="image/*" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
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
    </div>
  )
}

export default MentorSessions
