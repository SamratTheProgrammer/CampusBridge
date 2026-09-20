import AdminSpinner from '../../components/admin/AdminSpinner'
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Star, Loader2, User } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/modals/ConfirmModal'
import API_BASE from '../../utils/api'

const AdminMentorship = () => {
  const navigate = useNavigate()
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
        <AdminSpinner message="Loading active mentors..." />
      ) : mentors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((mentor) => (
            <div key={mentor.id} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex justify-between items-start mb-3">
                  {mentor.imageUrl ? (
                    <img 
                      src={mentor.imageUrl} 
                      alt={mentor.name} 
                      onClick={() => navigate(`/admin/users/${mentor.username || mentor.clerkId || mentor.id}`)}
                      className="w-13 h-13 rounded-2xl object-cover border border-border/50 cursor-pointer hover:ring-2 hover:ring-primary/40 hover:opacity-90 transition-all shadow-sm" 
                      title="View Profile"
                    />
                  ) : (
                    <div 
                      onClick={() => navigate(`/admin/users/${mentor.username || mentor.clerkId || mentor.id}`)}
                      className="w-13 h-13 rounded-2xl bg-primary/10 text-primary font-extrabold flex items-center justify-center text-lg cursor-pointer hover:bg-primary/20 transition-all border border-primary/20 shadow-sm"
                      title="View Profile"
                    >
                      {mentor.name?.charAt(0)?.toUpperCase() || 'M'}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => confirmDelete(mentor.id, mentor.name)} 
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Remove Mentor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div 
                      className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20"
                      title={mentor.totalRatings > 0 ? `${mentor.totalRatings} review(s)` : 'No ratings yet'}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" /> 
                      {mentor.rating > 0 ? mentor.rating.toFixed(1) : 'New'}
                      {mentor.totalRatings > 0 && (
                        <span className="text-[10px] text-amber-500/80 font-normal">({mentor.totalRatings})</span>
                      )}
                    </div>
                  </div>
                </div>
                <h3 
                  onClick={() => navigate(`/admin/users/${mentor.username || mentor.clerkId || mentor.id}`)}
                  className="font-extrabold text-foreground text-lg cursor-pointer hover:text-primary transition-colors mt-2 truncate"
                  title="View Profile"
                >
                  {mentor.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{mentor.role} at {mentor.company}</p>
                <p className="text-sm font-semibold text-foreground mt-4">Mentees: <span className="text-primary">{mentor.activeMentees} active</span></p>
              </div>
              <button 
                onClick={() => confirmDelete(mentor.id, mentor.name)}
                className="mt-6 w-full py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm shadow-rose-500/10 cursor-pointer"
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
