import React, { useState, useEffect } from 'react'
import { useParams, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import API_BASE from '../utils/api'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useProfileData } from '../context/ProfileDataContext'
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
  const { mongoProfile } = useProfileData()

  if (!isLoaded) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-1 bg-background p-0 sm:p-6 md:p-8">
          <ProfileSkeleton />
        </main>
        <Footer />
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

  const role = localStorage.getItem('campusbridge_user_role') || sessionStorage.getItem('campusbridge_user_role') || mongoProfile?.role || user.publicMetadata?.role || user.unsafeMetadata?.role || 'student'
  
  // If the user navigates to their own profile, send them to their own profile dashboard
  const isSelf = username && (
    username === mongoProfile?.username ||
    username === user.id ||
    (user.username && username.toLowerCase() === user.username.toLowerCase())
  );

  if (isSelf) {
    if (role === 'mentor' || role === 'alumni') {
      return <Navigate to="/mentor-dashboard/profile" replace />
    }
    return <Navigate to="/dashboard/profile" replace />
  }

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
  const { mongoProfile } = useProfileData()
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
  }, [username, user?.id])

  if (isLoading) {
    return (
      <div className="w-full">
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

  const isAdmin = location.pathname.startsWith('/admin');

  // If this is the current user's profile and not an admin view, redirect to the personal profile view
  const isSelf = user && (
    profileUser.clerkId === user.id ||
    profileUser._id === user.id ||
    (profileUser.username && profileUser.username === mongoProfile?.username)
  );

  if (isSelf && !isAdmin) {
    const role = localStorage.getItem('campusbridge_user_role') || sessionStorage.getItem('campusbridge_user_role') || mongoProfile?.role || user.publicMetadata?.role || user.unsafeMetadata?.role || 'student';
    return <Navigate to={(role === 'mentor' || role === 'alumni') ? '/mentor-dashboard/profile' : '/dashboard/profile'} replace />;
  }
  const profileContent = (profileUser.role === 'mentor' || profileUser.role === 'alumni')
    ? <MentorProfile initialUser={profileUser} isAdmin={isAdmin} />
    : <StudentProfile initialUser={profileUser} isAdmin={isAdmin} />;

  if (isAdmin) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border/60 hover:bg-muted text-foreground text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-primary" /> Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              Admin Viewing Mode
            </span>
          </div>
        </div>
        {profileContent}
      </div>
    );
  }

  return profileContent;
}
