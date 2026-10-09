import React, { useState, useEffect } from 'react'
import JobSkeleton from '../../components/skeletons/JobSkeleton'
import { Link } from 'react-router-dom'
import { Search, MapPin, Briefcase, Filter, Loader2, Calendar, Share2, CheckCircle2, XCircle, GraduationCap } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { getCompanyLogo, handleImageError } from '../../utils/logoHelper'
import { formatPendingRequestTime } from '../../utils/dateFormatter'
import API_BASE from '../../utils/api'
import { getAppUrl } from '../../utils/appUrl'
import { formatSalaryWithLPA, formatEligibilitySummary, checkUserJobEligibility } from '../../utils/salaryHelper'
import ShareModal from '../../components/modals/ShareModal'

const Jobs = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [jobType, setJobType] = useState('All')
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Active') // 'Active' | 'Applied' | 'Inactive'
  const [showEligibleOnly, setShowEligibleOnly] = useState(false)
  const { user } = useUser()
  const [dbUser, setDbUser] = useState(null)
  const [appliedJobIds, setAppliedJobIds] = useState(new Set())
  
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareConfig, setShareConfig] = useState(null)

  const handleShare = (e, jobId) => {
    e.preventDefault();
    e.stopPropagation();
    setShareConfig({
      shareUrl: getAppUrl(`/dashboard/jobs/${jobId}`),
      shareType: 'job',
      itemId: jobId
    });
    setIsShareModalOpen(true);
  }

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/jobs`)
        if (!res.ok) throw new Error('Failed to fetch jobs')
        const data = await res.json()
        setJobs(data)
      } catch (err) {
        toast.error('Could not load jobs')
      } finally {
        setIsLoading(false)
      }
    }
    fetchJobs()
  }, [])

  useEffect(() => {
    if(user) {
      fetch(`${API_BASE}/api/users/${user.id}`)
      .then(res => res.json())
      .then(data => setDbUser(data))
      .catch(err => console.error(err))

      fetch(`${API_BASE}/api/jobs/student/applications/${user.id}`)
      .then(res => res.json())
      .then(apps => {
        if (Array.isArray(apps)) {
          const ids = new Set(apps.map(a => a.job?._id || a.job).filter(Boolean).map(String))
          setAppliedJobIds(ids)
        }
      })
      .catch(err => console.error('Error fetching student applications:', err))
    }
  }, [user])

  const checkEligibility = (job) => {
    return checkUserJobEligibility(job, dbUser || user).eligible;
  }

  const isJobExpired = (deadline) => {
    if (!deadline) return false
    const d = new Date(deadline)
    d.setHours(23, 59, 59, 999)
    return new Date() > d
  }

  const activeCount = jobs.filter(j => !isJobExpired(j.deadline)).length
  const appliedCount = jobs.filter(j => appliedJobIds.has(String(j._id))).length
  const inactiveCount = jobs.filter(j => isJobExpired(j.deadline)).length

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) || job.company?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = jobType === 'All' || job.type === jobType
    
    // Tab logic
    const isExpired = isJobExpired(job.deadline)
    let matchesTab = true
    if (activeTab === 'Active') matchesTab = !isExpired
    else if (activeTab === 'Applied') matchesTab = appliedJobIds.has(String(job._id))
    else if (activeTab === 'Inactive') matchesTab = isExpired
    
    // Eligibility logic
    const matchesEligibility = showEligibleOnly ? checkEligibility(job) : true

    return matchesSearch && matchesType && matchesTab && matchesEligibility
  })

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Jobs & Internships</h1>
        <p className="text-muted-foreground">Find the best opportunities tailored for you.</p>
      </div>

      {/* Filters Section */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by job title or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all text-foreground"
            />
          </div>
          <div className="flex flex-wrap md:flex-nowrap gap-4 items-center">
            
            {/* Toggle Button */}
            <label className="flex items-center gap-2 cursor-pointer bg-muted/30 px-3 py-2 rounded-xl border border-border/50">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={showEligibleOnly}
                  onChange={() => setShowEligibleOnly(!showEligibleOnly)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${showEligibleOnly ? 'bg-primary' : 'bg-muted-foreground/30'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showEligibleOnly ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <span className="text-sm font-medium text-foreground">Only Eligible</span>
            </label>

            <div className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted p-1 rounded-xl w-fit mb-4">
        <button
          onClick={() => setActiveTab('Active')}
          className={`px-5 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'Active' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Active Jobs</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeTab === 'Active' ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/15 text-muted-foreground'
          }`}>
            {activeCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('Applied')}
          className={`px-5 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'Applied' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Applied</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeTab === 'Applied' ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold' : 'bg-muted-foreground/15 text-muted-foreground'
          }`}>
            {appliedCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('Inactive')}
          className={`px-5 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'Inactive' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Inactive (Date Over)</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeTab === 'Inactive' ? 'bg-destructive/10 text-destructive' : 'bg-muted-foreground/15 text-muted-foreground'
          }`}>
            {inactiveCount}
          </span>
        </button>
      </div>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(4)].map((_, i) => (
                <JobSkeleton key={i}  />
              ))}
            </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map(job => (
            <Link
              to={`/dashboard/jobs/${job._id}`}
              key={job._id}
              className="bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-all hover:shadow-md group flex flex-col h-full relative overflow-hidden"
            >
              {job.moderationStatus === 'paused' && (
                <div className="absolute top-0 left-0 w-full bg-amber-500/10 text-amber-500 text-xs font-bold py-1.5 px-4 text-center border-b border-amber-500/20">
                  Paused by Admin: {job.moderationRemark || 'Under review'}
                </div>
              )}
              <div className={`flex items-start justify-between mb-4 ${job.moderationStatus === 'paused' ? 'mt-4' : ''}`}>
                <div className="w-12 h-12 rounded-xl border border-border/50 bg-white flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                  <img 
                    src={getCompanyLogo(job.company, job.companyLogo)} 
                    alt={job.company} 
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => handleImageError(e, job.company)}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {isJobExpired(job.deadline) && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Expired
                    </span>
                  )}
                  {appliedJobIds.has(String(job._id)) && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-purple-500" /> Applied
                    </span>
                  )}
                  {checkEligibility(job) ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Eligible
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Not Eligible
                    </span>
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full 
                    ${job.type === 'Internship' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}
                  >
                    {job.type}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-foreground text-lg mb-1 group-hover:text-primary transition-colors">{job.title}</h3>
                <p className="text-sm font-medium text-muted-foreground mb-4">{job.company}</p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" /> {job.location}
                  </div>
                  {job.salary && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <Briefcase className="w-3.5 h-3.5 text-primary shrink-0" /> {formatSalaryWithLPA(job.salary)}
                    </div>
                  )}
                  {formatEligibilitySummary(job.eligibility) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">
                        <strong className="text-muted-foreground mr-1 font-semibold">Eligibility:</strong>
                        {formatEligibilitySummary(job.eligibility)}
                      </span>
                    </div>
                  )}
                  {job.deadline && (
                    <div className={`flex items-center gap-2 text-xs font-medium ${
                      isJobExpired(job.deadline) ? 'text-destructive' : 'text-primary'
                    }`}>
                      <Calendar className="w-3.5 h-3.5" />
                      {isJobExpired(job.deadline) 
                        ? `Expired on ${new Date(job.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` 
                        : `Apply by ${new Date(job.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 flex items-center justify-between mt-auto">
                <span className="text-xs text-muted-foreground">
                  Posted {formatPendingRequestTime(job.createdAt)}
                </span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => handleShare(e, job._id)}
                    className="text-muted-foreground hover:text-primary transition-colors p-1"
                    title="Share Job"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  {appliedJobIds.has(String(job._id)) ? (
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      Applied <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-primary">View Details →</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-2xl p-12 text-center shadow-sm">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-foreground mb-2">No jobs found</h3>
          <p className="text-muted-foreground text-sm">Try adjusting your search or filters to find more opportunities.</p>
          <button
            onClick={() => { setSearchTerm(''); setJobType('All'); }}
            className="mt-6 bg-primary/10 text-primary hover:bg-primary/20 px-6 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        shareUrl={shareConfig?.shareUrl} 
        shareType={shareConfig?.shareType} 
        itemId={shareConfig?.itemId} 
      />
    </div>
  )
}

export default Jobs
