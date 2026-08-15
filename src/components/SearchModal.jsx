import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, FileText, Users, Briefcase, Calendar, Info, LogIn, UserPlus, BookOpen, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'


const staticSearchData = [
  {
    category: 'Pages',
    items: [
      { id: 'home', title: 'Home', path: '/#home', icon: FileText, description: 'Return to the landing page' },
      { id: 'login', title: 'Login', path: '/login', icon: LogIn, description: 'Access your account' },
      { id: 'signup', title: 'Sign Up', path: '/signup', icon: UserPlus, description: 'Create a new account' },
    ]
  },
  {
    category: 'Sections',
    items: [
      { id: 'mentor', title: 'Mentor Network', path: '/#mentor', icon: Users, description: 'Connect with featured mentor' },
      { id: 'mentorship', title: 'Mentorship', path: '/#mentorship', icon: BookOpen, description: 'Find or become a mentor' },
      { id: 'jobs', title: 'Jobs & Internships', path: '/#jobs', icon: Briefcase, description: 'Explore career opportunities' },
      { id: 'events', title: 'Upcoming Events', path: '/#events', icon: Calendar, description: 'Webinars, workshops, and meetups' },
      { id: 'resources', title: 'Resources & Communities', path: '/#resources', icon: FileText, description: 'Join student communities' },
      { id: 'about', title: 'About Us', path: '/#about', icon: Info, description: 'Learn how CampusBridge works' },
    ]
  }
]

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [dynamicResults, setDynamicResults] = useState({ users: [], events: [], jobs: [] })
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      setQuery('')
      setDynamicResults({ users: [], events: [], jobs: [] })
    }
  }, [isOpen])

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Debounced Search API Call
  useEffect(() => {
    const fetchDynamicResults = async () => {
      if (query.trim().length < 2) {
        setDynamicResults({ users: [], events: [], jobs: [] })
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setDynamicResults(data)
        }
      } catch (error) {
        console.error("Error fetching search results:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const delayDebounceFn = setTimeout(() => {
      fetchDynamicResults()
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query, API_URL])

  // Filter static data based on query
  const filteredStaticData = staticSearchData.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) || 
      item.description.toLowerCase().includes(query.toLowerCase())
    )
  })).filter(group => group.items.length > 0)

  // Combine static and dynamic data into a unified array for rendering
  const getCombinedData = () => {
    const combined = [...filteredStaticData]

    if (dynamicResults.users?.length > 0) {
      combined.push({
        category: 'Users',
        items: dynamicResults.users.map(u => ({
          id: u._id || u.clerkId,
          title: `${u.firstName} ${u.lastName || ''}`.trim(),
          path: `/profile/${u.clerkId}`,
          icon: Users,
          description: u.headline || (u.role === 'mentor' ? 'Mentor' : 'Student'),
          image: u.imageUrl
        }))
      })
    }

    if (dynamicResults.events?.length > 0) {
      combined.push({
        category: 'Events',
        items: dynamicResults.events.map(e => ({
          id: e._id,
          title: e.title,
          path: `/events/${e._id}`, // Adjust path as needed
          icon: Calendar,
          description: `${e.type || 'Event'} • ${e.mode}`,
          image: e.imageUrl
        }))
      })
    }

    if (dynamicResults.jobs?.length > 0) {
      combined.push({
        category: 'Jobs',
        items: dynamicResults.jobs.map(j => ({
          id: j._id,
          title: j.title,
          path: `/jobs/${j._id}`, // Adjust path as needed
          icon: Briefcase,
          description: `${j.company} • ${j.location}`,
          image: j.companyLogo
        }))
      })
    }

    return combined
  }

  const currentDisplayData = getCombinedData()

  const handleSelect = (path) => {
    onClose()
    if (path.startsWith('/#')) {
      // If we are already on home page, handle hash navigation manually
      if (window.location.pathname === '/') {
        const hash = path.substring(1)
        const element = document.getElementById(hash.replace('#', ''))
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      } else {
        navigate(path)
      }
    } else {
      navigate(path)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-16 sm:pt-24 px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center px-4 py-4 border-b border-border/50 gap-3">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search users, jobs, events, pages..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-lg"
                />
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                ) : (
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1 p-2 sm:p-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {currentDisplayData.length > 0 ? (
                  currentDisplayData.map((group, groupIdx) => (
                    <div key={group.category} className={groupIdx > 0 ? 'mt-6' : ''}>
                      <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {group.category}
                      </h3>
                      <ul className="flex flex-col gap-1">
                        {group.items.map((item) => (
                          <li key={item.id}>
                            <button
                              onClick={() => handleSelect(item.path)}
                              className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-muted/60 hover:text-primary transition-all text-left group"
                            >
                              <div className="bg-muted p-2 rounded-lg group-hover:bg-background transition-colors shadow-sm overflow-hidden shrink-0 flex items-center justify-center w-9 h-9">
                                {item.image ? (
                                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                ) : (
                                  <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                )}
                              </div>
                              <div className="flex flex-col flex-1 overflow-hidden">
                                <span className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                  {item.title}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {item.description}
                                </span>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  !isLoading && (
                    <div className="py-14 text-center flex flex-col items-center justify-center">
                      <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
                      <p className="text-lg font-medium text-foreground">No results found</p>
                      <p className="text-sm text-muted-foreground mt-1">Try searching for something else like "Jobs" or "Mentors".</p>
                    </div>
                  )
                )}
              </div>
              
              <div className="px-4 py-3 bg-muted/30 border-t border-border/50 text-xs text-muted-foreground flex items-center justify-between">
                <div className="hidden sm:flex items-center gap-4">
                  <span className="flex items-center gap-1"><kbd className="bg-muted px-1.5 py-0.5 rounded border border-border/50 text-[10px] font-sans">↑</kbd><kbd className="bg-muted px-1.5 py-0.5 rounded border border-border/50 text-[10px] font-sans">↓</kbd> to navigate</span>
                  <span className="flex items-center gap-1"><kbd className="bg-muted px-1.5 py-0.5 rounded border border-border/50 text-[10px] font-sans">Enter</kbd> to select</span>
                </div>
                <span><kbd className="bg-muted px-1.5 py-0.5 rounded border border-border/50 text-[10px] font-sans">ESC</kbd> to close</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default SearchModal
