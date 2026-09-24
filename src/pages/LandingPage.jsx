import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import HeroSection from '../components/sections/HeroSection'
import TrustedBy from '../components/sections/TrustedBy'
import Statistics from '../components/sections/Statistics'
import Features from '../components/sections/Features'
import HowItWorks from '../components/sections/HowItWorks'
import WatchDemo from '../components/sections/WatchDemo'
import FeaturedMentor from '../components/sections/FeaturedMentor'
import MentorSpotlight from '../components/sections/MentorSpotlight'
import JobOpportunities from '../components/sections/JobOpportunities'
import Internships from '../components/sections/Internships'
import UpcomingEvents from '../components/sections/UpcomingEvents'
import Communities from '../components/sections/Communities'
import SuccessStories from '../components/sections/SuccessStories'
import PlatformPreview from '../components/sections/PlatformPreview'
import AppDownloadSection from '../components/sections/AppDownloadSection'
import FAQ from '../components/sections/FAQ'
import Newsletter from '../components/sections/Newsletter'
import ContactSection from '../components/sections/ContactSection'
import FinalCTA from '../components/sections/FinalCTA'
import API_BASE from '../utils/api'

const LandingPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isLoaded, isSignedIn, user } = useUser()

  useEffect(() => {
    if (!isLoaded) return

    // If user is intentionally viewing the landing page in this tab session or tab is initialized, remain here
    const initialRouted = sessionStorage.getItem('campusbridge_tab_initialized') === 'true' ||
                          sessionStorage.getItem('campusbridge_viewing_home') === 'true'
    if (initialRouted) {
      return
    }

    // Default NEVER redirects to admin; admin is only accessible via /admin URL
    if (isSignedIn && user) {
      const cachedRole = localStorage.getItem('campusbridge_user_role') || sessionStorage.getItem('campusbridge_user_role') || user.publicMetadata?.role || user.unsafeMetadata?.role
      if (cachedRole) {
        if (cachedRole === 'mentor') {
          navigate('/mentor-dashboard', { replace: true })
        } else if (cachedRole !== 'admin') {
          navigate('/dashboard', { replace: true })
        }
        return
      }

      // If role is undetermined, fetch from backend before navigating so mentors never flicker to /dashboard
      let isMounted = true
      const resolveRole = async () => {
        let role = 'student'
        try {
          const res = await fetch(`${API_BASE}/api/users/${user.id}`)
          if (res.ok) {
            const data = await res.json()
            if (data?.role) role = data.role
          }
        } catch (err) {
          console.error('Failed to resolve role on landing page:', err)
        }

        if (isMounted) {
          localStorage.setItem('campusbridge_user_role', role)
          sessionStorage.setItem('campusbridge_user_role', role)
          if (role === 'mentor') {
            navigate('/mentor-dashboard', { replace: true })
          } else if (role !== 'admin') {
            navigate('/dashboard', { replace: true })
          }
        }
      }

      resolveRole()
      return () => { isMounted = false }
    }
  }, [isLoaded, isSignedIn, user, navigate])

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) {
        setTimeout(() => {
          const offset = 80
          const bodyRect = document.body.getBoundingClientRect().top
          const elementRect = el.getBoundingClientRect().top
          const offsetPosition = elementRect - bodyRect - offset
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
        }, 100)
      }
    }
  }, [location.hash])

  return (
    <div className="w-full overflow-hidden">
      <div id="home"><HeroSection /></div>
      <TrustedBy />
      <Statistics />
      <Features />
      <div id="about"><HowItWorks /></div>
      <div id="demo"><WatchDemo /></div>
      <div id="mentor"><FeaturedMentor /></div>
      <div id="mentorship"><MentorSpotlight /></div>
      <div id="jobs"><JobOpportunities /></div>
      <Internships />
      <div id="events"><UpcomingEvents /></div>
      <div id="resources"><Communities /></div>
      <SuccessStories />
      <PlatformPreview />
      <AppDownloadSection />
      <div id="faq"><FAQ /></div>
      <Newsletter />
      <div id="contact"><ContactSection /></div>
      <FinalCTA />
    </div>
  )
}

export default LandingPage
