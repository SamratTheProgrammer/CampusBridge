import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookmarkMinus, MapPin, Building2, Calendar, ExternalLink, GraduationCap, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'

// Mock events for now, since we haven't implemented saved events yet
const mockSavedEvents = [
  { id: 1, title: 'Tech Career Fair 2024', date: 'Nov 15, 2023', location: 'Main Campus Center', type: 'Career Fair' },
  { id: 2, title: 'Mentor Mixer: Software Engineering', date: 'Nov 20, 2023', location: 'Virtual', type: 'Networking' },
]

const Saved = () => {
  const [activeTab, setActiveTab] = useState('Jobs') // 'Jobs' | 'Events'
  const [savedJobs, setSavedJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()

  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        if (!user) return;
        const res = await fetch(`/api/users/${user.id}/saved-jobs`)
        if (!res.ok) throw new Error('Failed to fetch saved jobs')
        const data = await res.json()
        setSavedJobs(data)
      } catch (err) {
        toast.error('Could not load saved jobs')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSavedJobs()
  }, [user])

  const handleUnsaveJob = async (jobId) => {
    try {
      // Optimistic update
      setSavedJobs(prev => prev.filter(job => job._id !== jobId))
      
      const res = await fetch(`/api/users/${user.id}/save-job`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      })
      
      if (!res.ok) throw new Error('Failed to unsave job')
      toast.success('Job removed from saved list')
    } catch (err) {
      toast.error(err.message)
      // We could revert the optimistic update here if needed by re-fetching
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Saved Items</h1>
          <p className="text-muted-foreground">Everything you've bookmarked for later.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border/40 pb-px">
        {['Jobs', 'Events'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div 
                layoutId="savedTab" 
                className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary" 
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          {activeTab === 'Jobs' && (
            <motion.div 
              key="jobs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {isLoading ? (
                <div className="p-12 flex justify-center items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : savedJobs.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {savedJobs.map(job => {
                    let jobLogo = job.companyLogo;
                    if (jobLogo && jobLogo.includes('logo.clearbit.com')) {
                      jobLogo = jobLogo.replace('https://logo.clearbit.com/', 'https://www.google.com/s2/favicons?sz=128&domain=');
                    }
                    jobLogo = jobLogo || `https://www.google.com/s2/favicons?domain=${job.company?.toLowerCase().replace(/\s+/g, '')}.com&sz=128`

                    return (
                      <div key={job._id} className="bg-card border border-border/40 p-5 rounded-2xl flex flex-col justify-between group hover:border-primary/50 transition-colors">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl border border-border/50 bg-white flex items-center justify-center p-2 shrink-0 overflow-hidden">
                              <img 
                                src={jobLogo} 
                                alt={job.company} 
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company || 'C')}&size=64&background=7c3aed&color=fff&bold=true` }}
                              />
                            </div>
                            <button 
                              onClick={() => handleUnsaveJob(job._id)}
                              className="text-muted-foreground hover:text-red-500 transition-colors" 
                              title="Remove from saved"
                            >
                              <BookmarkMinus className="w-5 h-5" />
                            </button>
                          </div>
                          <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">{job.title}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
                            <Building2 className="w-4 h-4" /> {job.company}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-4">
                            <MapPin className="w-4 h-4" /> {job.location}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-border/40">
                          <span className="text-sm font-medium text-foreground">{job.salary || 'Not specified'}</span>
                          <Link to={`/dashboard/jobs/${job._id}`} className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
                            View <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <BookmarkMinus className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>You haven't saved any jobs yet.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'Events' && (
            <motion.div 
              key="events"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {mockSavedEvents.map(event => (
                <div key={event.id} className="bg-card border border-border/40 p-5 rounded-2xl flex flex-col justify-between group hover:border-primary/50 transition-colors">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 font-bold">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <button className="text-muted-foreground hover:text-red-500 transition-colors" title="Remove from saved">
                        <BookmarkMinus className="w-5 h-5" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">{event.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
                      <Calendar className="w-4 h-4" /> {event.date}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-4">
                      <MapPin className="w-4 h-4" /> {event.location}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border/40">
                    <span className="text-xs font-medium px-2.5 py-1 bg-muted rounded-md">{event.type}</span>
                    <button className="text-sm text-primary hover:underline font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Saved
