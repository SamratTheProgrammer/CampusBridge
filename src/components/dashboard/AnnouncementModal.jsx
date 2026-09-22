import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, X, Check, Flame, Info, AlertTriangle, ChevronLeft, ChevronRight, ArrowRight, Layers } from 'lucide-react'
import API_BASE from '../../utils/api'
import ModalPortal from '../modals/ModalPortal'

/**
 * AnnouncementModal
 * 
 * Pops up automatically on Dashboard load if there are active announcements
 * for the user's role.
 * 
 * Features:
 * 1. Adaptive image ratio container (fits wide banner, square, 16:9, or portrait without clipping).
 * 2. Back-to-back queue when multiple announcements are active, ordered by published date.
 * 3. Session persistence: stores `announcement_seen_<id>` in `sessionStorage` upon reading.
 */
const AnnouncementModal = ({ role = 'student' }) => {
  const [announcements, setAnnouncements] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchActiveAnnouncements = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/announcements/active?role=${role}`)
        if (!res.ok) return
        const data = await res.json()

        if (isMounted && data.success && Array.isArray(data.announcements) && data.announcements.length > 0) {
          // Filter only unseen announcements in this session
          const unseen = data.announcements.filter(a => !sessionStorage.getItem(`announcement_seen_${a._id}`))
          
          // Order according to published date (oldest/first-uploaded first)
          unseen.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

          if (unseen.length > 0) {
            setAnnouncements(unseen)
            setCurrentIndex(0)
            setIsOpen(true)
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard announcements:', err)
      }
    }

    // Slight delay to allow dashboard shell to smoothly render first
    const timer = setTimeout(() => {
      fetchActiveAnnouncements()
    }, 600)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [role])

  if (!isOpen || announcements.length === 0) return null

  const currentAnnouncement = announcements[currentIndex] || announcements[0]
  const totalCount = announcements.length
  const hasMultiple = totalCount > 1
  const isLast = currentIndex === totalCount - 1

  // Advance to next announcement back to back, marking current as seen
  const handleNext = () => {
    if (currentAnnouncement?._id) {
      sessionStorage.setItem(`announcement_seen_${currentAnnouncement._id}`, 'true')
    }
    if (!isLast) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setIsOpen(false)
    }
  }

  // Go back to previous announcement in queue
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  // Dismiss current announcement (advances to next if more are remaining)
  const handleDismissCurrent = () => {
    if (currentAnnouncement?._id) {
      sessionStorage.setItem(`announcement_seen_${currentAnnouncement._id}`, 'true')
    }
    if (!isLast) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setIsOpen(false)
    }
  }

  // Skip all remaining announcements
  const handleDismissAll = () => {
    announcements.forEach(a => {
      sessionStorage.setItem(`announcement_seen_${a._id}`, 'true')
    })
    setIsOpen(false)
  }

  // Priority styling
  const priorityConfig = {
    High: {
      badgeBg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      icon: Flame,
      label: 'High Priority'
    },
    Medium: {
      badgeBg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      icon: AlertTriangle,
      label: 'Important Update'
    },
    Low: {
      badgeBg: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      icon: Info,
      label: 'Notice'
    }
  }

  const pConfig = priorityConfig[currentAnnouncement.priority] || priorityConfig.Medium
  const PriorityIcon = pConfig.icon

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md">
        {/* Backdrop click dismisses current announcement */}
        <div className="fixed inset-0" onClick={handleDismissCurrent} />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-lg bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] my-auto"
        >
          {/* Top Bar with Priority, Queue Indicator, Skip and Close */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50 bg-card shrink-0 z-20">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${pConfig.badgeBg}`}>
                <PriorityIcon className="w-3.5 h-3.5" />
                {pConfig.label}
              </span>

              {hasMultiple && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-muted text-muted-foreground border-border/60">
                  <Layers className="w-3 h-3" />
                  {currentIndex + 1} of {totalCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {hasMultiple && (
                <button
                  onClick={handleDismissAll}
                  className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted rounded-full border border-border/60 transition-all shadow-xs cursor-pointer whitespace-nowrap"
                  title="Skip all remaining announcements"
                >
                  Skip all
                </button>
              )}
              <button
                onClick={handleDismissCurrent}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                title={hasMultiple && !isLast ? "Next announcement" : "Close"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentAnnouncement._id || currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              {/* Banner Image - Adaptive to Any Aspect Ratio (Full-Fit, Unobstructed) */}
              {currentAnnouncement.imageUrl ? (
                <div className="relative w-full bg-muted/30 overflow-hidden flex items-center justify-center min-h-[140px] max-h-[300px] sm:max-h-[320px] shrink-0 border-b border-border/40">
                  {/* Ambient blurred backdrop so whatever aspect ratio fits smoothly */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20 scale-125 pointer-events-none"
                    style={{ backgroundImage: `url(${currentAnnouncement.imageUrl})` }}
                  />
                  <img
                    src={currentAnnouncement.imageUrl}
                    alt={currentAnnouncement.title}
                    className="relative z-10 max-h-[280px] sm:max-h-[300px] w-auto max-w-full object-contain mx-auto p-2 drop-shadow-sm select-none"
                  />
                </div>
              ) : (
                <div className="px-6 pt-5 pb-1 flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                    <Megaphone className="w-5 h-5" />
                  </div>
                </div>
              )}

              {/* Modal Content */}
              <div className="p-6 pt-4 overflow-y-auto flex-1 space-y-3">
                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug">
                  {currentAnnouncement.title}
                </h2>

                {/* Formatted details text */}
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line space-y-2 font-normal">
                  {currentAnnouncement.details}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Footer Action & Back-to-Back Navigation */}
          <div className="p-4 sm:p-5 bg-muted/20 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            {hasMultiple ? (
              <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                {/* Dots indicator */}
                <div className="flex items-center gap-1.5">
                  {announcements.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === currentIndex 
                          ? 'w-6 bg-primary' 
                          : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                      }`}
                      title={`Go to announcement ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Back / Forward arrows */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Previous announcement"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={isLast}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Next announcement"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden sm:block" />
            )}

            {/* Primary Action Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleNext}
                className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-sm transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLast ? (
                  <>
                    <Check className="w-4 h-4" /> Got it, continue
                  </>
                ) : (
                  <>
                    Next Announcement ({currentIndex + 1}/{totalCount})
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </ModalPortal>
  )
}

export default AnnouncementModal
