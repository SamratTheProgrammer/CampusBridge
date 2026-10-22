import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, X, User, Calendar, MessageSquare, BookOpen, Loader2, Globe, MapPin, Clock,
  Target, Link2, ExternalLink, Mail, Phone, Video, Sparkles, AlertCircle, Eye, Info
} from 'lucide-react'
import UserSkeleton from '../../components/skeletons/UserSkeleton'
import toast from 'react-hot-toast'
import { useUser } from '@clerk/clerk-react'
import { useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import API_BASE from '../../utils/api'
import { formatPendingRequestTime } from '../../utils/dateFormatter'
import ModalPortal from '../../components/modals/ModalPortal'

const MentorshipRequests = () => {
  const { user } = useUser()
  const navigate = useNavigate()

  // Category: 'sessions' | 'connections'
  const [requestCategory, setRequestCategory] = useState('sessions')
  const [activeStatusTab, setActiveStatusTab] = useState('pending') // 'pending' | 'accepted' | 'declined' | 'all'

  // Data states
  const [connectionRequests, setConnectionRequests] = useState([])
  const [sessionRequests, setSessionRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals for session actions
  const [sessionToAccept, setSessionToAccept] = useState(null)
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false)
  const [meetingLinkInput, setMeetingLinkInput] = useState('')

  const [sessionToDecline, setSessionToDecline] = useState(null)
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false)
  const [declineReasonInput, setDeclineReasonInput] = useState('')

  const [detailSession, setDetailSession] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)

  const fetchData = async () => {
    if (!user) return
    try {
      setIsLoading(true)

      // 1. Fetch connection requests
      const connRes = await fetch(`${API_BASE}/api/connections/user/${user.id}`)
      if (connRes.ok) {
        const data = await connRes.json()
        const received = data.filter(conn => conn.recipientClerkId === user.id)
        setConnectionRequests(received)
      }

      // 2. Fetch 1-on-1 session requests for mentor
      const sessRes = await fetch(`${API_BASE}/api/sessions/user/${user.id}`)
      if (sessRes.ok) {
        const sessData = await sessRes.json()
        // Filter sessions where the current user is the mentor
        const receivedSessions = sessData.filter(s => s.mentor?.clerkId === user.id)
        setSessionRequests(receivedSessions)
      }
    } catch (err) {
      console.error('Error fetching mentorship data:', err)
      toast.error('Failed to load requests')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  // Connection Request Action
  const handleConnectionAction = async (id, action) => {
    try {
      const status = action === 'accept' ? 'accepted' : 'declined'
      const res = await fetch(`${API_BASE}/api/connections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        toast.success(`Connection ${status} successfully!`)
        fetchData()
      } else {
        toast.error('Failed to update request')
      }
    } catch (err) {
      toast.error('An error occurred')
    }
  }

  // Session Request Action (Accept)
  const handleAcceptSession = async (e) => {
    e.preventDefault()
    if (!sessionToAccept) return
    setIsSubmittingAction(true)
    try {
      const payload = {
        status: 'accepted',
        meetingLink: meetingLinkInput.trim()
      }

      const res = await fetch(`${API_BASE}/api/sessions/${sessionToAccept._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success('Session accepted successfully! Student notified.')
        setIsAcceptModalOpen(false)
        setSessionToAccept(null)
        setMeetingLinkInput('')
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to accept session')
      }
    } catch (err) {
      console.error(err)
      toast.error('Error accepting session')
    } finally {
      setIsSubmittingAction(false)
    }
  }

  // Session Request Action (Decline)
  const handleDeclineSession = async (e) => {
    e.preventDefault()
    if (!sessionToDecline) return
    setIsSubmittingAction(true)
    try {
      const payload = {
        status: 'declined',
        declineReason: declineReasonInput.trim()
      }

      const res = await fetch(`${API_BASE}/api/sessions/${sessionToDecline._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success('Session request declined. Student notified.')
        setIsDeclineModalOpen(false)
        setSessionToDecline(null)
        setDeclineReasonInput('')
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to decline session')
      }
    } catch (err) {
      console.error(err)
      toast.error('Error declining session')
    } finally {
      setIsSubmittingAction(false)
    }
  }

  // Counts
  const pendingSessionsCount = sessionRequests.filter(s => s.status === 'pending').length
  const pendingConnectionsCount = connectionRequests.filter(c => c.status === 'pending').length

  // Filtered Sessions
  const filteredSessions = sessionRequests.filter(s => {
    if (activeStatusTab === 'pending') return s.status === 'pending'
    if (activeStatusTab === 'accepted') return s.status === 'accepted'
    if (activeStatusTab === 'declined') return s.status === 'declined'
    return true
  })

  // Filtered Connections
  const filteredConnections = connectionRequests.filter(c => {
    if (activeStatusTab === 'pending') return c.status === 'pending'
    if (activeStatusTab === 'accepted') return c.status === 'accepted'
    if (activeStatusTab === 'declined') return c.status === 'declined'
    return true
  })

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">Mentorship Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and respond to 1-on-1 session bookings and student connection requests with full details.
          </p>
        </div>

        {/* Category Toggle: Sessions vs Connections */}
        <div className="flex bg-muted p-1 rounded-2xl border border-border/50 shrink-0">
          <button
            onClick={() => setRequestCategory('sessions')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              requestCategory === 'sessions'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="w-4 h-4 text-primary" />
            <span>1-on-1 Sessions</span>
            {pendingSessionsCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                {pendingSessionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setRequestCategory('connections')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              requestCategory === 'connections'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-500" />
            <span>Connections</span>
            {pendingConnectionsCount > 0 && (
              <span className="bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                {pendingConnectionsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1">
        <div className="flex space-x-1 bg-muted p-1 rounded-xl w-fit">
          {[
            { id: 'pending', label: 'Pending Action' },
            { id: 'accepted', label: 'Accepted' },
            { id: 'declined', label: 'Declined' },
            { id: 'all', label: 'All Requests' },
          ].map((tab) => {
            const count = requestCategory === 'sessions'
              ? (tab.id === 'all' ? sessionRequests.length : sessionRequests.filter(s => s.status === tab.id).length)
              : (tab.id === 'all' ? connectionRequests.length : connectionRequests.filter(c => c.status === tab.id).length)

            return (
              <button
                key={tab.id}
                onClick={() => setActiveStatusTab(tab.id)}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeStatusTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  activeStatusTab === tab.id ? 'bg-muted text-foreground' : 'text-muted-foreground'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="w-full space-y-4">
          {[...Array(3)].map((_, i) => (
            <UserSkeleton key={i} variant="list" />
          ))}
        </div>
      ) : requestCategory === 'sessions' ? (
        /* ==================== 1-ON-1 SESSIONS LIST ==================== */
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const student = session.student
            const studentName = student
              ? (student.firstName ? `${student.firstName} ${student.lastName || ''}`.trim() : student.name || 'Student')
              : 'Student'
            const studentImg = student?.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentName}`
            const formattedDate = session.date
              ? new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
              : 'Date not set'

            const statusColors = {
              pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
              accepted: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
              declined: 'bg-destructive/10 text-destructive border-destructive/20',
              completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
              cancelled: 'bg-muted text-muted-foreground border-border/50',
            }

            return (
              <motion.div
                key={session._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border/50 hover:border-primary/40 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Top Row: Student info & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
                  <div className="flex items-start gap-4">
                    <img
                      src={studentImg}
                      alt={studentName}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/20 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground text-base sm:text-lg">{studentName}</h3>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {student?.role || 'Student'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {student?.course || student?.department || student?.headline || 'CampusBridge Member'}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5">
                        {student?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" /> {student.email}
                          </span>
                        )}
                        {student?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" /> {student.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${statusColors[session.status] || statusColors.pending}`}>
                      {session.status}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Requested {formatPendingRequestTime(session.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Session Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Topic / Focus Area
                    </span>
                    <span className="text-xs font-bold text-foreground block truncate">
                      {session.type || '1-on-1 Mentorship'}
                    </span>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl border border-border/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Mode & Location
                    </span>
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      {session.mode === 'Offline' ? (
                        <span className="text-amber-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{session.location || 'Campus In-Person'}</span>
                        </span>
                      ) : (
                        <span className="text-primary flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 shrink-0" /> Online Video Call
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl border border-border/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Date & Time
                    </span>
                    <span className="text-xs font-bold text-foreground block truncate">
                      {formattedDate} • {session.time}
                    </span>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl border border-border/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Duration
                    </span>
                    <span className="text-xs font-bold text-foreground block">
                      {session.duration || 30} Minutes
                    </span>
                  </div>
                </div>

                {/* Student's Message / Notes */}
                {session.message && (
                  <div className="p-3.5 bg-muted/30 rounded-xl border border-border/40 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" /> Student's Note / Agenda
                    </span>
                    <p className="text-xs text-foreground/90 leading-relaxed italic">
                      "{session.message}"
                    </p>
                  </div>
                )}

                {/* Student's Goals & Attachment Links */}
                {(session.goals || session.attachmentUrl) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {session.goals && (
                      <div className="p-3 bg-muted/20 rounded-xl border border-border/40">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                          <Target className="w-3.5 h-3.5 text-emerald-500" /> Specific Goals
                        </span>
                        <p className="text-xs text-foreground/90">{session.goals}</p>
                      </div>
                    )}
                    {session.attachmentUrl && (
                      <div className="p-3 bg-muted/20 rounded-xl border border-border/40">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                          <Link2 className="w-3.5 h-3.5 text-blue-500" /> Project / Resume Link
                        </span>
                        <a
                          href={session.attachmentUrl.startsWith('http') ? session.attachmentUrl : `https://${session.attachmentUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 truncate font-medium"
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{session.attachmentUrl}</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Accepted Session: Meeting link display */}
                {session.status === 'accepted' && session.mode === 'Online' && (
                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        Meeting Link: {session.meetingLink || 'CampusBridge In-App Video Call'}
                      </span>
                    </div>
                    {session.meetingLink && session.meetingLink.startsWith('http') && (
                      <a
                        href={session.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1"
                      >
                        <Video className="w-3.5 h-3.5" /> Join / Start Meeting
                      </a>
                    )}
                  </div>
                )}

                {/* Declined Session: Decline reason display */}
                {session.status === 'declined' && session.declineReason && (
                  <div className="p-3 bg-destructive/10 rounded-xl border border-destructive/20 text-xs text-destructive flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Decline Reason:</span>
                      <span>"{session.declineReason}"</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => {
                      setDetailSession(session)
                      setIsDetailModalOpen(true)
                    }}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Full Request Summary
                  </button>

                  <div className="flex items-center gap-2">
                    {session.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            setSessionToDecline(session)
                            setDeclineReasonInput('')
                            setIsDeclineModalOpen(true)
                          }}
                          className="bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => {
                            setSessionToAccept(session)
                            setMeetingLinkInput(session.meetingLink || '')
                            setIsAcceptModalOpen(true)
                          }}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" /> Accept Session
                        </button>
                      </>
                    )}

                    {session.status === 'accepted' && (
                      <a
                        href={`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(`Mentorship Session with ${studentName}`)}&dates=${format(new Date(session.date), 'yyyyMMdd')}/${format(new Date(session.date), 'yyyyMMdd')}&details=${encodeURIComponent(`Topic: ${session.type}\nStudent: ${studentName}\nMode: ${session.mode}\nLocation/Link: ${session.meetingLink || session.location || ''}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-muted hover:bg-primary/10 text-foreground hover:text-primary px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Add to Calendar
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}

          {filteredSessions.length === 0 && (
            <div className="bg-card border border-border/50 rounded-2xl p-12 text-center space-y-3">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
              <h3 className="text-lg font-bold text-foreground">No {activeStatusTab} session requests</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                When students book a 1-on-1 mentorship session with you, their requests and agenda will appear here.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ==================== CONNECTION REQUESTS LIST ==================== */
        <div className="space-y-4">
          {filteredConnections.map((conn) => (
            <motion.div
              key={conn._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-5 items-start justify-between"
            >
              <div className="flex gap-4 items-start w-full">
                <img
                  src={conn.targetUser?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conn.targetUser?.name || 'Student'}`}
                  alt="Student"
                  className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-border"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h3 className="font-bold text-foreground text-base">{conn.targetUser?.name || 'Student'}</h3>
                      <p className="text-xs text-muted-foreground">{conn.targetUser?.course || conn.targetUser?.headline || 'Student Profile'}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {formatPendingRequestTime(conn.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/40">
                    "{conn.message || 'I would like to connect with you for mentorship guidance.'}"
                  </p>
                </div>
              </div>

              {activeStatusTab === 'pending' && conn.status === 'pending' && (
                <div className="flex gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleConnectionAction(conn._id, 'accept')}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Accept
                  </button>
                  <button
                    onClick={() => handleConnectionAction(conn._id, 'decline')}
                    className="bg-muted hover:bg-destructive/10 text-foreground hover:text-destructive text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Decline
                  </button>
                </div>
              )}
            </motion.div>
          ))}

          {filteredConnections.length === 0 && (
            <div className="bg-card border border-border/50 rounded-2xl p-12 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
              <h3 className="text-lg font-bold text-foreground">No {activeStatusTab} connection requests</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Mentorship connection requests from students will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ==================== ACCEPT SESSION MODAL ==================== */}
      {isAcceptModalOpen && sessionToAccept && (
        <ModalPortal>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                    <Check className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Accept Session Request</h2>
                </div>
                <button
                  onClick={() => {
                    setIsAcceptModalOpen(false)
                    setSessionToAccept(null)
                  }}
                  className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                Confirm session with <span className="font-bold text-foreground">{sessionToAccept.student?.firstName || sessionToAccept.student?.name || 'the student'}</span> on <span className="font-semibold text-foreground">{new Date(sessionToAccept.date).toLocaleDateString()}</span> at <span className="font-semibold text-foreground">{sessionToAccept.time}</span>.
              </p>

              <form onSubmit={handleAcceptSession} className="space-y-4">
                {sessionToAccept.mode === 'Online' ? (
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center justify-between">
                      <span>Video Meeting Link</span>
                      <span className="text-[10px] text-muted-foreground">Google Meet / Zoom / Teams</span>
                    </label>
                    <input
                      type="url"
                      value={meetingLinkInput}
                      onChange={(e) => setMeetingLinkInput(e.target.value)}
                      placeholder="https://meet.google.com/abc-defg-hij"
                      className="w-full px-3.5 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      If left empty, CampusBridge's built-in 1-on-1 virtual call room will be used automatically.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/40 text-xs">
                    <span className="font-bold block text-foreground mb-1">Campus Offline Meeting</span>
                    <p className="text-muted-foreground">Location: <span className="font-semibold text-foreground">{sessionToAccept.location || 'Campus Center'}</span></p>
                  </div>
                )}

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAcceptModalOpen(false)
                      setSessionToAccept(null)
                    }}
                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAction}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingAction ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Confirm & Accept
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ==================== DECLINE SESSION MODAL ==================== */}
      {isDeclineModalOpen && sessionToDecline && (
        <ModalPortal>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center font-bold">
                    <X className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Decline Session Request</h2>
                </div>
                <button
                  onClick={() => {
                    setIsDeclineModalOpen(false)
                    setSessionToDecline(null)
                  }}
                  className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                Are you sure you want to decline this session request from <span className="font-bold text-foreground">{sessionToDecline.student?.firstName || sessionToDecline.student?.name || 'the student'}</span>?
              </p>

              <form onSubmit={handleDeclineSession} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Reason for Declining (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={declineReasonInput}
                    onChange={(e) => setDeclineReasonInput(e.target.value)}
                    placeholder="e.g. Schedule conflict, please reschedule for next week..."
                    className="w-full px-3.5 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeclineModalOpen(false)
                      setSessionToDecline(null)
                    }}
                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAction}
                    className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingAction ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <X className="w-4 h-4" /> Confirm Decline
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ==================== FULL DETAIL MODAL ==================== */}
      {isDetailModalOpen && detailSession && (
        <ModalPortal>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-thin space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">Session Request Details</h2>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Student Bio Card */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl border border-border/40">
                <img
                  src={detailSession.student?.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${detailSession.student?.firstName || 'Student'}`}
                  alt="Student"
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/20 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-foreground text-base truncate">
                    {detailSession.student?.firstName} {detailSession.student?.lastName}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {detailSession.student?.headline || detailSession.student?.course || 'Student at CampusBridge'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                    {detailSession.student?.email && <span>{detailSession.student.email}</span>}
                    {detailSession.student?.phone && <span>• {detailSession.student.phone}</span>}
                  </div>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-muted/40 rounded-xl border border-border/40">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Topic</span>
                  <span className="font-bold text-foreground">{detailSession.type}</span>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl border border-border/40">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Mode</span>
                  <span className="font-bold text-foreground">{detailSession.mode} ({detailSession.duration || 30}m)</span>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl border border-border/40">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Date</span>
                  <span className="font-bold text-foreground">
                    {new Date(detailSession.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl border border-border/40">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Time</span>
                  <span className="font-bold text-foreground">{detailSession.time}</span>
                </div>
              </div>

              {detailSession.mode === 'Offline' && detailSession.location && (
                <div className="p-3 bg-muted/40 rounded-xl border border-border/40 text-xs">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Venue</span>
                  <span className="font-medium text-foreground">{detailSession.location}</span>
                </div>
              )}

              {/* Message */}
              {detailSession.message && (
                <div className="p-3.5 bg-muted/30 rounded-xl border border-border/40 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">Session Agenda / Note</span>
                  <p className="text-foreground leading-relaxed italic">"{detailSession.message}"</p>
                </div>
              )}

              {/* Goals */}
              {detailSession.goals && (
                <div className="p-3.5 bg-muted/30 rounded-xl border border-border/40 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">Specific Goals & Questions</span>
                  <p className="text-foreground leading-relaxed">{detailSession.goals}</p>
                </div>
              )}

              {/* Attachment */}
              {detailSession.attachmentUrl && (
                <div className="p-3.5 bg-muted/30 rounded-xl border border-border/40 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">Attached Document / Link</span>
                  <a
                    href={detailSession.attachmentUrl.startsWith('http') ? detailSession.attachmentUrl : `https://${detailSession.attachmentUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 font-semibold break-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" /> {detailSession.attachmentUrl}
                  </a>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}

export default MentorshipRequests
