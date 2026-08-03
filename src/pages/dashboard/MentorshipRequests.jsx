import React, { useState } from 'react'

const MentorshipRequests = () => {
  const [activeTab, setActiveTab] = useState('received')

  const receivedRequests = [
    {
      id: 1,
      name: 'Rahul Kumar',
      role: 'BCA Student',
      message: "I'm looking for guidance in Full Stack Development and career growth.",
      time: '2 days ago',
      image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 2,
      name: 'Pooja Verma',
      role: 'MCA Student',
      message: 'Need help in Data Structures and System Design.',
      time: '3 days ago',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 3,
      name: 'Ankit Singh',
      role: 'B.Tech Student',
      message: 'Would like to learn about Cloud and DevOps.',
      time: '5 days ago',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 4,
      name: 'Neha Patel',
      role: 'MCA Student',
      message: 'Guidance for AI/ML and career path.',
      time: '1 week ago',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
    }
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Mentorship</h1>
        <p className="text-muted-foreground">Manage your mentorship requests and connections.</p>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-6 px-6 border-b border-border/40">
          <button 
            onClick={() => setActiveTab('received')}
            className={`py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'received' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Received Requests
          </button>
          <button 
            onClick={() => setActiveTab('sent')}
            className={`py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'sent' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Sent Requests
          </button>
        </div>

        {/* Requests List */}
        <div className="p-6 space-y-4">
          {activeTab === 'received' ? (
            receivedRequests.map(request => (
              <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border/40 rounded-xl hover:border-border transition-colors">
                <div className="flex items-start gap-4">
                  <img src={request.image} alt={request.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{request.name}</h3>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{request.role}</p>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-2">{request.message}</p>
                    <p className="text-[10px] text-muted-foreground">{request.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                    Accept
                  </button>
                  <button className="bg-transparent border border-border/50 text-foreground hover:bg-muted px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                    Decline
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No sent requests found.
            </div>
          )}
          
          {activeTab === 'received' && (
            <div className="pt-4 text-center">
              <button className="text-sm font-medium text-primary hover:underline">
                View All Requests
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MentorshipRequests
