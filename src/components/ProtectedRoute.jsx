import React, { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import BlockedUserScreen from './BlockedUserScreen'
import API_BASE from '../utils/api'
import RouteIntegrityLoader from './RouteIntegrityLoader'
import DashboardSkeleton from './skeletons/DashboardSkeleton'

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isLoaded, isSignedIn } = useUser()
  const justAuthenticated = sessionStorage.getItem('campusbridge_just_authenticated') === 'true'
  const cachedRole = localStorage.getItem('campusbridge_user_role') || sessionStorage.getItem('campusbridge_user_role')
  const initialRole = cachedRole || user?.publicMetadata?.role || user?.unsafeMetadata?.role || null
  const [userRole, setUserRole] = useState(initialRole)
  const [isBlockedUser, setIsBlockedUser] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  // Show integrity loading if role is not yet known or just authenticated
  const [isRoleLoading, setIsRoleLoading] = useState(justAuthenticated || (isSignedIn && !initialRole))
  const location = useLocation()

  // Admin session check via standalone admin login - strictly sessionStorage only
  const hasAdminToken = allowedRoles.includes('admin') && !!sessionStorage.getItem('adminToken')

  useEffect(() => {
    let isMounted = true

    const checkUserRole = async () => {
      if (!isLoaded) return

      if (!isSignedIn || !user) {
        if (isMounted) {
          setUserRole(null)
          sessionStorage.removeItem('campusbridge_user_role')
          localStorage.removeItem('campusbridge_user_role')
          sessionStorage.removeItem('campusbridge_just_authenticated')
          setIsRoleLoading(false)
        }
        return
      }

      let role = user.publicMetadata?.role || user.unsafeMetadata?.role || localStorage.getItem('campusbridge_user_role') || sessionStorage.getItem('campusbridge_user_role')

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

      // Fallback default only if completely undetermined
      role = role || 'student'

      // If just authenticated or clicked "Go to Dashboard", ensure a smooth transition (~600ms)
      if (justAuthenticated) {
        await new Promise(resolve => setTimeout(resolve, 600))
      }

      if (isMounted) {
        setUserRole(role)
        localStorage.setItem('campusbridge_user_role', role)
        sessionStorage.setItem('campusbridge_user_role', role)
        sessionStorage.removeItem('campusbridge_just_authenticated')
        setIsRoleLoading(false)
      }
    }

    const safetyTimeout = setTimeout(() => {
      if (isMounted && isRoleLoading) {
        const fallbackRole = user?.publicMetadata?.role || user?.unsafeMetadata?.role || localStorage.getItem('campusbridge_user_role') || sessionStorage.getItem('campusbridge_user_role') || 'student'
        setUserRole(fallbackRole)
        localStorage.setItem('campusbridge_user_role', fallbackRole)
        sessionStorage.setItem('campusbridge_user_role', fallbackRole)
        sessionStorage.removeItem('campusbridge_just_authenticated')
        setIsRoleLoading(false)
      }
    }, 4000)

    checkUserRole()

    return () => {
      isMounted = false
      clearTimeout(safetyTimeout)
    }
  }, [isLoaded, isSignedIn, user, justAuthenticated])

  // Admin session check via standalone admin login
  if (hasAdminToken) {
    return <Outlet />
  }

  // 1. Loading state while checking authentication and role - show RouteIntegrityLoader to avoid UI flash
  if (!isLoaded || (justAuthenticated && isRoleLoading) || (isSignedIn && !userRole)) {
    return <RouteIntegrityLoader />
  }

  // 1.5. Blocked User Check -> Show Blocked User Screen
  if (isSignedIn && user && isBlockedUser) {
    return <BlockedUserScreen blockReason={blockReason} />
  }

  // 2. Unauthenticated check -> Redirect unauthenticated admin access to "/" (home page), others to /login
  if (!isSignedIn || !user) {
    if (allowedRoles.includes('admin')) {
      return <Navigate to="/" replace />
    }
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. Role authorization check
  if (allowedRoles.length > 0) {
    const isAllowed = allowedRoles.includes(userRole)

    if (!isAllowed) {
      // Redirect to authorized dashboard based on actual user role
      const search = location.search || '';
      if (userRole === 'mentor') {
        const subPath = location.pathname.startsWith('/dashboard')
          ? location.pathname.replace(/^\/dashboard\/?/, '')
          : '';
        return <Navigate to={`/mentor-dashboard${subPath ? `/${subPath}` : ''}${search}`} replace />
      } else if (userRole === 'admin') {
        return <Navigate to={`/admin${search}`} replace />
      } else {
        const subPath = location.pathname.startsWith('/mentor-dashboard')
          ? location.pathname.replace(/^\/mentor-dashboard\/?/, '')
          : '';
        return <Navigate to={`/dashboard${subPath ? `/${subPath}` : ''}${search}`} replace />
      }
    }
  }

  return <Outlet />
}

export default ProtectedRoute
