import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, Building2, MapPin, Clock, MoreVertical, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

const mockApplications = [
  {
    id: 1,
    role: 'Frontend Developer',
    company: 'TechCorp',
    location: 'Remote',
    type: 'Full-time',
    appliedDate: 'Oct 24, 2023',
    status: 'In Review', // 'Pending', 'In Review', 'Interview', 'Rejected'
    logo: 'T'
  },
  {
    id: 2,
    role: 'UX Designer',
    company: 'Creative Solutions',
    location: 'San Francisco, CA',
    type: 'Contract',
    appliedDate: 'Oct 18, 2023',
    status: 'Interview',
    logo: 'C'
  },
  {
    id: 3,
    role: 'Backend Engineer',
    company: 'InnovateSpace',
    location: 'New York, NY',
    type: 'Full-time',
    appliedDate: 'Oct 12, 2023',
    status: 'Pending',
    logo: 'I'
  },
  {
    id: 4,
    role: 'Product Manager',
    company: 'Global Systems',
    location: 'Austin, TX',
    type: 'Full-time',
    appliedDate: 'Sep 28, 2023',
    status: 'Rejected',
    logo: 'G'
  }
]

const getStatusColor = (status) => {
  switch (status) {
    case 'Pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    case 'In Review': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'Interview': return 'bg-green-500/10 text-green-500 border-green-500/20'
    case 'Rejected': return 'bg-red-500/10 text-red-500 border-red-500/20'
    default: return 'bg-muted text-muted-foreground'
  }
}

const Applications = () => {
  const [filter, setFilter] = useState('All')

  const filteredApplications = mockApplications.filter(app => {
    if (filter === 'All') return true
    if (filter === 'Active') return app.status !== 'Rejected'
    if (filter === 'Archived') return app.status === 'Rejected'
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
        {filteredApplications.length > 0 ? (
          <div className="divide-y divide-border/40">
            {filteredApplications.map((app, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={app.id} 
                className="p-6 hover:bg-muted/30 transition-colors flex flex-col md:flex-row md:items-center gap-6"
              >
                {/* Logo */}
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">
                  {app.logo}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg text-foreground">{app.role}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      {app.company}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {app.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" />
                      {app.type}
                    </div>
                  </div>
                </div>

                {/* Date & Actions */}
                <div className="flex items-center justify-between md:flex-col md:items-end gap-4 shrink-0">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Applied {app.appliedDate}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/dashboard/jobs/${app.id}`} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors" title="View Job">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors" title="More options">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
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
