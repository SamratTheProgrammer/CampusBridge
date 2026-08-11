import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  UserCheck, 
  HelpingHand, 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight,
  Loader2
} from 'lucide-react'
import API_BASE from '../../utils/api'

const AdminDashboard = () => {
  const [data, setData] = useState({
    stats: {
      totalUsers: 0,
      totalStudents: 0,
      totalMentors: 0,
      totalAlumni: 0,
      activeMentors: 0,
      jobPosts: 0,
      internshipPosts: 0,
      upcomingEvents: 0,
      messagesCount: 0,
      pendingApprovals: 0
    },
    recentActivity: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/stats`)
        if (res.ok) {
          const result = await res.json()
          if (result.success) {
            setData(result)
          }
        }
      } catch (err) {
        console.error('Failed to fetch admin stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAdminStats()
  }, [])

  const stats = [
    { title: 'Total Students', value: (data.stats.totalStudents || 0).toLocaleString(), trend: 'Realtime', isUp: true, icon: GraduationCap, color: 'text-blue-500 bg-blue-500/10' },
    { title: 'Total Mentors', value: (data.stats.totalMentors || 0).toLocaleString(), trend: 'Realtime', isUp: true, icon: UserCheck, color: 'text-emerald-500 bg-emerald-500/10' },
    { title: 'Active Mentors', value: (data.stats.activeMentors || 0).toLocaleString(), trend: 'Realtime', isUp: true, icon: HelpingHand, color: 'text-purple-500 bg-purple-500/10' },
    { title: 'Job Posts', value: (data.stats.jobPosts || 0).toLocaleString(), trend: 'Realtime', isUp: true, icon: Briefcase, color: 'text-amber-500 bg-amber-500/10' },
    { title: 'Internship Posts', value: (data.stats.internshipPosts || 0).toLocaleString(), trend: 'Realtime', isUp: true, icon: Briefcase, color: 'text-indigo-500 bg-indigo-500/10' },
    { title: 'Upcoming Events', value: (data.stats.upcomingEvents || 0).toLocaleString(), trend: 'Realtime', isUp: true, icon: Calendar, color: 'text-pink-500 bg-pink-500/10' },
    { title: 'Total Messages', value: (data.stats.messagesCount || 0).toLocaleString(), trend: 'Realtime', isUp: true, icon: MessageSquare, color: 'text-sky-500 bg-sky-500/10' },
    { title: 'Pending Sessions', value: (data.stats.pendingApprovals || 0).toLocaleString(), trend: 'Pending', isUp: false, icon: Clock, color: 'text-rose-500 bg-rose-500/10' },
  ]

  const totalUsersCount = (data.stats.totalUsers || 0)
  const studentsPct = totalUsersCount > 0 ? ((data.stats.totalStudents / totalUsersCount) * 100).toFixed(1) : 0
  const mentorsPct = totalUsersCount > 0 ? ((data.stats.totalMentors / totalUsersCount) * 100).toFixed(1) : 0
  const alumniPct = totalUsersCount > 0 ? ((data.stats.totalAlumni / totalUsersCount) * 100).toFixed(1) : 0

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time system overview from live database.</p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-primary font-semibold">
            <Loader2 className="w-4 h-4 animate-spin" /> Syncing live data...
          </div>
        )}
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-card border border-border/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${stat.isUp ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10'}`}>
                  {stat.isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {stat.trend}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-muted-foreground text-sm font-medium">{stat.title}</h3>
                <p className="text-2xl font-extrabold text-foreground mt-1">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts & Activity Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* User Growth Chart */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm lg:col-span-8 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-foreground text-lg">User Growth</h3>
              <p className="text-xs text-muted-foreground mt-0.5"><span className="text-emerald-500 font-semibold">+16.5%</span> from last month</p>
            </div>
            <select className="bg-muted/50 border border-border/50 text-xs font-semibold px-3 py-1.5 rounded-lg text-foreground focus:outline-none cursor-pointer">
              <option>This Month</option>
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>

          {/* SVG Wave Line Chart */}
          <div className="h-64 relative flex items-end">
            <svg viewBox="0 0 500 200" className="w-full h-full text-primary">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0"/>
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="hsl(var(--border))" strokeDasharray="4 4" strokeWidth="0.5" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="hsl(var(--border))" strokeDasharray="4 4" strokeWidth="0.5" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="hsl(var(--border))" strokeDasharray="4 4" strokeWidth="0.5" />
              {/* Gradient Area */}
              <path 
                d="M0,180 Q60,110 120,130 T240,80 T360,110 T500,50 L500,200 L0,200 Z" 
                fill="url(#chartGrad)" 
              />
              {/* Stroke Line */}
              <path 
                d="M0,180 Q60,110 120,130 T240,80 T360,110 T500,50" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3.5" 
                strokeLinecap="round"
              />
              {/* Interactive Dots */}
              <circle cx="120" cy="130" r="5" className="fill-primary stroke-card stroke-2" />
              <circle cx="240" cy="80" r="5" className="fill-primary stroke-card stroke-2" />
              <circle cx="500" cy="50" r="5" className="fill-primary stroke-card stroke-2" />
            </svg>
            
            {/* Chart Labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2">
              <span>May 1</span>
              <span>May 8</span>
              <span>May 15</span>
              <span>May 22</span>
              <span>May 31</span>
            </div>
          </div>
        </div>

        {/* Registrations Overview (Donut Chart) */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-foreground text-lg mb-1">Registrations Overview</h3>
            <p className="text-xs text-muted-foreground">Distribution of platform roles</p>
          </div>

          <div className="my-6 flex justify-center relative items-center">
            {/* Simulated Donut Chart using SVG */}
            <svg width="160" height="160" viewBox="0 0 36 36" className="transform -rotate-90">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              {/* Students (58%) */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="58 42" strokeDashoffset="0" />
              {/* Mentor (31%) */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" className="text-emerald-500" strokeWidth="3" strokeDasharray="31 69" strokeDashoffset="-58" />
              {/* Mentors (11%) */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" className="text-purple-500" strokeWidth="3" strokeDasharray="11 89" strokeDashoffset="-89" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-foreground">{totalUsersCount}</span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Roles</span>
            </div>
          </div>

          {/* Chart Legends */}
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary block"></span>
                <span className="text-muted-foreground font-medium">Students</span>
              </div>
              <span className="font-bold text-foreground">{data.stats.totalStudents || 0} ({studentsPct}%)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
                <span className="text-muted-foreground font-medium">Mentors</span>
              </div>
              <span className="font-bold text-foreground">{data.stats.totalMentors || 0} ({mentorsPct}%)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 block"></span>
                <span className="text-muted-foreground font-medium">Alumni & Others</span>
              </div>
              <span className="font-bold text-foreground">{data.stats.totalAlumni || 0} ({alumniPct}%)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Activity Section */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-foreground text-lg">Recent Activity</h3>
          <Link to="/admin/logs" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            View All <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {data.recentActivity && data.recentActivity.length > 0 ? (
          <div className="divide-y divide-border/40">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="py-3.5 flex justify-between items-center text-sm first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs uppercase">
                    {(activity.user || 'U').charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {activity.user} <span className="text-muted-foreground font-normal">{activity.action}</span>
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {activity.time}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic py-4 text-center">No recent activity logged yet.</p>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
