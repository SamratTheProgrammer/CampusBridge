import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, Calendar, Users, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import API_BASE from '../../utils/api'

const fallbackSpotlightMentors = [
  {
    _id: 'spotlight-1',
    clerkId: 'spotlight-mentor-1',
    username: 'rohit-sharma',
    firstName: 'Rohit',
    lastName: 'Sharma',
    headline: 'Senior Software Engineer at Google',
    skills: ['System Design', 'React', 'Cloud'],
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
  },
  {
    _id: 'spotlight-2',
    clerkId: 'spotlight-mentor-2',
    username: 'priya-patel',
    firstName: 'Priya',
    lastName: 'Patel',
    headline: 'Staff Product Manager at Microsoft',
    skills: ['Product Strategy', 'UI/UX', 'Leadership'],
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
  },
  {
    _id: 'spotlight-3',
    clerkId: 'spotlight-mentor-3',
    username: 'ananya-verma',
    firstName: 'Ananya',
    lastName: 'Verma',
    headline: 'Lead AI & ML Scientist at Amazon',
    skills: ['Machine Learning', 'Python', 'GenAI'],
    imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
  }
]

const MentorCard = ({ mentor, index, isLoaded, user, navigate }) => {
  const [stats, setStats] = useState({ rating: 4.9, reviews: 34, students: 28, sessions: 42, loading: true })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const clerkId = mentor.clerkId || mentor._id
        if (!clerkId || clerkId.startsWith('spotlight-')) {
          setStats({ rating: 4.9, reviews: 38, students: 32, sessions: 45, loading: false })
          return
        }

        const [reviewsRes, connectionsRes, sessionsRes] = await Promise.all([
          fetch(`${API_BASE}/api/reviews/mentor/${clerkId}`),
          fetch(`${API_BASE}/api/connections/user/${clerkId}`),
          fetch(`${API_BASE}/api/sessions/user/${clerkId}`)
        ])

        let rating = 4.9
        let reviewsCount = 24
        if (reviewsRes.ok) {
          const revData = await reviewsRes.json()
          if (revData.averageRating > 0) rating = revData.averageRating
          if (revData.totalRatings !== undefined) reviewsCount = revData.totalRatings
        }

        let studentsCount = 18
        if (connectionsRes.ok) {
          const connData = await connectionsRes.json()
          if (Array.isArray(connData)) {
            const accepted = connData.filter(c => c.status === 'accepted').length
            if (accepted > 0) studentsCount = accepted
          }
        }

        let sessionsCount = 25
        if (sessionsRes.ok) {
          const sessData = await sessionsRes.json()
          if (Array.isArray(sessData)) {
            const booked = sessData.filter(s => s.status === 'completed' || s.status === 'accepted' || s.status === 'upcoming').length
            if (booked > 0) sessionsCount = booked
          }
        }

        setStats({ rating, reviews: reviewsCount, students: studentsCount, sessions: sessionsCount, loading: false })
      } catch (err) {
        setStats({ rating: 4.9, reviews: 24, students: 18, sessions: 25, loading: false })
      }
    }
    fetchStats()
  }, [mentor.clerkId, mentor._id])

  const name = mentor.firstName ? `${mentor.firstName} ${mentor.lastName || ''}`.trim() : mentor.username || 'Mentor'
  const role = mentor.headline || mentor.position || 'Industry Expert'
  const image = mentor.imageUrl || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80'
  const tags = mentor.skills && mentor.skills.length > 0 ? mentor.skills.slice(0, 2) : ['Mentorship', 'Career Guidance']

  const handleBookSession = () => {
    const mentorTarget = mentor.clerkId || mentor.username || mentor._id
    const userRole = sessionStorage.getItem('campusbridge_user_role') || user?.publicMetadata?.role || 'student'

    if (!isLoaded || !user) {
      navigate('/login', { 
        state: { from: { pathname: `/dashboard/mentor/${mentorTarget}/book` } } 
      })
      return
    }

    if (userRole === 'mentor') {
      navigate(`/mentor-dashboard/mentor/${mentorTarget}/book`)
    } else {
      navigate(`/dashboard/mentor/${mentorTarget}/book`)
    }
  }

  const handleViewProfile = () => {
    const identifier = mentor.username || mentor.clerkId || mentor._id
    navigate(`/profile/${identifier}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between"
    >
      <div>
        <div 
          onClick={handleViewProfile}
          className="flex items-start gap-4 mb-6 cursor-pointer"
        >
          <img 
            src={image} 
            alt={name} 
            className="w-16 h-16 rounded-xl object-cover ring-2 ring-primary/20 group-hover:ring-primary transition-all shrink-0"
          />
          <div className="overflow-hidden">
            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">{name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{role}</p>
            <div className="flex items-center gap-1 mt-1 text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              {stats.loading ? (
                <Loader2 className="w-3 h-3 animate-spin ml-1" />
              ) : (
                <>
                  <span className="text-sm font-medium text-foreground">{stats.rating}</span>
                  <span className="text-xs text-muted-foreground">({stats.reviews} reviews)</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
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
            <p className="font-bold text-lg text-foreground">
              {stats.loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto mt-1" /> : stats.students}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Sessions</span>
            </div>
            <p className="font-bold text-lg text-foreground">
              {stats.loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto mt-1" /> : stats.sessions}
            </p>
          </div>
        </div>
      </div>

      <button 
        onClick={handleBookSession}
        className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
      >
        <Calendar className="w-4 h-4" /> Book Session
      </button>
    </motion.div>
  )
}

const MentorSpotlight = () => {
  const navigate = useNavigate()
  const { user, isLoaded } = useUser()
  const [mentors, setMentors] = useState(fallbackSpotlightMentors)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/mentors/all`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setMentors(data.slice(0, 3))
          } else {
            setMentors(fallbackSpotlightMentors)
          }
        }
      } catch (error) {
        console.error('Error fetching mentors:', error)
        setMentors(fallbackSpotlightMentors)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMentors()
  }, [])

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
            <MentorCard 
              key={mentor._id || index} 
              mentor={mentor} 
              index={index} 
              isLoaded={isLoaded} 
              user={user} 
              navigate={navigate} 
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default MentorSpotlight
