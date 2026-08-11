import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { ThemeProvider, useTheme } from './components/ThemeProvider'
import LandingPage from './pages/LandingPage'
import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import ForgotPassword from './pages/auth/ForgotPassword'
import OTPVerification from './pages/auth/OTPVerification'
import SSOCallback from './pages/auth/SSOCallback'
import SyncUser from './pages/auth/SyncUser'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import PageTransition from './components/PageTransition'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { ClerkProvider } from '@clerk/clerk-react'
import ErrorBoundary from './components/ErrorBoundary'
import EventPopup from './components/EventPopup'
import IndependenceDayConfetti from './components/IndependenceDayConfetti'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

// Dashboard Layout & Pages
import DashboardLayout from './layouts/DashboardLayout'
import DashboardHome from './pages/dashboard/DashboardHome'
import MyProfile from './pages/dashboard/MyProfile'
import MentorDirectory from './pages/dashboard/MentorDirectory'
import MentorProfile from './pages/dashboard/MentorProfile'
import BookSession from './pages/dashboard/BookSession'
import BookingSuccess from './pages/dashboard/BookingSuccess'
import MyMentors from './pages/dashboard/MyMentors'
import MentorshipRequests from './pages/dashboard/MentorshipRequests'
import JobDetails from './pages/dashboard/JobDetails'
import Events from './pages/dashboard/Events'
import Messages from './pages/dashboard/Messages'
import Jobs from './pages/dashboard/Jobs'
import Settings from './pages/dashboard/Settings'
import Applications from './pages/dashboard/Applications'
import Saved from './pages/dashboard/Saved'
import MySessions from './pages/dashboard/MySessions'
import MyNetwork from './pages/dashboard/MyNetwork'

// Mentor Dashboard Layout & Pages
import MentorDashboardLayout from './layouts/MentorDashboardLayout'
import MentorHome from './pages/mentor-dashboard/MentorHome'
import MyMentees from './pages/mentor-dashboard/MyMentees'
import MentorRequests from './pages/mentor-dashboard/MentorshipRequests'
import MentorJobs from './pages/mentor-dashboard/MentorJobs'
import MentorSessions from './pages/mentor-dashboard/MentorSessions'
import MentorPosts from './pages/mentor-dashboard/MentorPosts'
import MentorMessages from './pages/mentor-dashboard/MentorMessages'
import MentorAnalytics from './pages/mentor-dashboard/MentorAnalytics'
import MentorSettings from './pages/mentor-dashboard/MentorSettings'
import StudentProfile from './pages/mentor-dashboard/StudentProfile'

// Admin Layout & Pages
import AdminLayout from './layouts/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUserManagement from './pages/admin/AdminUserManagement'
import AdminVerification from './pages/admin/AdminVerification'
import AdminMentorship from './pages/admin/AdminMentorship'
import AdminJobs from './pages/admin/AdminJobs'
import AdminCompanies from './pages/admin/AdminCompanies'
import AdminEvents from './pages/admin/AdminEvents'
import AdminSupportMessages from './pages/admin/AdminSupportMessages'
import AdminSettings from './pages/admin/AdminSettings'

import ProtectedRoute from './components/ProtectedRoute'

