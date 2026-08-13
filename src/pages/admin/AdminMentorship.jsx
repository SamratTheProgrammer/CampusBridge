import React, { useState, useEffect } from 'react'
import { Plus, Trash2, HelpingHand, Star, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/modals/ConfirmModal'
import API_BASE from '../../utils/api'

const AdminMentorship = () => {
  const [mentors, setMentors] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    fetchMentors()
  }, [])

  const fetchMentors = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE}/api/admin/mentors`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.mentors) {
          setMentors(data.mentors)
        }
      } else {
        toast.error('Failed to fetch mentors')
      }
    } catch (error) {
      console.error('Error fetching mentors:', error)
      toast.error('Server error while fetching mentors')
    } finally {
      setIsLoading(false)
    }
  }

  const confirmDelete = (id, name) => {
    setDeleteTarget({ id, name })
    setIsConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setMentors(mentors.filter(m => m.id !== deleteTarget.id))
          toast.success('Mentor profile removed successfully.')
        } else {
          toast.error(data.message || 'Failed to remove mentor')
        }
      } else {
        toast.error('Failed to remove mentor')
      }
    } catch (error) {
      console.error('Error deleting mentor:', error)
      toast.error('Server error while deleting mentor')
    } finally {
      setIsConfirmOpen(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Mentorship Program</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and manage verified platform mentors and mentorship engagement rates.</p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Loading active mentors...</p>
        </div>
      ) : mentors.length > 0 ? (
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
                onClick={() => confirmDelete(mentor.id, mentor.name)}
                className="mt-6 w-full py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm shadow-rose-500/10"
              >
                Remove Mentor
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-card border border-border/50 rounded-2xl">
          <p className="text-muted-foreground">No active mentors found.</p>
        </div>
      )}

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
