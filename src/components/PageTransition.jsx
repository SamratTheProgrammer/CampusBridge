import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

import { useTheme } from './ThemeProvider'
import { useLocation } from 'react-router-dom'

const CanvasFireworks = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let particles = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const colors = ['#ff0055', '#ffdd00', '#ff5500', '#00ffcc', '#ff00ff', '#ffffff']

    const createFirework = (x, y) => {
      const particleCount = 60
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount
        const speed = Math.random() * 5 + 2
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 3 + 1,
          decay: Math.random() * 0.02 + 0.015,
        })
      }
    }

    const interval = setInterval(() => {
      const rx = Math.random() * (canvas.width * 0.8) + canvas.width * 0.1
      const ry = Math.random() * (canvas.height * 0.5) + canvas.height * 0.1
      createFirework(rx, ry)
    }, 400)

    const render = () => {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'lighter'

      particles.forEach((p, index) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05
        p.alpha -= p.decay

        if (p.alpha <= 0) {
          particles.splice(index, 1)
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = p.color
          ctx.globalAlpha = Math.max(0, p.alpha)
          ctx.fill()
        }
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      clearInterval(interval)
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    />
  )
}

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
          >
            <CanvasFireworks />
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
