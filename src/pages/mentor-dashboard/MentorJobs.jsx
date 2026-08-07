import React, { useState } from 'react'
import { Plus, Briefcase, MapPin, DollarSign, Building2, Users, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const MOCK_JOBS = [
  {
    id: 1,
    title: 'Software Development Engineer Intern',
    company: 'Amazon',
    location: 'Bangalore, India',
    type: 'Internship',
    salary: '₹80,000 / month',
    applicants: 45,
    posted: '2 days ago',
    active: true
  },
  {
    id: 2,
    title: 'Frontend Engineer (React)',
    company: 'Amazon',
    location: 'Remote',
    type: 'Full-time',
    salary: '₹24,00,000 / year',
    applicants: 128,
    posted: '1 week ago',
    active: true
  }
]

const MentorJobs = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [jobs, setJobs] = useState(MOCK_JOBS)

  const handleAddJob = (e) => {
    e.preventDefault()
    toast.success('Job posted successfully!')
    setIsModalOpen(false)
  }

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    job.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Job Posts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage jobs and internships you've shared with students.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Briefcase className="w-6 h-6" />
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
                  <MapPin className="w-4 h-4 shrink-0" /> {job.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="w-4 h-4 shrink-0" /> {job.type}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="w-4 h-4 shrink-0" /> {job.salary}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4 shrink-0" /> {job.applicants} Applied
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/40 pt-4">
              <span className="text-xs text-muted-foreground">Posted {job.posted}</span>
              <button className="text-sm font-medium text-primary hover:underline">
                View Applicants →
              </button>
            </div>
          </div>
        ))}

        {filteredJobs.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No jobs found.
          </div>
        )}
      </div>

      {/* Add Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-foreground mb-1">Add New Job</h2>
            <p className="text-sm text-muted-foreground mb-6">Post an opportunity for your mentees.</p>
            
            <form onSubmit={handleAddJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Job Title</label>
                <input required type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. SDE Intern" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Company</label>
                  <input required type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Amazon" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
                  <input required type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Remote / Bangalore" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Job Type</label>
                  <select className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>Full-time</option>
                    <option>Internship</option>
                    <option>Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Salary / Stipend</label>
                  <input type="text" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. ₹80,000 / month" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description (Optional)</label>
                <textarea rows="3" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Brief requirements..."></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-medium transition-colors shadow-sm"
                >
                  Post Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default MentorJobs

