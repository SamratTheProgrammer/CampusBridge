import React, { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import MentorSidebar from '../components/dashboard/MentorSidebar'
import PageTransition from '../components/PageTransition'
import { AnimatePresence } from 'framer-motion'
import { Search, Bell, Menu, Sun, Moon, Users, Briefcase, Calendar, Loader2 } from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'
import { useUser } from '@clerk/clerk-react'
import NotificationDropdown from '../components/NotificationDropdown'
import VideoCallModal from '../components/VideoCallModal'
import { socket } from '../services/socket'
import { ringtoneService } from '../utils/ringtone'
import { calculateProfileCompleteness } from '../utils/profileCompleteness'
import toast from 'react-hot-toast'

const MOCK_STUDENTS = [
  { id: 1, name: 'Ananya Sharma', role: 'B.Tech CS Student', university: 'NIT Trichy' },
  { id: 2, name: 'Rahul Verma', role: 'MCA Student', university: 'Delhi University' },
]

const MOCK_POSTS = [
  { id: 1, title: 'How to crack FAANG interviews', type: 'Post' },
  { id: 2, title: 'React Performance Tips', type: 'Post' },
]

const MentorDashboardLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const searchRef = useRef(null)
  
  const { user, isLoaded, isSignedIn } = useUser()

  const [profileCompleteness, setProfileCompleteness] = useState({ percentage: 100, isEligibleForVerification: true })
  const [verificationStatus, setVerificationStatus] = useState('Pending')
  const [isVerified, setIsVerified] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  const fetchUserProfile = async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/users/${user.id}`)
      if (res.ok) {
        const data = await res.json()
        const comp = calculateProfileCompleteness(data)
        setProfileCompleteness(comp)
        if (data.verificationStatus) setVerificationStatus(data.verificationStatus)
        if (data.isVerified !== undefined) setIsVerified(data.isVerified)
      }
    } catch (err) {
      console.error('Failed to fetch user profile in MentorDashboardLayout:', err)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile()
    }
  }, [user])

  useEffect(() => {
    const handleUpdate = () => fetchUserProfile()
    socket.on('update_sidebar', handleUpdate)
    return () => {
      socket.off('update_sidebar', handleUpdate)
    }
  }, [user])

  const isApproved = verificationStatus === 'Approved' || isVerified
  const isLocked = profileCompleteness.percentage < 80

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        navigate('/login', { replace: true })
      } else if (user) {
        const role = user.publicMetadata?.role || user.unsafeMetadata?.role || sessionStorage.getItem('campusbridge_user_role')
        if (role === 'student' || role === 'user' || role === 'alumni') {
          const subPath = location.pathname.replace(/^\/mentor-dashboard\/?/, '/');
          navigate(`/dashboard${subPath === '/' ? '' : subPath}`, { replace: true })
        } else if (!isLoadingProfile && role === 'mentor') {
          if (isLocked && location.pathname === '/mentor-dashboard') {
            toast.error(
              profileCompleteness.percentage < 80
                ? '🔔 Reminder: Complete at least 80% of your profile in Settings.'
                : '🔔 Note: Your profile is pending Admin Verification.',
              { id: 'mentor-locked-guard', duration: 4000 }
            )
          }
        }
      }
    }
  }, [isLoaded, isSignedIn, user, navigate, isLoadingProfile, isLocked, location.pathname, profileCompleteness.percentage])

  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Global Socket Registration & Chat Notification Listener
  useEffect(() => {
    if (!user?.id) return;

    const registerSocket = () => {
      socket.emit('register_user', user.id);
      socket.emit('get_online_users');
    };

    if (socket.connected) {
      registerSocket();
    } else {
      socket.connect();
    }

    socket.on('connect', registerSocket);

    const handleNewMessage = (msg) => {
      // Don't show toast if we are currently looking at the chat page
      if (window.location.pathname.includes('/mentor-dashboard/messages')) {
        return;
      }

      const isNotifEnabled = localStorage.getItem('campusbridge_chat_notifs') !== 'false';
      if (!isNotifEnabled) return;

      // Play notification sound
      ringtoneService.playNotificationSound();

      // Show Custom Toast
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-in slide-in-from-top-2 fade-in' : 'animate-out slide-out-to-top-2 fade-out'
            } max-w-md w-full bg-card shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black/5 border border-border/50`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={msg.senderImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName}`}
                    alt={msg.senderName}
                  />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    New message from {msg.senderName}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                    {msg.type === 'text' ? msg.text : `Sent a ${msg.type}`}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-border/50">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  navigate('/mentor-dashboard/messages');
                }}
                className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-medium text-primary hover:text-primary/80 hover:bg-muted/50 focus:outline-none transition-colors"
              >
                Reply
              </button>
            </div>
          </div>
        ),
        {
          duration: 4000,
          position: 'top-center',
        }
      );
    };

    socket.on('update_sidebar', handleNewMessage);

    return () => {
      socket.off('connect', registerSocket);
      socket.off('update_sidebar', handleNewMessage);
    };
  }, [user, navigate]);

  if (!isLoaded || (isSignedIn && !user)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading CampusBridge...</p>
      </div>
    )
  }

  const filteredMentees = MOCK_STUDENTS.filter(mentee => 
    mentee.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    mentee.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredPosts = MOCK_POSTS.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const hasResults = filteredMentees.length > 0 || filteredPosts.length > 0

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar for Desktop */}
      <div className={`hidden md:block fixed inset-y-0 left-0 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} z-40`}>
        <MentorSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300 z-[90] ${isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      {/* Mobile Sidebar Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 z-[100] transition-transform duration-300 ease-in-out md:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64 bg-card shadow-2xl`}
      >
        <MentorSidebar isCollapsed={false} setIsCollapsed={() => {}} onClose={() => setIsMobileSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ${isCollapsed ? 'md:ml-20' : 'md:ml-64'} min-h-screen min-w-0 transition-all duration-300`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40 h-16 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="md:hidden p-2 rounded-md hover:bg-muted text-muted-foreground"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div ref={searchRef} className="hidden sm:block relative flex-1 max-w-md">
              <div className="flex items-center bg-muted/50 border border-border/50 rounded-lg px-3 py-2 w-full focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <Search className="w-4 h-4 text-muted-foreground mr-2 animate-pulse" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setIsDropdownOpen(true)
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Search students, jobs, posts..." 
                  className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline transition-colors px-1"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {isDropdownOpen && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-md border border-border/80 rounded-xl shadow-xl z-50 max-h-[380px] overflow-y-auto divide-y divide-border/40 scrollbar-none animate-in fade-in slide-in-from-top-1 duration-200">
                  
                  {filteredMentees.length > 0 && (
                    <div className="p-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-primary px-3 py-1.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Students
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {filteredMentees.map(mentee => (
                          <button
                            key={mentee.id}
                            onClick={() => {
                              navigate(`/mentor-dashboard/mentees`)
                              setSearchQuery('')
                              setIsDropdownOpen(false)
                            }}
                            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-primary/10 hover:text-primary transition-all flex flex-col"
                          >
                            <span className="font-semibold text-foreground">{mentee.name}</span>
                            <span className="text-xs text-muted-foreground">{mentee.role} at {mentee.university}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredPosts.length > 0 && (
                    <div className="p-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-primary px-3 py-1.5 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" /> Posts
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {filteredPosts.map(post => (
                          <button
                            key={post.id}
                            onClick={() => {
                              navigate(`/mentor-dashboard/posts`)
                              setSearchQuery('')
                              setIsDropdownOpen(false)
                            }}
                            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-primary/10 hover:text-primary transition-all flex flex-col"
                          >
                            <span className="font-semibold text-foreground">{post.title}</span>
                            <span className="text-xs text-muted-foreground">{post.type}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!hasResults && (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      No results found for "{searchQuery}"
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <NotificationDropdown />
            <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-border/50 ml-2">
              {isLoaded && user ? (
                <>
                  <img 
                    src={user.imageUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate('/mentor-dashboard/profile')}
                  />
                  <div className="hidden lg:block text-sm">
                    <p 
                      className="font-semibold text-foreground leading-none mb-1 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate('/mentor-dashboard/profile')}
                    >
                      {user.fullName || 'Mentor'}
                    </p>
                    <p className="text-xs text-muted-foreground leading-none">Mentor</p>
                  </div>
                </>
              ) : (
                <div className="w-32 h-8 bg-muted animate-pulse rounded-md hidden lg:block"></div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 ${location.pathname.includes('/messages') ? 'p-0 sm:p-6 md:p-8' : 'p-3 sm:p-6 md:p-8'} min-w-0`}>
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
        {isLoaded && user && <VideoCallModal currentUser={user} />}
      </div>
    </div>
  )
}

export default MentorDashboardLayout
