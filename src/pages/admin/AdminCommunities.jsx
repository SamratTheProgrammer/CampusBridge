import React, { useState } from 'react'
import { Plus, Trash2, ShieldCheck, ToggleLeft, ToggleRight, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/modals/ConfirmModal'

const AdminCommunities = () => {
  const [communities, setCommunities] = useState([
    { id: 1, name: 'AI & Machine Learning', members: '2,345', posts: 245, status: 'Active' },
    { id: 2, name: 'Web Development', members: '4,562', posts: 512, status: 'Active' },
    { id: 3, name: 'Cloud Computing', members: '1,723', posts: 193, status: 'Active' },
    { id: 4, name: 'Cyber Security', members: '2,112', posts: 276, status: 'Active' },
    { id: 5, name: 'UI/UX Design', members: '1,542', posts: 164, status: 'Active' },
  ])

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const confirmDelete = (id, name) => {
    setDeleteTarget({ id, name })
    setIsConfirmOpen(true)
  }

  const handleDelete = () => {
    if (!deleteTarget) return;
    setCommunities(communities.filter(c => c.id !== deleteTarget.id))
    toast.success('Community group deleted.')
    setIsConfirmOpen(false)
    setDeleteTarget(null)
  }

  const handleToggleStatus = (id) => {
    setCommunities(communities.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'Active' ? 'Inactive' : 'Active'
        toast.success(`Community status is now ${nextStatus}`)
        return { ...c, status: nextStatus }
      }
      return c
    }))
  }

  const handleCreateCommunity = () => {
    const name = prompt('Enter Community Name:')
    if (name) {
      setCommunities([
        ...communities,
        { id: communities.length + 1, name, members: '0', posts: 0, status: 'Active' }
      ])
      toast.success('Community created!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Communities</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and moderate campus interest groups and sub-forums.</p>
        </div>
        <button 
          onClick={handleCreateCommunity}
          className="bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 flex items-center gap-2 transition-all shadow-md shadow-primary/10 text-sm self-start sm:self-auto"
        >
          <Plus className="w-4.5 h-4.5" /> Create Community
        </button>
      </div>

      {/* Communities Table */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="whitespace-nowrap w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4">Community</th>
                <th className="px-6 py-4">Members</th>
                <th className="px-6 py-4">Posts</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-sm">
              {communities.map((c) => (
                <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                    {c.name}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{c.members}</td>
                  <td className="px-6 py-4 text-foreground font-semibold">{c.posts}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      c.status === 'Active' 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button 
                      onClick={() => handleToggleStatus(c.id)}
                      className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors inline-flex items-center justify-center"
                      title="Toggle Active/Inactive"
                    >
                      {c.status === 'Active' ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                    </button>
                    <button 
                      onClick={() => confirmDelete(c.id, c.name)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex items-center justify-center"
                      title="Delete Group"
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
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Community Group"
        message={`Are you sure you want to delete community group "${deleteTarget?.name}"?`}
      />
    </div>
  )
}

export default AdminCommunities
