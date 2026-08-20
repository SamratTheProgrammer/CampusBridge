import React, { useState, useEffect } from 'react'
import { Plus, Search, Trash2, CheckCircle2, AlertCircle, Loader2, X, Briefcase, MapPin, DollarSign, Building, Pause } from 'lucide-react'
import toast from 'react-hot-toast'
import RemarkModal from '../../components/modals/RemarkModal'
import API_BASE from '../../utils/api'

const AdminJobs = () => {
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  
  // Modal states
  const [remarkModal, setRemarkModal] = useState({ isOpen: false, action: null, target: null, title: '', placeholder: '', buttonText: '' })

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCompanyOption, setSelectedCompanyOption] = useState('')
  const [customCompany, setCustomCompany] = useState('')

  const DEFAULT_COMPANIES = [
    'Google', 'Microsoft', 'Amazon', 'Adobe', 'Apple', 'Meta', 'Netflix',
    'TechNova Inc.', 'ByteShift Solutions', 'Creative Minds', 'AI Labs',
    'CloudScale', 'TCS', 'Infosys', 'Wipro', 'Cognizant', 'Accenture',
    'Flipkart', 'Swiggy', 'Zomato'
  ]

  const companyOptions = Array.from(new Set([
    ...DEFAULT_COMPANIES,
    ...jobs.map(j => j.company).filter(Boolean)
  ])).sort()

  const [newJobData, setNewJobData] = useState({
    title: '',
    company: '',
    location: 'Remote',
    type: 'Full-time',
    salary: '',
    description: '',
    status: 'Approved'
  })

  // Fetch jobs from backend
  const fetchJobs = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE}/api/admin/jobs`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.jobs)) {
          setJobs(data.jobs)
        }
      } else {
        toast.error('Failed to load jobs')
      }
    } catch (err) {
      console.error('Error fetching admin jobs:', err)
      toast.error('Server error while loading jobs')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  // Confirm delete handler
  const confirmDelete = (id, title) => {
    setRemarkModal({
      isOpen: true,
      action: 'delete',
      target: { id, title },
      title: 'Delete Job',
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
        const res = await fetch(`${API_BASE}/api/admin/moderate/job/${target.id}?remark=${encodeURIComponent(remark)}`, { method: 'DELETE' })
        const data = await res.json()
        if (res.ok && data.success) {
          setJobs(prev => prev.filter(j => (j.id || j._id) !== target.id))
          toast.success(`Job "${target.title}" deleted successfully.`)
        } else {
          toast.error(data.message || 'Failed to delete job')
        }
      } catch (err) {
        console.error('Error deleting job:', err)
        toast.error('Failed to communicate with server')
      }
    } else {
      try {
        const isModeration = action === 'paused' || action === 'approved';
        const endpoint = isModeration 
          ? `${API_BASE}/api/admin/moderate/job/${target.id}/status`
          : `${API_BASE}/api/admin/jobs/${target.id}/status`;
        
        const payload = { status: action, remark };

        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        const data = await res.json()
        if (res.ok && data.success) {
          if (isModeration) {
            setJobs(prev => prev.map(j => (j.id || j._id) === target.id ? { ...j, moderationStatus: action } : j))
          } else {
            setJobs(prev => prev.map(j => (j.id || j._id) === target.id ? { ...j, status: action } : j))
          }
          toast.success(`Job status changed to ${action}`)
        } else {
          toast.error(data.message || 'Failed to update job status')
        }
      } catch (err) {
        console.error('Error updating status:', err)
        toast.error('Failed to communicate with server')
      }
    }
    
    setRemarkModal({ isOpen: false, action: null, target: null, title: '', placeholder: '', buttonText: '' })
  }

  // Submit new job form
  const handleCreateJob = async (e) => {
    e.preventDefault()
    if (!newJobData.title.trim() || !newJobData.company.trim()) {
      toast.error('Title and Company are required')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await fetch(`${API_BASE}/api/admin/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJobData)
      })

      const data = await res.json()
      if (res.ok && data.success && data.job) {
        setJobs(prev => [data.job, ...prev])
        toast.success('New job post created successfully!')
        setIsAddModalOpen(false)
        setSelectedCompanyOption('')
        setCustomCompany('')
        setNewJobData({
          title: '',
          company: '',
          location: 'Remote',
          type: 'Full-time',
          salary: '',
          description: '',
          status: 'Approved'
        })
      } else {
        toast.error(data.message || 'Failed to create job post')
      }
    } catch (err) {
      console.error('Error creating job:', err)
      toast.error('Failed to connect to backend server')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || j.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Jobs Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and moderate job / internship postings submitted by partners.</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button 
            onClick={fetchJobs}
            disabled={isLoading}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-muted border border-border/60 text-foreground hover:bg-muted/80 transition-all flex items-center gap-1.5"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Refresh
          </button>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 flex items-center gap-2 transition-all shadow-md shadow-primary/10 text-xs sm:text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Job
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search job title or company..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-foreground text-xs font-semibold focus:outline-none cursor-pointer appearance-none min-w-[140px] w-full md:w-auto"
        >
          <option value="All">All Status</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Jobs Table */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Loading job postings from database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="whitespace-nowrap w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Job Title</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Posted On</th>
                  <th className="px-6 py-4">Applications</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">
                        <div>
                          <span className="block text-foreground font-bold">{job.title}</span>
                          <span className="text-[11px] text-muted-foreground font-normal">{job.type} • {job.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-medium">{job.company}</td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">{job.posted}</td>
                      <td className="px-6 py-4 text-foreground font-semibold">{job.applications}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          job.moderationStatus === 'paused'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : job.status === 'Approved' 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : job.status === 'Pending' 
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          {job.moderationStatus === 'paused' ? 'Paused' : job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        {job.moderationStatus !== 'paused' ? (
                          <button 
                            onClick={() => handleStatusChange(job.id || job._id, 'paused')}
                            className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Pause Job"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleStatusChange(job.id || job._id, 'approved')}
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Approve Job"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {job.status !== 'Approved' && job.moderationStatus !== 'paused' && (
                          <button 
                            onClick={() => handleStatusChange(job.id || job._id, 'Approved')}
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Approve Post"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {job.status === 'Approved' && job.moderationStatus !== 'paused' && (
                          <button 
                            onClick={() => handleStatusChange(job.id || job._id, 'Pending')}
                            className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Set Pending"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => confirmDelete(job.id || job._id, job.title)}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="Delete Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                      No jobs found matching constraints.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Job Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/60 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-xl font-extrabold text-foreground">Add New Job Post</h2>
              <p className="text-xs text-muted-foreground mt-1">Fill in the details to publish a new job or internship opportunity.</p>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">Job Title *</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Senior Frontend Engineer"
                    value={newJobData.title}
                    onChange={(e) => setNewJobData({ ...newJobData, title: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-muted/40 border border-border/50 rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">Company Name *</label>
                  <select 
                    required
                    value={selectedCompanyOption}
                    onChange={(e) => {
                      const val = e.target.value
                      setSelectedCompanyOption(val)
                      if (val !== 'Other') {
                        setNewJobData({ ...newJobData, company: val })
                      } else {
                        setNewJobData({ ...newJobData, company: customCompany })
                      }
                    }}
                    className="w-full px-3 py-2 bg-muted/40 border border-border/50 rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    <option value="" disabled>-- Select Company --</option>
                    {companyOptions.map((comp) => (
                      <option key={comp} value={comp}>{comp}</option>
                    ))}
                    <option value="Other">+ Other (Custom Company)</option>
                  </select>

                  {selectedCompanyOption === 'Other' && (
                    <input 
                      type="text" 
                      required
                      placeholder="Type custom company name..."
                      value={customCompany}
                      onChange={(e) => {
                        setCustomCompany(e.target.value)
                        setNewJobData({ ...newJobData, company: e.target.value })
                      }}
                      className="w-full px-3 py-2 mt-2 bg-muted/40 border border-border/50 rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="e.g. Bangalore / Remote"
                      value={newJobData.location}
                      onChange={(e) => setNewJobData({ ...newJobData, location: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-muted/40 border border-border/50 rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">Job Type</label>
                  <select 
                    value={newJobData.type}
                    onChange={(e) => setNewJobData({ ...newJobData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border/50 rounded-xl text-foreground text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">Salary / Package</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="e.g. ₹12,00,000 / year"
                      value={newJobData.salary}
                      onChange={(e) => setNewJobData({ ...newJobData, salary: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-muted/40 border border-border/50 rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">Description</label>
                <textarea 
                  rows="3"
                  placeholder="Job description, requirements, and responsibilities..."
                  value={newJobData.description}
                  onChange={(e) => setNewJobData({ ...newJobData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/40 border border-border/50 rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border/40">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-border/60 hover:bg-muted text-foreground font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/10 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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

export default AdminJobs