function ScrollToHash() {
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [hash])
  return null
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes with Navbar and Footer */}
        <Route path="/" element={
          <PageTransition>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                <LandingPage />
              </main>
              <Footer />
            </div>
          </PageTransition>
        } />

        <Route path="/login" element={<PageTransition><div className="flex flex-col min-h-screen"><Navbar /><main className="flex-1"><Login /></main><Footer /></div></PageTransition>} />
        <Route path="/signup" element={<PageTransition><div className="flex flex-col min-h-screen"><Navbar /><main className="flex-1"><SignUp /></main><Footer /></div></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><div className="flex flex-col min-h-screen"><Navbar /><main className="flex-1"><ForgotPassword /></main><Footer /></div></PageTransition>} />
        <Route path="/otp" element={<PageTransition><div className="flex flex-col min-h-screen"><Navbar /><main className="flex-1"><OTPVerification /></main><Footer /></div></PageTransition>} />
        <Route path="/sso-callback" element={<SSOCallback />} />
        <Route path="/sync-user" element={<SyncUser />} />
        <Route path="/u/:id" element={<PageTransition><div className="flex flex-col min-h-screen"><Navbar /><main className="flex-1 bg-background pt-20 pb-10"><StudentProfile /></main><Footer /></div></PageTransition>} />

        {/* Authenticated Dashboard Routes */}
        <Route element={<ProtectedRoute allowedRoles={['student', 'user']} />}>
          <Route path="/dashboard" element={<PageTransition><DashboardLayout /></PageTransition>}>
            <Route index element={<DashboardHome />} />
            <Route path="profile" element={<MyProfile />} />
            <Route path="mentor" element={<MentorDirectory />} />
            <Route path="mentor/:id" element={<MentorProfile />} />
            <Route path="student/:id" element={<StudentProfile />} />
            <Route path="mentor/:id/book" element={<BookSession />} />
            <Route path="mentor/:id/book/success" element={<BookingSuccess />} />
            <Route path="my-mentors" element={<MyMentors />} />
            <Route path="mentorship" element={<MentorshipRequests />} />
            <Route path="sessions" element={<MySessions />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/:id" element={<JobDetails />} />
            <Route path="events" element={<Events />} />
            <Route path="messages" element={<Messages />} />
            <Route path="applications" element={<Applications />} />
            <Route path="saved" element={<Saved />} />
            <Route path="network" element={<MyNetwork />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Authenticated Mentor Dashboard Routes */}
        <Route element={<ProtectedRoute allowedRoles={['mentor', 'alumni']} />}>
          <Route path="/mentor-dashboard" element={<PageTransition><MentorDashboardLayout /></PageTransition>}>
            <Route index element={<MentorHome />} />
            <Route path="profile" element={<MyProfile />} />
            <Route path="mentees" element={<MyMentees />} />
            <Route path="requests" element={<MentorRequests />} />
            <Route path="network" element={<MyNetwork />} />
            <Route path="student/:id" element={<StudentProfile />} />
            <Route path="mentor/:id" element={<MentorProfile />} />
            <Route path="jobs" element={<MentorJobs />} />
            <Route path="sessions" element={<MentorSessions />} />
            <Route path="events" element={<MentorSessions />} />
            <Route path="posts" element={<MentorPosts />} />
            <Route path="messages" element={<MentorMessages />} />
            <Route path="analytics" element={<MentorAnalytics />} />
            <Route path="settings" element={<MentorSettings />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<PageTransition><AdminLayout /></PageTransition>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUserManagement />} />
            <Route path="verification" element={<AdminVerification />} />
            <Route path="mentorship" element={<AdminMentorship />} />
            <Route path="jobs" element={<AdminJobs />} />
            <Route path="companies" element={<AdminCompanies />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="messages" element={<AdminSupportMessages />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

function IndependenceDayWrapper() {
  const { globalTheme } = useTheme()
  const location = useLocation()
  const [hasPlayed, setHasPlayed] = useState(false)

  useEffect(() => {
    if (globalTheme === 'independence' && !hasPlayed && !location.pathname.startsWith('/admin')) {
      setHasPlayed(true)
    }
  }, [globalTheme, hasPlayed, location.pathname])

  if (hasPlayed) {
    return <IndependenceDayConfetti />
  }
  return null
}

function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ThemeProvider defaultTheme="system" storageKey="campusbridge-theme">
        <Router>
          <ScrollToHash />
          <ErrorBoundary>
            <AnimatedRoutes />
          </ErrorBoundary>
          <EventPopup />
          <IndependenceDayWrapper />
          <Toaster position="bottom-right" />
        </Router>
      </ThemeProvider>
    </ClerkProvider>
  )
}

export default App
