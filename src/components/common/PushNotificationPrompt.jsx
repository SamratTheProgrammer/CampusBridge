import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Check, Smartphone, Sparkles, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { isPushSupported, subscribeUserToPush, requestAndSubscribePush } from '../../utils/pushManager'

const PushNotificationPrompt = () => {
  const { user, isLoaded, isSignedIn } = useUser()
  const [showPrompt, setShowPrompt] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return
    if (!isPushSupported()) return

    // If permission is already granted, silently ensure this device is registered with backend
    if (Notification.permission === 'granted') {
      subscribeUserToPush(user.id)
      return
    }

    // If permission was already denied, do not annoy user with prompt
    if (Notification.permission === 'denied') return

    // If permission is 'default' (not decided yet), check if user dismissed recently
    const dismissedTime = localStorage.getItem('cb_push_prompt_dismissed')
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000
    if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < threeDaysMs) {
      return
    }

    // Delay prompt slightly so page has settled
    const timer = setTimeout(() => {
      setShowPrompt(true)
    }, 2500)

    return () => clearTimeout(timer)
  }, [isLoaded, isSignedIn, user?.id])

  const handleEnable = async () => {
    if (!user?.id) return
    setIsSubscribing(true)
    try {
      const success = await requestAndSubscribePush(user.id)
      if (success) {
        toast.success("Push notifications enabled! You'll get alerts even when the app is closed.", {
          duration: 5000,
          icon: '🔔'
        })
        setShowPrompt(false)
      } else {
        setShowPrompt(false)
      }
    } catch (err) {
      console.error('Push enable error:', err)
      toast.error(err.message || 'Could not enable notifications. Check browser settings.')
      setShowPrompt(false)
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('cb_push_prompt_dismissed', Date.now().toString())
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[180] max-w-sm w-[calc(100%-2rem)] bg-card/95 backdrop-blur-md border border-primary/30 rounded-2xl shadow-2xl p-4 sm:p-5 overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3.5 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/25">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                Stay Updated
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              </h4>
              <button 
                onClick={handleDismiss} 
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed mb-3.5">
              Receive messages, calls, and notifications on your phone even when Chrome or CampusBridge is closed.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={handleEnable}
                disabled={isSubscribing}
                className="flex-1 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubscribing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Enabling...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-3.5 h-3.5" />
                    Turn On Notifications
                  </>
                )}
              </button>

              <button
                onClick={handleDismiss}
                className="px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PushNotificationPrompt
