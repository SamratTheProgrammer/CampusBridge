import React, { useState, useEffect, useRef } from 'react'
import { Plus, Briefcase, MapPin, DollarSign, Building2, Users, Search, Loader2, Clock, ChevronDown, X, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useUser } from '@clerk/clerk-react'
import { formatDistanceToNow, format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmModal from '../../components/modals/ConfirmModal'
import { getPdfViewUrl } from '../../utils/pdfViewer'
import API_BASE from '../../utils/api'

// ─── Searchable Company Selector Component ──────────────────────────────────
const CompanySelector = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isFetching, setIsFetching] = useState(false)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)
  const [selectedCompanyObj, setSelectedCompanyObj] = useState(null)

  // When value changes from outside, try to show it
  useEffect(() => {
    if (value && (!selectedCompanyObj || selectedCompanyObj.name !== value)) {
      setSelectedCompanyObj({ name: value, logo: '' })
    }
  }, [value])

  // Fetch from Clearbit API
  useEffect(() => {
    if (search.length > 2) {
      const fetchCompanies = async () => {
        setIsFetching(true)
        try {
          const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(search)}`)
          if (res.ok) {
            const data = await res.json()
            setSuggestions(data)
          }
        } catch (err) {
          console.error(err)
        } finally {
          setIsFetching(false)
        }
      }
      const timeoutId = setTimeout(fetchCompanies, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setSuggestions([])
    }
  }, [search])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (company) => {
    const logoUrl = `https://www.google.com/s2/favicons?sz=128&domain=${company.domain}`
    setSelectedCompanyObj({ name: company.name, logo: logoUrl })
    onChange(company.name, logoUrl)
    setSearch('')
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-foreground mb-1.5">Company</label>
      
      {/* Selected company display / trigger */}
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setTimeout(() => inputRef.current?.focus(), 50) }}
        className="w-full flex items-center gap-2.5 px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary text-left transition-all"
      >
        {selectedCompanyObj ? (
          <>
            <img 
              src={selectedCompanyObj.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCompanyObj.name)}&size=32&background=7c3aed&color=fff&bold=true`} 
              alt={selectedCompanyObj.name} 
              className="w-5 h-5 rounded object-contain shrink-0 bg-white"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <span className="flex-1 text-foreground truncate">{selectedCompanyObj.name}</span>
          </>
        ) : (
          <span className="flex-1 text-muted-foreground">Select a company...</span>
        )}
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Hidden input for form submission */}
      <input type="hidden" name="company" value={value || ''} required />

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-card border border-border/50 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search inside dropdown */}
          <div className="p-2 border-b border-border/30">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search companies globally..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-muted/50 border border-border/30 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-2">
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Company list */}
          <div className="max-h-52 overflow-y-auto overscroll-contain">
            {isFetching ? (
              <div className="px-3 py-6 flex items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Searching...
              </div>
            ) : suggestions.length > 0 ? suggestions.map((company) => {
              const logoUrl = `https://www.google.com/s2/favicons?sz=128&domain=${company.domain}`
              return (
                <button
                  type="button"
                  key={company.domain}
                  onClick={() => handleSelect(company)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-primary/10 transition-colors ${
                    value === company.name ? 'bg-primary/5 text-primary font-medium' : 'text-foreground'
                  }`}
                >
                  <img 
                    src={logoUrl} 
                    alt={company.name} 
                    className="w-6 h-6 rounded object-contain shrink-0 bg-white p-0.5" 
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&size=32&background=7c3aed&color=fff&bold=true` }}
                  />
                  <span className="truncate flex-1">{company.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{company.domain}</span>
                </button>
              )
            }) : search.length > 2 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No company found. You can add it below.
              </div>
            ) : (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Type at least 3 characters to search globally...
              </div>
            )}
            
            {/* Custom / typed company option */}
            {search.length > 0 && !suggestions.find(c => c.name.toLowerCase() === search.toLowerCase()) && (
              <button
                type="button"
                onClick={() => { 
                  const fallbackLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(search)}&size=64&background=7c3aed&color=fff&bold=true`;
                  setSelectedCompanyObj({ name: search, logo: fallbackLogo });
                  onChange(search, fallbackLogo); 
                  setSearch(''); 
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-primary/10 transition-colors border-t border-border/30 text-primary font-medium"
              >
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                </div>
                <span>Use "{search}" as custom company</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────
const MentorJobs = () => {
  const { user } = useUser()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedCompanyLogo, setSelectedCompanyLogo] = useState('')

  // Applications state
  const [isApplicationsModalOpen, setIsApplicationsModalOpen] = useState(false)
  const [selectedJobForApps, setSelectedJobForApps] = useState(null)
  const [applications, setApplications] = useState([])
  const [isLoadingApps, setIsLoadingApps] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [jobToDelete, setJobToDelete] = useState(null)
  const [jobToEdit, setJobToEdit] = useState(null)

  const fetchJobs = async () => {
    if (!user) return
    try {
      const res = await fetch(`${API_BASE}/api/jobs/mentor/${user.id}`)
      if (!res.ok) throw new Error('Failed to fetch jobs')
      const data = await res.json()
      setJobs(data)
    } catch (err) {
      toast.error('Could not load jobs')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [user])

  const handleAddJob = async (e) => {
    e.preventDefault()
    if (!selectedCompany) {
      toast.error('Please select a company')
      return
    }
    setIsSubmitting(true)
    
    const formData = new FormData(e.target)
    const newJob = {
      title: formData.get('title'),
      company: selectedCompany,
      companyLogo: selectedCompanyLogo,
      location: formData.get('location'),
      type: formData.get('type'),
      salary: formData.get('salary'),
      description: formData.get('description'),
      deadline: formData.get('deadline'),
      clerkId: user.id
    }

    try {
      const url = jobToEdit ? `/api/jobs/${jobToEdit._id}` : '/api/jobs'
      const method = jobToEdit ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob)
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || `Failed to ${jobToEdit ? 'update' : 'post'} job`)
      }
      
      toast.success(`Job ${jobToEdit ? 'updated' : 'posted'} successfully!`)
      setIsModalOpen(false)
      setJobToEdit(null)
      setSelectedCompany('')
      setSelectedCompanyLogo('')
      fetchJobs()
    } catch (err) {
      toast.error(err.message || 'Failed to post job')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditModal = (job) => {
    setJobToEdit(job)
    setSelectedCompany(job.company)
    setSelectedCompanyLogo(job.companyLogo)
    setIsModalOpen(true)
  }

  const confirmDeleteJob = (jobId) => {
    setJobToDelete(jobId)
    setIsConfirmOpen(true)
  }

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${jobToDelete}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete job');
      
      toast.success('Job deleted successfully');
      setJobs(jobs.filter(job => job._id !== jobToDelete));
    } catch (err) {
      toast.error(err.message || 'Could not delete job');
    } finally {
      setIsConfirmOpen(false);
      setJobToDelete(null);
    }
  }

  const handleViewApplications = async (job) => {
    setSelectedJobForApps(job)
    setIsApplicationsModalOpen(true)
    setIsLoadingApps(true)
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${job._id}/applications`)
      if (!res.ok) throw new Error('Failed to fetch applications')
      const data = await res.json()
      setApplications(data)
    } catch (err) {
      toast.error('Could not load applications')
    } finally {
      setIsLoadingApps(false)
    }
  }

  const handleUpdateAppStatus = async (appId, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/jobs/applications/${appId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Failed to update status')
      const updatedApp = await res.json()
      
      setApplications(prev => prev.map(app => app._id === appId ? updatedApp : app))
      toast.success(`Application ${status}`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    job.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Helper to get logo for a job
  const getJobLogo = (job) => {
    let logo = job.companyLogo;
    if (logo && logo.includes('logo.clearbit.com')) {
      logo = logo.replace('https://logo.clearbit.com/', 'https://www.google.com/s2/favicons?sz=128&domain=');
    }
    if (logo) return logo;

    const match = COMPANIES.find(c => c.name.toLowerCase() === job.company?.toLowerCase());
    return match?.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company || 'C')}&size=64&background=7c3aed&color=fff&bold=true`;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Job Posts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage jobs and internships you've shared with students.</p>
        </div>
        <button 
          onClick={() => {
            setJobToEdit(null)
            setSelectedCompany('')
            setSelectedCompanyLogo('')
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Job
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search jobs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
        />
      </div>

      {/* Job Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <div key={job._id} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-xl bg-white border border-border/30 flex items-center justify-center shrink-0 p-1.5 overflow-hidden">
                      <img 
                        src={getJobLogo(job)} 
                        alt={job.company} 
                        className="w-full h-full object-contain"
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company || 'C')}&size=64&background=7c3aed&color=fff&bold=true` }}
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg leading-tight">{job.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> {job.company}
                      </p>
                    </div>
                  </div>
                  {job.active ? (
                    <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Active</span>
                  ) : (
                    <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Closed</span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="truncate">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <span>{job.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span className="truncate">{job.salary || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4 text-primary" />
                    <span>{job.applicants?.length || 0} applied</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 
                  Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                </span>
                <div className="flex gap-3 items-center">
                  <button 
                    onClick={() => openEditModal(job)}
                    className="text-blue-500 hover:bg-blue-500/10 p-1.5 rounded-lg transition-colors"
                    title="Edit Job"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => confirmDeleteJob(job._id)}
                    className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                    title="Delete Job"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleViewApplications(job)}
                    className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                  >
                    View Applications
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredJobs.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No jobs found.
            </div>
          )}
        </div>
      )}

      {/* Add Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-foreground mb-1">{jobToEdit ? 'Edit Job' : 'Add New Job'}</h2>
            <p className="text-sm text-muted-foreground mb-6">{jobToEdit ? 'Update job details.' : 'Post an opportunity for your mentees.'}</p>
            
            <form onSubmit={handleAddJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Job Title</label>
                <input name="title" defaultValue={jobToEdit?.title} required type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. SDE Intern" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <CompanySelector
                  value={selectedCompany}
                  onChange={(name, logo) => { setSelectedCompany(name); setSelectedCompanyLogo(logo) }}
                />
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
                  <input name="location" defaultValue={jobToEdit?.location} required type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Remote / Bangalore" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Job Type</label>
                  <select name="type" defaultValue={jobToEdit?.type || 'Full-time'} className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>Full-time</option>
                    <option>Internship</option>
                    <option>Contract</option>
                    <option>Part-time</option>
                    <option>Freelance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Salary / Stipend</label>
                  <input name="salary" defaultValue={jobToEdit?.salary} type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. ₹80,000 / month" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Deadline (Last Date to Apply)</label>
                <input name="deadline" defaultValue={jobToEdit?.deadline ? new Date(jobToEdit.deadline).toISOString().split('T')[0] : ''} type="date" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description (Optional)</label>
                <textarea name="description" defaultValue={jobToEdit?.description} rows="3" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Brief requirements..."></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  disabled={isSubmitting}
                  onClick={() => { setIsModalOpen(false); setJobToEdit(null); setSelectedCompany(''); setSelectedCompanyLogo('') }}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {jobToEdit ? 'Update Job' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Applications Modal */}
      <AnimatePresence>
        {isApplicationsModalOpen && selectedJobForApps && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/50 rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 sm:p-8 border-b border-border/50 flex justify-between items-start shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Applications for {selectedJobForApps.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{selectedJobForApps.company}</p>
                </div>
                <button onClick={() => setIsApplicationsModalOpen(false)} className="text-muted-foreground hover:bg-muted p-2 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto flex-1">
                {isLoadingApps ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground opacity-50 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No Applications Yet</h3>
                    <p className="text-muted-foreground text-sm">Students who apply will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {applications.map(app => (
                      <div key={app._id} className="border border-border/50 rounded-xl p-5 bg-background">
                        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                          <div className="flex items-center gap-4">
                            <img 
                              src={app.applicant?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.applicant?.name || 'User')}`} 
                              alt="Applicant" 
                              className="w-12 h-12 rounded-full border border-border/50 object-cover"
                            />
                            <div>
                              <h4 className="font-semibold text-foreground">{app.applicant?.name || 'Unknown User'}</h4>
                              <p className="text-xs text-muted-foreground">{app.applicant?.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {app.status === 'pending' ? (
                              <>
                                <button 
                                  onClick={() => handleUpdateAppStatus(app._id, 'accepted')}
                                  className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 text-xs font-semibold rounded-lg transition-colors"
                                >
                                  Accept
                                </button>
                                <button 
                                  onClick={() => handleUpdateAppStatus(app._id, 'rejected')}
                                  className="px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-semibold rounded-lg transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg uppercase tracking-wider ${
                                app.status === 'accepted' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'
                              }`}>
                                {app.status}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          {app.coverLetter && (
                            <div className="bg-muted/30 p-4 rounded-lg text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed border border-border/30">
                              {app.coverLetter}
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Applied {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}</p>
                            <a 
                              href={getPdfViewUrl(app.resumeLink)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary text-sm font-medium hover:underline bg-primary/10 px-4 py-2 rounded-lg"
                            >
                              View Resume
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteJob}
        title="Delete Job Post"
        message="Are you sure you want to delete this job? This action cannot be undone and will also delete all associated applications."
      />

    </div>
  )
}

export default MentorJobs
