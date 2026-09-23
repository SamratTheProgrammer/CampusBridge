import React, { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import MentorSidebar from '../components/dashboard/MentorSidebar'
import PageTransition from '../components/PageTransition'
import { AnimatePresence } from 'framer-motion'
import { Search, Bell, Menu, Sun, Moon, Users, Briefcase, Calendar, Loader2, ShieldAlert, Check, X } from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'
import { useUser } from '@clerk/clerk-react'
import NotificationDropdown from '../components/NotificationDropdown'
import VideoCallModal from '../components/VideoCallModal'
import { socket } from '../services/socket'
import { ringtoneService } from '../utils/ringtone'
import { calculateProfileCompleteness } from '../utils/profileCompleteness'
import toast from 'react-hot-toast'
import API_BASE from '../utils/api'
import ReviewModal from '../components/modals/ReviewModal'
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton'
import RouteIntegrityLoader from '../components/RouteIntegrityLoader'
import AnnouncementModal from '../components/dashboard/AnnouncementModal'
import DashboardAppBanner from '../components/dashboard/DashboardAppBanner'

const MentorDashboardLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true')
  const [warnings, setWarnings] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [mentorsList, setMentorsList] = useState([])
  const [jobsList, setJobsList] = useState([])
  const [eventsList, setEventsList] = useState([])
  const [studentsList, setStudentsList] = useState([])
  const [pendingReviews, setPendingReviews] = useState([])
  const [currentReview, setCurrentReview] = useState(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  
  const navigate = useNavigate()
  const location = useLocation()
  const searchRef = useRef(null)
  
  const { user, isLoaded, isSignedIn } = useUser()

  useEffect(() => {
    sessionStorage.setItem('campusbridge_tab_initialized', 'true')
  }, [])

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed)
  }, [isCollapsed])

  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const [usersRes, jobsRes, eventsRes] = await Promise.all([
          fetch(`${API_BASE}/api/users/search/all`).then(r => r.ok ? r : fetch(`${API_BASE}/api/users/mentors/all`)),
          fetch(`${API_BASE}/api/jobs`),
          fetch(`${API_BASE}/api/events`)
        ]);

        if (usersRes.ok) {
          const allUsers = await usersRes.json();
          setMentorsList(allUsers.filter(u => ['mentor', 'alumni'].includes((u.role || '').toLowerCase())));
          setStudentsList(allUsers.filter(u => !['mentor', 'alumni'].includes((u.role || '').toLowerCase())));
        }
        if (jobsRes.ok) setJobsList(await jobsRes.json());
        if (eventsRes.ok) setEventsList(await eventsRes.json());
      } catch (error) {
        console.error('Error fetching search data for MentorDashboardLayout:', error);
      }
    };

    if (user) {
      fetchSearchData();
    }
  }, [user]);

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
        if (data.warnings && Array.isArray(data.warnings)) {
          setWarnings(data.warnings.filter(w => !w.isDismissed))
        }
      }
    } catch (err) {
      console.error('Failed to fetch user profile in MentorDashboardLayout:', err)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const handleDismissWarning = async (warningId) => {
    try {
      setWarnings(prev => prev.filter(w => String(w._id || w.id) !== String(warningId)));
      await fetch(`${API_BASE}/api/users/${user.id}/warnings/${warningId}/dismiss`, {
        method: 'PUT'
      });
      toast.success('Warning acknowledged');
    } catch (err) {
      console.error('Failed to dismiss warning:', err);
    }
  };

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

  const isVerifiedStatus = verificationStatus === 'Approved'

  useEffect(() => {
    const fetchPendingReviews = () => {
      if (user?.id) {
        fetch(`${API_BASE}/api/reviews/pending/${user.id}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.length > 0) {
              setPendingReviews(data)
              setCurrentReview(data[0])
              setIsReviewModalOpen(true)
            }
          })
          .catch(err => console.error('Error fetching pending reviews:', err))
      }
    };

    fetchPendingReviews();

    window.addEventListener('video-call-ended', fetchPendingReviews);
    return () => window.removeEventListener('video-call-ended', fetchPendingReviews);
  }, [user?.id]);

  const handleReviewSubmitted = (referenceId) => {
    const updatedPending = pendingReviews.filter(r => r.referenceId !== referenceId)
    setPendingReviews(updatedPending)
    if (updatedPending.length > 0) {
      setCurrentReview(updatedPending[0])
    } else {
      setIsReviewModalOpen(false)
      setCurrentReview(null)
    }
  }

  const isApproved = verificationStatus === 'Approved' || isVerified
  const isLocked = profileCompleteness.percentage < 80

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        navigate('/login', { replace: true })
      } else if (user) {
        const role = sessionStorage.getItem('campusbridge_user_role') || user.publicMetadata?.role || user.unsafeMetadata?.role
        if ((role === 'student' || role === 'user' || role === 'alumni') && !location.pathname.startsWith('/profile')) {
          const subPath = location.pathname.replace(/^\/mentor-dashboard\/?/, '/');
          navigate(`/dashboard${subPath === '/' ? '' : subPath}`, { replace: true })
        } else if (!isLoadingProfile && role === 'mentor' && !location.pathname.startsWith('/profile')) {
          const allowedPaths = ['/mentor-dashboard', '/mentor-dashboard/settings', '/mentor-dashboard/profile'];
          if (isLocked && !allowedPaths.includes(location.pathname)) {
            toast.error('Please complete at least 80% of your profile to access this feature.', { id: 'mentor-locked-guard' });
            navigate('/mentor-dashboard', { replace: true });
          } else if (isLocked && location.pathname === '/mentor-dashboard') {
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
    if (sessionStorage.getItem('campusbridge_just_authenticated') === 'true') {
      return <RouteIntegrityLoader />
    }
    return <DashboardSkeleton />
  }

  const filteredMentors = mentorsList.filter(mentor => {
    const fullName = `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim().toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) ||
           (mentor.name || '').toLowerCase().includes(query) ||
           (mentor.username || '').toLowerCase().includes(query) ||
           (mentor.headline || '').toLowerCase().includes(query) ||
           (mentor.skills || []).some(s => s.toLowerCase().includes(query));
  }).map(m => ({
    id: m.clerkId || m._id,
    username: m.username,
    name: `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.name || 'Mentor',
    role: m.headline || 'Mentor',
    roleType: (m.role || 'mentor').toLowerCase(),
    company: m.company || m.location || '',
    imageUrl: m.imageUrl
  }))

  const filteredStudents = studentsList.filter(student => {
    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim().toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) ||
           (student.name || '').toLowerCase().includes(query) ||
           (student.username || '').toLowerCase().includes(query) ||
           (student.course || '').toLowerCase().includes(query) ||
           (student.headline || '').toLowerCase().includes(query) ||
           (student.skills || []).some(s => s.toLowerCase().includes(query));
  }).map(s => ({
    id: s.clerkId || s._id,
    username: s.username,
    name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || 'Student',
    role: s.course || s.headline || 'Student',
    roleType: (s.role || 'student').toLowerCase(),
    imageUrl: s.imageUrl
  }))

  const filteredJobs = jobsList.filter(job =>
    (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.company || '').toLowerCase().includes(searchQuery.toLowerCase())
  ).map(j => ({
    id: j._id,
    title: j.title,
    company: j.company
  }))

  const filteredEvents = eventsList.filter(event =>
    (event.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (event.type || '').toLowerCase().includes(searchQuery.toLowerCase())
  ).map(e => ({
    id: e._id,
    title: e.title,
    type: e.type
  }))

  const hasResults = filteredMentors.length > 0 || filteredStudents.length > 0 || filteredJobs.length > 0 || filteredEvents.length > 0

  return (
    <div className={`min-h-screen bg-background flex ${location.pathname.includes('/messages') ? 'h-screen max-h-screen overflow-hidden' : ''}`}>
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
        <div className={`flex-1 flex flex-col ${isCollapsed ? 'md:ml-20' : 'md:ml-64'} min-h-screen ${location.pathname.includes('/messages') ? 'h-screen max-h-screen overflow-hidden' : ''} min-w-0 transition-all duration-300`}>
          {/* Top Header */}
          <header className={`md:sticky md:top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40 h-16 px-4 sm:px-8 justify-between shrink-0 ${location.pathname.includes('/profile') ? 'hidden md:flex' : 'flex items-center'}`}>
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
                  autoComplete="off"
                  spellCheck="false"
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
                  
                  {filteredMentors.length > 0 && (
                    <div className="p-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-primary px-3 py-1.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Mentors
                      </div>
                      <div className="space-y-1 mt-1">
                        {filteredMentors.map(mentor => (
                          <button
                            key={mentor.id}
                            onClick={() => {
                              navigate(`/profile/${mentor.username || mentor.id}`)
                              setSearchQuery('')
                              setIsDropdownOpen(false)
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="relative shrink-0 w-9 h-9 rounded-full overflow-hidden border border-border/60 bg-muted flex items-center justify-center ring-1 ring-border/30">
                                <img
                                  src={mentor.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(mentor.name || 'Mentor')}`}
                                  alt={mentor.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(mentor.name || 'Mentor')}`;
                                  }}
                                />
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{mentor.name}</span>
                                <span className="text-xs text-muted-foreground capitalize truncate">{mentor.role}{mentor.company ? ` at ${mentor.company}` : ''}</span>
                              </div>
                            </div>

                            {/* Right side role badge */}
                            <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-all ${
                              mentor.roleType === 'alumni'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
                            }`}>
                              {mentor.roleType === 'alumni' ? 'Alumni' : 'Mentor'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredStudents.length > 0 && (
                    <div className="p-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-primary px-3 py-1.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Students & Mentees
                      </div>
                      <div className="space-y-1 mt-1">
                        {filteredStudents.map(student => (
                          <button
                            key={student.id}
                            onClick={() => {
                              navigate(`/profile/${student.username || student.id}`)
                              setSearchQuery('')
                              setIsDropdownOpen(false)
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="relative shrink-0 w-9 h-9 rounded-full overflow-hidden border border-border/60 bg-muted flex items-center justify-center ring-1 ring-border/30">
                                <img
                                  src={student.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.name || 'Student')}`}
                                  alt={student.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.name || 'Student')}`;
                                  }}
                                />
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{student.name}</span>
                                <span className="text-xs text-muted-foreground capitalize truncate">{student.role}</span>
                              </div>
                            </div>

                            {/* Right side role badge */}
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-all bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30">
                              Student
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredJobs.length > 0 && (
                    <div className="p-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-primary px-3 py-1.5 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" /> Jobs
                      </div>
                      <div className="space-y-1 mt-1">
                        {filteredJobs.map(job => (
                          <button
                            key={job.id}
                            onClick={() => {
                              navigate('/mentor-dashboard/jobs')
                              setSearchQuery('')
                              setIsDropdownOpen(false)
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-3 group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{job.title}</span>
                              <span className="text-xs text-muted-foreground truncate">{job.company}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredEvents.length > 0 && (
                    <div className="p-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-primary px-3 py-1.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Events & Sessions
                      </div>
                      <div className="space-y-1 mt-1">
                        {filteredEvents.map(event => (
                          <button
                            key={event.id}
                            onClick={() => {
                              navigate('/mentor-dashboard/sessions')
                              setSearchQuery('')
                              setIsDropdownOpen(false)
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-3 group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{event.title}</span>
                              <span className="text-xs text-muted-foreground truncate">{event.type}</span>
                            </div>
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

            <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
              <ThemeToggle />
              <NotificationDropdown />
              <div className="flex items-center gap-2 sm:gap-3 pl-1.5 sm:pl-4 border-l border-border/50 ml-1 sm:ml-2 shrink-0">
                {isLoaded && user ? (
                  <>
                    <img 
                      src={user.imageUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
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

        {/* Mobile App Launch Notification Banner */}
        <DashboardAppBanner />

        {/* Official Administrative Warning Banner for Mentor */}
        {warnings.length > 0 && (
          <div className="px-3 sm:px-8 pt-4 pb-0 max-w-7xl mx-auto w-full">
            {warnings.map(warn => (
              <div 
                key={warn._id || warn.id} 
                className="bg-amber-500/10 border-2 border-amber-500/40 dark:border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden backdrop-blur-md mb-4 animate-in slide-in-from-top-2 duration-300"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500 text-black">
                        Administrative Notice
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(warn.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-extrabold text-foreground mt-1.5">
                      {warn.subject}
                    </h4>
                    <p className="text-xs sm:text-sm text-foreground/85 mt-1 leading-relaxed whitespace-pre-wrap">
                      {warn.message}
                    </p>
                    <div className="mt-3.5 flex items-center gap-3">
                      <button
                        onClick={() => handleDismissWarning(warn._id || warn.id)}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Acknowledge & Dismiss
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDismissWarning(warn._id || warn.id)}
                    className="absolute top-3.5 right-3.5 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-amber-500/20 transition-colors cursor-pointer"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Page Content */}
        <main className={`flex-1 ${
          location.pathname.includes('/messages')
            ? 'p-0 flex flex-col h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] overflow-hidden'
            : location.pathname.includes('/profile') || 
              location.pathname.includes('/mentor/') || 
              location.pathname.includes('/student/') 
              ? 'p-0 sm:p-6 md:p-8' 
              : 'p-3 sm:p-6 md:p-8'
        } min-w-0`}>
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
        {isLoaded && user && <VideoCallModal currentUser={user} />}
        <ReviewModal 
          isOpen={isReviewModalOpen} 
          onClose={() => setIsReviewModalOpen(false)}
          pendingReview={currentReview}
          onReviewSubmitted={handleReviewSubmitted}
        />
        <AnnouncementModal role="mentor" />
      </div>
    </div>
  )
}

export default MentorDashboardLayout
