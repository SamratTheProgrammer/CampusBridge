import React, { useState, useEffect } from 'react'
import { useParams, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import API_BASE from '../utils/api'
import { Loader2, ArrowLeft } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import MentorDashboardLayout from '../layouts/MentorDashboardLayout'
import Navbar from './Navbar'
import Footer from './Footer'
import MentorProfile from '../pages/dashboard/MentorProfile'
import StudentProfile from '../pages/mentor-dashboard/StudentProfile'
import DashboardSkeleton from './skeletons/DashboardSkeleton'
import ProfileSkeleton from './skeletons/ProfileSkeleton'

export const DynamicLayoutWrapper = () => {
  const { user, isLoaded, isSignedIn } = useUser()
  const { username } = useParams()

  if (!isLoaded) {
    return <DashboardSkeleton />
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
  
  if (role === 'mentor' || role === 'alumni') {
    return <Navigate to={`/mentor-dashboard/profile/${username}`} replace />
  }

  if (role === 'admin') {
    return <Navigate to={`/admin/users/${username}`} replace />
  }

  return <Navigate to={`/dashboard/profile/${username}`} replace />
}

export const ProfileDispatcher = () => {
  const { user } = useUser()
  const { username } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [profileUser, setProfileUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/${username}?viewerId=${user?.id || ''}`)
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
      <div className="min-h-[60vh] p-4 sm:p-6 md:p-8">
        <ProfileSkeleton />
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        {location.pathname.startsWith('/admin') && (
          <button 
            onClick={() => navigate('/admin/users')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/60 hover:bg-muted text-foreground text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-primary" /> Back to Users
          </button>
        )}
        <h2 className="text-xl font-semibold text-foreground">User not found</h2>
      </div>
    )
  }

  const profileContent = (profileUser.role === 'mentor' || profileUser.role === 'alumni')
    ? <MentorProfile initialUser={profileUser} />
    : <StudentProfile initialUser={profileUser} />;

  if (location.pathname.startsWith('/admin')) {
    return (
      <div className="space-y-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border/60 hover:bg-muted text-foreground text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-primary" /> Back
          </button>
        </div>
        {profileContent}
      </div>
    );
  }

  return profileContent;
}
