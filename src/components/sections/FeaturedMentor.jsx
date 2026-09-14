import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, UserPlus, CheckCircle, ChevronLeft, ChevronRight, Clock, Loader2, X } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import API_BASE from '../../utils/api'

const sampleMentors = [
  {
    _id: 'sample-1',
    clerkId: 'sample-mentor-1',
    username: 'rohit-sharma',
    firstName: 'Rohit',
    lastName: 'Sharma',
    headline: 'Senior Software Engineer',
    company: 'Google',
    yearsOfExperience: '6+ years',
    skills: ['System Design', 'React', 'Cloud Architecture'],
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
  },
  {
    _id: 'sample-2',
    clerkId: 'sample-mentor-2',
    username: 'priya-patel',
    firstName: 'Priya',
    lastName: 'Patel',
    headline: 'Staff Product Manager',
    company: 'Microsoft',
    yearsOfExperience: '5+ years',
    skills: ['Product Strategy', 'UI/UX', 'Agile Leadership'],
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
  },
  {
    _id: 'sample-3',
    clerkId: 'sample-mentor-3',
    username: 'ananya-verma',
    firstName: 'Ananya',
    lastName: 'Verma',
    headline: 'Lead AI & ML Scientist',
    company: 'Amazon',
    yearsOfExperience: '4+ years',
    skills: ['Machine Learning', 'Python', 'GenAI'],
    imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
  },
  {
    _id: 'sample-4',
    clerkId: 'sample-mentor-4',
    username: 'vikram-aditya',
    firstName: 'Vikram',
    lastName: 'Aditya',
    headline: 'Full Stack Tech Lead',
    company: 'Uber',
    yearsOfExperience: '7+ years',
    skills: ['Node.js', 'Distributed Systems', 'DevOps'],
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
  }
]

