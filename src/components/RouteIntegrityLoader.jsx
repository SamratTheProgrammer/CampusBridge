import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Loader2, Lock } from 'lucide-react'

const RouteIntegrityLoader = ({
  title = 'Verifying route integrity...',
  subtitle = 'Securing session and authenticating permissions...',
  badge = '256-bit SSL • Verified Session'
}) => {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex flex-col items-center text-center max-w-sm w-full relative z-10"
      >
        {/* Spinner & Shield Graphic */}
        <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
          {/* Subtle outer pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-75" />

          {/* Glowing orbital ring */}
          <div className="absolute inset-1 rounded-full border-2 border-primary/20" />

          {/* Spinning gradient loader ring */}
          <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-primary border-r-primary animate-spin" />

          {/* Inner solid badge with ShieldCheck */}
          <div className="w-12 h-12 rounded-full bg-card border border-border/60 shadow-lg flex items-center justify-center text-primary relative z-10">
            <ShieldCheck className="w-6 h-6 animate-pulse text-primary" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold tracking-tight text-foreground mb-2 animate-pulse">
          {title}
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xs">
          {subtitle}
        </p>

        {/* Security verification badge */}
        {badge && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 border border-border/50 text-[11px] font-medium text-muted-foreground shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Lock className="w-3 h-3 text-muted-foreground/80" />
            <span>{badge}</span>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default RouteIntegrityLoader
