import React, { useState } from 'react'

const MentorshipRequests = () => {
  const [activeTab, setActiveTab] = useState('received')
  const [receivedRequests, setReceivedRequests] = useState([])

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-8">
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
            receivedRequests.length > 0 ? (
              receivedRequests.map(request => (
                <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border/40 rounded-xl hover:border-border transition-colors">
                  <div className="flex items-start gap-4">
                    <img src={request.image} alt={request.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{request.name}</h3>
                      <p className="text-xs font-medium text-muted-foreground mb-2 capitalize">{request.role}</p>
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
                No received requests found.
              </div>
            )
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No sent requests found.
            </div>
          )}

          {activeTab === 'received' && receivedRequests.length > 0 && (
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
