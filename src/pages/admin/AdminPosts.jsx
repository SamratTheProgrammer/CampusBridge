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
  Briefcase,
  Volume2,
  Flag,
  RotateCcw
} from 'lucide-react'
import AudioPlayerWidget from '../../components/common/AudioPlayerWidget'
import toast from 'react-hot-toast'
import RemarkModal from '../../components/modals/RemarkModal'
import ModalPortal from '../../components/modals/ModalPortal'
import API_BASE from '../../utils/api'
import { useRealtimePosts } from '../../hooks/useRealtimePosts'

const isAudioUrl = (url, mediaType) => {
  if (mediaType === 'audio') return true
  if (!url) return false
  const clean = url.split('?')[0].toLowerCase()
  if (['.mp3', '.wav', '.oga', '.m4a', '.aac', '.flac', '.opus', '.weba'].some(ext => clean.endsWith(ext))) return true
  if (url.includes('/audio/') || url.includes('/audios/') || clean.includes('voice_') || clean.includes('audio_')) return true
  return false
}

const isVideoUrl = (url, mediaType) => {
  if (isAudioUrl(url, mediaType)) return false
  if (mediaType === 'video') return true
  if (!url) return false
  const clean = url.split('?')[0].toLowerCase()
  if (['.mp4', '.mov', '.m4v', '.mkv', '.avi'].some(ext => clean.endsWith(ext))) return true
  if (['.webm', '.ogg'].some(ext => clean.endsWith(ext)) && !url.includes('voice_') && !url.includes('audio_')) return true
  if ((url.includes('/video/upload/') || url.includes('/video/')) && !isAudioUrl(url, mediaType)) return true
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

  const handleDismissReports = async (postId) => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}/dismiss-reports`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedPost = data.post;
        setPosts(prev => prev.map(p => (p._id || p.id) === postId ? { 
          ...p, 
          reports: [], 
          reportCount: 0,
          dismissedReports: updatedPost?.dismissedReports || p.reports || []
        } : p));

        if (selectedPostDetails && (selectedPostDetails._id || selectedPostDetails.id) === postId) {
          setSelectedPostDetails(prev => ({ 
            ...prev, 
            reports: [], 
            reportCount: 0,
            dismissedReports: updatedPost?.dismissedReports || prev.reports || []
          }));
        }

        // Actionable Toast with instant Undo option
        toast((t) => (
          <div className="flex items-center justify-between gap-3 w-full">
            <span className="text-xs sm:text-sm font-semibold text-foreground">All reports dismissed</span>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                await handleUndoDismissReports(postId);
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3" /> Undo
            </button>
          </div>
        ), { duration: 6000, id: `dismiss-reports-${postId}` });
      } else {
        toast.error(data.error || 'Failed to dismiss reports');
      }
    } catch (err) {
      console.error('Error dismissing reports:', err);
      toast.error('Server error while dismissing reports');
    }
  };

  const handleUndoDismissReports = async (postId) => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}/undo-dismiss-reports`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Dismissed reports have been restored!');
        const restoredReports = data.post?.reports || [];
        const restoredCount = data.post?.reportCount || restoredReports.length;

        setPosts(prev => prev.map(p => (p._id || p.id) === postId ? { 
          ...p, 
          reports: restoredReports, 
          reportCount: restoredCount,
          dismissedReports: []
        } : p));

        if (selectedPostDetails && (selectedPostDetails._id || selectedPostDetails.id) === postId) {
          setSelectedPostDetails(prev => ({ 
            ...prev, 
            reports: restoredReports, 
            reportCount: restoredCount,
            dismissedReports: []
          }));
        }
      } else {
        toast.error(data.error || 'Failed to restore reports');
      }
    } catch (err) {
      console.error('Error restoring reports:', err);
      toast.error('Server error while restoring reports');
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.content?.toLowerCase().includes(search.toLowerCase()) || 
                          post.author?.name?.toLowerCase().includes(search.toLowerCase()) ||
                          post.eventDetails?.title?.toLowerCase().includes(search.toLowerCase()) ||
                          post.jobDetails?.title?.toLowerCase().includes(search.toLowerCase())
    
    const isReported = (post.reportCount > 0) || (post.reports && post.reports.length > 0)
    let matchesStatus = true
    if (statusFilter === 'Active') matchesStatus = post.moderationStatus !== 'paused'
    else if (statusFilter === 'Paused') matchesStatus = post.moderationStatus === 'paused'
    else if (statusFilter === 'Reported') matchesStatus = isReported
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="w-full space-y-6 max-w-6xl mx-auto pb-12">
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

      {/* Sticky Header: Filter & Search Bar */}
      <div className="sticky top-16 z-30 bg-background pt-2 pb-3 -mx-4 sm:-mx-8 px-4 sm:px-8 border-b border-border/40 shadow-sm transition-all">
        <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by content, author, event, or job..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-foreground text-xs font-semibold focus:outline-none cursor-pointer appearance-none min-w-[160px] w-full md:w-auto"
          >
            <option value="All">All Status ({posts.length})</option>
            <option value="Reported">🚩 Reported ({posts.filter(p => p.reportCount > 0 || (p.reports && p.reports.length > 0)).length})</option>
            <option value="Active">Active ({posts.filter(p => p.moderationStatus !== 'paused').length})</option>
            <option value="Paused">Paused ({posts.filter(p => p.moderationStatus === 'paused').length})</option>
          </select>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <AdminSpinner message="Loading posts from database..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="whitespace-nowrap w-full text-left border-collapse">
              <thead className="bg-card border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground shadow-sm">
                <tr className="bg-muted/40">
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
                    const hasAudio = post.mediaFiles?.some(m => isAudioUrl(m.url, m.mediaType)) || isAudioUrl(post.imageUrl, post.mediaType)
                    const hasVideo = post.mediaFiles?.some(m => isVideoUrl(m.url, m.mediaType)) || (!isAudioUrl(post.imageUrl, post.mediaType) && isVideoUrl(post.imageUrl, post.mediaType))
                    const visualImages = post.mediaFiles?.filter(m => !isVideoUrl(m.url, m.mediaType) && !isAudioUrl(m.url, m.mediaType)) || []
                    const hasImages = visualImages.length > 0 || (post.imageUrl && !isVideoUrl(post.imageUrl, post.mediaType) && !isAudioUrl(post.imageUrl, post.mediaType))
                    const isEvent = post.eventDetails && post.eventDetails.title
                    const isJob = post.jobDetails && post.jobDetails.title

                    return (
                      <tr 
                        key={post._id} 
                        onClick={() => setSelectedPostDetails(post)}
                        className="hover:bg-muted/10 transition-colors cursor-pointer"
                      >
                        {/* Author Profile Link */}
                        <td className="px-6 py-4 font-bold text-foreground">
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/users/${post.author?.username || post.author?.clerkId || post.author?.id}`);
                            }}
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
                              onClick={(e) => { e.stopPropagation(); setSelectedPostDetails(post); }}
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/20 cursor-pointer transition-all"
                            >
                              <Calendar className="w-3.5 h-3.5" /> {post.eventDetails.type || 'Event / Hackathon'}
                            </span>
                          ) : isJob ? (
                            <span 
                              onClick={(e) => { e.stopPropagation(); setSelectedPostDetails(post); }}
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-500/20 cursor-pointer transition-all"
                            >
                              <Briefcase className="w-3.5 h-3.5" /> Job Post
                            </span>
                          ) : (hasImages && hasAudio) ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span 
                                onClick={(e) => { e.stopPropagation(); setSelectedPostDetails(post); }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-500/20 cursor-pointer transition-all"
                              >
                                <ImageIcon className="w-3 h-3" /> {visualImages.length || 1} Photo(s)
                              </span>
                              <span 
                                onClick={(e) => { e.stopPropagation(); setSelectedPostDetails(post); }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/20 cursor-pointer transition-all"
                              >
                                <Volume2 className="w-3 h-3" /> Audio
                              </span>
                            </div>
                          ) : hasVideo ? (
                            <span 
                              onClick={(e) => { e.stopPropagation(); setSelectedPostDetails(post); }}
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1 rounded-full border border-purple-500/20 cursor-pointer transition-all"
                            >
                              <Video className="w-3.5 h-3.5" /> Video Post
                            </span>
                          ) : hasAudio ? (
                            <span 
                              onClick={(e) => { e.stopPropagation(); setSelectedPostDetails(post); }}
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1 rounded-full border border-purple-500/20 cursor-pointer transition-all"
                            >
                              <Volume2 className="w-3.5 h-3.5" /> Audio Note
                            </span>
                          ) : hasImages ? (
                            <span 
                              onClick={(e) => { e.stopPropagation(); setSelectedPostDetails(post); }}
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-full border border-blue-500/20 cursor-pointer transition-all"
                            >
                              <ImageIcon className="w-3.5 h-3.5" /> {visualImages.length || 1} Photo(s)
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

                        {/* Status & Reports badge */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            {(post.reportCount > 0 || (post.reports && post.reports.length > 0)) && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                <Flag className="w-3 h-3 fill-rose-500 text-rose-500" />
                                Reported ({post.reportCount || post.reports?.length})
                              </span>
                            )}
                            {post.dismissedReports?.length > 0 && (!post.reports || post.reports.length === 0) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUndoDismissReports(post._id);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
                                title="Click to undo dismissal and restore reports"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                                Undo Dismiss ({post.dismissedReports.length})
                              </button>
                            )}
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              post.moderationStatus === 'paused'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            }`}>
                              {post.moderationStatus === 'paused' ? 'Paused' : 'Active'}
                            </span>
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="px-6 py-4 text-right space-x-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedPostDetails(post); }}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Inspect Post, Events &amp; Media"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {post.moderationStatus !== 'paused' ? (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(post._id, 'paused'); }}
                              className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                              title="Pause / Hide Post"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(post._id, 'approved'); }}
                              className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                              title="Resume / Approve Post"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); confirmDelete(post._id); }}
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
        <ModalPortal>
          <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
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
              {/* User Reports & Moderation Flags Box */}
              {(selectedPostDetails.reportCount > 0 || (selectedPostDetails.reports && selectedPostDetails.reports.length > 0)) && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-rose-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <Flag className="w-5 h-5 fill-rose-500 text-rose-500" />
                      <h4 className="text-sm font-black text-rose-600 dark:text-rose-400">
                        User Reported Concerns ({selectedPostDetails.reports?.length || selectedPostDetails.reportCount})
                      </h4>
                    </div>
                    <button
                      onClick={() => handleDismissReports(selectedPostDetails._id)}
                      className="px-3 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="Dismiss all reports and clear flag"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Dismiss Reports
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {selectedPostDetails.reports && selectedPostDetails.reports.length > 0 ? (
                      selectedPostDetails.reports.map((rep, rIdx) => (
                        <div key={rIdx} className="bg-background/80 p-3 rounded-xl border border-rose-500/20 text-xs flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md bg-rose-500/10">
                              {rep.reason}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {rep.createdAt ? new Date(rep.createdAt).toLocaleString() : 'Recently'}
                            </span>
                          </div>
                          {rep.details && (
                            <p className="text-foreground/90 italic mt-0.5 font-medium">"{rep.details}"</p>
                          )}
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                            <span>Reported by:</span>
                            {rep.reporterUsername ? (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPostDetails(null);
                                  navigate(`/admin/users/${rep.reporterUsername}`);
                                }}
                                className="font-bold text-primary hover:underline cursor-pointer"
                              >
                                @{rep.reporterUsername} ({rep.reporterName})
                              </span>
                            ) : (
                              <span className="font-semibold text-foreground">{rep.reporterName || 'Anonymous User'}</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-medium italic">
                        Post flagged for review by community members.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Dismissed Reports Box with Undo Option */}
              {selectedPostDetails.dismissedReports?.length > 0 && (!selectedPostDetails.reports || selectedPostDetails.reports.length === 0) && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div>
                        <h4 className="text-sm font-black text-foreground">
                          Reports Dismissed ({selectedPostDetails.dismissedReports.length})
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          These reports were previously reviewed and dismissed by an admin.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUndoDismissReports(selectedPostDetails._id)}
                      className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                      title="Undo dismiss and restore reports"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Undo Dismiss
                    </button>
                  </div>

                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar opacity-90">
                    {selectedPostDetails.dismissedReports.map((rep, rIdx) => (
                      <div key={rIdx} className="bg-background/80 p-2.5 rounded-xl border border-border/50 text-xs flex flex-col gap-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-muted-foreground px-2 py-0.5 rounded bg-muted text-[11px]">
                            {rep.reason}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {rep.createdAt ? new Date(rep.createdAt).toLocaleString() : 'Past'}
                          </span>
                        </div>
                        {rep.details && <p className="text-foreground/80 italic text-[11px] mt-0.5">"{rep.details}"</p>}
                        {rep.reporterName && (
                          <span className="text-[10px] text-muted-foreground mt-0.5">Reported by {rep.reporterName}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              
              {/* Media Files Display (Videos, Photos, Audio Player) */}
              {(() => {
                const rawList = selectedPostDetails.mediaFiles?.length > 0
                  ? selectedPostDetails.mediaFiles
                  : ((selectedPostDetails.imageUrl && (!selectedPostDetails.eventDetails || !selectedPostDetails.eventDetails.title)) ? [{ url: selectedPostDetails.imageUrl, mediaType: selectedPostDetails.mediaType || (isAudioUrl(selectedPostDetails.imageUrl) ? 'audio' : isVideoUrl(selectedPostDetails.imageUrl) ? 'video' : 'image') }] : [])

                if (rawList.length === 0) return null

                const visualList = rawList.filter(item => !isAudioUrl(item.url, item.mediaType))
                const audioList = rawList.filter(item => isAudioUrl(item.url, item.mediaType))

                return (
                  <div className="space-y-4 pt-1">
                    {visualList.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Attached Photos &amp; Videos ({visualList.length})
                        </h4>
                        <div className={`grid gap-3 ${visualList.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                          {visualList.map((item, idx) => {
                            const isVid = isVideoUrl(item.url, item.mediaType)
                            return (
                              <div 
                                key={idx} 
                                className="relative rounded-2xl overflow-hidden bg-black/90 border border-border/60 flex items-center justify-center min-h-[220px] max-h-[420px] shadow-sm"
                              >
                                {isVid ? (
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
                    )}

                    {audioList.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-purple-500" />
                          Attached Audio &amp; Voice Notes ({audioList.length})
                        </h4>
                        <div className="space-y-2">
                          {audioList.map((audioItem, aIdx) => (
                            <AudioPlayerWidget 
                              key={aIdx}
                              src={audioItem.url} 
                              duration={audioItem.duration}
                              title={`${selectedPostDetails.author?.name || 'Author'}'s Audio`} 
                              userAvatar={selectedPostDetails.author?.image}
                              senderName={selectedPostDetails.author?.name}
                            />
                          ))}
                        </div>
                      </div>
                    )}
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
        </ModalPortal>
      )}
    </div>
  )
}

export default AdminPosts
