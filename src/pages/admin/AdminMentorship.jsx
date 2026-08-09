import React, { useState } from 'react'
import { Plus, Trash2, HelpingHand, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/modals/ConfirmModal'

const AdminMentorship = () => {
  const [mentors, setMentors] = useState([
    { id: 1, name: 'Rohit Sharma', company: 'Amazon', role: 'Product Manager', rating: 4.9, activeMentees: 12 },
    { id: 2, name: 'Priya Singh', company: 'Adobe', role: 'UX Designer', rating: 4.8, activeMentees: 8 },
    { id: 3, name: 'Arjun Mehta', company: 'Google', role: 'Software Engineer', rating: 5.0, activeMentees: 15 },
  ])

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const confirmDelete = (id, name) => {
    setDeleteTarget({ id, name })
    setIsConfirmOpen(true)
  }

  const handleDelete = () => {
    if (!deleteTarget) return;
    setMentors(mentors.filter(m => m.id !== deleteTarget.id))
    toast.success('Mentor profile removed.')
    setIsConfirmOpen(false)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Mentorship Program</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and manage verified platform mentors and mentorship engagement rates.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentors.map((mentor) => (
          <div key={mentor.id} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <HelpingHand className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => confirmDelete(mentor.id, mentor.name)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-current" /> {mentor.rating}
                  </div>
                </div>
              </div>
              <h3 className="font-extrabold text-foreground text-lg">{mentor.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{mentor.role} at {mentor.company}</p>
              <p className="text-sm font-semibold text-foreground mt-4">Mentees: <span className="text-primary">{mentor.activeMentees} active</span></p>
            </div>
            <button 
              onClick={() => handleDelete(mentor.id, mentor.name)}
              className="mt-6 w-full py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm shadow-rose-500/10"
            >
              Remove Mentor
            </button>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Remove Mentor"
        message={`Are you sure you want to remove mentor ${deleteTarget?.name}?`}
      />
    </div>
  )
}

export default AdminMentorship
