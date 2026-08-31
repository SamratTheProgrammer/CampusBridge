import React, { useState, useEffect } from 'react'
import { useParams, Outlet, Navigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import API_BASE from '../utils/api'
import { Loader2 } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import MentorDashboardLayout from '../layouts/MentorDashboardLayout'
import Navbar from './Navbar'
import Footer from './Footer'
import MentorProfile from '../pages/dashboard/MentorProfile'
import StudentProfile from '../pages/mentor-dashboard/StudentProfile'

export const DynamicLayoutWrapper = () => {
  const { user, isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 bg-background sm:pt-10 sm:pb-10">
          <Outlet />
        </main>
        <Footer />
      </div>
    )
  }

  const role = sessionStorage.getItem('campusbridge_user_role') || user.publicMetadata?.role || user.unsafeMetadata?.role || 'student'
  const { username } = useParams()
  
  if (role === 'mentor' || role === 'alumni') {
    return <Navigate to={`/mentor-dashboard/profile/${username}`} replace />
  }

  if (role === 'admin') {
    return <Navigate to={`/admin/users`} replace /> // Admin user management
  }

  return <Navigate to={`/dashboard/profile/${username}`} replace />
}

export const ProfileDispatcher = () => {
  const { username } = useParams()
  const [profileUser, setProfileUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/${username}`)
        if (res.ok) {
          const data = await res.json()
          setProfileUser(data)
        } else {
          setProfileUser(null)
        }
      } catch (err) {
        console.error('Failed to fetch user:', err)
        setProfileUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [username])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-xl font-semibold text-foreground">User not found</h2>
      </div>
    )
  }

  if (profileUser.role === 'mentor' || profileUser.role === 'alumni') {
    return <MentorProfile initialUser={profileUser} />
  }

  return <StudentProfile initialUser={profileUser} />
}
