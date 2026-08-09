import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Video, XCircle, MoreVertical, CheckCircle2 } from 'lucide-react'

// Mock Data
const MOCK_SESSIONS = [
  {
    id: 1,
    mentorName: 'Arjun Mehta',
    mentorRole: 'Software Engineer at Google',
    mentorImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&w=250&q=80',
    type: 'Career Guidance',
    date: '2023-11-15',
    time: '10:00 AM',
    duration: 45,
    status: 'upcoming'
  },
  {
    id: 2,
    mentorName: 'Sneha Roy',
    mentorRole: 'Data Scientist at Microsoft',
    mentorImage: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    type: 'Resume Review',
    date: '2023-11-18',
    time: '02:30 PM',
    duration: 30,
    status: 'pending'
  },
  {
    id: 3,
    mentorName: 'Karan Verma',
    mentorRole: 'Cloud Engineer at AWS',
    mentorImage: 'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    type: 'Mock Interview',
    date: '2023-10-25',
    time: '11:00 AM',
    duration: 60,
    status: 'completed'
  }
]

const MySessions = () => {
  const [activeTab, setActiveTab] = useState('upcoming')

  const filteredSessions = MOCK_SESSIONS.filter(s => s.status === activeTab)

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Sessions</h1>
        <p className="text-muted-foreground">Manage your mentorship sessions and requests.</p>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="flex overflow-x-auto hide-scrollbar border-b border-border/40">
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors relative
              ${activeTab === 'upcoming' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Upcoming Sessions
            {activeTab === 'upcoming' && (
              <motion.div layoutId="sessionTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors relative
              ${activeTab === 'pending' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Pending Requests
            {activeTab === 'pending' && (
              <motion.div layoutId="sessionTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors relative
              ${activeTab === 'completed' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Completed
            {activeTab === 'completed' && (
              <motion.div layoutId="sessionTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <motion.div 
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:border-primary/50 transition-colors flex flex-col md:flex-row gap-6 md:items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <img src={session.mentorImage} alt={session.mentorName} className="w-14 h-14 rounded-full object-cover ring-2 ring-muted" />
                <div>
                  <h3 className="font-bold text-foreground text-lg">{session.type}</h3>
                  <p className="text-sm font-medium text-foreground mb-1">with {session.mentorName}</p>
                  <p className="text-xs text-muted-foreground">{session.mentorRole}</p>
                </div>
              </div>

              <div className="flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-8 bg-muted/30 p-3 rounded-xl border border-border/40">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{session.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{session.duration}m</span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t border-border/40 md:border-none">
                {activeTab === 'upcoming' && (
                  <>
                    <button className="flex-1 md:flex-none bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm">
                      Join Call
                    </button>
                    <button className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground border border-border/50 transition-colors" title="Cancel Session">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                )}
                
                {activeTab === 'pending' && (
                  <button className="flex-1 md:flex-none bg-background border border-destructive/50 text-destructive hover:bg-destructive/10 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors">
                    Cancel Request
                  </button>
                )}

                {activeTab === 'completed' && (
                  <button className="flex-1 md:flex-none bg-background border border-border/50 text-foreground hover:bg-muted px-5 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Write Review
                  </button>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-foreground mb-2">No {activeTab} sessions</h3>
            <p className="text-muted-foreground">You don't have any {activeTab} mentorship sessions at the moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MySessions
