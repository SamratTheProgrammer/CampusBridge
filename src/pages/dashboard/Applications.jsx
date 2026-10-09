import React, { useState, useEffect } from 'react'
import { Skeleton } from '../../components/ui/Skeleton'
import { motion } from 'framer-motion'
import { Briefcase, Building2, MapPin, Clock, MoreVertical, ExternalLink, Loader2, Archive, ArchiveRestore, IndianRupee } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import API_BASE from '../../utils/api'
import { formatSalaryWithLPA } from '../../utils/salaryHelper'
import { getCompanyLogo, handleImageError } from '../../utils/logoHelper'

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    case 'in review': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'interview': return 'bg-green-500/10 text-green-500 border-green-500/20'
    case 'accepted': return 'bg-green-500/10 text-green-500 border-green-500/20'
    case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20'
    default: return 'bg-muted text-muted-foreground'
  }
}

const Applications = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const validTabs = ['Active', 'Accepted', 'Rejected', 'Archived', 'All']
  const initialTab = searchParams.get('tab') || 'Active'
  const [filter, setFilter] = useState(validTabs.includes(initialTab) ? initialTab : 'Active')
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && validTabs.includes(tabParam)) {
      setFilter(tabParam)
    }
  }, [searchParams])

  const handleTabChange = (tabId) => {
    setFilter(tabId)
    setSearchParams({ tab: tabId })
  }

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        if (!user) return;
        const res = await fetch(`${API_BASE}/api/jobs/student/applications/${user.id}`)
        if (!res.ok) throw new Error('Failed to fetch applications')
        const data = await res.json()
        setApplications(data)
      } catch (err) {
        toast.error('Could not load applications')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchApplications()
  }, [user])

  const handleToggleArchive = async (appId, currentArchived) => {
    const nextArchived = !currentArchived
    // Optimistic local update
    setApplications(prev => prev.map(a => a._id === appId ? { ...a, archived: nextArchived } : a))
    toast.success(nextArchived ? 'Application moved to archive' : 'Application restored from archive')

    try {
      const res = await fetch(`${API_BASE}/api/jobs/applications/${appId}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: nextArchived })
      })
      if (!res.ok) {
        // Rollback
        setApplications(prev => prev.map(a => a._id === appId ? { ...a, archived: currentArchived } : a))
        toast.error('Failed to update archive status')
      }
    } catch (err) {
      console.error(err)
      setApplications(prev => prev.map(a => a._id === appId ? { ...a, archived: currentArchived } : a))
      toast.error('Network error')
    }
  }

  const pendingCount = applications.filter(app => !app.archived && (app.status === 'pending' || !app.status)).length
  const acceptedCount = applications.filter(app => !app.archived && app.status === 'accepted').length
  const rejectedCount = applications.filter(app => !app.archived && app.status === 'rejected').length
  const archivedCount = applications.filter(app => Boolean(app.archived)).length
  const allCount = applications.length

  const filteredApplications = applications.filter(app => {
    const isArchived = Boolean(app.archived)
    if (filter === 'Active') return !isArchived && (app.status === 'pending' || !app.status)
    if (filter === 'Accepted') return !isArchived && app.status === 'accepted'
    if (filter === 'Rejected') return !isArchived && app.status === 'rejected'
    if (filter === 'Archived') return isArchived
    return true // 'All'
  })

  return (
    <div className="w-full p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">My Applications</h1>
          <p className="text-muted-foreground">Track, manage, and archive your job applications.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'Active', label: `Active (${pendingCount})` },
            { id: 'Accepted', label: `Accepted (${acceptedCount})` },
            { id: 'Rejected', label: `Rejected (${rejectedCount})` },
            { id: 'Archived', label: `Archived (${archivedCount})` },
            { id: 'All', label: `All (${allCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                filter === tab.id 
                  ? tab.id === 'Accepted'
                    ? 'bg-green-600 text-white shadow-md'
                    : tab.id === 'Rejected'
                    ? 'bg-destructive text-destructive-foreground shadow-md'
                    : 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card text-muted-foreground hover:bg-muted border border-border/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border/40 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border/40 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-6 flex flex-col md:flex-row md:items-center gap-6">
                {/* Logo */}
                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                {/* Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-40 rounded-md" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-4 w-20 rounded-md" />
                  </div>
                </div>
                {/* Date + Action */}
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredApplications.length > 0 ? (
          <div className="divide-y divide-border/40">
            {filteredApplications.map((app, index) => {
              const job = app.job
              if (!job) return null;
              
              const jobLogo = getCompanyLogo(job.company, job.companyLogo);

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={app._id} 
                  className={`p-6 hover:bg-muted/30 transition-colors flex flex-col md:flex-row md:items-center gap-6 ${app.archived ? 'opacity-75 bg-muted/10' : ''}`}
                >
                  {/* Logo */}
                  <div className="w-12 h-12 rounded-xl border border-border/50 bg-white flex items-center justify-center p-2 shrink-0 overflow-hidden">
                    <img 
                      src={jobLogo} 
                      alt={job.company} 
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => handleImageError(e, job.company)}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-lg text-foreground">{job.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getStatusColor(app.status)}`}>
                        {app.status || 'Pending'}
                      </span>
                      {app.archived && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                          <Archive className="w-3 h-3" /> Archived
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        {job.company}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" />
                        {job.type}
                      </div>
                      {job.salary && (
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <IndianRupee className="w-3.5 h-3.5 text-primary" />
                          {formatSalaryWithLPA(job.salary)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date & Actions */}
                  <div className="flex items-center justify-between md:flex-col md:items-end gap-4 shrink-0">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Applied {format(new Date(app.createdAt), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleArchive(app._id, Boolean(app.archived))}
                        className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm ${
                          app.archived
                            ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
                        }`}
                        title={app.archived ? 'Restore to Active' : 'Archive Application'}
                      >
                        {app.archived ? (
                          <>
                            <ArchiveRestore className="w-3.5 h-3.5" />
                            <span>Unarchive</span>
                          </>
                        ) : (
                          <>
                            <Archive className="w-3.5 h-3.5" />
                            <span>Archive</span>
                          </>
                        )}
                      </button>

                      <Link 
                        to={`/dashboard/jobs/${job._id}`} 
                        className="p-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors cursor-pointer" 
                        title="View Job Details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No applications found in {filter.toLowerCase()} tab.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Applications
