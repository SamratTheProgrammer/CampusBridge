import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { useTheme } from './ThemeProvider'
import { useLocation } from 'react-router-dom'


const PageTransition = ({ children }) => {
  const location = useLocation()

  // Bypass Framer Motion transform wrapper on admin routes
  if (location.pathname.startsWith('/admin')) {
    return <>{children}</>
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full h-full min-h-full flex-1 flex flex-col min-w-0"
    >
      {children}
    </motion.div>
  )
}

export default PageTransition
