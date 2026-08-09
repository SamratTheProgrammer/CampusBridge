import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, User, Calendar, MessageSquare, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

const MOCK_REQUESTS = {
  pending: [
    {
      id: 1,
      name: 'Amit Kumar',
      course: 'B.Tech CS',
      university: 'NIT Trichy',
      interest: 'Frontend Development',
      message: 'Hi Rohit, I am very interested in frontend engineering and would love to get your guidance on building a strong portfolio for FAANG internships.',
      image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      date: '2 hours ago'
    },
    {
      id: 2,
      name: 'Sneha Gupta',
      course: 'MCA',
      university: 'Delhi University',
      interest: 'Cloud Computing',
      message: 'I am starting my journey in AWS and cloud architecture. Your posts have been very inspiring. I would be grateful for your mentorship.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      date: '1 day ago'
    }
  ],
  accepted: [
    {
      id: 3,
      name: 'Ananya Sharma',
      course: 'B.Tech CS',
      university: 'NIT Trichy',
      interest: 'System Design',
      message: 'Looking for guidance on scalable architectures.',
      image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      date: '3 weeks ago'
    }
  ],
  declined: [
    {
      id: 4,
      name: 'Vikas Singh',
      course: 'B.E. Mechanical',
      university: 'VIT Vellore',
      interest: 'Web3 & Crypto',
      message: 'I want to build a decentralized application on Ethereum.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      date: '1 month ago'
    }
  ]
}

const MentorshipRequests = () => {
  const [activeTab, setActiveTab] = useState('pending')
  const [requests, setRequests] = useState(MOCK_REQUESTS)

  const handleAction = (id, action) => {
    toast.success(`Request ${action === 'accept' ? 'accepted' : 'declined'} successfully!`)
    // In a real app, this would make an API call and update state.
    // For mock UI, we will just filter it out from pending.
    if (activeTab === 'pending') {
      const updatedPending = requests.pending.filter(req => req.id !== id)
      setRequests({ ...requests, pending: updatedPending })
    }
  }

  const currentList = requests[activeTab]

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mentorship Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and manage students asking for your guidance.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-xl w-full sm:w-fit">
        {['pending', 'accepted', 'declined'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 sm:flex-none sm:px-6 py-2.5 text-sm font-medium rounded-lg capitalize transition-all ${activeTab === tab
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {tab}
            {tab === 'pending' && requests.pending.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full">
                {requests.pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Request List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {currentList.map((req) => (
            <motion.div
              key={req.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-card border border-border/50 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row gap-5 items-start">

                {/* Photo & Basic Info */}
                <div className="flex items-center gap-4 sm:w-64 shrink-0">
                  <img src={req.image} alt={req.name} className="w-14 h-14 rounded-full object-cover border-2 border-border" />
                  <div>
                    <h3 className="font-bold text-foreground">{req.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{req.course}</p>
                    <p className="text-[10px] font-medium text-primary uppercase tracking-wider mt-1">{req.university}</p>
                  </div>
                </div>

                {/* Details & Actions */}
                <div className="flex-1 w-full space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold bg-muted px-2 py-1 rounded-md text-foreground flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> Interest: {req.interest}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {req.date}
                      </span>
                    </div>
                    <div className="text-sm text-foreground/80 leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/40">
                      "{req.message}"
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {activeTab === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(req.id, 'accept')}
                          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-sm"
                        >
                          <Check className="w-4 h-4" /> Accept Request
                        </button>
                        <button
                          onClick={() => handleAction(req.id, 'decline')}
                          className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-all"
                        >
                          <X className="w-4 h-4" /> Decline
                        </button>
                      </>
                    )}

                    <button className="flex items-center gap-2 bg-background border border-border/50 text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-all">
                      <User className="w-4 h-4" /> View Profile
                    </button>

                    {activeTab === 'accepted' && (
                      <button className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-all ml-auto">
                        <MessageSquare className="w-4 h-4" /> Send Message
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {currentList.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No {activeTab} requests</h3>
            <p className="text-sm text-muted-foreground mt-1">You're all caught up for now.</p>
          </div>
        )}
      </div>

    </div>
  )
}

export default MentorshipRequests

