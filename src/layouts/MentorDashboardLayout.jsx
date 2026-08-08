import React, { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import MentorSidebar from '../components/dashboard/MentorSidebar'
import { Search, Bell, Menu, Sun, Moon, Users, Briefcase, Calendar } from 'lucide-react'
import { useTheme } from '../components/ThemeProvider'
import { useUser } from '@clerk/clerk-react'
import NotificationDropdown from '../components/NotificationDropdown'

const MOCK_STUDENTS = [
  { id: 1, name: 'Ananya Sharma', role: 'B.Tech CS Student', university: 'NIT Trichy' },
  { id: 2, name: 'Rahul Verma', role: 'MCA Student', university: 'Delhi University' },
]

const MOCK_POSTS = [
  { id: 1, title: 'How to crack FAANG interviews', type: 'Post' },
  { id: 2, title: 'React Performance Tips', type: 'Post' },
]

const MentorDashboardLayout = () => {
  const { theme, setTheme } = useTheme()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const searchRef = useRef(null)
  
  const { user, isLoaded } = useUser()

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
      <div className={`hidden md:block fixed inset-y-0 left-0 z-40 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <MentorSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64`}>
        <MentorSidebar isCollapsed={false} setIsCollapsed={() => {}} />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ${isCollapsed ? 'md:ml-20' : 'md:ml-64'} min-h-screen transition-all duration-300`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 h-16 px-4 sm:px-8 flex items-center justify-between">
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
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <NotificationDropdown />
            <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-border/50 ml-2">
              {isLoaded && user ? (
                <>
                  <img 
                    src={user.imageUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20"
                  />
                  <div className="hidden lg:block text-sm">
                    <p className="font-semibold text-foreground leading-none mb-1">{user.fullName || 'Mentor'}</p>
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
        <main className="flex-1 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MentorDashboardLayout
