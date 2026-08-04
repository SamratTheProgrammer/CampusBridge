import React, { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  HelpingHand,
  Briefcase, 
  Building2, 
  Calendar, 
  MessageSquare, 
  Volume2, 
  BarChart3, 
  Bell, 
  History, 
  Settings, 
  User, 
  LogOut,
  Menu,
  Sun,
  Moon,
  Search,
  ChevronRight
} from 'lucide-react'
import { useTheme } from '../components/ThemeProvider'
import logoLight from '../assets/CampusLogoLight.png'
import logoDark from '../assets/CampusLogoDark.png'
import logoHalf from '../assets/CampusLogoHalf.png'

const AdminLayout = () => {
  const { theme, setTheme } = useTheme()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const adminMenu = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Alumni Verification', path: '/admin/verification', icon: UserCheck },
    { name: 'Mentorship', path: '/admin/mentorship', icon: HelpingHand },
    { name: 'Jobs & Internships', path: '/admin/jobs', icon: Briefcase },
    { name: 'Companies', path: '/admin/companies', icon: Building2 },
    { name: 'Events', path: '/admin/events', icon: Calendar },
    { name: 'Communities', path: '/admin/communities', icon: MessageSquare },
    { name: 'Announcements', path: '/admin/announcements', icon: Volume2 },
    { name: 'Reports & Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
    { name: 'Activity Logs', path: '/admin/logs', icon: History },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ]

  const handleLogout = () => {
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar for Desktop */}
      <div className={`hidden md:block border-r border-border/50 bg-card fixed inset-y-0 left-0 z-40 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="h-full flex flex-col justify-between py-6">
          <div>
            {/* Logo */}
            <div className="px-4 flex items-center justify-between mb-8">
              <Link to="/admin" className="flex items-center mx-auto">
                {isCollapsed ? (
                  <img src={logoHalf} alt="CampusBridge" className="h-10 w-10 object-contain" />
                ) : (
                  <>
                    <img src={logoLight} alt="CampusBridge" className="h-26 w-auto block dark:hidden" />
                    <img src={logoDark} alt="CampusBridge" className="h-26 w-auto hidden dark:block" />
                  </>
                )}
              </Link>
            </div>

            {/* Navigation links */}
            <nav className="px-3 space-y-1">
              {adminMenu.map((item) => {
                const isActive = location.pathname === item.path
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110`} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User profile & logout */}
          <div className="px-3 space-y-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors group"
            >
              <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar drawer */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 md:hidden ${isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
        {/* Drawer container */}
        <div className={`absolute top-0 bottom-0 left-0 w-64 bg-card border-r border-border/50 py-6 transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="px-6 flex items-center justify-between mb-8">
            <Link to="/admin" className="flex items-center">
              <img src={logoLight} alt="CampusBridge" className="h-16 w-auto block dark:hidden" />
              <img src={logoDark} alt="CampusBridge" className="h-16 w-auto hidden dark:block" />
            </Link>
          </div>

          <nav className="px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
            {adminMenu.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="absolute bottom-6 left-3 right-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ${isCollapsed ? 'md:ml-20' : 'md:ml-64'} min-h-screen transition-all duration-300`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/40 h-16 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="md:hidden p-2 rounded-md hover:bg-muted text-muted-foreground"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Collapse Sidebar Button for Desktop */}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            >
              <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
            </button>

            <div className="hidden sm:flex items-center bg-muted/50 border border-border/50 rounded-lg px-3 py-1.5 w-full max-w-md focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
              <Search className="w-4 h-4 text-muted-foreground mr-2" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Light/Dark Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <button className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border border-background"></span>
            </button>

            {/* Admin Profile */}
            <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-border/50 ml-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                A
              </div>
              <div className="hidden lg:block text-sm">
                <p className="font-semibold text-foreground leading-none mb-1">Admin</p>
                <p className="text-xs text-muted-foreground leading-none">Super Admin</p>
              </div>
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

export default AdminLayout
