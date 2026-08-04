import React, { useState } from 'react'
import { Plus, Trash2, Megaphone, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([
    { id: 1, title: 'New Internship Opportunities', priority: 'High', audience: 'Students', published: 'May 28, 2026', status: 'Published' },
    { id: 2, title: 'Platform Update - May 2026', priority: 'Medium', audience: 'All Users', published: 'May 25, 2026', status: 'Published' },
    { id: 3, title: 'Upcoming Maintenance', priority: 'High', audience: 'All Users', published: 'May 20, 2026', status: 'Published' },
    { id: 4, title: 'Alumni Meet Registration Open', priority: 'Medium', audience: 'Alumni', published: 'May 18, 2026', status: 'Published' },
  ])

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to delete announcement "${title}"?`)) {
      setAnnouncements(announcements.filter(a => a.id !== id))
      toast.success('Announcement removed.')
    }
  }

  const handleCreate = () => {
    const title = prompt('Enter Announcement Title:')
    const priority = prompt('Enter Priority (High, Medium, Low):', 'Medium')
    const audience = prompt('Enter Audience (Students, Alumni, All Users):', 'All Users')
    if (title) {
      setAnnouncements([
        ...announcements,
        { id: announcements.length + 1, title, priority, audience, published: 'Today', status: 'Published' }
      ])
      toast.success('Announcement published!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Announcements</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage targeted system-wide notifications.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 flex items-center gap-2 transition-all shadow-md shadow-primary/10 text-sm self-start sm:self-auto"
        >
          <Plus className="w-4.5 h-4.5" /> New Announcement
        </button>
      </div>

      {/* Announcements Table */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Audience</th>
                <th className="px-6 py-4">Published On</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-sm">
              {announcements.map((a) => (
                <tr key={a.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-primary shrink-0" />
                    {a.title}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      a.priority === 'High' 
                        ? 'bg-rose-500/10 text-rose-500' 
                        : a.priority === 'Medium' 
                        ? 'bg-amber-500/10 text-amber-500' 
                        : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {a.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-foreground font-semibold">{a.audience}</td>
                  <td className="px-6 py-4 text-muted-foreground">{a.published}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500">
                      <Check className="w-3 h-3" /> {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(a.id, a.title)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex items-center justify-center"
                      title="Delete Announcement"
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

export default AdminAnnouncements
