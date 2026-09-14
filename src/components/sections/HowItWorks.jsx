import React, { useRef } from 'react'
import { motion, useScroll } from 'framer-motion'
import { UserPlus, FileText, Search, UserCheck, MessageCircle, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

const steps = [
  { icon: UserPlus, title: 'Create Account', description: 'Sign up in seconds using your university email.', target: '/signup' },
  { icon: FileText, title: 'Complete Profile', description: 'Add your skills, interests, and current academic status.', target: '/dashboard/profile' },
  { icon: Search, title: 'Find Mentor', description: 'Search for mentor working in your dream roles or companies.', target: '#mentor' },
  { icon: UserCheck, title: 'Request Mentorship', description: 'Send a personalized request for career guidance.', target: '#mentor' },
  { icon: MessageCircle, title: 'Chat & Connect', description: 'Have 1-on-1 conversations and get your resume reviewed.', target: '#demo' },
  { icon: TrendingUp, title: 'Grow Career', description: 'Land internships, jobs, and build a lasting network.', target: '#jobs' },
]

const HowItWorks = () => {
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const { user, isLoaded } = useUser()
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  })

  const handleStepClick = (step) => {
    if (step.target?.startsWith('#')) {
      const targetId = step.target.replace('#', '')
      const el = document.getElementById(targetId)
      if (el) {
        const offset = 80
        const bodyRect = document.body.getBoundingClientRect().top
        const elementRect = el.getBoundingClientRect().top
        const offsetPosition = elementRect - bodyRect - offset
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
      }
    } else if (step.target) {
      if (step.target.startsWith('/dashboard') && (!isLoaded || !user)) {
        navigate('/login', { state: { from: { pathname: step.target } } })
      } else {
        navigate(step.target)
      }
    }
  }

  return (
    <section ref={containerRef} className="py-24 overflow-hidden relative">
      <div className="container max-w-7xl mx-auto px-3 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">How CampusBridge Works</h2>
          <p className="text-lg text-muted-foreground">
            Your journey to a successful career starts here. Follow these simple steps to unlock your potential.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertical Timeline Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-border -translate-x-1/2 rounded-full overflow-hidden">
            <motion.div 
              className="absolute top-0 left-0 right-0 bottom-0 bg-primary origin-top rounded-full"
              style={{ scaleY: scrollYProgress }}
            />
          </div>

          <div className="space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isEven = index % 2 === 0

              return (
                <div key={step.title} className={`relative flex items-center justify-center ${isEven ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Timeline Dot */}
                  <div className="absolute left-1/2 -translate-x-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background border-4 border-primary flex items-center justify-center z-10 shadow-sm">
                     <span className="text-[10px] sm:text-xs font-bold text-primary">{index + 1}</span>
                  </div>

                  {/* Spacer for the other side */}
                  <div className="w-1/2" />

                  {/* Content Card */}
                  <motion.div 
                    initial={{ opacity: 0, x: isEven ? 30 : -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5 }}
                    className={`w-1/2 ${isEven ? 'pl-4 sm:pl-12' : 'pr-4 sm:pr-12'}`}
                  >
                    <div 
                      onClick={() => handleStepClick(step)}
                      className="bg-card p-4 sm:p-6 rounded-2xl border shadow-sm hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer relative group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                        <div className="p-2 sm:p-3 rounded-lg bg-primary/10 text-primary w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <h3 className="text-sm sm:text-xl font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-base text-muted-foreground">{step.description}</p>
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
