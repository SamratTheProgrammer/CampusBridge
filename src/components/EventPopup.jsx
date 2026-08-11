import React, { useEffect, useState } from 'react'
import { useTheme } from './ThemeProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { PartyPopper, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import confetti from 'canvas-confetti'

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
        const delay = globalTheme === 'independence' ? 5000 : 1000;
        
        const timer = setTimeout(() => {
          setShow(true)
          setHasShown(true)
        }, delay)
        return () => clearTimeout(timer)
      }
    }
  }, [globalTheme])

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
        <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none p-4">
          {/* Backdrop (optimized for performance by removing blur) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/60 pointer-events-auto"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative bg-card border-2 border-primary/30 shadow-2xl shadow-primary/20 rounded-3xl p-8 max-w-sm w-full text-center pointer-events-auto overflow-hidden"
          >
            {/* Decorative background blur */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />

            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 text-muted-foreground hover:bg-muted p-1.5 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 ring-8 ring-primary/5">
                <PartyPopper className="w-10 h-10 animate-bounce" />
              </div>
              
              <h2 className="text-3xl font-extrabold text-foreground mb-3 text-center px-4 leading-tight">
                Wishing you and your family a Happy {getEventName(globalTheme)}.
              </h2>
              
              <button
                onClick={handleClose}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95"
              >
                Thank you!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default EventPopup
