import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Calendar, Clock, MapPin, Globe, Video, User, 
  ExternalLink, Link2, MessageSquare, Target, CheckCircle2, 
  AlertCircle, Copy, Check, ChevronRight, XCircle 
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import ModalPortal from './ModalPortal'

const SessionDetailsModal = ({ 
  isOpen, 
  onClose, 
  session, 
  currentUserRole = 'student', // 'student' | 'mentor'
  onCancel,
  onJoinCall,
  onAccept,
  onDecline 
}) => {
  const [copiedLink, setCopiedLink] = useState(false)

  if (!isOpen || !session) return null

  const isEvent = session.source === 'event' || session.category === 'event' || session.category === 'session'
  
  // Resolve host / partner details
  const isMentorView = currentUserRole === 'mentor'
  const partnerUser = isMentorView ? session.student : (isEvent ? session.organizer : session.mentor)
  
  const partnerName = partnerUser 
    ? (partnerUser.name || `${partnerUser.firstName || ''} ${partnerUser.lastName || ''}`.trim() || 'User')
    : 'Partner'
  const partnerRole = partnerUser?.headline || partnerUser?.position || partnerUser?.role || (isMentorView ? 'Student' : 'Mentor Host')
  const partnerCompany = partnerUser?.company ? ` • ${partnerUser.company}` : ''
  const partnerImg = partnerUser?.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerName}`
  const partnerProfileId = partnerUser?.username || partnerUser?.clerkId || partnerUser?._id

  // Date and Time formatting
  let sessionDateFormatted = 'TBD'
  if (session.date) {
    try {
      sessionDateFormatted = format(new Date(session.date), 'EEEE, MMMM d, yyyy')
    } catch {
      sessionDateFormatted = new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }
  const sessionTime = session.time || 'TBD'
  const isOffline = session.mode === 'Offline'
  const venueLocation = session.location
  const joinLink = session.meetingLink || session.link

  const duration = session.duration || 30
  const title = session.title || session.type || '1-on-1 Mentorship'

  // Status mapping
  const status = (session.status || 'confirmed').toLowerCase()

  const copyToClipboard = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedLink(true)
    toast.success('Link copied to clipboard!')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const rawAttachment = session.attachmentUrl || session.projectLink || session.resumeLink || ''
  const validAttachmentUrl = rawAttachment 
    ? (rawAttachment.startsWith('http://') || rawAttachment.startsWith('https://') ? rawAttachment : `https://${rawAttachment}`)
    : ''

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[200] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border/60 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        >
          {/* Top Banner / Header */}
          <div className="relative px-6 pt-6 pb-4 border-b border-border/40 bg-gradient-to-br from-primary/5 via-card to-card">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1 pr-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    {isEvent ? 'Platform Event' : '1-on-1 Mentorship'}
                  </span>

                  {/* Status Badge */}
                  {status === 'pending' && (
                    <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Pending Confirmation
                    </span>
                  )}
                  {(status === 'accepted' || status === 'confirmed') && (
                    <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Confirmed
                    </span>
                  )}
                  {status === 'completed' && (
                    <span className="bg-muted text-muted-foreground border border-border text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Completed
                    </span>
                  )}
                  {(status === 'declined' || status === 'cancelled') && (
                    <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {status === 'declined' ? 'Declined' : 'Cancelled'}
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight pt-1">
                  {title}
                </h2>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted p-2 rounded-xl transition-colors shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-sm custom-scrollbar">
            {/* Host / Student Profile Card (Clickable to open profile) */}
            <div className="bg-muted/40 hover:bg-muted/60 border border-border/40 rounded-2xl p-4 transition-all">
              <div className="flex items-center justify-between gap-3">
                <Link
                  to={partnerProfileId ? `/profile/${partnerProfileId}` : '#'}
                  onClick={onClose}
                  className="flex items-center gap-3.5 group min-w-0 flex-1"
                >
                  <div className="relative w-12 h-12 rounded-full border-2 border-primary/30 overflow-hidden bg-muted shrink-0 group-hover:scale-105 group-hover:ring-2 group-hover:ring-primary transition-all duration-300">
                    <img src={partnerImg} alt={partnerName} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">
                      {isMentorView ? 'Student Mentee' : 'Mentor / Host'}
                    </p>
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors text-base truncate flex items-center gap-1.5">
                      {partnerName}
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {partnerRole}{partnerCompany}
                    </p>
                  </div>
                </Link>

                {partnerProfileId && (
                  <Link
                    to={`/profile/${partnerProfileId}`}
                    onClick={onClose}
                    className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl border border-border/50 bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-sm"
                  >
                    View Profile
                  </Link>
                )}
              </div>
            </div>

            {/* Time & Venue Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Date & Time */}
              <div className="bg-muted/30 border border-border/30 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-0.5">Date & Time</p>
                  <p className="font-bold text-foreground text-xs sm:text-sm">{sessionDateFormatted}</p>
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {sessionTime} ({duration} mins)
                  </p>
                </div>
              </div>

              {/* Mode & Venue */}
              <div className="bg-muted/30 border border-border/30 rounded-2xl p-3.5 flex items-start gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${isOffline ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {isOffline ? <MapPin className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-0.5">Mode & Venue</p>
                  <p className="font-bold text-foreground text-xs sm:text-sm">
                    {isOffline ? 'In-Person Campus Meeting' : 'Online Video Conference'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate font-medium mt-0.5">
                    {isOffline ? (venueLocation || 'Campus Venue specified by Mentor') : 'Virtual Call via CampusBridge'}
                  </p>
                </div>
              </div>
            </div>

            {/* Message / Agenda ("ki ki blechilam") */}
            <div className="bg-muted/20 border border-border/40 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span>Discussion Agenda & Message</span>
              </div>
              {session.message ? (
                <div className="bg-background/80 rounded-xl p-3.5 border border-border/30 text-xs sm:text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  "{session.message}"
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic pl-6">
                  No specific agenda note was attached during booking.
                </p>
              )}
            </div>

            {/* Goals & Questions */}
            {session.goals && (
              <div className="bg-muted/20 border border-border/40 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Target className="w-4 h-4 text-emerald-500" />
                  <span>Goals & Questions to Discuss</span>
                </div>
                <div className="bg-background/80 rounded-xl p-3.5 border border-border/30 text-xs sm:text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {session.goals}
                </div>
              </div>
            )}

            {/* Attached Link / Resource */}
            <div className="bg-muted/20 border border-border/40 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Link2 className="w-4 h-4 text-primary" />
                <span>Attached Resource / Project Link</span>
              </div>
              {validAttachmentUrl ? (
                <div className="flex items-center justify-between gap-3 bg-background/80 border border-border/40 p-3 rounded-xl">
                  <a
                    href={validAttachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline font-semibold text-xs sm:text-sm min-w-0 truncate"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span className="truncate">{rawAttachment}</span>
                  </a>
                  <button
                    onClick={() => copyToClipboard(validAttachmentUrl)}
                    className="text-xs text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0 flex items-center gap-1"
                    title="Copy link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic pl-6">
                  No project or document links were provided for this session.
                </p>
              )}
            </div>

            {/* Decline reason if present */}
            {session.declineReason && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-500">
                  <AlertCircle className="w-4 h-4" />
                  <span>Reason for Declining</span>
                </div>
                <p className="text-xs text-foreground/90 pl-6 leading-relaxed">
                  {session.declineReason}
                </p>
              </div>
            )}
          </div>

          {/* Bottom Actions Bar */}
          <div className="p-4 sm:p-5 border-t border-border/40 bg-muted/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Google Calendar export */}
              {session.date && status !== 'cancelled' && status !== 'declined' && (
                <a
                  href={`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(title)}&dates=${format(new Date(session.date), 'yyyyMMdd')}/${format(new Date(session.date), 'yyyyMMdd')}&details=${encodeURIComponent(`Session with ${partnerName}\nTime: ${sessionTime}\nMode: ${session.mode || 'Online'}\n${session.message ? 'Agenda: ' + session.message : ''}`)}&location=${encodeURIComponent(venueLocation || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-background border border-border/50 hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Calendar className="w-3.5 h-3.5 text-primary" /> Add to Calendar
                </a>
              )}

              {/* Polished Soft Rose Cancel Button */}
              {onCancel && (status === 'pending' || status === 'accepted') && (
                <button
                  onClick={() => {
                    onClose()
                    onCancel(session._id)
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/25 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {isMentorView ? 'Decline Session' : 'Cancel Request'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Join Video Call button if Online */}
              {!isOffline && (status === 'accepted' || status === 'confirmed') && (
                <button
                  onClick={() => {
                    onClose()
                    if (onJoinCall) {
                      onJoinCall(session)
                    } else if (joinLink && joinLink.startsWith('http') && !joinLink.includes('meet.google.com')) {
                      window.open(joinLink, '_blank')
                    } else {
                      window.dispatchEvent(new CustomEvent('initiate_call', {
                        detail: { 
                          targetPartner: {
                            clerkId: partnerUser?.clerkId || partnerUser?._id,
                            name: partnerName,
                            image: partnerImg
                          }, 
                          type: 'video' 
                        }
                      }))
                    }
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 hover:scale-105 active:scale-95"
                >
                  <Video className="w-3.5 h-3.5" /> Join Call
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </ModalPortal>
  )
}

export default SessionDetailsModal
