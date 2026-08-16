import React, { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useClerk, useUser } from '@clerk/clerk-react'
import { socket } from '../../services/socket'
import { calculateProfileCompleteness } from '../../utils/profileCompleteness'
import toast from 'react-hot-toast'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Briefcase,
  Calendar,
  MessageSquare,
  BarChart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Lock,
  ShieldCheck
} from 'lucide-react'
import logoLight from '../../assets/CampusLogoLight.png'
import logoDark from '../../assets/CampusLogoDark.png'
import logoIcon from '../../assets/CampusLogoHalf.png'
import API_BASE from '../../utils/api'

const MentorSidebar = ({ isCollapsed, setIsCollapsed, onClose }) => {
  const { signOut } = useClerk()
  const { user } = useUser()
  const navigate = useNavigate()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [profileCompleteness, setProfileCompleteness] = useState({ percentage: 100, isEligibleForVerification: true })
  const [verificationStatus, setVerificationStatus] = useState('Pending')
  const [isVerified, setIsVerified] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchUserProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/${user.id}`)
        if (res.ok) {
          const data = await res.json()
          const comp = calculateProfileCompleteness(data)
          setProfileCompleteness(comp)
          if (data.verificationStatus) setVerificationStatus(data.verificationStatus)
          if (data.isVerified !== undefined) setIsVerified(data.isVerified)
        }
      } catch (err) {
        console.error('Failed to fetch profile completeness:', err)
      } finally {
        setIsLoadingProfile(false)
      }
    }
    fetchUserProfile()

    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/messages/unread-count/${user.id}`)
        if (res.ok) {
          const data = await res.json()
          setUnreadMessages(data.count)
        }
      } catch (err) {
        console.error('Failed to fetch unread count', err)
      }
    }
    fetchUnread()

    const handleUpdate = () => {
      fetchUnread()
      fetchUserProfile()
    }
    socket.on('update_sidebar', handleUpdate)
    socket.on('messages_read', handleUpdate)

    return () => {
      socket.off('update_sidebar', handleUpdate)
      socket.off('messages_read', handleUpdate)
    }
  }, [user])

  const isApproved = verificationStatus === 'Approved' || isVerified
  const isLocked = !isLoadingProfile && (profileCompleteness.percentage < 80 || !isApproved)

  const handleItemClick = (e, item) => {
    if (onClose) {
      onClose()
    }
  }

  const navItems = [
    { name: 'Dashboard', path: '/mentor-dashboard', icon: LayoutDashboard, exact: true },
    { name: 'My Students', path: '/mentor-dashboard/mentees', icon: Users },
    { name: 'Student Requests', path: '/mentor-dashboard/requests', icon: BookOpen },
    { name: 'Jobs', path: '/mentor-dashboard/jobs', icon: Briefcase },
    { name: 'Events & Sessions', path: '/mentor-dashboard/sessions', icon: Calendar },
    { name: 'Messages', path: '/mentor-dashboard/messages', icon: MessageSquare, badge: unreadMessages > 0 ? unreadMessages : null },
    { name: 'Analytics', path: '/mentor-dashboard/analytics', icon: BarChart },
    { name: 'Settings', path: '/mentor-dashboard/settings', icon: Settings },
  ]

  return (
    <div className={`border-r border-border/40 bg-card flex flex-col h-full w-full relative transition-all duration-300 sidebar-container`}>
      <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between'}`}>
        <Link to="/" onClick={() => onClose && onClose()} className="flex items-center gap-2 overflow-hidden">
          {isCollapsed ? (
            <img src={logoIcon} alt="CampusBridge" className="w-10 h-10 object-contain shrink-0 mx-auto" />
          ) : (
            <>
              <img src={logoLight} alt="CampusBridge" className="h-12 w-auto block dark:hidden" />
              <img src={logoDark} alt="CampusBridge" className="h-12 w-auto hidden dark:block" />
            </>
          )}
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
            onClick={(e) => handleItemClick(e, item)}
            title={isCollapsed ? item.name : undefined}
            className={({ isActive }) => `
              flex items-center gap-3 py-2.5 rounded-xl font-medium text-sm transition-all relative
              ${isCollapsed ? 'justify-center px-0' : 'px-3'}
              ${isActive
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
            `}
          >
            <item.icon className={`w-5 h-5 shrink-0`} />
            {!isCollapsed && (
              <span className="flex-1 truncate flex items-center justify-between">
                {item.name}
              </span>
            )}

            {!isCollapsed && item.badge && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                {item.badge}
              </span>
            )}
            {isCollapsed && item.badge && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Completion Pill Footer */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-border/40 bg-muted/20">
          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
            <span className="text-muted-foreground">Verification Status</span>
            <span className={isApproved ? 'text-emerald-500 flex items-center gap-1' : 'text-amber-500'}>
              {isApproved ? <><ShieldCheck className="w-3 h-3" /> Verified</> : `${profileCompleteness.percentage}% (Pending)`}
            </span>
          </div>
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${isApproved ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${isApproved ? 100 : profileCompleteness.percentage}%` }}
            />
          </div>
        </div>
      )}

      <div className={`p-4 border-t border-border/40 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={() => {
            if (onClose) onClose()
            sessionStorage.removeItem('campusbridge_user_role')
            signOut({ redirectUrl: '/login' })
          }}
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

export default MentorSidebar
