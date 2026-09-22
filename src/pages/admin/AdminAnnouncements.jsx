import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Megaphone, 
  Check, 
  Pause, 
  Play, 
  Calendar, 
  Clock, 
  Search, 
  Upload, 
  X, 
  Image as ImageIcon, 
  AlertCircle, 
  Eye, 
  Users, 
  GraduationCap, 
  Award,
  Filter,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/modals/ConfirmModal'
import ModalPortal from '../../components/modals/ModalPortal'
import AdminSpinner from '../../components/admin/AdminSpinner'
import API_BASE from '../../utils/api'

const toDatetimeLocal = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [audienceFilter, setAudienceFilter] = useState('All')

  // Modal State for Create / Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form Fields
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [audience, setAudience] = useState('All Users')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState('Published')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  // Confirm Delete Modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Image Preview Modal for table view
  const [previewImageModal, setPreviewImageModal] = useState(null)

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE}/api/admin/announcements`)
      const data = await res.json()
      if (res.ok && data.success) {
        setAnnouncements(data.announcements || [])
      } else {
        toast.error(data.message || 'Failed to fetch announcements')
      }
    } catch (err) {
      console.error('Error fetching announcements:', err)
      toast.error('Error loading announcements')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const resetForm = () => {
    setTitle('')
    setDetails('')
    setPriority('Medium')
    setAudience('All Users')
    const nowStr = toDatetimeLocal(new Date())
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    setStartDate(nowStr)
    setEndDate(toDatetimeLocal(nextWeek))
    setStatus('Published')
    setImageUrl('')
    setImageFile(null)
    setImagePreview('')
    setEditingItem(null)
  }

  const handleOpenCreateModal = () => {
    resetForm()
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = (item) => {
    setEditingItem(item)
    setTitle(item.title || '')
    setDetails(item.details || '')
    setPriority(item.priority || 'Medium')
    setAudience(item.audience || 'All Users')
    setStartDate(toDatetimeLocal(item.startDate))
    setEndDate(toDatetimeLocal(item.endDate))
    setStatus(item.status || 'Published')
    setImageUrl(item.imageUrl || '')
    setImagePreview(item.imageUrl || '')
    setImageFile(null)
    setIsFormModalOpen(true)
  }

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview('')
    setImageUrl('')
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Please enter an announcement title')
      return
    }
    if (!details.trim()) {
      toast.error('Please enter announcement details / description')
      return
    }

    setIsSubmitting(true)
    let finalImageUrl = imageUrl.trim()

    // If a new local file was selected, upload it
    if (imageFile) {
      const uploadToast = toast.loading('Uploading announcement image...')
      try {
        const formData = new FormData()
        formData.append('file', imageFile)
        const uploadRes = await fetch(`${API_BASE}/api/upload/image`, {
          method: 'POST',
          body: formData
        })
        const uploadData = await uploadRes.json()
        if (uploadRes.ok && uploadData.url) {
          finalImageUrl = uploadData.url
          toast.success('Image uploaded successfully', { id: uploadToast })
        } else {
          toast.error(uploadData.message || 'Image upload failed', { id: uploadToast })
          setIsSubmitting(false)
          return
        }
      } catch (err) {
        console.error('Error uploading image:', err)
        toast.error('Image upload failed', { id: uploadToast })
        setIsSubmitting(false)
        return
      }
    }

    const payload = {
      title: title.trim(),
      details: details.trim(),
      imageUrl: finalImageUrl || null,
      priority,
      audience,
      startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : null,
      status
    }

    try {
      let res, data
      if (editingItem) {
        res = await fetch(`${API_BASE}/api/admin/announcements/${editingItem._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        data = await res.json()
        if (res.ok && data.success) {
          toast.success('Announcement updated successfully!')
          setAnnouncements(prev => prev.map(a => a._id === editingItem._id ? data.announcement : a))
          setIsFormModalOpen(false)
          resetForm()
        } else {
          toast.error(data.message || 'Failed to update announcement')
        }
      } else {
        res = await fetch(`${API_BASE}/api/admin/announcements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        data = await res.json()
        if (res.ok && data.success) {
          toast.success('Announcement created and published!')
          setAnnouncements(prev => [data.announcement, ...prev])
          setIsFormModalOpen(false)
          resetForm()
        } else {
          toast.error(data.message || 'Failed to create announcement')
        }
      }
    } catch (err) {
      console.error('Error saving announcement:', err)
      toast.error('Network error saving announcement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (item) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/announcements/${item._id}/toggle-status`, {
        method: 'PATCH'
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Status updated')
        setAnnouncements(prev => prev.map(a => a._id === item._id ? data.announcement : a))
      } else {
        toast.error(data.message || 'Failed to update status')
      }
    } catch (err) {
      console.error('Error toggling status:', err)
      toast.error('Failed to change status')
    }
  }

  const confirmDelete = (item) => {
    setDeleteTarget(item)
    setIsConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/announcements/${deleteTarget._id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setAnnouncements(prev => prev.filter(a => a._id !== deleteTarget._id))
        toast.success('Announcement deleted successfully.')
      } else {
        toast.error(data.message || 'Failed to delete announcement')
      }
    } catch (err) {
      console.error('Error deleting announcement:', err)
      toast.error('Error deleting announcement')
    } finally {
      setIsConfirmOpen(false)
      setDeleteTarget(null)
    }
  }

  // Filtered List
  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch = 
      (a.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.details || '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter
    const matchesAudience = audienceFilter === 'All' || a.audience === audienceFilter
    return matchesSearch && matchesStatus && matchesAudience
  })

  // Helper to determine real-time activity status
  const getScheduleStatus = (item) => {
    if (item.status === 'Paused') {
      return { label: 'Paused', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' }
    }
    const now = new Date()
    const start = item.startDate ? new Date(item.startDate) : null
    const end = item.endDate ? new Date(item.endDate) : null

    if (start && now < start) {
      return { label: 'Scheduled', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' }
    }
    if (end && now > end) {
      return { label: 'Expired', color: 'bg-muted text-muted-foreground border-border' }
    }
    return { label: 'Active Now', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', isLive: true }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <Megaphone className="w-7 h-7 text-primary" /> Announcements & Broadcasts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create, schedule, pause/resume, and manage system-wide popup announcements for students and mentors.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button 
            onClick={fetchAnnouncements}
            className="p-2.5 bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 rounded-xl transition-colors shadow-sm"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleOpenCreateModal}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-primary/20 text-sm cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" /> New Announcement
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Announcements</p>
            <p className="text-2xl font-black text-foreground mt-0.5">{announcements.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Megaphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Currently Published</p>
            <p className="text-2xl font-black text-emerald-500 mt-0.5">
              {announcements.filter(a => a.status === 'Published').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <Check className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Paused / Inactive</p>
            <p className="text-2xl font-black text-amber-500 mt-0.5">
              {announcements.filter(a => a.status === 'Paused').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <Pause className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements by title or description..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/40 px-2 py-1 rounded-xl border border-border/50">
            <span>Status:</span>
            {['All', 'Published', 'Paused'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === s
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Audience filter */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/40 px-2 py-1 rounded-xl border border-border/50">
            <span>Audience:</span>
            {['All', 'All Users', 'Students', 'Mentors'].map((aud) => (
              <button
                key={aud}
                onClick={() => setAudienceFilter(aud)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  audienceFilter === aud
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {aud}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Announcements Table */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <AdminSpinner message="Loading announcements..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="whitespace-nowrap w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3.5">Announcement</th>
                  <th className="px-4 py-3.5">Target Audience</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Active Period</th>
                  <th className="px-4 py-3.5">Live Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {filteredAnnouncements.length > 0 ? (
                  filteredAnnouncements.map((a) => {
                    const sched = getScheduleStatus(a)
                    return (
                      <tr key={a._id} className="hover:bg-muted/20 transition-colors group">
                        {/* Announcement Info */}
                        <td className="px-5 py-3.5 max-w-[320px]">
                          <div className="flex items-center gap-3">
                            {/* Thumbnail */}
                            {a.imageUrl ? (
                              <div 
                                onClick={() => setPreviewImageModal(a.imageUrl)}
                                className="w-12 h-12 rounded-xl border border-border overflow-hidden shrink-0 cursor-pointer relative group/img bg-muted shadow-xs"
                                title="Click to view full image"
                              >
                                <img 
                                  src={a.imageUrl} 
                                  alt={a.title} 
                                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="w-3.5 h-3.5 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-xs">
                                <Megaphone className="w-5 h-5" />
                              </div>
                            )}

                            {/* Title & snippet */}
                            <div className="truncate">
                              <p className="font-bold text-foreground truncate text-sm flex items-center gap-1.5" title={a.title}>
                                {a.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-[260px]" title={a.details}>
                                {a.details}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Audience */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted border border-border text-foreground">
                            {a.audience === 'Students' ? (
                              <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                            ) : a.audience === 'Mentors' ? (
                              <Award className="w-3.5 h-3.5 text-cyan-500" />
                            ) : (
                              <Users className="w-3.5 h-3.5 text-purple-500" />
                            )}
                            {a.audience || 'All Users'}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            a.priority === 'High' 
                              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                              : a.priority === 'Medium' 
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                              : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          }`}>
                            {a.priority || 'Medium'}
                          </span>
                        </td>

                        {/* Active Period */}
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 text-foreground font-medium">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              {a.startDate ? new Date(a.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Immediate'}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              until {a.endDate ? new Date(a.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Indefinite'}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${sched.color}`}>
                            {sched.isLive && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                            {sched.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Pause / Resume */}
                            <button
                              onClick={() => handleToggleStatus(a)}
                              className={`p-2 rounded-lg transition-colors inline-flex items-center justify-center ${
                                a.status === 'Published'
                                  ? 'text-amber-500 hover:bg-amber-500/10'
                                  : 'text-emerald-500 hover:bg-emerald-500/10'
                              }`}
                              title={a.status === 'Published' ? 'Pause announcement (hide from users)' : 'Resume announcement (publish)'}
                            >
                              {a.status === 'Published' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEditModal(a)}
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex items-center justify-center"
                              title="Edit Announcement"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button 
                              onClick={() => confirmDelete(a)}
                              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex items-center justify-center"
                              title="Delete Announcement"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Megaphone className="w-8 h-8 text-muted-foreground/40 stroke-1" />
                        <p className="font-semibold text-foreground">No announcements found</p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {search || statusFilter !== 'All' || audienceFilter !== 'All'
                            ? 'No announcements match your current filter criteria.'
                            : 'Get started by creating your first announcement popup for students or mentors.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isFormModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">
                    {editingItem ? 'Edit Announcement' : 'Create New Announcement'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configure the popup announcement displayed on user dashboards.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsFormModalOpen(false)
                  resetForm()
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                  Announcement Title <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Annual Tech Fest Registration is Now Live!"
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground font-medium"
                />
              </div>

              {/* Target Audience & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                    Target Audience
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground font-medium"
                  >
                    <option value="All Users">All Users (Students & Mentors)</option>
                    <option value="Students">Students Only</option>
                    <option value="Mentors">Mentors Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground font-medium"
                  >
                    <option value="Low">Low (Informational)</option>
                    <option value="Medium">Medium (Standard)</option>
                    <option value="High">High (Urgent / Important)</option>
                  </select>
                </div>
              </div>

              {/* Schedule Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> Start Date & Time
                  </label>
                  <input 
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Announcement becomes visible on user dashboard from this date.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" /> End Date & Time (Optional)
                  </label>
                  <input 
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Automatically stops showing after this date.
                  </p>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                  Initial Status
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-foreground">
                    <input 
                      type="radio" 
                      name="status" 
                      value="Published" 
                      checked={status === 'Published'} 
                      onChange={() => setStatus('Published')}
                      className="accent-primary w-4 h-4"
                    />
                    Published (Active)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-foreground">
                    <input 
                      type="radio" 
                      name="status" 
                      value="Paused" 
                      checked={status === 'Paused'} 
                      onChange={() => setStatus('Paused')}
                      className="accent-primary w-4 h-4"
                    />
                    Paused (Draft / Inactive)
                  </label>
                </div>
              </div>

              {/* Image Upload or URL */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  Announcement Banner Image (Optional)
                </label>

                {imagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-muted/40 flex items-center justify-center p-2 min-h-[140px] max-h-[320px] group">
                    {/* Ambient blur background for smooth presentation of any aspect ratio */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center blur-2xl opacity-25 scale-125 pointer-events-none"
                      style={{ backgroundImage: `url(${imagePreview})` }}
                    />
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="relative z-10 max-h-[300px] w-auto max-w-full object-contain rounded-xl shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-3 right-3 z-20 p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-lg transition-colors shadow-md cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* File Upload Button */}
                    <label className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-colors bg-muted/10 hover:bg-muted/30">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-foreground">Upload Image File</span>
                      <span className="text-[10px] text-muted-foreground">PNG, JPG, WEBP (Max 5MB)</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>

                    {/* Or URL Input */}
                    <div className="flex flex-col justify-center">
                      <span className="text-xs text-muted-foreground mb-1">Or paste image URL:</span>
                      <div className="relative">
                        <ImageIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input 
                          type="url"
                          value={imageUrl}
                          onChange={(e) => {
                            setImageUrl(e.target.value)
                            setImagePreview(e.target.value)
                          }}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Details Textarea */}
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                  Announcement Details / Description <span className="text-rose-500">*</span>
                </label>
                <textarea 
                  required
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide complete details, objective, guidelines, links, or instructions that will be visible in the user's dashboard popup modal..."
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground resize-y leading-relaxed font-normal"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsFormModalOpen(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {editingItem ? 'Save Changes' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {previewImageModal && (
        <ModalPortal>
          <div 
            onClick={() => setPreviewImageModal(null)}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer animate-in fade-in duration-150"
          >
            <div className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-card">
              <img 
                src={previewImageModal} 
                alt="Full Preview" 
                className="w-full h-auto max-h-[85vh] object-contain"
              />
              <button 
                onClick={() => setPreviewImageModal(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setDeleteTarget(null)
        }}
        onConfirm={handleDelete}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone and it will no longer be shown to users.`}
      />
    </div>
  )
}

export default AdminAnnouncements
