import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { useTheme } from './ThemeProvider'
import { useLocation } from 'react-router-dom'


const PageTransition = ({ children }) => {
  const { globalTheme } = useTheme()
  const location = useLocation()

  useEffect(() => {
    // Disable animations on admin routes
    if (location.pathname.startsWith('/admin')) {
      return;
    }
  }, [globalTheme, location.pathname])


  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </>
  )
}

export default PageTransition
