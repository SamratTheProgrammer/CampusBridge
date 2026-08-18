import React, { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { Loader2 } from 'lucide-react'
import BlockedUserScreen from './BlockedUserScreen'
import API_BASE from '../utils/api'

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isLoaded, isSignedIn } = useUser()
  const [userRole, setUserRole] = useState(() => {
    return sessionStorage.getItem('campusbridge_user_role') || null
  })
  const [isBlockedUser, setIsBlockedUser] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [isRoleLoading, setIsRoleLoading] = useState(true)
  const location = useLocation()

  // Admin session check via standalone admin login
  const hasAdminToken = allowedRoles.includes('admin') && (!!localStorage.getItem('adminToken') || !!sessionStorage.getItem('adminToken'))
  if (hasAdminToken) {
    return <Outlet />
  }

  useEffect(() => {
    let isMounted = true

    const checkUserRole = async () => {
      if (!isLoaded) return

      if (!isSignedIn || !user) {
        if (isMounted) {
          setUserRole(null)
          sessionStorage.removeItem('campusbridge_user_role')
          setIsRoleLoading(false)
        }
        return
      }

      let role = user.publicMetadata?.role || user.unsafeMetadata?.role || sessionStorage.getItem('campusbridge_user_role')

      // Fetch user profile from MongoDB API to check role and block status
      try {
        const res = await fetch(`${API_BASE}/api/users/${user.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data) {
            if (data.role) role = data.role
            if (data.isBlocked && isMounted) {
              setIsBlockedUser(true)
              setBlockReason(data.blockReason || '')
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch user status:', err)
      }

      // Fallback default
      role = role || 'student'

      if (isMounted) {
        setUserRole(role)
        sessionStorage.setItem('campusbridge_user_role', role)
        setIsRoleLoading(false)
      }
    }

    const safetyTimeout = setTimeout(() => {
      if (isMounted && isRoleLoading) {
        const fallbackRole = user?.publicMetadata?.role || user?.unsafeMetadata?.role || sessionStorage.getItem('campusbridge_user_role') || 'student'
        setUserRole(fallbackRole)
        sessionStorage.setItem('campusbridge_user_role', fallbackRole)
        setIsRoleLoading(false)
      }
    }, 4000)

    checkUserRole()

    return () => {
      isMounted = false
      clearTimeout(safetyTimeout)
    }
  }, [isLoaded, isSignedIn, user])

  // 1. Loading state while checking authentication and role
  if (!isLoaded || isRoleLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Verifying route integrity...</p>
      </div>
    )
  }

  // 1.5. Blocked User Check -> Show Blocked User Screen
  if (isSignedIn && user && isBlockedUser) {
    return <BlockedUserScreen blockReason={blockReason} />
  }

  // 2. Unauthenticated check -> Redirect to /login
  if (!isSignedIn || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. Role authorization check
  if (allowedRoles.length > 0) {
    const isAllowed = allowedRoles.includes(userRole)

    if (!isAllowed) {
      // Redirect to authorized dashboard based on actual user role
      if (userRole === 'mentor') {
        const subPath = location.pathname.replace(/^\/dashboard\/?/, '/');
        return <Navigate to={`/mentor-dashboard${subPath === '/' ? '' : subPath}`} replace />
      } else if (userRole === 'admin') {
        return <Navigate to="/admin" replace />
      } else {
        const subPath = location.pathname.replace(/^\/mentor-dashboard\/?/, '/');
        return <Navigate to={`/dashboard${subPath === '/' ? '' : subPath}`} replace />
      }
    }
  }

  return <Outlet />
}

export default ProtectedRoute
