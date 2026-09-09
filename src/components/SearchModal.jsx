import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, FileText, Users, Briefcase, Calendar, Info, LogIn, UserPlus, BookOpen, Loader2, Compass } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import API_BASE from '../utils/api'

const staticSearchData = [
  {
    category: 'Navigation',
    items: [
      { id: 'find-mentor', title: 'Find Mentor (Mentor Directory)', path: '/dashboard/mentor', icon: Compass, description: 'Browse and connect with verified mentors' },
      { id: 'mentor-dir', title: 'Mentor Directory', path: '/dashboard/mentor', icon: Compass, description: 'Find mentors by company, domain, and skills' },
      { id: 'dash-jobs', title: 'Browse Jobs & Internships', path: '/dashboard/jobs', icon: Briefcase, description: 'Explore career opportunities and open roles' },
      { id: 'dash-events', title: 'Upcoming Events & Sessions', path: '/dashboard/events', icon: Calendar, description: 'Workshops, webinars, and 1-on-1 mentorship sessions' },
    ]
  },
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
      { id: 'mentorship', title: 'Mentorship Spotlight', path: '/#mentorship', icon: BookOpen, description: 'Find or become a mentor' },
      { id: 'jobs', title: 'Jobs & Internships Section', path: '/#jobs', icon: Briefcase, description: 'Explore career opportunities' },
      { id: 'events', title: 'Upcoming Events Section', path: '/#events', icon: Calendar, description: 'Webinars, workshops, and meetups' },
      { id: 'resources', title: 'Resources & Communities', path: '/#resources', icon: FileText, description: 'Join student communities' },
      { id: 'about', title: 'About Us', path: '/#about', icon: Info, description: 'Learn how CampusBridge works' },
    ]
  }
]

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [dynamicResults, setDynamicResults] = useState({ users: [], events: [], jobs: [] })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const itemRefs = useRef([])
  const navigate = useNavigate()
  const { user } = useUser()

  const userRole = sessionStorage.getItem('campusbridge_user_role') || user?.publicMetadata?.role || user?.unsafeMetadata?.role || 'student'

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      setQuery('')
      setDynamicResults({ users: [], events: [], jobs: [] })
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Debounced Search API Call
  useEffect(() => {
    const fetchDynamicResults = async () => {
      if (query.trim().length < 2) {
        setDynamicResults({ users: [], events: [], jobs: [] })
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`)
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
  }, [query])

  // Filter static data based on query
  const filteredStaticData = staticSearchData.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) || 
      item.description.toLowerCase().includes(query.toLowerCase())
    ).map(item => {
      // Adjust path for mentors if needed
      if (userRole === 'mentor' && item.path === '/dashboard/mentor') {
        return { ...item, path: '/mentor-dashboard/mentor' }
      }
      if (userRole === 'mentor' && item.path === '/dashboard/jobs') {
        return { ...item, path: '/mentor-dashboard/jobs' }
      }
      if (userRole === 'mentor' && item.path === '/dashboard/events') {
        return { ...item, path: '/mentor-dashboard/sessions' }
      }
      return item
    })
  })).filter(group => group.items.length > 0)

  // Combine static and dynamic data into a unified array for rendering
  const getCombinedData = () => {
    const combined = [...filteredStaticData]

    if (dynamicResults.users?.length > 0) {
      combined.push({
        category: 'Users & Mentors',
        items: dynamicResults.users.map(u => ({
          id: u._id || u.clerkId,
          title: `${u.firstName} ${u.lastName || ''}`.trim(),
          path: `/profile/${u.username || u.clerkId}`,
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
          path: userRole === 'mentor' ? '/mentor-dashboard/sessions' : '/dashboard/events',
          icon: Calendar,
          description: `${e.type || 'Event'} • ${e.mode || 'Online'}`,
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
          path: userRole === 'mentor' ? '/mentor-dashboard/jobs' : `/dashboard/jobs/${j._id}`,
          icon: Briefcase,
          description: `${j.company} • ${j.location || 'Remote'}`,
          image: j.companyLogo
        }))
      })
    }

    return combined
  }

  const currentDisplayData = getCombinedData()
  const allItems = currentDisplayData.flatMap(group => group.items)

  useEffect(() => {
    setSelectedIndex(0)
  }, [query, dynamicResults])

  // Scroll active item into view
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex])

  const handleSelect = (path) => {
    onClose()
    if (path.startsWith('/#')) {
      if (window.location.pathname === '/') {
        const hash = path.substring(1)
        const element = document.getElementById(hash.replace('#', ''))
        if (element) {
          const offset = 80
          const bodyRect = document.body.getBoundingClientRect().top
          const elementRect = element.getBoundingClientRect().top
          const offsetPosition = elementRect - bodyRect - offset
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
          window.history.pushState(null, '', path)
        }
      } else {
        navigate(path)
      }
    } else {
      navigate(path)
    }
  }

  // Handle keyboard navigation (Escape, ArrowUp, ArrowDown, Enter)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (allItems.length > 0 ? (prev + 1) % allItems.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (allItems.length > 0 ? (prev - 1 + allItems.length) % allItems.length : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (allItems[selectedIndex]) {
          handleSelect(allItems[selectedIndex].path)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, allItems, selectedIndex])

  let runningItemIndex = 0

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
                  placeholder="Search users, mentors, jobs, events, pages..."
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
                        {group.items.map((item) => {
                          const currentIndex = runningItemIndex++
                          const isSelected = currentIndex === selectedIndex

                          return (
                            <li key={item.id}>
                              <button
                                ref={(el) => (itemRefs.current[currentIndex] = el)}
                                onClick={() => handleSelect(item.path)}
                                onMouseEnter={() => setSelectedIndex(currentIndex)}
                                className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all text-left group ${
                                  isSelected
                                    ? 'bg-primary/10 border border-primary/30 text-primary shadow-xs'
                                    : 'hover:bg-muted/60 hover:text-primary text-foreground'
                                }`}
                              >
                                <div className={`p-2 rounded-lg transition-colors shadow-sm overflow-hidden shrink-0 flex items-center justify-center w-9 h-9 ${
                                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted group-hover:bg-background'
                                }`}>
                                  {item.image ? (
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover rounded" />
                                  ) : (
                                    <item.icon className={`w-5 h-5 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary transition-colors'}`} />
                                  )}
                                </div>
                                <div className="flex flex-col flex-1 overflow-hidden">
                                  <span className={`font-medium truncate ${isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary transition-colors'}`}>
                                    {item.title}
                                  </span>
                                  <span className="text-xs text-muted-foreground truncate">
                                    {item.description}
                                  </span>
                                </div>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))
                ) : (
                  !isLoading && (
                    <div className="py-14 text-center flex flex-col items-center justify-center">
                      <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
                      <p className="text-lg font-medium text-foreground">No results found</p>
                      <p className="text-sm text-muted-foreground mt-1">Try searching for something else like "Jobs", "Mentors", or "Find Mentor".</p>
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

