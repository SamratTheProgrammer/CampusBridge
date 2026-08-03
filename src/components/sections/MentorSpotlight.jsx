import React from 'react'
import { motion } from 'framer-motion'
import { Star, Calendar, Users } from 'lucide-react'

const mentors = [
  {
    name: 'Sarah Chen',
    role: 'Senior Product Manager @ Stripe',
    rating: 4.9,
    reviews: 124,
    studentsMentored: 45,
    sessions: 180,
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    tags: ['Product Strategy', 'Interview Prep']
  },
  {
    name: 'David Kumar',
    role: 'Staff Software Engineer @ Netflix',
    rating: 5.0,
    reviews: 89,
    studentsMentored: 32,
    sessions: 140,
    image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    tags: ['System Design', 'React']
  },
  {
    name: 'Emily Davis',
    role: 'Lead UX Designer @ Airbnb',
    rating: 4.8,
    reviews: 210,
    studentsMentored: 88,
    sessions: 320,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    tags: ['Portfolio Review', 'Figma']
  }
]

const MentorSpotlight = () => {
  return (
    <section className="py-24">
      <div className="container max-w-7xl mx-auto px-3 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Mentor Spotlight</h2>
          <p className="text-lg text-muted-foreground">
            Learn from the best. Our top-rated mentors have helped hundreds of students land their dream roles.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mentors.map((mentor, index) => (
            <motion.div
              key={mentor.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex items-start gap-4 mb-6">
                <img 
                  src={mentor.image} 
                  alt={mentor.name} 
                  className="w-16 h-16 rounded-xl object-cover ring-2 ring-primary/20"
                />
                <div>
                  <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{mentor.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{mentor.role}</p>
                  <div className="flex items-center gap-1 mt-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium text-foreground">{mentor.rating}</span>
                    <span className="text-xs text-muted-foreground">({mentor.reviews} reviews)</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mb-6">
                {mentor.tags.map(tag => (
                  <span key={tag} className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-y">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Students</span>
                  </div>
                  <p className="font-bold text-lg text-foreground">{mentor.studentsMentored}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Sessions</span>
                  </div>
                  <p className="font-bold text-lg text-foreground">{mentor.sessions}</p>
                </div>
              </div>

              <button className="w-full bg-foreground text-background py-3 rounded-xl font-medium hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm">
                Book Session
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default MentorSpotlight
