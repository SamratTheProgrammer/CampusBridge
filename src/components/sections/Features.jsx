import React from 'react'
import { GraduationCap, Users, Briefcase, Calendar, MessageSquare, Globe } from 'lucide-react'
import { motion } from 'framer-motion'

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay }}
    className="group p-8 rounded-2xl bg-card border hover:border-primary/50 transition-colors shadow-sm hover:shadow-lg relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-bold mb-3 text-foreground">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">
      {description}
    </p>
  </motion.div>
)

const Features = () => {
  const features = [
    {
      icon: GraduationCap,
      title: 'Mentor Network',
      description: 'Connect with successful mentor from your institution. Build a powerful professional network that lasts a lifetime.',
    },
    {
      icon: Users,
      title: 'Mentorship',
      description: 'Find experienced mentors who can guide you through your career journey, review your resume, and prepare you for interviews.',
    },
    {
      icon: Briefcase,
      title: 'Jobs & Internships',
      description: 'Access exclusive job postings and internship opportunities shared directly by mentor working in top tech companies.',
    },
    {
      icon: Calendar,
      title: 'Events & Workshops',
      description: 'Participate in skill-building workshops, networking events, and virtual seminars hosted by industry experts.',
    },
    {
      icon: MessageSquare,
      title: 'Real-time Chat',
      description: 'Communicate instantly with peers and mentors. Join group discussions and get your questions answered quickly.',
    },
    {
      icon: Globe,
      title: 'Global Community',
      description: 'Join specialized communities based on your interests like Web Dev, AI, Cloud, and collaborate on exciting projects.',
    },
  ]

  return (
    <section className="py-24 bg-muted/20">
      <div className="container max-w-7xl mx-auto px-3 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Why Choose CampusBridge?</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to launch and accelerate your career, all in one powerful platform designed specifically for students and alumni and mentor.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={feature.title} 
              {...feature} 
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
