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
import { Toaster } from 'react-hot-toast'

// Dashboard Layout & Pages
import DashboardLayout from './layouts/DashboardLayout'
import DashboardHome from './pages/dashboard/DashboardHome'
import AlumniDirectory from './pages/dashboard/AlumniDirectory'
import AlumniProfile from './pages/dashboard/AlumniProfile'
import MentorshipRequests from './pages/dashboard/MentorshipRequests'
import JobDetails from './pages/dashboard/JobDetails'
import Events from './pages/dashboard/Events'
import Messages from './pages/dashboard/Messages'
import Jobs from './pages/dashboard/Jobs'
import Settings from './pages/dashboard/Settings'

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

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="campusbridge-theme">
      <Router>
        <ScrollToHash />
        <Routes>
          {/* Public Routes with Navbar and Footer */}
          <Route path="/" element={
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                <LandingPage />
              </main>
              <Footer />
            </div>
          } />
          
          <Route path="/login" element={<div className="flex flex-col min-h-screen"><Navbar /><main className="flex-1"><Login /></main><Footer /></div>} />
          <Route path="/signup" element={<div className="flex flex-col min-h-screen"><Navbar /><main className="flex-1"><SignUp /></main><Footer /></div>} />
          <Route path="/forgot-password" element={<div className="flex flex-col min-h-screen"><Navbar /><main className="flex-1"><ForgotPassword /></main><Footer /></div>} />
          <Route path="/otp" element={<div className="flex flex-col min-h-screen"><Navbar /><main className="flex-1"><OTPVerification /></main><Footer /></div>} />

          {/* Authenticated Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="alumni" element={<AlumniDirectory />} />
            <Route path="alumni/:id" element={<AlumniProfile />} />
            <Route path="mentorship" element={<MentorshipRequests />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/:id" element={<JobDetails />} />
            <Route path="events" element={<Events />} />
            <Route path="messages" element={<Messages />} />
            <Route path="applications" element={<div className="p-4">Applications</div>} />
            <Route path="saved" element={<div className="p-4">Saved</div>} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
        <Toaster position="bottom-right" />
      </Router>
    </ThemeProvider>
  )
}

export default App
