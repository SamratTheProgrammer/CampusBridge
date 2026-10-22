import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, FileText, Users, Briefcase, Calendar, Info, LogIn, UserPlus, BookOpen, Loader2, Compass, MessageSquare, Settings as SettingsIcon, Bookmark, HelpCircle, Mail, PlayCircle, ShieldCheck, Clock, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import API_BASE from '../utils/api'
import ModalPortal from './modals/ModalPortal'

import useSearchHistory from '../hooks/useSearchHistory'

const staticSearchData = [
  {
    category: 'Jobs & Events',
    items: [
      { id: 'dash-jobs', title: 'Browse Jobs & Internships', path: '/dashboard/jobs', icon: Briefcase, description: 'Explore career opportunities and open roles', keywords: ['jobs', 'internships', 'careers', 'openings', 'hiring', 'apply'] },
      { id: 'my-applications', title: 'My Job Applications', path: '/dashboard/applications', icon: FileText, description: 'Track your submitted job and internship applications', keywords: ['applications', 'applied', 'status', 'track'] },
      { id: 'dash-events', title: 'Upcoming Events & Workshops', path: '/dashboard/events', icon: Calendar, description: 'Webinars, tech talks, and community meetups', keywords: ['events', 'workshops', 'webinars', 'talks', 'meetups'] },
      { id: 'saved-items', title: 'Saved Jobs & Opportunities', path: '/dashboard/saved', icon: Bookmark, description: 'Access your bookmarked jobs, internships and events', keywords: ['saved', 'bookmarks', 'favorites'] },
    ]
  },
  {
    category: 'Networking & Community',
    items: [
      { id: 'my-network', title: 'My Network & People', path: '/dashboard/network', icon: Users, description: 'Connect with students, alumni, and campus peers', keywords: ['network', 'people', 'friends', 'classmates', 'students'] },
      { id: 'messages', title: 'Messages & Chat', path: '/dashboard/messages', icon: MessageSquare, description: 'Direct message your peers and campus network', keywords: ['messages', 'chat', 'inbox', 'dm', 'conversation'] },
      { id: 'resources', title: 'Communities & Roadmaps', path: '/#resources', icon: BookOpen, description: 'Join student tech communities and learning roadmaps', keywords: ['communities', 'resources', 'roadmaps', 'clubs', 'ai', 'cybersecurity'] },
    ]
  },
  {
    category: 'Account & Settings',
    items: [
      { id: 'my-profile', title: 'My Profile', path: '/dashboard/profile', icon: Users, description: 'View and update your public profile and bio', keywords: ['profile', 'account', 'resume', 'bio', 'edit'] },
      { id: 'settings', title: 'Settings & Preferences', path: '/dashboard/settings', icon: SettingsIcon, description: 'Manage security, notifications and app preferences', keywords: ['settings', 'preferences', 'security', 'password'] },
      { id: 'login', title: 'Login / Sign In', path: '/login', icon: LogIn, description: 'Access your CampusBridge student or mentor account', keywords: ['login', 'signin', 'auth', 'access'] },
      { id: 'signup', title: 'Sign Up / Create Account', path: '/signup', icon: UserPlus, description: 'Join CampusBridge as a student or alumni member', keywords: ['signup', 'register', 'join', 'create'] },
    ]
  },
  {
    category: 'Platform & About',
    items: [
      { id: 'home', title: 'Home Page', path: '/#home', icon: FileText, description: 'Return to the CampusBridge landing page', keywords: ['home', 'landing', 'main', 'start'] },
      { id: 'how-it-works', title: 'How CampusBridge Works', path: '/#about', icon: Info, description: 'Learn how our platform connects students and peers', keywords: ['about', 'how it works', 'info', 'platform'] },
      { id: 'watch-demo', title: 'Watch Demo Video', path: '/#demo', icon: PlayCircle, description: 'Take a quick walkthrough of key features', keywords: ['demo', 'watch', 'video', 'preview'] },
      { id: 'faq', title: 'Frequently Asked Questions (FAQ)', path: '/#faq', icon: HelpCircle, description: 'Answers to common questions about opportunities and jobs', keywords: ['faq', 'questions', 'help', 'answers', 'support'] },
      { id: 'contact', title: 'Contact Us & Support', path: '/#contact', icon: Mail, description: 'Get in touch with the CampusBridge support team', keywords: ['contact', 'support', 'help', 'email', 'reach'] },
    ]
  }
]

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [dynamicResults, setDynamicResults] = useState({ users: [], events: [], jobs: [] })
  const [allUsersList, setAllUsersList] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const itemRefs = useRef([])
  const navigate = useNavigate()
  const { user } = useUser()

  const {
    history: searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    refreshHistory
  } = useSearchHistory(user)

  const userRole = sessionStorage.getItem('campusbridge_user_role') || user?.publicMetadata?.role || user?.unsafeMetadata?.role || 'student'

  // Focus input and refresh search history when modal opens
  useEffect(() => {
    if (isOpen) {
      if (typeof refreshHistory === 'function') {
        refreshHistory();
      }
      if (allUsersList.length === 0) {
        fetch(`${API_BASE}/api/users/search/all`)
          .then(r => r.ok ? r.json() : [])
          .then(data => {
            if (Array.isArray(data)) setAllUsersList(data);
          })
          .catch(() => {});
      }
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      setQuery('')
      setDynamicResults({ users: [], events: [], jobs: [] })
      setSelectedIndex(0)
    }
  }, [isOpen, refreshHistory, allUsersList.length])

  // Save entry to search history (synced to local + DB)
  const saveToHistory = (entryOrTitle, itemPath = null, itemDesc = null) => {
    if (!entryOrTitle) return
    if (typeof entryOrTitle === 'string') {
      const q = entryOrTitle.trim()
      if (!q) return
      addToHistory({
        query: q,
        title: q,
        path: itemPath || '',
        description: itemDesc || '',
        type: itemPath ? 'nav' : 'text'
      })
    } else {
      addToHistory(entryOrTitle)
    }
  }

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

  // Filter static data based on query & keywords
  const q = query.toLowerCase().trim()
  const filteredStaticData = staticSearchData.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!q) return true
      const matchesTitle = item.title.toLowerCase().includes(q)
      const matchesDesc = item.description.toLowerCase().includes(q)
      const matchesKeywords = item.keywords?.some(k => k.toLowerCase().includes(q))
      return matchesTitle || matchesDesc || matchesKeywords
    }).map(item => {
      // Adjust path for mentors if needed
      if (userRole === 'mentor') {
        if (item.path === '/dashboard/jobs') return { ...item, path: '/mentor-dashboard/jobs' }
        if (item.path === '/dashboard/events' || item.path === '/dashboard/sessions') return { ...item, path: '/mentor-dashboard/sessions' }
        if (item.path === '/dashboard/mentorship') return { ...item, path: '/mentor-dashboard/requests' }
        if (item.path === '/dashboard/network') return { ...item, path: '/mentor-dashboard/network' }
        if (item.path === '/dashboard/messages') return { ...item, path: '/mentor-dashboard/messages' }
        if (item.path === '/dashboard/profile') return { ...item, path: '/mentor-dashboard/profile' }
        if (item.path === '/dashboard/settings') return { ...item, path: '/mentor-dashboard/settings' }
      }
      return item
    })
  })).filter(group => group.items.length > 0)

  // Combine static and dynamic data into a unified array for rendering
  const getCombinedData = () => {
    const combined = [...filteredStaticData]

    if (dynamicResults.users?.length > 0) {
      combined.push({
        category: 'People & Members',
        items: dynamicResults.users.map(u => ({
          id: u._id || u.clerkId,
          targetId: u.clerkId || u._id,
          title: `${u.firstName} ${u.lastName || ''}`.trim(),
          path: `/profile/${u.username || u.clerkId}`,
          icon: Users,
          description: u.headline || (u.company ? `At ${u.company}` : (u.role === 'mentor' ? 'Verified Mentor' : 'Student Member')),
          image: u.imageUrl,
          role: (u.role || '').toLowerCase(),
          badge: (u.role || '').toLowerCase() === 'mentor' ? 'Mentor' : (u.role || '').toLowerCase() === 'alumni' ? 'Alumni' : 'Student',
          type: 'user'
        }))
      })
    }

    if (dynamicResults.events?.length > 0) {
      combined.push({
        category: 'Live Events & Workshops',
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
        category: 'Jobs & Openings',
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

  const isQueryEmpty = q.length === 0
  const currentDisplayData = isQueryEmpty ? [] : getCombinedData()
  const allItems = isQueryEmpty
    ? searchHistory.map(h => ({
        ...h,
        id: h.id || h.title,
        icon: Clock,
        isHistory: true
      }))
    : currentDisplayData.flatMap(group => group.items)

  useEffect(() => {
    setSelectedIndex(0)
  }, [query, dynamicResults])

  // Scroll active item into view
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex])

  const handleSelect = (itemOrPath) => {
    let path = ''
    if (typeof itemOrPath === 'string') {
      path = itemOrPath
      if (query.trim()) {
        saveToHistory(query.trim(), path)
      }
    } else if (itemOrPath) {
      path = itemOrPath.path
      saveToHistory(itemOrPath)
    }

    onClose()
    if (!path) return

    if (path.startsWith('/#')) {
      const hash = path.substring(1)
      const targetId = hash.replace('#', '')
      if (window.location.pathname === '/') {
        const element = document.getElementById(targetId)
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
        if (isQueryEmpty) {
          const activeHistory = allItems[selectedIndex]
          if (activeHistory) {
            if (activeHistory.path) {
              handleSelect(activeHistory)
            } else {
              setQuery(activeHistory.query || activeHistory.title)
            }
          }
        } else {
          if (query.trim()) {
            saveToHistory(query.trim())
          }
          if (allItems[selectedIndex]) {
            handleSelect(allItems[selectedIndex])
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, allItems, selectedIndex, isQueryEmpty, query])

  let runningItemIndex = 0

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[201] flex items-start justify-center pt-16 sm:pt-24 px-4 pointer-events-none">
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
                  placeholder="Search people, jobs, events, pages..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-lg"
                />
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                ) : (
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors shrink-0 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1 p-2 sm:p-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {isQueryEmpty ? (
                  /* When clicked/focused without query: Show Search History */
                  searchHistory.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between px-3 mb-2.5">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          Recent Searches
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            clearHistory()
                          }}
                          className="text-xs text-muted-foreground hover:text-red-500 font-medium transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Clear all
                        </button>
                      </div>
                      <ul className="flex flex-col gap-1">
                        {searchHistory.map((item, idx) => {
                          const isSelected = idx === selectedIndex
                          const isPerson = item.image || item.role || item.type === 'user' || (item.path && item.path.startsWith('/profile/'))
                          const combinedUserPool = [...allUsersList, ...(dynamicResults.users || [])]
                          const liveUser = combinedUserPool.find(u => 
                            (item.targetId && (u.clerkId === item.targetId || u.id === item.targetId || u._id === item.targetId)) ||
                            (item.id && (u.clerkId === item.id || u.id === item.id || u._id === item.id)) ||
                            (u.username && item.path?.toLowerCase().includes(`/profile/${u.username.toLowerCase()}`)) ||
                            (u.clerkId && item.path?.includes(u.clerkId))
                          ) || (user && (item.targetId === user.id || item.id === user.id || (user.username && item.path?.toLowerCase().includes(`/profile/${user.username.toLowerCase()}`)) || item.path?.includes(user.id)) ? {
                            imageUrl: user.imageUrl,
                            name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                            role: user.publicMetadata?.role || user.unsafeMetadata?.role || 'student'
                          } : null);

                          const displayImage = liveUser?.imageUrl !== undefined ? liveUser.imageUrl : item.image;
                          const displayTitle = liveUser?.name || item.title || item.query;
                          const displayRole = (liveUser?.role || item.role || '').toLowerCase();
                          const displayDesc = liveUser?.headline || (liveUser?.company ? `At ${liveUser.company}` : item.description);

                          return (
                            <li key={item.id || item.targetId || idx}>
                              <div
                                ref={(el) => (itemRefs.current[idx] = el)}
                                onClick={() => {
                                  if (item.path) {
                                    handleSelect({
                                      ...item,
                                      image: displayImage,
                                      title: displayTitle
                                    })
                                  } else {
                                    setQuery(item.query || item.title)
                                  }
                                }}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${
                                  isSelected
                                    ? 'bg-primary/10 border border-primary/30 text-primary shadow-xs'
                                    : 'hover:bg-muted/60 text-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  {displayImage ? (
                                    <div className="relative shrink-0 w-9 h-9 rounded-full overflow-hidden border border-border/60 bg-muted flex items-center justify-center ring-1 ring-border/30">
                                      <img
                                        src={displayImage}
                                        alt={displayTitle}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayTitle || 'User')}`;
                                        }}
                                      />
                                    </div>
                                  ) : isPerson ? (
                                    <div className="relative shrink-0 w-9 h-9 rounded-full overflow-hidden border border-border/60 bg-gradient-to-tr from-primary/30 to-purple-500/20 text-primary font-bold text-xs flex items-center justify-center ring-1 ring-border/30">
                                      {(displayTitle || 'U').charAt(0).toUpperCase()}
                                    </div>
                                  ) : (
                                    <div className={`w-8 h-8 rounded-lg transition-colors shrink-0 flex items-center justify-center ${
                                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-background'
                                    }`}>
                                      <Clock className="w-4 h-4" />
                                    </div>
                                  )}

                                  <div className="flex flex-col flex-1 min-w-0">
                                    <span className={`font-medium text-sm truncate ${isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
                                      {displayTitle}
                                    </span>
                                    {displayDesc ? (
                                      <span className="text-xs text-muted-foreground truncate">{displayDesc}</span>
                                    ) : displayRole ? (
                                      <span className="text-xs text-muted-foreground capitalize truncate">{displayRole}</span>
                                    ) : (
                                      <span className="text-[11px] text-muted-foreground/70">Recent search</span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {(item.badge || (displayRole ? (displayRole === 'mentor' ? 'Mentor' : displayRole === 'alumni' ? 'Alumni' : 'Student') : null)) && (
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-all ${
                                      displayRole === 'mentor'
                                        ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
                                        : displayRole === 'alumni'
                                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                        : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                    }`}>
                                      {item.badge || (displayRole === 'mentor' ? 'Mentor' : displayRole === 'alumni' ? 'Alumni' : 'Student')}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeFromHistory(item)
                                    }}
                                    className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0 opacity-70 group-hover:opacity-100 cursor-pointer"
                                    title="Remove from history"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ) : (
                    <div className="py-14 text-center flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground/50 mb-3">
                        <Clock className="w-6 h-6" />
                      </div>
                      <p className="text-base font-medium text-foreground">No search history</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        Type in the search bar above to look up people, jobs, events, and campus resources.
                      </p>
                    </div>
                  )
                ) : (
                  /* When user enters a query: Show results */
                  currentDisplayData.length > 0 ? (
                    currentDisplayData.map((group, groupIdx) => (
                      <div key={group.category} className={groupIdx > 0 ? 'mt-6' : ''}>
                        <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {group.category}
                        </h3>
                        <ul className="flex flex-col gap-1">
                          {group.items.map((item) => {
                            const currentIndex = runningItemIndex++
                            const isSelected = currentIndex === selectedIndex
                            const isPerson = group.category === 'People & Members' || item.role || item.type === 'user'

                            return (
                              <li key={item.id}>
                                <button
                                  ref={(el) => (itemRefs.current[currentIndex] = el)}
                                  onClick={() => handleSelect(item)}
                                  onMouseEnter={() => setSelectedIndex(currentIndex)}
                                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${
                                    isSelected
                                      ? 'bg-primary/10 border border-primary/30 text-primary shadow-xs'
                                      : 'hover:bg-muted/60 hover:text-primary text-foreground'
                                  }`}
                                >
                                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                    {isPerson ? (
                                      <div className="relative shrink-0 w-10 h-10 rounded-full overflow-hidden border border-border/60 bg-muted flex items-center justify-center ring-1 ring-border/30">
                                        <img
                                          src={item.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.title || 'User')}`}
                                          alt={item.title}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.title || 'User')}`;
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div className={`p-2 rounded-xl transition-colors shrink-0 flex items-center justify-center w-10 h-10 ${
                                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-background'
                                      }`}>
                                        {item.image ? (
                                          <img src={item.image} alt={item.title} className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                          <item.icon className={`w-5 h-5 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary transition-colors'}`} />
                                        )}
                                      </div>
                                    )}

                                    <div className="flex flex-col flex-1 min-w-0">
                                      <span className={`font-semibold text-sm truncate ${isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary transition-colors'}`}>
                                        {item.title}
                                      </span>
                                      <span className="text-xs text-muted-foreground truncate">
                                        {item.description}
                                      </span>
                                    </div>
                                  </div>

                                  {item.badge && (
                                    <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-all ${
                                      item.role === 'mentor'
                                        ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
                                        : item.role === 'alumni'
                                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                        : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                    }`}>
                                      {item.badge}
                                    </span>
                                  )}
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
                        <p className="text-sm text-muted-foreground mt-1">Try searching for something else like "Jobs", "Events", or names.</p>
                      </div>
                    )
                  )
                )}
              </div>
              
              <div className="hidden sm:flex px-4 py-3 bg-muted/30 border-t border-border/50 text-xs text-muted-foreground items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><kbd className="bg-muted px-1.5 py-0.5 rounded border border-border/50 text-[10px] font-sans">↑</kbd><kbd className="bg-muted px-1.5 py-0.5 rounded border border-border/50 text-[10px] font-sans">↓</kbd> to navigate</span>
                  <span className="flex items-center gap-1"><kbd className="bg-muted px-1.5 py-0.5 rounded border border-border/50 text-[10px] font-sans">Enter</kbd> to select</span>
                </div>
                <span className="inline-flex items-center gap-1"><kbd className="bg-muted px-1.5 py-0.5 rounded border border-border/50 text-[10px] font-sans">ESC</kbd> to close</span>
              </div>
            </motion.div>
          </div>
        </ModalPortal>
      )}
    </AnimatePresence>
  )
}

export default SearchModal
