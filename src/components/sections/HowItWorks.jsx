import React, { useRef } from 'react'
import { motion, useScroll } from 'framer-motion'
import { UserPlus, FileText, Search, UserCheck, MessageCircle, TrendingUp } from 'lucide-react'

const steps = [
  { icon: UserPlus, title: 'Create Account', description: 'Sign up in seconds using your university email.' },
  { icon: FileText, title: 'Complete Profile', description: 'Add your skills, interests, and current academic status.' },
  { icon: Search, title: 'Find Alumni', description: 'Search for alumni working in your dream roles or companies.' },
  { icon: UserCheck, title: 'Request Mentorship', description: 'Send a personalized request for career guidance.' },
  { icon: MessageCircle, title: 'Chat & Connect', description: 'Have 1-on-1 conversations and get your resume reviewed.' },
  { icon: TrendingUp, title: 'Grow Career', description: 'Land internships, jobs, and build a lasting network.' },
]

const HowItWorks = () => {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  })

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
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-border -translate-x-1/2 rounded-full hidden md:block overflow-hidden">
            <motion.div 
              className="absolute top-0 left-0 right-0 bottom-0 bg-primary origin-top rounded-full"
              style={{ scaleY: scrollYProgress }}
            />
          </div>

          <div className="space-y-12 md:space-y-0">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isEven = index % 2 === 0

              return (
                <div key={step.title} className={`relative flex flex-col md:flex-row items-start ${isEven ? 'md:flex-row-reverse' : ''} md:mb-12`}>
                  
                  {/* Timeline Dot */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-background border-4 border-primary items-center justify-center z-10">
                     <span className="text-xs font-bold text-primary">{index + 1}</span>
                  </div>

                  {/* Content Card */}
                  <motion.div 
                    initial={{ opacity: 0, x: isEven ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5 }}
                    className={`md:w-1/2 ${isEven ? 'md:pl-12' : 'md:pr-12'}`}
                  >
                    <div className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow relative">
                       {/* Mobile Step Number */}
                       <div className="md:hidden absolute -top-4 -left-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
                          {index + 1}
                       </div>
                       
                      <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary">
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                      </div>
                      <p className="text-muted-foreground">{step.description}</p>
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
