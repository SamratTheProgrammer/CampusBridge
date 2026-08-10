import React from 'react'
import { ShieldAlert, Mail, LogOut, ArrowRight, HelpCircle, AlertCircle } from 'lucide-react'
import { useClerk, useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

const BlockedUserScreen = ({ blockReason }) => {
  const { signOut } = useClerk()
  const { user } = useUser()
  const navigate = useNavigate()

  const userEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || 'User'
  const reasonText = blockReason || 'Your account has been restricted by administration due to a violation of platform policies or security verification.'

  const handleContactSupport = () => {
    const subject = encodeURIComponent(`Account Unblock Appeal - ${userEmail}`)
    const body = encodeURIComponent(`Hello CampusBridge Support,\n\nMy account (${userEmail}) has been blocked.\nReason displayed: ${reasonText}\n\nI would like to request a review of my account suspension.\n\nThank you,\n${user?.fullName || userEmail}`)
    window.location.href = `mailto:campusbridgeofficial3@gmail.com?subject=${subject}&body=${body}`
  }

  const handleGoToLandingContact = () => {
    navigate('/#contact-us')
    setTimeout(() => {
      const contactElem = document.getElementById('contact-us')
      if (contactElem) {
        contactElem.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const handleLogout = async () => {
    sessionStorage.removeItem('campusbridge_user_role')
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center relative z-10 animate-in fade-in zoom-in duration-300">
        
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border-2 border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8 animate-pulse" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Account Restricted</h1>
          <p className="text-xs text-muted-foreground">
            Access to CampusBridge services for <strong className="text-foreground">{userEmail}</strong> has been suspended by the administrator.
          </p>
        </div>

        {/* Reason / Suspension Letter Box */}
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 text-left space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5" /> Suspension Reason
          </div>
          <p className="text-xs text-foreground leading-relaxed font-medium">
            "{reasonText}"
          </p>
        </div>

        {/* Explanation */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          If you believe this restriction is an error or would like to request an account review, please reach out to our administration team.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button 
            onClick={handleContactSupport}
            className="w-full py-3 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10 cursor-pointer"
          >
            <Mail className="w-4 h-4" /> Contact Support / Appeal Unblock
          </button>

          <button 
            onClick={handleGoToLandingContact}
            className="w-full py-2.5 bg-muted/50 border border-border/60 text-foreground text-xs font-bold rounded-xl hover:bg-muted transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Contact Us Page <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button 
            onClick={handleLogout}
            className="w-full py-2.5 text-destructive text-xs font-bold rounded-xl hover:bg-destructive/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default BlockedUserScreen
