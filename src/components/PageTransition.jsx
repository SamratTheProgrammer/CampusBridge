import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Fireworks } from '@fireworks-js/react'

const PageTransition = ({ children }) => {
  const [showFireworks, setShowFireworks] = useState(false)

  useEffect(() => {
    // Only show fireworks for Diwali theme on page load/refresh/transition
    const rootClasses = document.documentElement.classList
    if (rootClasses.contains('event-diwali')) {
      setShowFireworks(true)
      const timer = setTimeout(() => setShowFireworks(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <>
      <AnimatePresence>
        {showFireworks && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, pointerEvents: 'none' }}
          >
            <Fireworks 
              options={{ 
                opacity: 0.8,
                explosion: 5,
                intensity: 30,
                traceLength: 3,
                traceSpeed: 10,
                particles: 100,
                friction: 0.95
              }} 
              style={{ width: '100%', height: '100%', position: 'absolute' }} 
            />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 260, damping: 20 }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </>
  )
}

export default PageTransition
