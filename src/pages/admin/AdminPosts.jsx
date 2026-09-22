import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSpinner from '../../components/admin/AdminSpinner'
import { 
  Search, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Pause, 
  MessageSquare, 
  Eye, 
  X, 
  Video, 
  Image as ImageIcon, 
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  Briefcase
} from 'lucide-react'
import toast from 'react-hot-toast'
import RemarkModal from '../../components/modals/RemarkModal'
import API_BASE from '../../utils/api'
import { useRealtimePosts } from '../../hooks/useRealtimePosts'

const isVideoUrl = (url, mediaType) => {
  if (mediaType === 'video') return true
  if (!url) return false
  if (url.match(/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i)) return true
  if (url.includes('/video/upload/') || url.includes('/video/')) return true
  return false
}

const AdminPosts = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Real-time synchronization for Admin Posts
  useRealtimePosts({ setPosts })
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
      title: `Confirm Action: ${nextStatus === 'paused' ? 'Pause Post' : 'Approve Post'}`,
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
                          post.author?.name?.toLowerCase().includes(search.toLowerCase()) ||
                          post.eventDetails?.title?.toLowerCase().includes(search.toLowerCase()) ||
                          post.jobDetails?.title?.toLowerCase().includes(search.toLowerCase())
    
    const status = post.moderationStatus === 'paused' ? 'Paused' : 'Active'
    const matchesStatus = statusFilter === 'All' || status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Posts Moderation</h1>
          <p className="text-muted-foreground text-sm mt-1">Review community feeds, inspect video &amp; media attachments, events &amp; hackathons, and moderate content.</p>
        </div>
        <button 
          onClick={fetchPosts}
          disabled={isLoading}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-muted border border-border/60 text-foreground hover:bg-muted/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
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
            placeholder="Search by content, author, event, or job..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all text-foreground"
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
          <AdminSpinner message="Loading posts from database..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="whitespace-nowrap w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4">Content</th>
                  <th className="px-6 py-4">Type / Media</th>
                  <th className="px-6 py-4">Engagement</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => {
                    const hasVideo = post.mediaFiles?.some(m => isVideoUrl(m.url, m.mediaType)) || isVideoUrl(post.imageUrl)
                    const hasImages = (post.mediaFiles?.length > 0 && !hasVideo) || (post.imageUrl && !hasVideo)
                    const isEvent = post.eventDetails && post.eventDetails.title
                    const isJob = post.jobDetails && post.jobDetails.title

                    return (
                      <tr key={post._id} className="hover:bg-muted/10 transition-colors">
                        {/* Author Profile Link */}
                        <td className="px-6 py-4 font-bold text-foreground">
                          <div 
                            onClick={() => navigate(`/admin/users/${post.author?.username || post.author?.clerkId || post.author?.id}`)}
                            className="flex items-center gap-3 cursor-pointer group w-fit"
                            title="Click to view full user profile"
                          >
                            <img 
                              src={post.author?.image || `https://ui-avatars.com/api/?name=${post.author?.name || 'User'}`} 
                              className="rounded-full border border-border/50 group-hover:ring-2 group-hover:ring-primary/40 transition-all object-cover shrink-0" 
                              style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px' }}
                              alt="" 
                            />
                            <div className="min-w-0">
                              <span className="block text-foreground font-bold group-hover:text-primary transition-colors text-sm truncate max-w-[140px]">
                                {post.author?.name}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-normal block">
                                {new Date(post.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Content snippet */}
                        <td className="px-6 py-4 text-muted-foreground font-medium">
                          <div className="max-w-xs truncate" title={post.content || post.eventDetails?.title || post.jobDetails?.title}>
                            {post.content || post.eventDetails?.title || post.jobDetails?.title || 'No text content'}
                          </div>
                        </td>

                        {/* Type & Media badge */}
                        <td className="px-6 py-4 text-xs">
                          {isEvent ? (
                            <span 
                              onClick={() => setSelectedPostDetails(post)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/20 cursor-pointer transition-all"
                            >
                              <Calendar className="w-3.5 h-3.5" /> {post.eventDetails.type || 'Event / Hackathon'}
                            </span>
                          ) : isJob ? (
                            <span 
                              onClick={() => setSelectedPostDetails(post)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-500/20 cursor-pointer transition-all"
                            >
                              <Briefcase className="w-3.5 h-3.5" /> Job Post
                            </span>
                          ) : hasVideo ? (
                            <span 
                              onClick={() => setSelectedPostDetails(post)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1 rounded-full border border-purple-500/20 cursor-pointer transition-all"
                            >
                              <Video className="w-3.5 h-3.5" /> Video Post
                            </span>
                          ) : hasImages ? (
                            <span 
                              onClick={() => setSelectedPostDetails(post)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-full border border-blue-500/20 cursor-pointer transition-all"
                            >
                              <ImageIcon className="w-3.5 h-3.5" /> {post.mediaFiles?.length || 1} Photo(s)
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs font-normal">Text Post</span>
                          )}
                        </td>

                        {/* Engagement */}
                        <td className="px-6 py-4 text-foreground text-xs">
                          <div className="flex items-center gap-3">
                            <span>❤️ {post.likes?.length || 0}</span>
                            <span>💬 {post.comments?.length || 0}</span>
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            post.moderationStatus === 'paused'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                          }`}>
                            {post.moderationStatus === 'paused' ? 'Paused' : 'Active'}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="px-6 py-4 text-right space-x-1">
                          <button 
                            onClick={() => setSelectedPostDetails(post)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Inspect Post, Events &amp; Media"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {post.moderationStatus !== 'paused' ? (
                            <button 
                              onClick={() => handleStatusChange(post._id, 'paused')}
                              className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                              title="Pause / Hide Post"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleStatusChange(post._id, 'approved')}
                              className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                              title="Resume / Approve Post"
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
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                        <p className="font-semibold text-sm">No posts found matching filter.</p>
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

      {/* Post Details & Media Inspection Modal */}
      {selectedPostDetails && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/60 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-5 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setSelectedPostDetails(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Clickable Author Profile Header (Clean, Standard Small Avatar) */}
            <div 
              onClick={() => {
                const target = selectedPostDetails.author?.username || selectedPostDetails.author?.clerkId || selectedPostDetails.author?.id
                setSelectedPostDetails(null)
                navigate(`/admin/users/${target}`)
              }}
              className="flex items-center justify-between gap-4 border-b border-border/50 pb-4 cursor-pointer group pr-10"
              title="Click to view full user profile"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img 
                  src={selectedPostDetails.author?.image || `https://ui-avatars.com/api/?name=${selectedPostDetails.author?.name || 'User'}`} 
                  className="rounded-full border border-border/50 object-cover group-hover:ring-2 group-hover:ring-primary/40 transition-all shrink-0 shadow-sm" 
                  style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
                  alt="" 
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5 truncate">
                    {selectedPostDetails.author?.name}
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0" />
                  </h3>
                  <p className="text-xs text-muted-foreground">{new Date(selectedPostDetails.createdAt).toLocaleString()}</p>
                  <span className="text-[11px] text-primary font-semibold mt-0.5 inline-block">View Author Profile →</span>
                </div>
              </div>

              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                selectedPostDetails.moderationStatus === 'paused'
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
              }`}>
                {selectedPostDetails.moderationStatus === 'paused' ? 'Paused' : 'Active'}
              </span>
            </div>

            {/* Content Text (or gradient text) */}
            <div className="space-y-4">
              {selectedPostDetails.bgGradient ? (
                <div className={`p-8 rounded-2xl flex items-center justify-center text-center ${selectedPostDetails.bgGradient}`}>
                  <p className="text-white text-lg font-bold drop-shadow-md whitespace-pre-wrap">
                    {selectedPostDetails.content}
                  </p>
                </div>
              ) : selectedPostDetails.content ? (
                <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap bg-muted/20 p-3.5 rounded-2xl border border-border/40">
                  {selectedPostDetails.content}
                </p>
              ) : null}

              {/* Rich Event / Hackathon / Workshop Card (exactly as shown in Feed) */}
              {selectedPostDetails.eventDetails && selectedPostDetails.eventDetails.title && (
                <div className="bg-muted/30 border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                  {/* Event Top Image / Banner */}
                  {(selectedPostDetails.imageUrl || selectedPostDetails.eventDetails.imageUrl) ? (
                    <div className="w-full h-48 bg-muted overflow-hidden relative">
                      <img 
                        src={selectedPostDetails.imageUrl || selectedPostDetails.eventDetails.imageUrl} 
                        alt={selectedPostDetails.eventDetails.title} 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
                          {selectedPostDetails.eventDetails.type || 'Event'}
                        </span>
                        {selectedPostDetails.eventDetails.date && new Date(selectedPostDetails.eventDetails.date).getTime() < new Date().setHours(0,0,0,0) && (
                          <span className="bg-red-600/90 backdrop-blur-md text-white text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
                            Expired
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-gradient-to-r from-orange-500/20 via-pink-500/10 to-primary/20 flex items-center justify-between px-5 border-b border-border/40 relative overflow-hidden">
                      <div className="flex items-center gap-3 z-10">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                            {selectedPostDetails.eventDetails.type || 'Event / Hackathon'}
                          </span>
                        </div>
                      </div>
                      <Calendar className="w-20 h-20 text-foreground/5 absolute -right-2 -bottom-2 pointer-events-none" />
                    </div>
                  )}

                  {/* Event Details Bar */}
                  <div className="p-4 flex items-start gap-3.5">
                    {selectedPostDetails.eventDetails.date && (
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shrink-0 text-center shadow-xs">
                        <span className="text-[10px] font-bold text-primary uppercase leading-tight">
                          {new Date(selectedPostDetails.eventDetails.date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-base font-black text-foreground leading-none mt-0.5">
                          {new Date(selectedPostDetails.eventDetails.date).getDate()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-foreground mb-1 leading-snug">
                        {selectedPostDetails.eventDetails.title}
                      </h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-muted-foreground mt-1">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary" /> 
                          {selectedPostDetails.eventDetails.date ? new Date(selectedPostDetails.eventDetails.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary" /> 
                          {selectedPostDetails.eventDetails.time || 'TBD'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary" /> 
                          {selectedPostDetails.eventDetails.location || (selectedPostDetails.eventDetails.format === 'online' ? 'Online Meeting' : 'Campus Venue')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rich Job Card (if post is a job announcement) */}
              {selectedPostDetails.jobDetails && selectedPostDetails.jobDetails.title && (
                <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-purple-500/30 rounded-2xl p-4 flex gap-4 items-center shadow-sm relative overflow-hidden">
                  <div className="w-14 h-14 rounded-xl bg-background text-purple-600 flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1.5 border border-border/50">
                    {selectedPostDetails.jobDetails.companyLogo ? (
                      <img src={selectedPostDetails.jobDetails.companyLogo} alt={selectedPostDetails.jobDetails.company} className="w-full h-full object-contain" />
                    ) : (
                      <Briefcase className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-md border border-purple-500/20">
                        Job Opening
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-foreground mt-0.5 truncate">{selectedPostDetails.jobDetails.title}</h4>
                    <p className="text-xs text-muted-foreground">{selectedPostDetails.jobDetails.company} • {selectedPostDetails.jobDetails.location || 'Remote'}</p>
                  </div>
                </div>
              )}
              
              {/* Media Files Display (Videos & Photos with Controls - only if not already shown in event banner) */}
              {(() => {
                const mediaList = selectedPostDetails.mediaFiles?.length > 0
                  ? selectedPostDetails.mediaFiles
                  : ((selectedPostDetails.imageUrl && (!selectedPostDetails.eventDetails || !selectedPostDetails.eventDetails.title)) ? [{ url: selectedPostDetails.imageUrl, mediaType: isVideoUrl(selectedPostDetails.imageUrl) ? 'video' : 'image' }] : [])

                if (mediaList.length === 0) return null

                return (
                  <div className="space-y-2 pt-1">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Attached Media &amp; Videos ({mediaList.length})
                    </h4>
                    <div className={`grid gap-3 ${mediaList.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                      {mediaList.map((item, idx) => {
                        const isVideo = isVideoUrl(item.url, item.mediaType)
                        return (
                          <div 
                            key={idx} 
                            className="relative rounded-2xl overflow-hidden bg-black/90 border border-border/60 flex items-center justify-center min-h-[220px] max-h-[420px] shadow-sm"
                          >
                            {isVideo ? (
                              <video 
                                src={item.url} 
                                controls 
                                playsInline
                                preload="metadata"
                                className="w-full max-h-[400px] object-contain rounded-2xl" 
                              />
                            ) : (
                              <img 
                                src={item.url} 
                                alt={`Media item ${idx + 1}`} 
                                className="w-full max-h-[400px] object-contain rounded-2xl" 
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
              
              {/* Likes & Comments */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-rose-500">❤️</span> {selectedPostDetails.likes?.length || 0} Likes
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-blue-500">💬</span> {selectedPostDetails.comments?.length || 0} Comments
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedPostDetails.moderationStatus !== 'paused' ? (
                    <button 
                      onClick={() => {
                        handleStatusChange(selectedPostDetails._id, 'paused')
                        setSelectedPostDetails(null)
                      }}
                      className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Pause Post
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        handleStatusChange(selectedPostDetails._id, 'approved')
                        setSelectedPostDetails(null)
                      }}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Resume Post
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      confirmDelete(selectedPostDetails._id)
                      setSelectedPostDetails(null)
                    }}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Delete Post
                  </button>
                </div>
              </div>

              {selectedPostDetails.moderationRemark && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <h4 className="text-amber-600 font-bold text-xs mb-1">Moderation Remark:</h4>
                  <p className="text-amber-700/90 dark:text-amber-400/90 text-xs">{selectedPostDetails.moderationRemark}</p>
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
