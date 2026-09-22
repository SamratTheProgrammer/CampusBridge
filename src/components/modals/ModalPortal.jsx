import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * ModalPortal
 * 
 * Portals modal elements directly into document.body.
 * This guarantees that fixed positioning (e.g. `fixed inset-0`) is strictly
 * relative to the browser viewport (window), preventing any parent transform,
 * overflow, or stacking context from causing gaps or clipping at the top.
 */
const ModalPortal = ({ children }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(children, document.body)
}

export default ModalPortal
