import React from 'react'
import { NavLink, Link } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Briefcase, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Bookmark, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'Alumni Directory', path: '/dashboard/alumni', icon: Users },
    { name: 'Mentorship', path: '/dashboard/mentorship', icon: BookOpen },
    { name: 'Jobs & Internships', path: '/dashboard/jobs', icon: Briefcase },
    { name: 'Events', path: '/dashboard/events', icon: Calendar },
    { name: 'Messages', path: '/dashboard/messages', icon: MessageSquare, badge: 5 },
    { name: 'Applications', path: '/dashboard/applications', icon: FileText },
    { name: 'Saved', path: '/dashboard/saved', icon: Bookmark },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className={`border-r border-border/40 bg-card h-screen flex flex-col fixed left-0 top-0 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} z-40`}>
      <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between'}`}>
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          {!isCollapsed && <span className="font-bold text-lg tracking-tight truncate">CampusBridge</span>}
        </Link>
        
        {/* Toggle Button for Desktop */}
        {setIsCollapsed && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex items-center justify-center w-6 h-6 rounded-full hover:bg-muted text-muted-foreground transition-colors absolute -right-3 top-8 bg-card border border-border/50 shadow-sm z-50"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto space-y-1 ${isCollapsed ? 'px-3 py-4' : 'px-4 py-4'}`}>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.exact}
            title={isCollapsed ? item.name : undefined}
            className={({ isActive }) => `
              flex items-center gap-3 py-2.5 rounded-xl font-medium text-sm transition-all relative
              ${isCollapsed ? 'justify-center px-0' : 'px-3'}
              ${isActive 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
            `}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="flex-1 truncate">{item.name}</span>}
            
            {!isCollapsed && item.badge && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                {item.badge}
              </span>
            )}
            {/* Small dot for badge when collapsed */}
            {isCollapsed && item.badge && (
               <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={`p-4 border-t border-border/40 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button 
          title={isCollapsed ? 'Logout' : undefined}
          className={`flex items-center gap-3 py-2.5 rounded-xl font-medium text-sm text-destructive hover:bg-destructive/10 transition-all text-left
            ${isCollapsed ? 'justify-center px-0 w-full' : 'px-3 w-full'}
          `}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}

export default Sidebar
