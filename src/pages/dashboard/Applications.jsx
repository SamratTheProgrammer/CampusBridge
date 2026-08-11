import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, Building2, MapPin, Clock, MoreVertical, ExternalLink, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import API_BASE from '../../utils/api'

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
  const [filter, setFilter] = useState('All')
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()

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

  const filteredApplications = applications.filter(app => {
    const status = app.status?.toLowerCase() || 'pending'
    if (filter === 'All') return true
    if (filter === 'Active') return status !== 'rejected'
    if (filter === 'Archived') return status === 'rejected'
    return true
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">My Applications</h1>
          <p className="text-muted-foreground">Track and manage your job applications.</p>
        </div>
        <div className="flex gap-2">
          {['All', 'Active', 'Archived'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'bg-card text-muted-foreground hover:bg-muted border border-border/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border/40 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
             <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredApplications.length > 0 ? (
          <div className="divide-y divide-border/40">
            {filteredApplications.map((app, index) => {
              const job = app.job
              if (!job) return null;
              
              let jobLogo = job.companyLogo;
              if (jobLogo && jobLogo.includes('logo.clearbit.com')) {
                jobLogo = jobLogo.replace('https://logo.clearbit.com/', 'https://www.google.com/s2/favicons?sz=128&domain=');
              }
              jobLogo = jobLogo || `https://www.google.com/s2/favicons?domain=${job.company?.toLowerCase().replace(/\s+/g, '')}.com&sz=128`

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={app._id} 
                  className="p-6 hover:bg-muted/30 transition-colors flex flex-col md:flex-row md:items-center gap-6"
                >
                  {/* Logo */}
                  <div className="w-12 h-12 rounded-xl border border-border/50 bg-white flex items-center justify-center p-2 shrink-0 overflow-hidden">
                    <img 
                      src={jobLogo} 
                      alt={job.company} 
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company || 'C')}&size=64&background=7c3aed&color=fff&bold=true` }}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg text-foreground">{job.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getStatusColor(app.status)}`}>
                        {app.status || 'Pending'}
                      </span>
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
                    </div>
                  </div>

                  {/* Date & Actions */}
                  <div className="flex items-center justify-between md:flex-col md:items-end gap-4 shrink-0">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Applied {format(new Date(app.createdAt), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/dashboard/jobs/${job._id}`} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors" title="View Job">
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
            <p>No applications found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Applications
