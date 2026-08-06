import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, UserPlus, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import ConnectModal from '../modals/ConnectModal'
import MessageAlertModal from '../modals/MessageAlertModal'

const mentorData = [
  {
    id: 1,
    name: 'Arjun Mehta',
    role: 'Software Engineer',
    company: 'Google',
    experience: '5+ years',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    tags: ['React', 'Node.js', 'System Design'],
    connectionState: 'none'
  },
  {
    id: 2,
    name: 'Sneha Roy',
    role: 'Data Scientist',
    company: 'Microsoft',
    experience: '3+ years',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    tags: ['Python', 'ML', 'Data Analysis'],
    connectionState: 'none'
  },
  {
    id: 3,
    name: 'Rohit Sharma',
    role: 'Product Manager',
    company: 'Amazon',
    experience: '4+ years',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    tags: ['Product Strategy', 'Agile', 'SQL'],
    connectionState: 'none'
  },
  {
    id: 4,
    name: 'Priya Singh',
    role: 'UX Designer',
    company: 'Adobe',
    experience: '6+ years',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    tags: ['Figma', 'UI/UX', 'Adobe XD'],
    connectionState: 'none'
  }
]

const FeaturedMentor = () => {
  const navigate = useNavigate()
  const [mentors, setMentors] = useState(mentorData)
  const [activeMentor, setActiveMentor] = useState(null)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [isMessageAlertOpen, setIsMessageAlertOpen] = useState(false)

  const handleConnectClick = (m) => {
    setActiveMentor(m)
    setIsConnectModalOpen(true)
  }

  const handleMessageClick = (m) => {
    if (m.connectionState === 'connected') {
      navigate('/dashboard/messages')
    } else {
      setActiveMentor(m)
      setIsMessageAlertOpen(true)
    }
  }

  const handleSendConnectionRequest = (message) => {
    setMentors(prev => prev.map(m => 
      m.id === activeMentor?.id ? { ...m, connectionState: 'pending' } : m
    ))
    setIsConnectModalOpen(false)
    setIsMessageAlertOpen(false)
    toast.success('Connection request sent successfully!', {
      icon: '🚀',
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    })
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
          <button className="text-primary font-medium hover:underline">
            View All Mentor &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mentors.map((person, index) => (
            <motion.div
              key={person.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card rounded-2xl p-6 border shadow-sm hover:shadow-lg transition-all"
            >
              <div className="flex flex-col items-center text-center mb-6">
                <img 
                  src={person.image} 
                  alt={person.name} 
                  className="w-24 h-24 rounded-full object-cover mb-4 ring-4 ring-background shadow-md"
                />
                <h3 className="text-xl font-bold text-foreground mb-1">{person.name}</h3>
                <p className="text-sm font-medium text-primary mb-1">{person.role} @ {person.company}</p>
                <p className="text-xs text-muted-foreground">{person.experience} exp.</p>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {person.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-medium px-2 py-1 bg-muted text-muted-foreground rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3 w-full">
                {person.connectionState === 'none' && (
                  <button 
                    onClick={() => handleConnectClick(person)}
                    className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> Connect
                  </button>
                )}
                {person.connectionState === 'pending' && (
                  <button 
                    disabled
                    className="flex-1 bg-muted border border-border/50 text-muted-foreground py-2 rounded-lg text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Request Sent
                  </button>
                )}
                {person.connectionState === 'connected' && (
                  <button 
                    onClick={() => navigate('/dashboard/messages')}
                    className="flex-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Connected
                  </button>
                )}
                <button 
                  onClick={() => handleMessageClick(person)}
                  className="flex-1 border py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Message
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <ConnectModal 
        isOpen={isConnectModalOpen} 
        onClose={() => setIsConnectModalOpen(false)} 
        onConnect={handleSendConnectionRequest}
        mentorName={activeMentor?.name}
      />
      <MessageAlertModal 
        isOpen={isMessageAlertOpen} 
        onClose={() => setIsMessageAlertOpen(false)} 
        onConnect={() => handleConnectClick(activeMentor)}
      />
    </section>
  )
}

export default FeaturedMentor
