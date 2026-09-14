import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
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
import FAQ from '../components/sections/FAQ'
import Newsletter from '../components/sections/Newsletter'
import ContactSection from '../components/sections/ContactSection'
import FinalCTA from '../components/sections/FinalCTA'

const LandingPage = () => {
  const location = useLocation()

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
      <div id="faq"><FAQ /></div>
      <Newsletter />
      <div id="contact"><ContactSection /></div>
      <FinalCTA />
    </div>
  )
}

export default LandingPage
