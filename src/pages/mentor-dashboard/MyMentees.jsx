import React, { useState } from 'react'
import { Search, Filter, MessageSquare, User, CheckCircle2 } from 'lucide-react'

const MOCK_MENTEES = [
  {
    id: 1,
    name: 'Ananya Sharma',
    course: 'B.Tech Computer Science',
    university: 'NIT Trichy',
    skills: ['React', 'Node.js', 'System Design'],
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    progress: 75
  },
  {
    id: 2,
    name: 'Rahul Verma',
    course: 'MCA',
    university: 'Delhi University',
    skills: ['Python', 'Machine Learning', 'Data Structures'],
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    progress: 40
  },
  {
    id: 3,
    name: 'Neha Gupta',
    course: 'B.E. Information Technology',
    university: 'VIT Vellore',
    skills: ['Figma', 'UI/UX', 'Frontend Dev'],
    status: 'Completed',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    progress: 100
  },
  {
    id: 4,
    name: 'Vikram Singh',
    course: 'M.Tech Data Science',
    university: 'IIT Bombay',
    skills: ['SQL', 'Tableau', 'Statistics'],
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    progress: 15
  },
]

const MyMentees = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filteredMentees = MOCK_MENTEES.filter(mentee => {
    const matchesSearch = mentee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentee.course.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'All' || mentee.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Mentees</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track your students' progress.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search mentees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto appearance-none pl-10 pr-8 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMentees.map((mentee) => (
          <div key={mentee.id} className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">

            <div className="p-5 flex-1 text-center relative">
              <div className="absolute top-4 right-4">
                {mentee.status === 'Active' ? (
                  <span className="bg-blue-500/10 text-blue-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                    {mentee.status}
                  </span>
                ) : (
                  <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {mentee.status}
                  </span>
                )}
              </div>
              <img
                src={mentee.image}
                alt={mentee.name}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-2 border-primary/20"
              />
              <h3 className="font-bold text-foreground text-lg">{mentee.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{mentee.course}</p>
              <p className="text-[10px] font-medium text-foreground/70 uppercase tracking-widest mt-1">{mentee.university}</p>

              <div className="flex flex-wrap gap-1.5 justify-center mt-4">
                {mentee.skills.map((skill, index) => (
                  <span key={index} className="bg-muted text-muted-foreground text-[10px] px-2 py-1 rounded-md">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="px-5 pb-5">
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-medium">Mentorship Progress</span>
                  <span className="text-primary font-bold">{mentee.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${mentee.progress}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-2 bg-background border border-border/50 hover:bg-muted text-foreground py-2 rounded-lg text-xs font-medium transition-colors">
                  <User className="w-4 h-4" /> Profile
                </button>
                <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg text-xs font-medium transition-colors shadow-sm shadow-primary/20">
                  <MessageSquare className="w-4 h-4" /> Message
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredMentees.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No mentees found matching your search.
          </div>
        )}
      </div>

    </div>
  )
}

export default MyMentees