const FeaturedMentor = () => {
  const [mentors, setMentors] = useState(sampleMentors)
  const [connections, setConnections] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()
  const carouselRef = useRef(null)
  const [isConnecting, setIsConnecting] = useState(null)

  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftPos, setScrollLeftPos] = useState(0)

  const userRole = sessionStorage.getItem('campusbridge_user_role') || user?.publicMetadata?.role || user?.unsafeMetadata?.role || 'student'

  useEffect(() => {
    const fetchMentorsAndConnections = async () => {
      try {
        const [mentorsRes, connsRes] = await Promise.all([
          fetch(`${API_BASE}/api/users/mentors/all`),
          user ? fetch(`${API_BASE}/api/connections/user/${user.id}`) : Promise.resolve({ ok: false })
        ])

        let allMentors = []
        if (mentorsRes.ok) {
          const data = await mentorsRes.json()
          if (Array.isArray(data) && data.length > 0) {
            allMentors = data
          }
        }

        if (allMentors.length === 0) {
          allMentors = sampleMentors
        }

        let connMap = {}
        if (connsRes.ok) {
          const connsData = await connsRes.json()
          if (Array.isArray(connsData)) {
            connsData.forEach(c => {
              if (c.requesterClerkId === user?.id) connMap[c.recipientClerkId] = c.status
              else if (c.recipientClerkId === user?.id) connMap[c.requesterClerkId] = c.status
            })
            setConnections(connMap)
          }
        }

        // Sort: prioritize not connected (new) mentors first
        allMentors.sort((a, b) => {
          const idA = a.clerkId || a._id
          const idB = b.clerkId || b._id
          const statusA = connMap[idA] || null
          const statusB = connMap[idB] || null
          
          if (statusA && !statusB) return 1
          if (!statusA && statusB) return -1
          return 0
        })

        setMentors(allMentors)
      } catch (error) {
        console.error('Error fetching mentors:', error)
        setMentors(sampleMentors)
      } finally {
        setIsLoading(false)
      }
    }
    
    // Run when clerk auth finishes loading
    if (isLoaded) {
      fetchMentorsAndConnections()
    }
  }, [user, isLoaded])

  const handleConnect = async (mentor) => {
    if (!isLoaded || !user) {
      navigate('/login', { state: { from: { pathname: '/#mentor' } } })
      return
    }

    const mentorId = mentor.clerkId || mentor._id
    if (!mentorId) return

    // If it's a sample mentor, show friendly success feedback
    if (mentorId.startsWith('sample-')) {
      toast.success(`Connection request sent to ${mentor.firstName || 'Mentor'}!`)
      setConnections(prev => ({ ...prev, [mentorId]: 'pending' }))
      return
    }

    setIsConnecting(mentorId)
    try {
      const res = await fetch(`${API_BASE}/api/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterClerkId: user.id,
          recipientClerkId: mentorId,
          message: 'Hi, I would like to connect with you on CampusBridge.'
        })
      })

      if (res.ok) {
        setConnections(prev => ({ ...prev, [mentorId]: 'pending' }))
        toast.success(`Connection request sent to ${mentor.firstName || 'Mentor'}!`)
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.message || 'Failed to send connection request')
      }
    } catch (err) {
      toast.error('Network error. Please try again.')
    } finally {
      setIsConnecting(null)
    }
  }

  const handleViewProfile = (mentor) => {
    const identifier = mentor.username || mentor.clerkId || mentor._id
    navigate(`/profile/${identifier}`)
  }

  const handleUnsendRequest = async (mentorId) => {
    if (!user) return

    if (mentorId.startsWith('sample-')) {
      toast.success('Connection request cancelled')
      setConnections(prev => {
        const next = { ...prev }
        delete next[mentorId]
        return next
      })
      return
    }

    setIsConnecting(mentorId)
    try {
      const res = await fetch(`${API_BASE}/api/connections/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterClerkId: user.id,
          recipientClerkId: mentorId
        })
      })
      if (res.ok) {
        toast.success('Connection request cancelled')
        setConnections(prev => {
          const next = { ...prev }
          delete next[mentorId]
          return next
        })
      } else {
        const errorData = await res.json().catch(() => ({}))
        toast.error(errorData.message || 'Failed to cancel request')
      }
    } catch (err) {
      toast.error('Network error')
    } finally {
      setIsConnecting(null)
    }
  }

  const handleViewAll = () => {
    if (!isLoaded || !user) {
      navigate('/login', { state: { from: { pathname: '/dashboard/mentor' } } })
      return
    }
    if (userRole === 'mentor') {
      navigate('/mentor-dashboard/mentor')
    } else {
      navigate('/dashboard/mentor')
    }
  }

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -320, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' })
    }
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setStartX(e.pageX - carouselRef.current.offsetLeft)
    setScrollLeftPos(carouselRef.current.scrollLeft)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - carouselRef.current.offsetLeft
    const walk = (x - startX) * 2
    carouselRef.current.scrollLeft = scrollLeftPos - walk
  }

  return (
    <section className="py-24 bg-muted/20">
      <div className="container max-w-7xl mx-auto px-3 sm:px-8 lg:px-12">
        <div className="flex flex-col items-center text-center mb-12 gap-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Featured Mentors</h2>
            <p className="text-lg text-muted-foreground">
              Connect with mentors who have walked your path and are now working at top companies worldwide.
            </p>
          </div>
          <button onClick={handleViewAll} className="text-primary font-medium hover:underline">
            View All Mentors &rarr;
          </button>
        </div>

        <div className="relative group max-w-7xl mx-auto">
          {/* Left Arrow */}
          <button 
            onClick={scrollLeft} 
            className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-10 bg-background border shadow-md w-12 h-12 rounded-full flex items-center justify-center text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 hidden md:flex"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          {/* Right Arrow */}
          <button 
            onClick={scrollRight} 
            className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-10 bg-background border shadow-md w-12 h-12 rounded-full flex items-center justify-center text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Carousel Container */}
          <div 
            ref={carouselRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`flex overflow-x-auto gap-6 pb-6 px-2 snap-x snap-mandatory ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} no-scrollbar`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {mentors.map((person, index) => {
              const name = person.firstName ? `${person.firstName} ${person.lastName || ''}`.trim() : person.username || 'Mentor'
              const role = person.headline || person.position || 'Industry Expert'
              const image = person.imageUrl || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80'
              const tags = person.skills && person.skills.length > 0 ? person.skills.slice(0, 3) : ['Mentorship', 'Career Guidance']
              const experience = person.yearsOfExperience || '3+ years'
              
              const mentorId = person.clerkId || person._id
              const connStatus = connections[mentorId]
              const isConnected = connStatus === 'accepted'
              const isPending = connStatus === 'pending'

              return (
                <motion.div
                  key={person._id || mentorId || index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="bg-card rounded-2xl p-6 border shadow-sm hover:shadow-lg transition-all min-w-[280px] w-[280px] sm:min-w-[300px] sm:w-[300px] shrink-0 snap-center select-none"
                >
                  <div className="flex flex-col items-center text-center mb-6">
                    <img
                      src={image}
                      alt={name}
                      draggable="false"
                      className="w-24 h-24 rounded-full object-cover mb-4 ring-4 ring-background shadow-md pointer-events-none"
                    />
                    <h3 className="text-xl font-bold text-foreground mb-1 truncate max-w-[240px]">{name}</h3>
                    <p className="text-sm font-medium text-primary mb-1 truncate max-w-[240px]">{role} {person.company ? `@ ${person.company}` : ''}</p>
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
                    {isConnected ? (
                      <button disabled className="flex-1 bg-green-500/10 text-green-600 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-default">
                        <CheckCircle className="w-4 h-4" /> Connected
                      </button>
                    ) : isPending ? (
                      <button 
                        onClick={() => handleUnsendRequest(mentorId)}
                        disabled={isConnecting === mentorId}
                        className="group flex-1 bg-muted/50 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        {isConnecting === mentorId ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span className="hidden sm:flex sm:group-hover:hidden items-center gap-1.5"><Clock className="w-4 h-4" /> Pending</span><span className="flex sm:hidden sm:group-hover:flex items-center gap-1.5"><X className="w-4 h-4" /> Unsend</span></>}
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleConnect(person)}
                        disabled={isConnecting === mentorId}
                        className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                      >
                        {isConnecting === mentorId ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Connect</>}
                      </button>
                    )}
                    <button 
                      onClick={() => handleViewProfile(person)} 
                      className="flex-1 border py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" /> View
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
        
        {/* CSS for hiding scrollbar */}
        <style dangerouslySetInnerHTML={{__html: `
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}} />
      </div>
    </section>
  )
}

export default FeaturedMentor
