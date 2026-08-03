import React from 'react'
import HeroSection from '../components/sections/HeroSection'
import TrustedBy from '../components/sections/TrustedBy'
import Statistics from '../components/sections/Statistics'
import Features from '../components/sections/Features'
import HowItWorks from '../components/sections/HowItWorks'
import FeaturedAlumni from '../components/sections/FeaturedAlumni'
import MentorSpotlight from '../components/sections/MentorSpotlight'
import JobOpportunities from '../components/sections/JobOpportunities'
import Internships from '../components/sections/Internships'
import UpcomingEvents from '../components/sections/UpcomingEvents'
import Communities from '../components/sections/Communities'
import SuccessStories from '../components/sections/SuccessStories'
import PlatformPreview from '../components/sections/PlatformPreview'
import FAQ from '../components/sections/FAQ'
import Newsletter from '../components/sections/Newsletter'
import FinalCTA from '../components/sections/FinalCTA'

const LandingPage = () => {
  return (
    <div className="w-full overflow-hidden">
      <div id="home"><HeroSection /></div>
      <TrustedBy />
      <Statistics />
      <Features />
      <div id="about"><HowItWorks /></div>
      <div id="alumni"><FeaturedAlumni /></div>
      <div id="mentorship"><MentorSpotlight /></div>
      <div id="jobs"><JobOpportunities /></div>
      <Internships />
      <div id="events"><UpcomingEvents /></div>
      <div id="resources"><Communities /></div>
      <SuccessStories />
      <PlatformPreview />
      <FAQ />
      <Newsletter />
      <FinalCTA />
    </div>
  )
}

export default LandingPage
