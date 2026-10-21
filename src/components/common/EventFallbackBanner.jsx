import React from 'react'
import {
  Calendar,
  Terminal,
  Cpu,
  GraduationCap,
  Briefcase,
  Presentation,
  Users,
  Video,
  Sparkles,
  Gamepad2,
  Trophy,
  Mic,
  Music,
  Bookmark
} from 'lucide-react'

/**
 * Returns thematic icon, gradients, and styling based on event type
 */
export const getEventTypeTheme = (rawType = '') => {
  const t = String(rawType || '').toLowerCase().trim()

  if (t.includes('hack') || t.includes('code') || t.includes('coding') || t.includes('dev') || t.includes('algo')) {
    return {
      label: rawType || 'Hackathon',
      Icon: Terminal,
      gradient: 'from-violet-950 via-indigo-950 to-slate-950',
      accentGlow: 'bg-violet-500/25',
      border: 'border-violet-500/30',
      badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      iconBox: 'bg-violet-500/20 text-violet-300 border-violet-500/40 shadow-violet-500/20'
    }
  }

  if (t.includes('work') || t.includes('hands-on') || t.includes('lab') || t.includes('bootcamp')) {
    return {
      label: rawType || 'Workshop',
      Icon: Cpu,
      gradient: 'from-amber-950 via-orange-950 to-neutral-950',
      accentGlow: 'bg-amber-500/25',
      border: 'border-amber-500/30',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      iconBox: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/20'
    }
  }

  if (t.includes('master') || t.includes('class') || t.includes('course') || t.includes('lecture') || t.includes('study')) {
    return {
      label: rawType || 'Masterclass',
      Icon: GraduationCap,
      gradient: 'from-purple-950 via-fuchsia-950 to-neutral-950',
      accentGlow: 'bg-purple-500/25',
      border: 'border-purple-500/30',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      iconBox: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-500/20'
    }
  }

  if (t.includes('career') || t.includes('fair') || t.includes('job') || t.includes('hire') || t.includes('placement')) {
    return {
      label: rawType || 'Career Fair',
      Icon: Briefcase,
      gradient: 'from-emerald-950 via-teal-950 to-neutral-950',
      accentGlow: 'bg-emerald-500/25',
      border: 'border-emerald-500/30',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      iconBox: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20'
    }
  }

  if (t.includes('talk') || t.includes('tech') || t.includes('seminar') || t.includes('speaker') || t.includes('conference')) {
    return {
      label: rawType || 'Tech Talk',
      Icon: Presentation,
      gradient: 'from-sky-950 via-blue-950 to-neutral-950',
      accentGlow: 'bg-sky-500/25',
      border: 'border-sky-500/30',
      badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      iconBox: 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sky-500/20'
    }
  }

  if (t.includes('network') || t.includes('meet') || t.includes('community') || t.includes('social') || t.includes('alumni')) {
    return {
      label: rawType || 'Networking',
      Icon: Users,
      gradient: 'from-rose-950 via-pink-950 to-neutral-950',
      accentGlow: 'bg-rose-500/25',
      border: 'border-rose-500/30',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      iconBox: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-500/20'
    }
  }

  if (t.includes('webinar') || t.includes('online') || t.includes('virtual') || t.includes('stream') || t.includes('live')) {
    return {
      label: rawType || 'Webinar',
      Icon: Video,
      gradient: 'from-cyan-950 via-blue-950 to-neutral-950',
      accentGlow: 'bg-cyan-500/25',
      border: 'border-cyan-500/30',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      iconBox: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-500/20'
    }
  }

  if (t.includes('game') || t.includes('gaming') || t.includes('esport')) {
    return {
      label: rawType || 'Gaming Event',
      Icon: Gamepad2,
      gradient: 'from-green-950 via-emerald-950 to-neutral-950',
      accentGlow: 'bg-green-500/25',
      border: 'border-green-500/30',
      badge: 'bg-green-500/20 text-green-300 border-green-500/30',
      iconBox: 'bg-green-500/20 text-green-300 border-green-500/40 shadow-green-500/20'
    }
  }

  if (t.includes('fest') || t.includes('cultur') || t.includes('music') || t.includes('celebrat')) {
    return {
      label: rawType || 'Cultural Fest',
      Icon: Sparkles,
      gradient: 'from-fuchsia-950 via-pink-950 to-neutral-950',
      accentGlow: 'bg-fuchsia-500/25',
      border: 'border-fuchsia-500/30',
      badge: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
      iconBox: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40 shadow-fuchsia-500/20'
    }
  }

  if (t.includes('comp') || t.includes('contest') || t.includes('quiz')) {
    return {
      label: rawType || 'Competition',
      Icon: Trophy,
      gradient: 'from-yellow-950 via-amber-950 to-neutral-950',
      accentGlow: 'bg-yellow-500/25',
      border: 'border-yellow-500/30',
      badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      iconBox: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 shadow-yellow-500/20'
    }
  }

  // Default / Other Custom Type
  return {
    label: rawType || 'Campus Event',
    Icon: Calendar,
    gradient: 'from-indigo-950 via-slate-900 to-neutral-950',
    accentGlow: 'bg-primary/25',
    border: 'border-primary/30',
    badge: 'bg-primary/20 text-primary-foreground/90 border-primary/30',
    iconBox: 'bg-primary/20 text-primary border-primary/40 shadow-primary/20'
  }
}

/**
 * EventFallbackBanner
 * 
 * Displayed when an event does not have an uploaded image.
 * Shows a styled gradient backdrop with thematic iconography and category label.
 */
const EventFallbackBanner = ({ type = '', title = '', className = '', showLabel = true }) => {
  const theme = getEventTypeTheme(type)
  const { Icon, gradient, accentGlow, border, badge, iconBox, label } = theme

  return (
    <div className={`w-full h-full relative overflow-hidden bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-3 select-none ${className}`}>
      {/* Decorative ambient background glows */}
      <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none ${accentGlow}`} />
      <div className={`absolute -bottom-10 -left-10 w-28 h-28 rounded-full blur-2xl pointer-events-none ${accentGlow}`} />
      
      {/* Subtle geometric pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.07] pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '16px 16px'
        }}
      />

      {/* Main Center Icon Box */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center gap-2">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 ${iconBox}`}>
          <Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
        </div>

        {/* Event Type Badge */}
        {showLabel && (
          <span className={`inline-flex items-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-xs max-w-[170px] truncate ${badge}`}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

export default EventFallbackBanner
