import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSpinner from '../../components/admin/AdminSpinner'
import { 
  Check, 
  X, 
  FileText, 
  ShieldCheck, 
  Loader2, 
  Briefcase, 
  GraduationCap, 
  AlertCircle, 
  AlertTriangle, 
  Ban, 
  Trash2, 
  Star, 
  Send, 
  Mail, 
  Info 
} from 'lucide-react'
import toast from 'react-hot-toast'
import RemarkModal from '../../components/modals/RemarkModal'
import ConfirmModal from '../../components/modals/ConfirmModal'
import API_BASE from '../../utils/api'

const AdminVerification = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Approved')
  const [verifications, setVerifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMentor, setSelectedMentor] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  
  // Remark Modal state (for Rejecting verification)
  const [remarkModal, setRemarkModal] = useState({ isOpen: false, action: null, target: null, title: '', placeholder: '', buttonText: '' })

  // Block Modal state
  const [blockModal, setBlockModal] = useState({ isOpen: false, mentor: null, reason: '', isSubmitting: false })

  // Warn Modal state
  const [warnModal, setWarnModal] = useState({ isOpen: false, mentor: null, subject: 'Notice from Administration: Community Guidelines', message: '', isSubmitting: false })

  // Confirm Delete Modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, mentor: null, isSubmitting: false })

  // Fetch verifications & mentors from backend
  const fetchVerifications = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE}/api/admin/verifications`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.verifications)) {
          setVerifications(data.verifications)
        }
      } else {
        toast.error('Failed to load mentor verification records')
      }
    } catch (err) {
      console.error('Error fetching verifications:', err)
      toast.error('Server error while loading verifications')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVerifications()
  }, [])

  // Handle Approve or Reject
  const handleAction = (id, newStatus, name) => {
    if (newStatus === 'Approved') {
      submitStatus(id, name, newStatus, '')
    } else {
      setRemarkModal({
        isOpen: true,
        action: newStatus,
        target: { id, name },
        title: `Confirm Action: ${newStatus}`,
        placeholder: `Enter remark for ${newStatus}...`,
        buttonText: 'Confirm'
      })
    }
  }

  const submitStatus = async (id, name, action, remark = '') => {
    try {
      setUpdatingId(id)
      const res = await fetch(`${API_BASE}/api/admin/verifications/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action, remark })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setVerifications(prev => prev.map(v => v.id === id ? { ...v, status: action, isVerified: action === 'Approved' } : v))
        if (selectedMentor && selectedMentor.id === id) {
          setSelectedMentor(prev => prev ? { ...prev, status: action, isVerified: action === 'Approved' } : null)
        }
        if (action === 'Approved') {
          toast.success(`${name} has been successfully verified!`)
        } else {
          toast.error(`${name}'s verification was set to ${action}.`)
        }
      } else {
        toast.error(data.message || 'Failed to update verification status')
      }
    } catch (err) {
      console.error('Error updating verification status:', err)
      toast.error('Failed to communicate with server')
    } finally {
      setUpdatingId(null)
      setRemarkModal({ isOpen: false, action: null, target: null, title: '', placeholder: '', buttonText: '' })
    }
  }

  const handleRemarkSubmit = async (remark) => {
    const { action, target } = remarkModal
    if (!target) return
    await submitStatus(target.id, target.name, action, remark)
  }

  // --- MENTOR BLOCK / UNBLOCK HANDLERS ---
  const handleOpenBlockModal = (mentor) => {
    setBlockModal({
      isOpen: true,
      mentor,
      reason: mentor.blockReason || '',
      isSubmitting: false
    })
  }

  const handleConfirmBlock = async () => {
    const { mentor, reason } = blockModal
    if (!mentor) return

    try {
      setBlockModal(prev => ({ ...prev, isSubmitting: true }))
      const res = await fetch(`${API_BASE}/api/admin/users/${mentor.id}/block`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: true, blockReason: reason })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setVerifications(prev => prev.map(v => v.id === mentor.id ? { ...v, isBlocked: true, blockReason: reason } : v))
        toast.success(`Mentor ${mentor.name} has been blocked.`)
        setBlockModal({ isOpen: false, mentor: null, reason: '', isSubmitting: false })
      } else {
        toast.error(data.message || 'Failed to block mentor')
      }
    } catch (err) {
      console.error('Error blocking mentor:', err)
      toast.error('Server error while blocking mentor')
    } finally {
      setBlockModal(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  const handleUnblockMentor = async (mentor) => {
    try {
      setUpdatingId(mentor.id)
      const res = await fetch(`${API_BASE}/api/admin/users/${mentor.id}/block`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: false, blockReason: '' })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setVerifications(prev => prev.map(v => v.id === mentor.id ? { ...v, isBlocked: false, blockReason: '' } : v))
        toast.success(`Mentor ${mentor.name} has been unblocked.`)
      } else {
        toast.error(data.message || 'Failed to unblock mentor')
      }
    } catch (err) {
      console.error('Error unblocking mentor:', err)
      toast.error('Server error while unblocking mentor')
    } finally {
      setUpdatingId(null)
    }
  }

  // --- SEND WARNING HANDLERS ---
  const handleOpenWarnModal = (mentor) => {
    setWarnModal({
      isOpen: true,
      mentor,
      subject: 'Notice from Administration: Policy Compliance',
      message: '',
      isSubmitting: false
    })
  }

  const handleSendWarning = async () => {
    const { mentor, subject, message } = warnModal
    if (!mentor) return
    if (!message.trim()) {
      toast.error('Please enter a warning message')
      return
    }

    try {
      setWarnModal(prev => ({ ...prev, isSubmitting: true }))
      const res = await fetch(`${API_BASE}/api/admin/users/${mentor.id}/warn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warningSubject: subject, warningMessage: message })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(`Warning email and notification sent to ${mentor.name}!`)
        setWarnModal({ isOpen: false, mentor: null, subject: '', message: '', isSubmitting: false })
      } else {
        toast.error(data.message || 'Failed to send warning')
      }
    } catch (err) {
      console.error('Error sending warning:', err)
      toast.error('Server error while sending warning')
    } finally {
      setWarnModal(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  // --- PERMANENT DELETE HANDLERS ---
  const handleOpenDeleteModal = (mentor) => {
    setDeleteModal({
      isOpen: true,
      mentor,
      isSubmitting: false
    })
  }

  const handleConfirmDelete = async () => {
    const { mentor } = deleteModal
    if (!mentor) return

    try {
      setDeleteModal(prev => ({ ...prev, isSubmitting: true }))
      const res = await fetch(`${API_BASE}/api/admin/users/${mentor.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (res.ok && data.success) {
        setVerifications(prev => prev.filter(v => v.id !== mentor.id))
        toast.success(`Mentor ${mentor.name} has been permanently removed.`)
        setDeleteModal({ isOpen: false, mentor: null, isSubmitting: false })
      } else {
        toast.error(data.message || 'Failed to remove mentor')
      }
    } catch (err) {
      console.error('Error deleting mentor:', err)
      toast.error('Server error while removing mentor')
    } finally {
      setDeleteModal(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  const counts = {
    Approved: verifications.filter(v => v.status === 'Approved').length,
    Pending: verifications.filter(v => v.status === 'Pending').length,
    Rejected: verifications.filter(v => v.status === 'Rejected').length,
  }

  const currentList = verifications.filter(v => v.status === activeTab)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Mentor Verification</h1>
          <p className="text-muted-foreground text-sm mt-1">Review active mentors, verify credentials, and moderate mentor accounts.</p>
        </div>
        <button 
          onClick={fetchVerifications}
          disabled={isLoading}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-muted border border-border/60 text-foreground hover:bg-muted/80 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-primary" />}
          Refresh List
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50 gap-2 overflow-x-auto">
        {[
          { key: 'Approved', label: 'Active Mentors' },
          { key: 'Pending', label: 'Pending Requests' },
          { key: 'Rejected', label: 'Rejected' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-3 text-sm font-bold border-b-2 px-4 transition-all relative whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === key 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label} 
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
              activeTab === key ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted border-border/40 text-muted-foreground'
            }`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <AdminSpinner message="Loading mentor directory & verification records..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentList.length > 0 ? (
            currentList.map((mentor) => (
              <div 
                key={mentor.id} 
                className={`bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full relative overflow-hidden ${
                  mentor.isBlocked ? 'border-rose-500/40 bg-rose-500/[0.02]' : 'border-border/50'
                }`}
              >
                {/* Top Corner Status Badge */}
                {mentor.isBlocked ? (
                  <div className="absolute top-0 right-0 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-rose-500/20 flex items-center gap-1">
                    <Ban className="w-3 h-3" /> Blocked
                  </div>
                ) : mentor.status === 'Approved' ? (
                  <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </div>
                ) : mentor.status === 'Rejected' ? (
                  <div className="absolute top-0 right-0 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-rose-500/20 flex items-center gap-1">
                    <X className="w-3 h-3" /> Rejected
                  </div>
                ) : null}

                {/* Main Card Body */}
                <div>
                  {/* Top: Small Circular Avatar + User Info */}
                  <div className="flex gap-4 items-start">
                    <img 
                      src={mentor.image} 
                      alt={mentor.name} 
                      onClick={() => navigate(`/admin/users/${mentor.username || mentor.clerkId || mentor.id}`)}
                      className="rounded-full object-cover border border-border/40 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/40 hover:opacity-90 transition-all shadow-sm"
                      style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px' }}
                      title="View Profile"
                    />
                    <div className="space-y-1 min-w-0 flex-1 pr-14">
                      <h3 
                        onClick={() => navigate(`/admin/users/${mentor.username || mentor.clerkId || mentor.id}`)}
                        className="font-bold text-foreground flex items-center gap-1.5 text-base truncate cursor-pointer hover:text-primary transition-colors"
                        title="View Profile"
                      >
                        {mentor.name}
                        {mentor.status === 'Approved' && !mentor.isBlocked && (
                          <ShieldCheck className="w-4 h-4 text-emerald-500 fill-emerald-500/10 shrink-0" />
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">{mentor.email}</p>
                      <p className="text-xs font-semibold text-foreground bg-muted inline-block px-2.5 py-1 rounded-lg border border-border/50 mt-1 max-w-full truncate">
                        {mentor.role} at {mentor.company}
                      </p>
                    </div>
                  </div>

                  {/* Rating & Mentees row (Active Mentors) */}
                  {mentor.status === 'Approved' && (
                    <div className="flex items-center justify-between mt-4 px-0.5 text-xs">
                      <div 
                        className="flex items-center gap-1 font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20"
                        title={mentor.totalRatings > 0 ? `${mentor.totalRatings} review(s)` : 'No ratings yet'}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" /> 
                        {mentor.rating > 0 ? mentor.rating.toFixed(1) : '0'}
                        {mentor.totalRatings > 0 && (
                          <span className="text-[10px] text-amber-500/80 font-normal">({mentor.totalRatings})</span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        Mentees: <strong className="text-primary">{mentor.activeMentees || 0} active</strong>
                      </span>
                    </div>
                  )}

                  {/* Block reason notice */}
                  {mentor.isBlocked && (
                    <div className="mt-3 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-bold text-rose-600 dark:text-rose-400">Blocked:</span>{' '}
                        <span className="text-rose-600/90 dark:text-rose-300/90">{mentor.blockReason || 'Account paused by administrator'}</span>
                      </div>
                    </div>
                  )}

                  {/* Graduation & Experience Stats */}
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/40 text-xs">
                    <div>
                      <span className="text-muted-foreground block mb-0.5 font-medium">Graduated</span>
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-primary" /> {mentor.gradYear}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5 font-medium">Experience</span>
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-primary" /> {mentor.experience}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-6 pt-3 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigate(`/admin/users/${mentor.username || mentor.clerkId || mentor.id}`)}
                      className="px-3 py-1.5 border border-border/60 hover:bg-muted text-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      title="View User Profile"
                    >
                      <FileText className="w-3.5 h-3.5" /> Profile
                    </button>
                    <button 
                      onClick={() => setSelectedMentor(mentor)}
                      className="px-2.5 py-1.5 border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      title="View Bio & Credentials"
                    >
                      <Info className="w-3.5 h-3.5" /> Details
                    </button>
                  </div>

                  {activeTab === 'Approved' && (
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleOpenWarnModal(mentor)}
                        className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        title="Send Official Warning"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Warn
                      </button>

                      {mentor.isBlocked ? (
                        <button 
                          disabled={updatingId === mentor.id}
                          onClick={() => handleUnblockMentor(mentor)}
                          className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Unblock Mentor"
                        >
                          {updatingId === mentor.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />} Unblock
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleOpenBlockModal(mentor)}
                          className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          title="Block / Pause Mentor"
                        >
                          <Ban className="w-3.5 h-3.5" /> Block
                        </button>
                      )}

                      <button 
                        onClick={() => handleOpenDeleteModal(mentor)}
                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                        title="Permanently Remove Mentor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {activeTab === 'Pending' && (
                    <div className="flex items-center gap-2">
                      <button 
                        disabled={updatingId === mentor.id}
                        onClick={() => handleAction(mentor.id, 'Approved', mentor.name)}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm shadow-emerald-500/10 disabled:opacity-50 cursor-pointer"
                      >
                        {updatingId === mentor.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
                      </button>
                      <button 
                        disabled={updatingId === mentor.id}
                        onClick={() => handleAction(mentor.id, 'Rejected', mentor.name)}
                        className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm shadow-rose-500/10 disabled:opacity-50 cursor-pointer"
                      >
                        {updatingId === mentor.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />} Reject
                      </button>
                    </div>
                  )}

                  {activeTab === 'Rejected' && (
                    <div className="flex items-center gap-2">
                      <button 
                        disabled={updatingId === mentor.id}
                        onClick={() => handleAction(mentor.id, 'Approved', mentor.name)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      >
                        Re-Approve
                      </button>
                      <button 
                        onClick={() => handleOpenDeleteModal(mentor)}
                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                        title="Delete Mentor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 py-16 text-center text-muted-foreground bg-card border border-border/50 rounded-2xl flex flex-col items-center justify-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <p className="font-semibold text-sm">No mentor records found in "{activeTab === 'Approved' ? 'Active Mentors' : activeTab}".</p>
              <p className="text-xs text-muted-foreground mt-1">Verified and registered mentors will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* Mentor Profile Details Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/60 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setSelectedMentor(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex gap-4 items-center border-b border-border/40 pb-6">
              <img 
                src={selectedMentor.image} 
                alt={selectedMentor.name} 
                className="rounded-full object-cover border-2 border-primary/20"
                style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px' }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{selectedMentor.name}</h2>
                  {selectedMentor.status === 'Approved' && (
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Mentor
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedMentor.email}</p>
                <p className="text-xs font-semibold text-primary bg-primary/10 inline-block px-3 py-1 rounded-lg border border-primary/20 mt-2">
                  {selectedMentor.role} at {selectedMentor.company}
                </p>
              </div>
            </div>

            {/* Profile Grid Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-muted/50 p-3.5 rounded-xl border border-border/40">
                <span className="text-muted-foreground block mb-1 font-medium">Graduation Year</span>
                <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-primary" /> {selectedMentor.gradYear}
                </span>
              </div>
              <div className="bg-muted/50 p-3.5 rounded-xl border border-border/40">
                <span className="text-muted-foreground block mb-1 font-medium">Total Experience</span>
                <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-primary" /> {selectedMentor.experience}
                </span>
              </div>
            </div>

            {/* About / Bio */}
            {selectedMentor.aboutMe && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">About Mentor</h4>
                <p className="text-xs text-foreground bg-muted/30 p-3.5 rounded-xl border border-border/40 leading-relaxed">
                  {selectedMentor.aboutMe}
                </p>
              </div>
            )}

            {/* Work Experience History */}
            {selectedMentor.experienceList && selectedMentor.experienceList.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Work Experience</h4>
                <div className="space-y-2">
                  {selectedMentor.experienceList.map((exp, idx) => (
                    <div key={idx} className="bg-muted/30 p-3 rounded-xl border border-border/40 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-foreground">
                        <span>{exp.title}</span>
                        <span className="text-primary">{exp.duration}</span>
                      </div>
                      <p className="text-muted-foreground font-semibold">{exp.company}</p>
                      {exp.description && <p className="text-muted-foreground leading-snug">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {selectedMentor.skills && selectedMentor.skills.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Expertise &amp; Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMentor.skills.map((skill, idx) => (
                    <span key={idx} className="text-xs font-medium bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border/40">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions in Modal */}
            <div className="pt-4 border-t border-border/40 flex justify-between items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Status: <strong className={`font-bold ${
                  selectedMentor.status === 'Approved' ? 'text-emerald-500' : selectedMentor.status === 'Rejected' ? 'text-rose-500' : 'text-amber-500'
                }`}>{selectedMentor.status}</strong>
              </span>

              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setSelectedMentor(null)
                    navigate(`/admin/users/${selectedMentor.username || selectedMentor.clerkId || selectedMentor.id}`)
                  }}
                  className="px-4 py-2 border border-border/60 hover:bg-muted text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Full Profile
                </button>
                {selectedMentor.status !== 'Approved' && (
                  <button 
                    onClick={() => handleAction(selectedMentor.id, 'Approved', selectedMentor.name)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Mentor Modal */}
      {blockModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/60 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Block Mentor</h3>
                <p className="text-xs text-muted-foreground">Restrict {blockModal.mentor?.name} from mentor privileges</p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-foreground">Reason for Restriction / Pause</label>
              <textarea 
                value={blockModal.reason}
                onChange={(e) => setBlockModal({ ...blockModal, reason: e.target.value })}
                placeholder="e.g. Conduct issue, policy violation, or pause on request..."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-foreground"
              />
              <p className="text-[11px] text-muted-foreground">This reason will be recorded on the mentor's account and visible to administrators.</p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <button 
                type="button"
                onClick={() => setBlockModal({ isOpen: false, mentor: null, reason: '', isSubmitting: false })}
                className="px-4 py-2 border border-border/60 text-foreground text-xs font-bold rounded-xl hover:bg-muted transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                disabled={blockModal.isSubmitting}
                onClick={handleConfirmBlock}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {blockModal.isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Warning Modal */}
      {warnModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/60 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Send Official Warning</h3>
                <p className="text-xs text-muted-foreground">To {warnModal.mentor?.name} ({warnModal.mentor?.email})</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Subject</label>
                <input 
                  type="text"
                  value={warnModal.subject}
                  onChange={(e) => setWarnModal({ ...warnModal, subject: e.target.value })}
                  placeholder="Subject of warning..."
                  className="w-full px-3.5 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Warning Message / Details</label>
                <textarea 
                  value={warnModal.message}
                  onChange={(e) => setWarnModal({ ...warnModal, message: e.target.value })}
                  placeholder="Specify the violation or guidance the mentor must follow..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-foreground"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>This will trigger an in-app system notification and an official email to the mentor's registered address.</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <button 
                type="button"
                onClick={() => setWarnModal({ isOpen: false, mentor: null, subject: '', message: '', isSubmitting: false })}
                className="px-4 py-2 border border-border/60 text-foreground text-xs font-bold rounded-xl hover:bg-muted transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                disabled={warnModal.isSubmitting}
                onClick={handleSendWarning}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {warnModal.isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send Warning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Permanent Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, mentor: null, isSubmitting: false })}
        onConfirm={handleConfirmDelete}
        title="Permanently Remove Mentor"
        message={`Are you sure you want to permanently delete mentor "${deleteModal.mentor?.name}"? All associated profile records, credentials, and user data will be wiped from the platform.`}
      />

      {/* Remark Modal for Rejection */}
      <RemarkModal
        isOpen={remarkModal.isOpen}
        onClose={() => setRemarkModal({ ...remarkModal, isOpen: false })}
        onSubmit={handleRemarkSubmit}
        title={remarkModal.title}
        placeholder={remarkModal.placeholder}
        actionLabel={remarkModal.buttonText}
      />
    </div>
  )
}

export default AdminVerification
