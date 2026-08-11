import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Fireworks } from '@fireworks-js/react'
import confetti from 'canvas-confetti'

import { useTheme } from './ThemeProvider'
import { useLocation } from 'react-router-dom'

const PageTransition = ({ children }) => {
  const [showFireworks, setShowFireworks] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const confettiCanvasRef = useRef(null)
  const { globalTheme } = useTheme()
  const location = useLocation()

  useEffect(() => {
    // Disable animations on admin routes
    if (location.pathname.startsWith('/admin')) {
      return;
    }

    // Diwali Fireworks
    if (globalTheme === 'diwali') {
      setShowFireworks(true)
      const timer = setTimeout(() => setShowFireworks(false), 5000)
      return () => clearTimeout(timer)
    }
    
    // Holi Confetti
    if (globalTheme === 'holi') {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [globalTheme, location.pathname])

  useEffect(() => {
    if (showConfetti && confettiCanvasRef.current) {
      const myConfetti = confetti.create(confettiCanvasRef.current, {
        resize: true,
        useWorker: true
      })
      
      const duration = 5000;
      const end = Date.now() + duration;

      const frame = () => {
        myConfetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ff00ff', '#00ffff', '#ffff00', '#ff00aa', '#00ff00']
        });
        myConfetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ff00ff', '#00ffff', '#ffff00', '#ff00aa', '#00ff00']
        });

        if (Date.now() < end && showConfetti) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [showConfetti])

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
                opacity: 0.6,
                explosion: 3,
                intensity: 15,
                traceLength: 2,
                traceSpeed: 10,
                particles: 60,
                friction: 0.96
              }} 
              style={{ width: '100%', height: '100%', position: 'absolute' }} 
            />
          </motion.div>
        )}
        
        {showConfetti && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, pointerEvents: 'none' }}
          >
            <canvas ref={confettiCanvasRef} style={{ width: '100%', height: '100%', position: 'absolute' }} />
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
