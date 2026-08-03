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
import AlumniDirectory from './pages/dashboard/AlumniDirectory'
import AlumniProfile from './pages/dashboard/AlumniProfile'
import MentorshipRequests from './pages/dashboard/MentorshipRequests'
import JobDetails from './pages/dashboard/JobDetails'
import Events from './pages/dashboard/Events'
import Messages from './pages/dashboard/Messages'
import Jobs from './pages/dashboard/Jobs'
import Settings from './pages/dashboard/Settings'
import Applications from './pages/dashboard/Applications'
import Saved from './pages/dashboard/Saved'

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
          <Route path="alumni" element={<AlumniDirectory />} />
          <Route path="alumni/:id" element={<AlumniProfile />} />
          <Route path="mentorship" element={<MentorshipRequests />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/:id" element={<JobDetails />} />
          <Route path="events" element={<Events />} />
          <Route path="messages" element={<Messages />} />
          <Route path="applications" element={<Applications />} />
          <Route path="saved" element={<Saved />} />
          <Route path="settings" element={<Settings />} />
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
