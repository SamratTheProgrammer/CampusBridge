import React from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { CheckCircle, Calendar, ArrowLeft, Clock, MapPin, Globe, Sparkles, MessageSquare, Target, Link2 } from 'lucide-react'
import { motion } from 'framer-motion'

const BookingSuccess = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()

  const booking = location.state?.booking
  const mentor = booking?.mentor

  const isMentorDashboard = window.location.pathname.startsWith('/mentor-dashboard')
  const basePath = isMentorDashboard ? '/mentor-dashboard' : '/dashboard'

  const formattedDate = booking?.date
    ? new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Selected Date'

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 py-8">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 25 }}
        className="bg-card border border-border/50 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-primary/10 max-w-xl w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
          className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-emerald-500/5"
        >
          <CheckCircle className="w-10 h-10" />
        </motion.div>
        
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Request Sent • Pending Mentor Confirmation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">Session Requested!</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Your mentorship session request has been forwarded to the mentor with all your details. You will receive an instant notification once the mentor confirms.
          </p>
        </div>

        {/* Detailed Booking Card */}
        <div className="bg-muted/40 border border-border/50 rounded-2xl p-5 mb-6 space-y-4">
          {mentor && (
            <div className="flex items-center gap-3.5 pb-4 border-b border-border/40">
              <img
                src={mentor.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.firstName || 'Mentor'}`}
                alt={mentor.firstName || 'Mentor'}
                className="w-13 h-13 rounded-2xl object-cover ring-2 ring-primary/20"
              />
              <div className="min-w-0">
                <h3 className="font-bold text-foreground text-base truncate">{mentor.firstName} {mentor.lastName}</h3>
                <p className="text-xs text-muted-foreground truncate">{mentor.headline || 'Campus Mentor'}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-background/80 rounded-xl border border-border/40">
              <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-0.5">Topic</span>
              <span className="font-bold text-foreground block truncate">{booking?.type || booking?.sessionType || 'Mentorship'}</span>
            </div>

            <div className="p-2.5 bg-background/80 rounded-xl border border-border/40">
              <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-0.5">Mode</span>
              <span className="font-bold text-foreground flex items-center gap-1 truncate">
                {booking?.mode === 'Offline' ? (
                  <span className="text-amber-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" /> Offline</span>
                ) : (
                  <span className="text-primary flex items-center gap-1"><Globe className="w-3.5 h-3.5 shrink-0" /> Online Video</span>
                )}
              </span>
            </div>

            <div className="p-2.5 bg-background/80 rounded-xl border border-border/40">
              <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-0.5">Date</span>
              <span className="font-bold text-foreground block truncate">{formattedDate}</span>
            </div>

            <div className="p-2.5 bg-background/80 rounded-xl border border-border/40">
              <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-0.5">Time & Duration</span>
              <span className="font-bold text-foreground block truncate">{booking?.time || 'Scheduled Time'} ({booking?.duration || 45}m)</span>
            </div>
          </div>

          {booking?.location && booking.mode === 'Offline' && (
            <div className="p-2.5 bg-background/80 rounded-xl border border-border/40 text-xs">
              <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-0.5">Campus Venue</span>
              <span className="font-medium text-foreground">{booking.location}</span>
            </div>
          )}

          {booking?.message && (
            <div className="p-2.5 bg-background/80 rounded-xl border border-border/40 text-xs">
              <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-primary" /> Message Sent
              </span>
              <p className="text-foreground/90 italic line-clamp-2">"{booking.message}"</p>
            </div>
          )}

          {booking?.goals && (
            <div className="p-2.5 bg-background/80 rounded-xl border border-border/40 text-xs">
              <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <Target className="w-3 h-3 text-emerald-500" /> Key Goals
              </span>
              <p className="text-foreground/90">{booking.goals}</p>
            </div>
          )}

          {booking?.attachmentUrl && (
            <div className="p-2.5 bg-background/80 rounded-xl border border-border/40 text-xs">
              <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <Link2 className="w-3 h-3 text-blue-500" /> Attached Link
              </span>
              <a href={booking.attachmentUrl.startsWith('http') ? booking.attachmentUrl : `https://${booking.attachmentUrl}`} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate block">
                {booking.attachmentUrl}
              </a>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => navigate(`${basePath}/sessions`)}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" /> View in My Sessions
          </button>

          <button 
            onClick={() => navigate(`${basePath}/mentor`)}
            className="w-full bg-background border border-border/50 text-foreground hover:bg-muted py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Explore More Mentors
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default BookingSuccess
