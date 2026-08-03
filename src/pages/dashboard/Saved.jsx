import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookmarkMinus, MapPin, Building2, Calendar, ExternalLink, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'

const mockSavedJobs = [
  { id: 1, title: 'Senior React Developer', company: 'TechNova', location: 'San Francisco, CA (Hybrid)', salary: '$120k - $150k' },
  { id: 2, title: 'Data Scientist', company: 'DataCorp', location: 'Remote', salary: '$110k - $140k' },
]

const mockSavedEvents = [
  { id: 1, title: 'Tech Career Fair 2024', date: 'Nov 15, 2023', location: 'Main Campus Center', type: 'Career Fair' },
  { id: 2, title: 'Alumni Mixer: Software Engineering', date: 'Nov 20, 2023', location: 'Virtual', type: 'Networking' },
]

const Saved = () => {
  const [activeTab, setActiveTab] = useState('Jobs') // 'Jobs' | 'Events'

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
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {mockSavedJobs.map(job => (
                <div key={job.id} className="bg-card border border-border/40 p-5 rounded-2xl flex flex-col justify-between group hover:border-primary/50 transition-colors">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {job.company.charAt(0)}
                      </div>
                      <button className="text-muted-foreground hover:text-red-500 transition-colors" title="Remove from saved">
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
                    <span className="text-sm font-medium text-foreground">{job.salary}</span>
                    <Link to={`/dashboard/jobs/${job.id}`} className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
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
