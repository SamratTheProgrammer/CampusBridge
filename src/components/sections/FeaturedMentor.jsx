import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, UserPlus } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import API_BASE from '../../utils/api'

const FeaturedMentor = () => {
  const [mentors, setMentors] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/mentors/all`)
        if (res.ok) {
          const data = await res.json()
          setMentors(data.slice(0, 4))
        }
      } catch (error) {
        console.error('Error fetching mentors:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMentors()
  }, [])

  const handleConnect = (mentorId) => {
    if (!isLoaded || !user) {
      navigate('/login')
      return
    }
    navigate(`/dashboard/mentor/${mentorId}`)
  }

  const handleViewAll = () => {
    if (!isLoaded || !user) {
      navigate('/login')
      return
    }
    navigate('/dashboard/mentor')
  }

  if (isLoading || mentors.length === 0) {
    return null
  }

  return (
    <section className="py-24 bg-muted/20">
      <div className="container max-w-7xl mx-auto px-3 sm:px-8 lg:px-12">
        <div className="flex flex-col items-center text-center mb-12 gap-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Featured Mentor</h2>
            <p className="text-lg text-muted-foreground">
              Connect with mentor who have walked your path and are now working at top companies worldwide.
            </p>
          </div>
          <button onClick={handleViewAll} className="text-primary font-medium hover:underline">
            View All Mentor &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mentors.map((person, index) => {
            const name = person.firstName ? `${person.firstName} ${person.lastName || ''}` : person.username || 'Mentor'
            const role = person.headline || person.position || 'Industry Expert'
            const image = person.imageUrl || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80'
            const tags = person.skills && person.skills.length > 0 ? person.skills.slice(0, 3) : ['Mentorship', 'Career Guidance']
            const experience = person.yearsOfExperience || '3+ years'

            return (
              <motion.div
                key={person._id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 border shadow-sm hover:shadow-lg transition-all"
              >
                <div className="flex flex-col items-center text-center mb-6">
                  <img
                    src={image}
                    alt={name}
                    className="w-24 h-24 rounded-full object-cover mb-4 ring-4 ring-background shadow-md"
                  />
                  <h3 className="text-xl font-bold text-foreground mb-1">{name}</h3>
                  <p className="text-sm font-medium text-primary mb-1">{role} {person.company ? `@ ${person.company}` : ''}</p>
                  <p className="text-xs text-muted-foreground">{experience} exp.</p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {tags.map(tag => (
                    <span key={tag} className="text-[10px] font-medium px-2 py-1 bg-muted text-muted-foreground rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 w-full">
                  <button onClick={() => handleConnect(person._id)} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" /> Connect
                  </button>
                  <button onClick={() => handleConnect(person._id)} className="flex-1 border py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Message
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FeaturedMentor
