import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Fireworks } from '@fireworks-js/react'
import confetti from 'canvas-confetti'

const PageTransition = ({ children }) => {
  const [showFireworks, setShowFireworks] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const confettiCanvasRef = useRef(null)

  useEffect(() => {
    const rootClasses = document.documentElement.classList
    
    // Diwali Fireworks
    if (rootClasses.contains('event-diwali')) {
      setShowFireworks(true)
      const timer = setTimeout(() => setShowFireworks(false), 5000)
      return () => clearTimeout(timer)
    }
    
    // Holi Confetti
    if (rootClasses.contains('event-holi')) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [])

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
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ff00ff', '#00ffff', '#ffff00', '#ff00aa', '#00ff00']
        });
        myConfetti({
          particleCount: 5,
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
