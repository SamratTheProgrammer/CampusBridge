import React, { useState, useMemo } from 'react'
import { useParams, useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  ArrowRight,
  Home,
  LayoutDashboard,
  Search,
  Users,
  Briefcase,
  Calendar,
  HelpCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ShieldAlert,
  ServerCrash,
  RefreshCw,
  FileQuestion
} from 'lucide-react'

// Standard Clean Error Profiles tailored for CampusBridge
const ERROR_CONFIG = {
  404: {
    code: '404',
    badge: '404 Error',
    title: 'Page Not Found',
    description: "Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or the link may be incorrect.",
    icon: FileQuestion,
    accentClass: 'from-primary via-purple-600 to-indigo-600 dark:from-primary dark:via-purple-400 dark:to-indigo-300',
    badgeClass: 'bg-primary/10 text-primary border-primary/20'
  },
  403: {
    code: '403',
    badge: '403 Forbidden',
    title: 'Access Restricted',
    description: 'You do not have permission to access this page or resource. Please ensure you are signed in with the appropriate account.',
    icon: ShieldAlert,
    accentClass: 'from-amber-500 via-orange-500 to-red-500 dark:from-amber-400 dark:via-orange-400 dark:to-red-400',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
  },
  401: {
    code: '401',
    badge: '401 Unauthorized',
    title: 'Authentication Required',
    description: 'Your session has expired or you need to sign in to view this content.',
    icon: ShieldAlert,
    accentClass: 'from-purple-500 via-indigo-500 to-primary dark:from-purple-400 dark:via-indigo-400 dark:to-primary',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
  },
  500: {
    code: '500',
    badge: '500 Server Error',
    title: 'Something Went Wrong',
    description: 'Our servers encountered an unexpected issue while processing your request. Please try refreshing or try again shortly.',
    icon: ServerCrash,
    accentClass: 'from-rose-500 via-red-500 to-orange-500 dark:from-rose-400 dark:via-red-400 dark:to-orange-400',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
  }
}

