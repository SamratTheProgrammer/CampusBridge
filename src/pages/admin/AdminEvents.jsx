import React, { useState } from 'react'
import { Plus, Trash2, Edit3, CheckCircle, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminEvents = () => {
  const [events, setEvents] = useState([
    { id: 1, name: 'AI & ML Workshop', date: 'Jun 10, 2026', registrations: 324, status: 'Upcoming' },
    { id: 2, name: 'Career Fair 2026', date: 'Jun 18, 2026', registrations: 642, status: 'Upcoming' },
    { id: 3, name: 'Web Dev Hackathon', date: 'Jun 25, 2026', registrations: 512, status: 'Upcoming' },
    { id: 4, name: 'Mentor Meet 2026', date: 'Jul 05, 2026', registrations: 276, status: 'Upcoming' },
    { id: 5, name: 'Cloud Computing Webinar', date: 'Jul 12, 2026', registrations: 198, status: 'Upcoming' },
  ])

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to cancel event "${name}"?`)) {
      setEvents(events.filter(e => e.id !== id))
      toast.success('Event cancelled successfully.')
    }
  }

  const handleCreateEvent = () => {
    const name = prompt('Enter Event Name:')
    const date = prompt('Enter Event Date (e.g. Jun 28, 2026):')
    if (name && date) {
      setEvents([
        ...events,
        { id: events.length + 1, name, date, registrations: 0, status: 'Upcoming' }
      ])
      toast.success('Event created!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Events Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Create, edit, and coordinate campus wide and virtual events.</p>
        </div>
        <button 
          onClick={handleCreateEvent}
          className="bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 flex items-center gap-2 transition-all shadow-md shadow-primary/10 text-sm self-start sm:self-auto"
        >
          <Plus className="w-4.5 h-4.5" /> Create Event
        </button>
      </div>

      {/* Events Table */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4">Event</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Registrations</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-sm">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    {event.name}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{event.date}</td>
                  <td className="px-6 py-4 text-foreground font-semibold">{event.registrations}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button 
                      onClick={() => {
                        const newName = prompt('Edit Event Name:', event.name)
                        if (newName) {
                          setEvents(events.map(e => e.id === event.id ? { ...e, name: newName } : e))
                          toast.success('Event details updated.')
                        }
                      }}
                      className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors inline-flex items-center justify-center"
                      title="Edit Event"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(event.id, event.name)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex items-center justify-center"
                      title="Cancel Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminEvents
