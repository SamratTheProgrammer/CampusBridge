import React, { useState } from 'react'
import { Plus, Trash2, Bell, Check, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Career Fair Alert', audience: 'Students', type: 'In-App', sent: 'May 28, 2026', status: 'Sent' },
    { id: 2, title: 'AI Workshop Reminder', audience: 'All Users', type: 'Email', sent: 'May 27, 2026', status: 'Sent' },
    { id: 3, title: 'New Job Opportunities', audience: 'Alumni', type: 'In-App', sent: 'May 26, 2026', status: 'Sent' },
    { id: 4, title: 'Platform Maintenance', audience: 'All Users', type: 'In-App', sent: 'May 25, 2026', status: 'Scheduled' },
    { id: 5, title: 'Mentorship Program Update', audience: 'Students', type: 'Email', sent: 'May 24, 2026', status: 'Sent' },
  ])

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to delete notification "${title}"?`)) {
      setNotifications(notifications.filter(n => n.id !== id))
      toast.success('Notification removed.')
    }
  }

  const handleCreate = () => {
    const title = prompt('Enter Notification Title:')
    const audience = prompt('Enter Target Audience (Students, Alumni, All Users):', 'All Users')
    const type = prompt('Enter Delivery Type (In-App, Email):', 'In-App')
    if (title) {
      setNotifications([
        ...notifications,
        { id: notifications.length + 1, title, audience, type, sent: 'Today', status: 'Sent' }
      ])
      toast.success('Notification sent!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Send, schedule, and review system announcements and user broadcasts.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 flex items-center gap-2 transition-all shadow-md shadow-primary/10 text-sm self-start sm:self-auto"
        >
          <Plus className="w-4.5 h-4.5" /> New Notification
        </button>
      </div>

      {/* Notifications Table */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Audience</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Sent On</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-sm">
              {notifications.map((n) => (
                <tr key={n.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary shrink-0" />
                    {n.title}
                  </td>
                  <td className="px-6 py-4 text-foreground">{n.audience}</td>
                  <td className="px-6 py-4 text-muted-foreground font-medium">{n.type}</td>
                  <td className="px-6 py-4 text-muted-foreground">{n.sent}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      n.status === 'Sent' 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {n.status === 'Sent' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {n.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(n.id, n.title)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex items-center justify-center"
                      title="Delete Notification"
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

export default AdminNotifications