export default function ErrorPage({
  error: boundaryError,
  errorCode: propErrorCode,
  customTitle: propTitle,
  customMessage: propMessage,
  onReset: propReset
}) {
  const { code: paramCode } = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { isSignedIn } = useUser()

  const navState = location.state || {}
  const [searchQuery, setSearchQuery] = useState('')
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  const [copied, setCopied] = useState(false)

  // Resolve active error code dynamically
  const activeCode = useMemo(() => {
    if (propErrorCode) return String(propErrorCode)
    if (paramCode) return String(paramCode)
    if (searchParams.get('code') || searchParams.get('status')) {
      return String(searchParams.get('code') || searchParams.get('status'))
    }
    if (navState.code || navState.status) {
      return String(navState.code || navState.status)
    }
    if (boundaryError) return '500'
    return '404'
  }, [propErrorCode, paramCode, searchParams, navState, boundaryError])

  // Get active error profile
  const profile = useMemo(() => {
    const base = ERROR_CONFIG[activeCode] || {
      code: activeCode,
      badge: `Error ${activeCode}`,
      title: 'Unexpected Error',
      description: 'An unexpected issue occurred while loading this page.',
      icon: AlertCircle,
      accentClass: 'from-primary via-purple-600 to-indigo-600',
      badgeClass: 'bg-primary/10 text-primary border-primary/20'
    }

    return {
      ...base,
      title: propTitle || searchParams.get('title') || navState.title || base.title,
      description:
        propMessage ||
        searchParams.get('message') ||
        navState.message ||
        (boundaryError && boundaryError.message) ||
        base.description
    }
  }, [activeCode, propTitle, propMessage, searchParams, navState, boundaryError])

  const IconComponent = profile.icon

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    navigate(`/dashboard/mentor?search=${encodeURIComponent(searchQuery)}`)
  }

  // Copy error technical details
  const handleCopyDetails = () => {
    const errorDetails = {
      code: activeCode,
      title: profile.title,
      url: window.location.href,
      path: location.pathname,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      errorMessage: boundaryError?.message || navState.message || null,
      errorStack: boundaryError?.stack || navState.stack || null
    }

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
    setCopied(true)
    toast.success('Error details copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const primaryDestination = isSignedIn ? '/dashboard' : '/'
  const primaryLabel = isSignedIn ? 'Go to Dashboard' : 'Back to Home'

  // Quick helpful destination cards
  const helpfulLinks = [
    {
      title: 'Find a Mentor',
      description: 'Connect with verified campus alumni and industry mentors.',
      icon: Users,
      path: '/dashboard/mentor'
    },
    {
      title: 'Explore Jobs',
      description: 'Discover full-time roles, internships, and opportunities.',
      icon: Briefcase,
      path: '/dashboard/jobs'
    },
    {
      title: 'Campus Events',
      description: 'Join upcoming workshops, webinars, and networking events.',
      icon: Calendar,
      path: '/dashboard/events'
    },
    {
      title: 'Help & Support',
      description: 'Need assistance? Read our FAQs or contact our team.',
      icon: HelpCircle,
      path: '/#contact'
    }
  ]

  return (
    <div className="relative flex-1 flex flex-col justify-center items-center py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-background text-foreground overflow-hidden">
      {/* Subtle Background Glows matching CampusBridge Hero */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 dark:bg-primary/15 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[250px] bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-3xl w-full mx-auto text-center space-y-8">
        {/* Error Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border ${profile.badgeClass}`}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            {profile.badge}
          </span>
        </motion.div>

        {/* Central Graphic & Code */}
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex items-center justify-center gap-3 sm:gap-6"
          >
            {/* Elegant Icon Badge */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-card border border-border/80 shadow-xl flex items-center justify-center text-primary">
              <IconComponent className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            {/* Large Gradient Number */}
            <h1
              className={`text-6xl sm:text-7xl md:text-8xl font-extrabold tracking-tight font-sans text-transparent bg-clip-text bg-gradient-to-r ${profile.accentClass}`}
            >
              {profile.code}
            </h1>
          </motion.div>

          {/* Heading & Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-2.5"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              {profile.title}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {profile.description}
            </p>
          </motion.div>
        </div>

        {/* Primary Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2"
        >
          {propReset ? (
            <button
              onClick={propReset}
              className="w-full sm:w-auto px-8 py-3.5 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
          ) : (
            <Link
              to={primaryDestination}
              className="w-full sm:w-auto px-8 py-3.5 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
            >
              {isSignedIn ? <LayoutDashboard className="w-4 h-4" /> : <Home className="w-4 h-4" />}
              {primaryLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1)
              } else {
                navigate('/')
              }
            }}
            className="w-full sm:w-auto px-6 py-3.5 border border-border hover:bg-muted/50 rounded-full font-medium transition-all text-foreground flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-md mx-auto w-full pt-2"
        >
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mentors, jobs, events..."
              className="w-full bg-card border border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground text-sm rounded-full pl-11 pr-24 py-3 outline-none transition-all shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-medium transition-all"
            >
              Search
            </button>
          </form>
        </motion.div>

        {/* Helpful Destinations Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pt-6 border-t border-border/50 text-left"
        >
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center mb-4">
            Popular Destinations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {helpfulLinks.map((item) => (
              <Link
                key={item.title}
                to={item.path}
                className="group p-4 bg-card hover:bg-muted/40 border border-border/60 hover:border-primary/40 rounded-2xl transition-all shadow-sm flex items-start gap-3.5"
              >
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform shrink-0">
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                    {item.title}
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Collapsible Technical Details for Debugging */}
        {(boundaryError || navState.stack || navState.message || searchParams.get('debug') === 'true') && (
          <div className="max-w-2xl mx-auto w-full pt-2 text-left">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 mx-auto font-medium"
            >
              {showTechnicalDetails ? (
                <>
                  <ChevronUp className="w-4 h-4" /> Hide technical details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" /> View technical details
                </>
              )}
            </button>

            <AnimatePresence>
              {showTechnicalDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-4 bg-card border border-border/80 rounded-2xl text-xs font-mono text-muted-foreground space-y-2 overflow-hidden shadow-md"
                >
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="font-semibold text-foreground">Diagnostic Info</span>
                    <button
                      onClick={handleCopyDetails}
                      className="px-2.5 py-1 bg-muted hover:bg-muted/80 rounded-lg text-xs font-sans text-foreground flex items-center gap-1 transition-all"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div>Status: {activeCode}</div>
                    <div>Route: {location.pathname}</div>
                    <div>Time: {new Date().toLocaleString()}</div>
                    {boundaryError?.message && (
                      <div className="text-destructive font-semibold pt-1">
                        Error: {boundaryError.message}
                      </div>
                    )}
                    {boundaryError?.stack && (
                      <pre className="mt-2 p-2 bg-muted/60 rounded-lg overflow-x-auto text-[11px] max-h-36">
                        {boundaryError.stack}
                      </pre>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
