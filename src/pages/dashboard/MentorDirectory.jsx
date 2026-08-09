import React from 'react'
import { Search, Filter, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const MentorDirectory = () => {
  const mentorList = [
    {
      id: 1,
      name: 'Arjun Mehta',
      role: 'Software Engineer',
      company: 'Google',
      location: 'Bangalore, India',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&w=150&q=80',
      tags: ['React', 'Node.js', 'System Design']
    },
    {
      id: 2,
      name: 'Sneha Roy',
      role: 'Data Scientist',
      company: 'Microsoft',
      location: 'Noida, India',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&w=150&q=80',
      tags: ['Python', 'ML', 'Data Analysis']
    },
    {
      id: 3,
      name: 'Rohit Sharma',
      role: 'Product Manager',
      company: 'Amazon',
      location: 'Seattle, USA',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=150&q=80',
      tags: ['Product Strategy', 'Agile', 'SQL']
    },
    {
      id: 4,
      name: 'Priya Singh',
      role: 'UX Designer',
      company: 'Adobe',
      location: 'Bangalore, India',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&w=150&q=80',
      tags: ['Figma', 'UI/UX', 'Adobe XD']
    },
    {
      id: 5,
      name: 'Karan Verma',
      role: 'Cloud Engineer',
      company: 'AWS',
      location: 'Hyderabad, India',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&w=150&q=80',
      tags: ['AWS', 'DevOps', 'Docker']
    }
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Mentor Directory</h1>
        <p className="text-muted-foreground">Find and connect with mentor from your college.</p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, company or skills..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
          />
        </div>
        <div className="flex gap-2">
          <select className="bg-card border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground cursor-pointer appearance-none min-w-[140px]">
            <option value="">All Domains</option>
            <option value="engineering">Engineering</option>
            <option value="design">Design</option>
            <option value="product">Product</option>
          </select>
          <select className="bg-card border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground cursor-pointer appearance-none min-w-[140px]">
            <option value="">All Locations</option>
            <option value="bangalore">Bangalore</option>
            <option value="remote">Remote</option>
            <option value="usa">USA</option>
          </select>
          <button className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 p-2.5 rounded-xl transition-colors flex items-center justify-center">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Directory List */}
      <div className="space-y-4">
        {mentorList.map(mentor => (
          <div key={mentor.id} className="bg-card border border-border/50 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <img src={mentor.image} alt={mentor.name} className="w-16 h-16 rounded-full object-cover shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-foreground">{mentor.name}</h3>
                <p className="text-sm font-medium text-foreground">{mentor.role} at {mentor.company}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {mentor.location}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {mentor.tags.map(tag => (
                    <span key={tag} className="bg-muted text-muted-foreground px-2.5 py-1 rounded-md text-[10px] font-medium border border-border/50">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <Link
              to={`/dashboard/mentor/${mentor.id}`}
              className="text-primary font-medium text-sm border border-border/50 hover:border-primary/50 bg-background hover:bg-primary/5 px-6 py-2.5 rounded-xl transition-all text-center shrink-0"
            >
              View Profile
            </Link>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 pt-4">
        <button className="p-2 border border-border/50 rounded-lg hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50" disabled>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">1</button>
        <button className="w-8 h-8 rounded-lg hover:bg-muted text-foreground text-sm font-medium flex items-center justify-center transition-colors">2</button>
        <button className="w-8 h-8 rounded-lg hover:bg-muted text-foreground text-sm font-medium flex items-center justify-center transition-colors">3</button>
        <span className="text-muted-foreground">...</span>
        <button className="w-8 h-8 rounded-lg hover:bg-muted text-foreground text-sm font-medium flex items-center justify-center transition-colors">20</button>
        <button className="p-2 border border-border/50 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default MentorDirectory
