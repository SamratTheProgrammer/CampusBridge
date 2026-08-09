import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, Calendar, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

const MentorSpotlight = () => {
  const navigate = useNavigate()
  const { user, isLoaded } = useUser()
  const [mentors, setMentors] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const res = await fetch('/api/users/mentors/all')
        if (res.ok) {
          const data = await res.json()
          // Take top 3 mentors
          setMentors(data.slice(0, 3))
        }
      } catch (error) {
        console.error('Error fetching mentors:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMentors()
  }, [])

  if (isLoading || mentors.length === 0) {
    return null; // or a loading skeleton
  }

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
          {mentors.map((mentor, index) => {
            const name = mentor.firstName ? `${mentor.firstName} ${mentor.lastName || ''}` : mentor.username || 'Mentor'
            const role = mentor.headline || mentor.position || 'Industry Expert'
            const image = mentor.imageUrl || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80'
            const tags = mentor.skills && mentor.skills.length > 0 ? mentor.skills.slice(0, 2) : ['Mentorship', 'Career Guidance']
            const rating = 4.9
            const reviews = Math.floor(Math.random() * 50) + 10
            const studentsMentored = Math.floor(Math.random() * 100) + 20
            const sessionsCount = Math.floor(Math.random() * 200) + 50

            return (
              <motion.div
                key={mentor._id || index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="flex items-start gap-4 mb-6">
                  <img 
                    src={image} 
                    alt={name} 
                    className="w-16 h-16 rounded-xl object-cover ring-2 ring-primary/20"
                  />
                  <div>
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{role}</p>
                    <div className="flex items-center gap-1 mt-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium text-foreground">{rating}</span>
                      <span className="text-xs text-muted-foreground">({reviews} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mb-6">
                  {tags.map(tag => (
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
                    <p className="font-bold text-lg text-foreground">{studentsMentored}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Sessions</span>
                    </div>
                    <p className="font-bold text-lg text-foreground">{sessionsCount}</p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (!isLoaded || !user) {
                      navigate('/login')
                      return
                    }
                    navigate(`/dashboard/mentor/${mentor._id}`)
                  }}
                  className="w-full bg-foreground text-background py-3 rounded-xl font-medium hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
                >
                  Book Session
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default MentorSpotlight
