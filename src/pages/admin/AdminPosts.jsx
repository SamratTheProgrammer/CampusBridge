import React, { useState, useEffect } from 'react'
import { Search, Trash2, CheckCircle2, AlertCircle, Loader2, Pause, MessageSquare, Eye, X } from 'lucide-react'
import toast from 'react-hot-toast'
import RemarkModal from '../../components/modals/RemarkModal'
import API_BASE from '../../utils/api'

const AdminPosts = () => {
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Modal state
  const [selectedPostDetails, setSelectedPostDetails] = useState(null)
  
  // Modal states
  const [remarkModal, setRemarkModal] = useState({ isOpen: false, action: null, target: null, title: '', placeholder: '', buttonText: '' })

  const fetchPosts = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE}/api/posts?admin_override=true`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data)
      } else {
        toast.error('Failed to load posts')
      }
    } catch (err) {
      console.error('Error fetching posts:', err)
      toast.error('Server error while loading posts')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  // Confirm delete handler
  const confirmDelete = (id) => {
    setRemarkModal({
      isOpen: true,
      action: 'delete',
      target: { id },
      title: 'Delete Post',
      placeholder: 'Enter reason for deletion...',
      buttonText: 'Delete'
    })
  }

  const handleStatusChange = (id, nextStatus) => {
    setRemarkModal({
      isOpen: true,
      action: nextStatus,
      target: { id },
      title: `Confirm Action: ${nextStatus}`,
      placeholder: `Enter remark for ${nextStatus}...`,
      buttonText: 'Confirm'
    })
  }

  const handleRemarkSubmit = async (remark) => {
    const { action, target } = remarkModal
    
    if (action === 'delete') {
      try {
        const res = await fetch(`${API_BASE}/api/admin/moderate/post/${target.id}?remark=${encodeURIComponent(remark)}`, { method: 'DELETE' })
        const data = await res.json()
        if (res.ok && data.success) {
          setPosts(prev => prev.filter(p => (p._id || p.id) !== target.id))
          toast.success(`Post deleted successfully.`)
        } else {
          toast.error(data.message || 'Failed to delete post')
        }
      } catch (err) {
        console.error('Error deleting post:', err)
        toast.error('Failed to communicate with server')
      }
    } else {
      try {
        const res = await fetch(`${API_BASE}/api/admin/moderate/post/${target.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: action, remark })
        })

        const data = await res.json()
        if (res.ok && data.success) {
          setPosts(prev => prev.map(p => (p._id || p.id) === target.id ? { ...p, moderationStatus: action } : p))
          toast.success(`Post status changed to ${action}`)
        } else {
          toast.error(data.message || 'Failed to update post status')
        }
      } catch (err) {
        console.error('Error updating status:', err)
        toast.error('Failed to communicate with server')
      }
    }
    
    setRemarkModal({ isOpen: false, action: null, target: null, title: '', placeholder: '', buttonText: '' })
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.content?.toLowerCase().includes(search.toLowerCase()) || 
                          post.author?.name?.toLowerCase().includes(search.toLowerCase())
    
    const status = post.moderationStatus === 'paused' ? 'Paused' : 'Active'
    
    const matchesStatus = statusFilter === 'All' || status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Posts Moderation</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and manage community posts to ensure a safe environment.</p>
        </div>
        <button 
          onClick={fetchPosts}
          disabled={isLoading}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-muted border border-border/60 text-foreground hover:bg-muted/80 transition-all flex items-center gap-1.5"
        >
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Refresh Posts
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by content or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-foreground text-xs font-semibold focus:outline-none cursor-pointer appearance-none min-w-[140px] w-full md:w-auto"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Paused">Paused</option>
        </select>
      </div>

      {/* Posts Table */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Loading posts from database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="whitespace-nowrap w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4">Content</th>
                  <th className="px-6 py-4">Engagement</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <tr key={post._id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">
                        <div className="flex items-center gap-3">
                          <img src={post.author?.image || `https://ui-avatars.com/api/?name=${post.author?.name || 'User'}`} className="w-8 h-8 rounded-full border border-border/50" alt="" />
                          <div>
                            <span className="block text-foreground font-bold">{post.author?.name}</span>
                            <span className="text-[11px] text-muted-foreground font-normal">{new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-medium">
                        <div className="max-w-xs truncate" title={post.content}>{post.content}</div>
                      </td>
                      <td className="px-6 py-4 text-foreground text-xs">
                        <div className="flex items-center gap-3">
                          <span>❤️ {post.likes?.length || 0}</span>
                          <span>💬 {post.comments?.length || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          post.moderationStatus === 'paused'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                        }`}>
                          {post.moderationStatus === 'paused' ? 'Paused' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <button 
                          onClick={() => setSelectedPostDetails(post)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {post.moderationStatus !== 'paused' ? (
                          <button 
                            onClick={() => handleStatusChange(post._id, 'paused')}
                            className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Pause Post"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleStatusChange(post._id, 'approved')}
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Approve Post"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => confirmDelete(post._id)}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="Delete Post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                        <p className="font-semibold text-sm">No posts found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RemarkModal
        isOpen={remarkModal.isOpen}
        onClose={() => setRemarkModal({ ...remarkModal, isOpen: false })}
        onSubmit={handleRemarkSubmit}
        title={remarkModal.title}
        placeholder={remarkModal.placeholder}
        actionLabel={remarkModal.buttonText}
      />

      {/* Post Details Modal */}
      {selectedPostDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/60 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setSelectedPostDetails(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-border/50 pb-4">
              <img src={selectedPostDetails.author?.image || `https://ui-avatars.com/api/?name=${selectedPostDetails.author?.name || 'User'}`} className="w-12 h-12 rounded-full border border-border/50 object-cover" alt="" />
              <div>
                <h3 className="font-bold text-lg text-foreground">{selectedPostDetails.author?.name}</h3>
                <p className="text-sm text-muted-foreground">{new Date(selectedPostDetails.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{selectedPostDetails.content}</p>
              
              {selectedPostDetails.imageUrl && (
                <img src={selectedPostDetails.imageUrl} alt="Post media" className="w-full max-h-96 object-contain rounded-xl border border-border/50 bg-muted/20" />
              )}
              
              <div className="flex items-center gap-6 pt-4 border-t border-border/50 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-rose-500">❤️</span> {selectedPostDetails.likes?.length || 0} Likes
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">💬</span> {selectedPostDetails.comments?.length || 0} Comments
                </div>
              </div>

              {selectedPostDetails.moderationRemark && (
                <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <h4 className="text-amber-600 font-bold text-sm mb-1">Moderation Remark:</h4>
                  <p className="text-amber-700/80 dark:text-amber-400/80 text-sm">{selectedPostDetails.moderationRemark}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPosts
