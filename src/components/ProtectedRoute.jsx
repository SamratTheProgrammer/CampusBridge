import React, { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { Loader2 } from 'lucide-react'

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isLoaded, isSignedIn } = useUser()
  const [userRole, setUserRole] = useState(() => {
    return sessionStorage.getItem('campusbridge_user_role') || null
  })
  const [isRoleLoading, setIsRoleLoading] = useState(true)
  const location = useLocation()

  // Admin session check via standalone admin login
  const hasAdminToken = allowedRoles.includes('admin') && !!localStorage.getItem('adminToken')
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

      // Check Clerk metadata first
      let role = user.publicMetadata?.role || user.unsafeMetadata?.role

      // If missing from Clerk metadata, fetch from MongoDB API
      if (!role) {
        try {
          const res = await fetch(`/api/users/${user.id}`)
          if (res.ok) {
            const data = await res.json()
            if (data && data.role) {
              role = data.role
            }
          }
        } catch (err) {
          console.error('Failed to fetch user role:', err)
        }
      }

      // Fallback default
      role = role || 'student'

      if (isMounted) {
        setUserRole(role)
        sessionStorage.setItem('campusbridge_user_role', role)
        setIsRoleLoading(false)
      }
    }

    checkUserRole()

    return () => {
      isMounted = false
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
        return <Navigate to="/mentor-dashboard" replace />
      } else if (userRole === 'admin') {
        return <Navigate to="/admin" replace />
      } else {
        return <Navigate to="/dashboard" replace />
      }
    }
  }

  return <Outlet />
}

export default ProtectedRoute
