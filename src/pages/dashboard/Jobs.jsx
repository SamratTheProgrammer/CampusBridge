import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Briefcase, Filter, Loader2, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

const Jobs = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [jobType, setJobType] = useState('All')
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('/api/jobs')
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

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) || job.company?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = jobType === 'All' || job.type === jobType
    return matchesSearch && matchesType
  })

  const getJobLogo = (job) => {
    let logo = job.companyLogo;
    if (logo && logo.includes('logo.clearbit.com')) {
      logo = logo.replace('https://logo.clearbit.com/', 'https://www.google.com/s2/favicons?sz=128&domain=');
    }
    return logo || `https://www.google.com/s2/favicons?domain=${job.company?.toLowerCase().replace(/\s+/g, '')}.com&sz=128`;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
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
          <div className="flex flex-wrap md:flex-nowrap gap-4">
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

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map(job => (
            <Link
              to={`/dashboard/jobs/${job._id}`}
              key={job._id}
              className="bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-all hover:shadow-md group flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl border border-border/50 bg-white flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                  <img 
                    src={getJobLogo(job)} 
                    alt={job.company} 
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company || 'C')}&size=64&background=7c3aed&color=fff&bold=true` }}
                  />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full 
                  ${job.type === 'Internship' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}
                >
                  {job.type}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-foreground text-lg mb-1 group-hover:text-primary transition-colors">{job.title}</h3>
                <p className="text-sm font-medium text-muted-foreground mb-4">{job.company}</p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" /> {job.location}
                  </div>
                  {job.salary && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Briefcase className="w-3.5 h-3.5" /> {job.salary}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 flex items-center justify-between mt-auto">
                <span className="text-xs text-muted-foreground">
                  Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                </span>
                <span className="text-sm font-semibold text-primary">View Details →</span>
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
    </div>
  )
}

export default Jobs
