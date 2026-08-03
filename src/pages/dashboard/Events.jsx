import React, { useState } from 'react'

const Events = () => {
  const [activeTab, setActiveTab] = useState('upcoming')

  const eventsList = [
    {
      id: 1,
      title: 'Alumni Mentorship Meet',
      date: '10 May 2024',
      time: '6:00 PM',
      location: 'Virtual Event',
      registered: 245,
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 2,
      title: 'AI/ML Career Path',
      date: '18 May 2024',
      time: '5:00 PM',
      location: 'Virtual Event',
      registered: 180,
      image: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 3,
      title: 'Web Development Workshop',
      date: '25 May 2024',
      time: '11:00 AM',
      location: 'Seminar Hall, Block A',
      registered: 120,
      image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Events</h1>
        <p className="text-muted-foreground">Discover and register for upcoming events.</p>
      </div>

      <div className="flex items-center gap-6 border-b border-border/40">
        <button 
          onClick={() => setActiveTab('upcoming')}
          className={`pb-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'upcoming' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Upcoming Events
        </button>
        <button 
          onClick={() => setActiveTab('past')}
          className={`pb-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'past' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Past Events
        </button>
      </div>

      <div className="space-y-4 pt-2">
        {activeTab === 'upcoming' ? (
          eventsList.map(event => (
            <div key={event.id} className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="w-full sm:w-32 h-32 sm:h-24 rounded-xl overflow-hidden shrink-0">
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{event.title}</h3>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {event.date} • {event.time}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">{event.location}</p>
                  <p className="text-xs font-medium text-muted-foreground bg-muted inline-block px-2 py-1 rounded border border-border/50">
                    {event.registered} Registered
                  </p>
                </div>
              </div>
              <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm shrink-0 w-full sm:w-auto">
                Register
              </button>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-muted-foreground bg-card border border-border/50 rounded-2xl">
            No past events to show.
          </div>
        )}
        
        {activeTab === 'upcoming' && (
          <div className="pt-4 text-center">
            <button className="text-sm font-medium text-primary hover:underline">
              View All Events
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Events
