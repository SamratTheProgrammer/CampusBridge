import React, { useState, useEffect } from 'react'
import { X, Smartphone, ArrowRight, Download } from 'lucide-react'

const AppAnnouncementBar = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show if not dismissed in this session
    const isDismissed = sessionStorage.getItem('campusbridge_hide_app_announcement') === 'true'
    if (!isDismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = (e) => {
    e.stopPropagation()
    setIsVisible(false)
    sessionStorage.setItem('campusbridge_hide_app_announcement', 'true')
  }

  const handleScrollToDownload = () => {
    const el = document.getElementById('download-app')
    if (el) {
      const offset = 80
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = el.getBoundingClientRect().top
      const offsetPosition = elementRect - bodyRect - offset
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
    } else {
      window.location.hash = '#download-app'
    }
  }

  if (!isVisible) return null

  return (
    <div 
      onClick={handleScrollToDownload}
      className="bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white py-2.5 px-4 sm:px-8 shadow-md relative z-[60] flex items-center justify-between border-b border-purple-400/30 cursor-pointer group transition-all"
    >
      {/* Centered content with icon, message, and badge */}
      <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-center pr-6">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white shrink-0 group-hover:scale-110 transition-transform">
          <Smartphone className="w-3.5 h-3.5" />
        </span>
        <span className="leading-tight">
          <span className="font-semibold text-white">CampusBridge Mobile App is now live!</span>
          <span className="hidden sm:inline text-purple-100/90 ml-1">Download today for Android & iOS.</span>
        </span>
        <span className="bg-white text-purple-800 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wide shrink-0">
          NEW
        </span>
        <span className="hidden md:inline-flex items-center gap-1 text-xs font-semibold text-white/95 underline underline-offset-2 ml-1 group-hover:translate-x-0.5 transition-transform">
          Get it now <ArrowRight className="w-3 h-3 inline" />
        </span>
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="p-1 rounded-full text-white/75 hover:text-white hover:bg-white/20 transition-colors shrink-0 cursor-pointer"
        title="Dismiss announcement"
        aria-label="Dismiss announcement"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default AppAnnouncementBar
