import React, { useState } from 'react'
import { Plus, Search, Filter, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/modals/ConfirmModal'

const AdminJobs = () => {
  const [jobs, setJobs] = useState([
    { id: 1, title: 'Frontend Developer', company: 'TechNova Inc.', posted: 'May 28, 2026', applications: 125, status: 'Approved' },
    { id: 2, title: 'Backend Developer', company: 'ByteShift Solutions', posted: 'May 28, 2026', applications: 98, status: 'Approved' },
    { id: 3, title: 'UI/UX Designer', company: 'Creative Minds', posted: 'May 24, 2026', applications: 76, status: 'Pending' },
    { id: 4, title: 'Data Scientist', company: 'AI Labs', posted: 'May 22, 2026', applications: 142, status: 'Approved' },
    { id: 5, title: 'DevOps Engineer', company: 'CloudScale', posted: 'May 20, 2026', applications: 64, status: 'Rejected' },
  ])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const confirmDelete = (id, title) => {
    setDeleteTarget({ id, title })
    setIsConfirmOpen(true)
  }

  const handleDelete = () => {
    if (!deleteTarget) return;
    setJobs(jobs.filter(j => j.id !== deleteTarget.id))
    toast.success('Job posting deleted successfully.')
    setIsConfirmOpen(false)
    setDeleteTarget(null)
  }

  const handleStatusChange = (id, nextStatus) => {
    setJobs(jobs.map(j => {
      if (j.id === id) {
        toast.success(`Job status changed to ${nextStatus}`)
        return { ...j, status: nextStatus }
      }
      return j
    }))
  }

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || j.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Jobs Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and moderate job / internship postings submitted by partners.</p>
        </div>
        <button 
          onClick={() => {
            const title = prompt('Enter Job Title:')
            const company = prompt('Enter Company:')
            if (title && company) {
              setJobs([
                ...jobs, 
                { id: jobs.length + 1, title, company, posted: 'Today', applications: 0, status: 'Approved' }
              ])
              toast.success('New job post created!')
            }
          }}
          className="bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 flex items-center gap-2 transition-all shadow-md shadow-primary/10 text-sm self-start sm:self-auto"
        >
          <Plus className="w-4.5 h-4.5" /> Add Job
        </button>
      </div>

      {/* Filter Options */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
          className="bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-foreground text-xs font-semibold focus:outline-none cursor-pointer appearance-none min-w-[120px] w-full md:w-auto"
        >
          <option value="All">All Status</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Jobs Table */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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
                    <td className="px-6 py-4 font-bold text-foreground">{job.title}</td>
                    <td className="px-6 py-4 text-muted-foreground">{job.company}</td>
                    <td className="px-6 py-4 text-muted-foreground">{job.posted}</td>
                    <td className="px-6 py-4 text-foreground font-semibold">{job.applications}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                        job.status === 'Approved' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : job.status === 'Pending' 
                          ? 'bg-amber-500/10 text-amber-500' 
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      {job.status !== 'Approved' && (
                        <button 
                          onClick={() => handleStatusChange(job.id, 'Approved')}
                          className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors inline-flex items-center justify-center"
                          title="Approve Post"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      {job.status === 'Approved' && (
                        <button 
                          onClick={() => handleStatusChange(job.id, 'Pending')}
                          className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors inline-flex items-center justify-center"
                          title="Set Pending"
                        >
                          <AlertCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => confirmDelete(job.id, job.title)}
                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center justify-center"
                        title="Delete Job"
                      >                      <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                    No jobs matching constraints.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Job Post"
        message={`Are you sure you want to remove job post "${deleteTarget?.title}"?`}
      />
    </div>
  )
}

export default AdminJobs
