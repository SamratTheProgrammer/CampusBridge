import React, { useEffect, useState } from 'react'
import { useTheme } from './ThemeProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { PartyPopper, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const EventPopup = () => {
  const { globalTheme } = useTheme()
  const [show, setShow] = useState(false)
  const [hasShown, setHasShown] = useState(false)
  const location = useLocation()

  useEffect(() => {
    // Do not show popup for admin routes
    if (location.pathname.startsWith('/admin')) {
      return;
    }

    if (globalTheme && globalTheme !== 'system' && globalTheme !== 'none') {
      if (!hasShown) {
        // Delay popup so it doesn't block complex animations
        // Independence day animation takes 5s to form the flag
        // Diwali animation takes 6s to draw the rangoli
        let delay = 1000;
        if (globalTheme === 'independence') delay = 5000;
        if (globalTheme === 'diwali') delay = 6000;
        
        const timer = setTimeout(() => {
          setShow(true)
          setHasShown(true)
          
          // Auto close after 8 seconds
          setTimeout(() => setShow(false), 8000)
        }, delay)
        return () => clearTimeout(timer)
      }
    }
  }, [globalTheme, location.pathname, hasShown])

  const handleClose = () => {
    setShow(false)
  }

  const getEventName = (theme) => {
    if (theme === 'independence') return 'Independence Day'
    return theme.charAt(0).toUpperCase() + theme.slice(1)
  }

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed top-4 left-0 right-0 z-[10000] flex justify-center pointer-events-none px-4">
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`border border-primary/30 shadow-lg shadow-primary/10 rounded-2xl p-4 w-full max-w-md pointer-events-auto relative overflow-hidden flex items-center gap-4 bg-card ${
              globalTheme === 'independence' 
                ? 'bg-gradient-to-b from-[#FF9933]/30 via-transparent to-[#138808]/30 dark:from-[#FF9933]/20 dark:to-[#138808]/20' 
                : ''
            }`}
          >
            {/* Decorative background blur */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary ring-2 ring-primary/20">
              <PartyPopper className="w-5 h-5 animate-bounce" />
            </div>
            
            <div className="flex-1 pr-6">
              <h2 className="text-sm font-bold text-foreground">
                Wishing you and your family a Happy {getEventName(globalTheme)}!
              </h2>
            </div>

            <button 
              onClick={handleClose}
              className="absolute top-2 right-2 text-muted-foreground hover:bg-muted p-1 rounded-full transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default EventPopup
