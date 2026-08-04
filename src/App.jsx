import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import LandingPage from './pages/LandingPage'
import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import ForgotPassword from './pages/auth/ForgotPassword'
import OTPVerification from './pages/auth/OTPVerification'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import PageTransition from './components/PageTransition'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'

// Dashboard Layout & Pages
import DashboardLayout from './layouts/DashboardLayout'
import DashboardHome from './pages/dashboard/DashboardHome'
import MentorDirectory from './pages/dashboard/MentorDirectory'
import MentorProfile from './pages/dashboard/MentorProfile'
import MentorshipRequests from './pages/dashboard/MentorshipRequests'
import JobDetails from './pages/dashboard/JobDetails'
import Events from './pages/dashboard/Events'
import Messages from './pages/dashboard/Messages'
import Jobs from './pages/dashboard/Jobs'
import Settings from './pages/dashboard/Settings'
import Applications from './pages/dashboard/Applications'
import Saved from './pages/dashboard/Saved'

// Mentor Dashboard Layout & Pages
import MentorDashboardLayout from './layouts/MentorDashboardLayout'
import MentorHome from './pages/mentor-dashboard/MentorHome'
import MyMentees from './pages/mentor-dashboard/MyMentees'
import MentorRequests from './pages/mentor-dashboard/MentorshipRequests'
import MentorJobs from './pages/mentor-dashboard/MentorJobs'
import MentorEvents from './pages/mentor-dashboard/MentorEvents'
import MentorPosts from './pages/mentor-dashboard/MentorPosts'
import MentorMessages from './pages/mentor-dashboard/MentorMessages'
import MentorAnalytics from './pages/mentor-dashboard/MentorAnalytics'
import MentorProfilePage from './pages/mentor-dashboard/MentorProfilePage'
import MentorSettings from './pages/mentor-dashboard/MentorSettings'

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
import AdminCommunities from './pages/admin/AdminCommunities'
import AdminAnnouncements from './pages/admin/AdminAnnouncements'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminNotifications from './pages/admin/AdminNotifications'
import AdminSettings from './pages/admin/AdminSettings'
import AdminActivityLogs from './pages/admin/AdminActivityLogs'

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

        {/* Authenticated Dashboard Routes */}
        <Route path="/dashboard" element={<PageTransition><DashboardLayout /></PageTransition>}>
          <Route index element={<DashboardHome />} />
          <Route path="mentor" element={<MentorDirectory />} />
          <Route path="mentor/:id" element={<MentorProfile />} />
          <Route path="mentorship" element={<MentorshipRequests />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/:id" element={<JobDetails />} />
          <Route path="events" element={<Events />} />
          <Route path="messages" element={<Messages />} />
          <Route path="applications" element={<Applications />} />
          <Route path="saved" element={<Saved />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Authenticated Mentor Dashboard Routes */}
        <Route path="/mentor-dashboard" element={<PageTransition><MentorDashboardLayout /></PageTransition>}>
          <Route index element={<MentorHome />} />
          <Route path="profile" element={<MentorProfilePage />} />
          <Route path="mentees" element={<MyMentees />} />
          <Route path="requests" element={<MentorRequests />} />
          <Route path="jobs" element={<MentorJobs />} />
          <Route path="events" element={<MentorEvents />} />
          <Route path="posts" element={<MentorPosts />} />
          <Route path="messages" element={<MentorMessages />} />
          <Route path="analytics" element={<MentorAnalytics />} />
          <Route path="settings" element={<MentorSettings />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />
        <Route path="/admin" element={<PageTransition><AdminLayout /></PageTransition>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUserManagement />} />
          <Route path="verification" element={<AdminVerification />} />
          <Route path="mentorship" element={<AdminMentorship />} />
          <Route path="jobs" element={<AdminJobs />} />
          <Route path="companies" element={<AdminCompanies />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="communities" element={<AdminCommunities />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="logs" element={<AdminActivityLogs />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="campusbridge-theme">
      <Router>
        <ScrollToHash />
        <AnimatedRoutes />
        <Toaster position="bottom-right" />
      </Router>
    </ThemeProvider>
  )
}

export default App
