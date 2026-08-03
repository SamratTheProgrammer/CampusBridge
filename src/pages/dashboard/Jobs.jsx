import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Briefcase, Filter } from 'lucide-react'

const Jobs = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [jobType, setJobType] = useState('All')
  const [experience, setExperience] = useState('All')

  const jobsData = [
    {
      id: 1,
      title: 'Frontend Developer',
      company: 'Microsoft',
      logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://microsoft.com&size=128',
      location: 'Remote',
      type: 'Full-time',
      experience: '2-4 years',
      posted: '2 May 2024'
    },
    {
      id: 2,
      title: 'Software Engineering Intern',
      company: 'Google',
      logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://google.com&size=128',
      location: 'Bangalore, India',
      type: 'Internship',
      experience: '0-1 years',
      posted: '1 May 2024'
    },
    {
      id: 3,
      title: 'Data Analyst Intern',
      company: 'Flipkart',
      logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://flipkart.com&size=128',
      location: 'Bangalore, India',
      type: 'Internship',
      experience: '0-1 years',
      posted: '28 Apr 2024'
    },
    {
      id: 4,
      title: 'Backend Engineer',
      company: 'Amazon',
      logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://amazon.com&size=128',
      location: 'Hyderabad, India',
      type: 'Full-time',
      experience: '3-5 years',
      posted: '25 Apr 2024'
    },
    {
      id: 5,
      title: 'Product Designer',
      company: 'Adobe',
      logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://adobe.com&size=128',
      location: 'Noida, India',
      type: 'Full-time',
      experience: '1-3 years',
      posted: '20 Apr 2024'
    },
    {
      id: 6,
      title: 'DevOps Intern',
      company: 'Atlassian',
      logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://atlassian.com&size=128',
      location: 'Remote',
      type: 'Internship',
      experience: '0 years',
      posted: '15 Apr 2024'
    }
  ]

  const filteredJobs = jobsData.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = jobType === 'All' || job.type === jobType
    const matchesExp = experience === 'All' || job.experience === experience
    return matchesSearch && matchesType && matchesExp
  })

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
              </select>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <select 
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer"
              >
                <option value="All">Any Experience</option>
                <option value="0 years">0 years</option>
                <option value="0-1 years">0-1 years</option>
                <option value="1-3 years">1-3 years</option>
                <option value="2-4 years">2-4 years</option>
                <option value="3-5 years">3-5 years</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map(job => (
            <Link 
              to={`/dashboard/jobs/${job.id}`} 
              key={job.id}
              className="bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-all hover:shadow-md group flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl border border-border/50 bg-background flex items-center justify-center p-2 shrink-0">
                  <img src={job.logo} alt={job.company} className="max-w-full max-h-full object-contain" />
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Briefcase className="w-3.5 h-3.5" /> {job.experience}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border/40 flex items-center justify-between mt-auto">
                <span className="text-xs text-muted-foreground">Posted {job.posted}</span>
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
            onClick={() => { setSearchTerm(''); setJobType('All'); setExperience('All'); }}
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
