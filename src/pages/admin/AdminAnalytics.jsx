import React from 'react'
import { Download, Users, UserCheck, Briefcase, Calendar } from 'lucide-react'

const AdminAnalytics = () => {
  const cards = [
    { title: 'Total Users', value: '21,368', change: '+18.5%', icon: Users, color: 'text-blue-500 bg-blue-500/10' },
    { title: 'Active Users', value: '8,562', change: '+12.4%', icon: UserCheck, color: 'text-emerald-500 bg-emerald-500/10' },
    { title: 'Job Applications', value: '2,458', change: '+21.3%', icon: Briefcase, color: 'text-purple-500 bg-purple-500/10' },
    { title: 'Event Registrations', value: '1,952', change: '+16.7%', icon: Calendar, color: 'text-amber-500 bg-amber-500/10' },
  ]

  const depts = [
    { name: 'CSE', pct: '45.2%', count: 9658, color: 'bg-primary' },
    { name: 'ECE', pct: '22.1%', count: 4722, color: 'bg-emerald-500' },
    { name: 'EE', pct: '15.3%', count: 3269, color: 'bg-purple-500' },
    { name: 'IT', pct: '10.2%', count: 2179, color: 'bg-amber-500' },
    { name: 'Others', pct: '7.2%', count: 1540, color: 'bg-rose-500' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Detailed platform analytics, visitor statistics, and operational insights.</p>
        </div>
        <button className="bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-foreground text-xs font-semibold flex items-center gap-2 hover:bg-muted/60 transition-colors self-start sm:self-auto">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className="bg-card border border-border/50 p-6 rounded-2xl shadow-sm">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {card.change}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-muted-foreground text-sm font-medium">{card.title}</h3>
                <p className="text-2xl font-extrabold text-foreground mt-1">{card.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Growth Trend */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm lg:col-span-8 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-foreground text-lg">User Growth</h3>
              <p className="text-xs text-muted-foreground">Historical user signups over time</p>
            </div>
          </div>

          <div className="h-64 relative flex items-end">
            <svg viewBox="0 0 500 200" className="w-full h-full text-primary">
              <defs>
                <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0"/>
                </linearGradient>
              </defs>
              <line x1="0" y1="50" x2="500" y2="50" stroke="hsl(var(--border))" strokeDasharray="4 4" strokeWidth="0.5" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="hsl(var(--border))" strokeDasharray="4 4" strokeWidth="0.5" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="hsl(var(--border))" strokeDasharray="4 4" strokeWidth="0.5" />
              <path d="M0,180 Q60,110 120,130 T240,80 T360,110 T500,50 L500,200 L0,200 Z" fill="url(#analyticsGrad)" />
              <path d="M0,180 Q60,110 120,130 T240,80 T360,110 T500,50" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2">
              <span>May 1</span>
              <span>May 8</span>
              <span>May 15</span>
              <span>May 22</span>
              <span>May 31</span>
            </div>
          </div>
        </div>

        {/* Right Side: Donut breakdown */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-foreground text-lg mb-1">Top Departments</h3>
            <p className="text-xs text-muted-foreground">Distribution across branches</p>
          </div>

          <div className="my-6 flex justify-center relative items-center">
            <svg width="150" height="150" viewBox="0 0 36 36" className="transform -rotate-90">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(var(--muted))" strokeWidth="3.5" />
              {/* CSE (45.2%) */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" className="text-primary" strokeWidth="3.5" strokeDasharray="45 55" strokeDashoffset="0" />
              {/* ECE (22.1%) */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" className="text-emerald-500" strokeWidth="3.5" strokeDasharray="22 78" strokeDashoffset="-45" />
              {/* EE (15.3%) */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" className="text-purple-500" strokeWidth="3.5" strokeDasharray="15 85" strokeDashoffset="-67" />
              {/* IT (10.2%) */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" className="text-amber-500" strokeWidth="3.5" strokeDasharray="10 90" strokeDashoffset="-82" />
              {/* Others (7.2%) */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" className="text-rose-500" strokeWidth="3.5" strokeDasharray="8 92" strokeDashoffset="-92" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-foreground">21,368</span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total</span>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            {depts.map((d) => (
              <div key={d.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${d.color} block`}></span>
                  <span className="text-muted-foreground font-medium">{d.name}</span>
                </div>
                <span className="font-bold text-foreground">{d.count.toLocaleString()} ({d.pct})</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default AdminAnalytics
