import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Smartphone, 
  ArrowDownToLine, 
  QrCode, 
  X, 
  Sparkles, 
  ChevronRight 
} from 'lucide-react'
import AppInstallModal from '../modals/AppInstallModal'

const STORAGE_KEY = 'campusbridge_dashboard_app_banner_dismissed'

const DashboardAppBanner = () => {
  const location = useLocation()
  const [isDismissed, setIsDismissed] = useState(true) // default true to avoid hydration flicker
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY) === 'true'
    setIsDismissed(dismissed)

    const handleOpen = () => setShowModal(true)
    window.addEventListener('open-app-install-modal', handleOpen)
    return () => window.removeEventListener('open-app-install-modal', handleOpen)
  }, [])

  // Never display inside the full-screen messages/chat route
  if (location.pathname.includes('/messages')) {
    return <AppInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  return (
    <>
      <AnimatePresence>
        {!isDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, height: 0, y: -10, marginBottom: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="w-full mb-4 px-3 sm:px-6 md:px-8 pt-2"
          >
            <div className="relative overflow-hidden rounded-2xl border border-purple-500/25 dark:border-purple-500/35 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-purple-600/10 dark:from-purple-950/40 dark:via-zinc-900/60 dark:to-indigo-950/40 p-3.5 sm:p-4 backdrop-blur-md shadow-sm transition-all">
              {/* Subtle ambient background glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left Info Group */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="relative w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
                    <Smartphone className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 dark:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        <Sparkles className="w-2.5 h-2.5" /> Mobile App Launched
                      </span>
                      <span className="text-[11px] text-muted-foreground hidden lg:inline">• Android APK (7.2MB) & iOS PWA</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-foreground mt-0.5 leading-snug">
                      CampusBridge is now available for your phone!
                    </p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight hidden sm:block mt-0.5">
                      Get instant push notifications, 1-on-1 WebRTC mentorship calls, and real-time chat directly on your mobile.
                    </p>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pl-1 sm:pl-0">
                  <a
                    href="/downloads/CampusBridge.apk"
                    download="CampusBridge.apk"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>Download APK</span>
                  </a>

                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/70 hover:bg-muted/70 text-foreground text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Scan QR /</span> iOS
                  </button>

                  <button
                    onClick={handleDismiss}
                    aria-label="Dismiss banner"
                    className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0 ml-1"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AppInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}

export default DashboardAppBanner
