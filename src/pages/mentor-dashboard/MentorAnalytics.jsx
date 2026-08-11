import React, { useState, useEffect } from 'react'
import { Users, Eye, MousePointerClick, TrendingUp, Star, Award, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import API_BASE from '../../utils/api'

const STATS = [
  { label: 'Total Students', value: '48', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Profile Views', value: '1,245', icon: Eye, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { label: 'Post Engagements', value: '3,892', icon: MousePointerClick, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { label: 'Sessions Hosted', value: '156', icon: Award, color: 'text-orange-500', bg: 'bg-orange-500/10' },
]

const PERFORMANCE_DATA = [
  { month: 'Jan', value: 40 },
  { month: 'Feb', value: 65 },
  { month: 'Mar', value: 45 },
  { month: 'Apr', value: 80 },
  { month: 'May', value: 95 },
  { month: 'Jun', value: 85 },
  { month: 'Jul', value: 110 },
  { month: 'Aug', value: 130 },
]

const MentorAnalytics = () => {
  const { user } = useUser();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${API_BASE}/api/analytics/mentor/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setAnalyticsData(data);
        }
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const dataToRender = analyticsData || {
    totalStudents: 0,
    profileViews: 0,
    postEngagements: 0,
    sessionsHosted: 0,
    performanceData: PERFORMANCE_DATA,
    averageRating: 4.9,
    totalReviews: 124
  };

  const dynamicStats = [
    { label: 'Total Students', value: dataToRender.totalStudents.toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Profile Views', value: dataToRender.profileViews.toLocaleString(), icon: Eye, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Post Engagements', value: dataToRender.postEngagements.toLocaleString(), icon: MousePointerClick, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { label: 'Sessions Hosted', value: dataToRender.sessionsHosted.toString(), icon: Award, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const chartData = dataToRender.performanceData;
  const maxVal = Math.max(...chartData.map(d => d.value), 1) // avoid div by 0

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your mentorship impact and profile performance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dynamicStats.map((stat, idx) => (
          <div key={idx} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" /> +12%
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <h3 className="text-3xl font-bold text-foreground mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-foreground">Profile Views Over Time</h3>
            <select className="bg-background border border-border/50 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary">
              <option>This Year</option>
              <option>Last 6 Months</option>
            </select>
          </div>
          
          {/* CSS Bar Chart */}
          <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 mt-8 pt-4 border-l border-b border-border/50 px-4 pb-2 relative">
            {/* Y-axis markers */}
            <div className="absolute -left-8 top-0 text-[10px] text-muted-foreground">150</div>
            <div className="absolute -left-8 top-1/2 text-[10px] text-muted-foreground">75</div>
            <div className="absolute -left-6 bottom-0 text-[10px] text-muted-foreground">0</div>

            {chartData.map((data, idx) => {
              const heightPercent = (data.value / maxVal) * 100
              return (
                <div key={idx} className="flex flex-col items-center flex-1 group">
                  <div className="w-full relative flex justify-center h-full items-end">
                    <div 
                      className="w-full max-w-[40px] bg-primary/20 group-hover:bg-primary transition-all rounded-t-sm"
                      style={{ height: `${heightPercent}%` }}
                    >
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold py-1 px-2 rounded pointer-events-none whitespace-nowrap transition-opacity">
                        {data.value} Views
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground mt-3">{data.month}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Feedback/Ratings */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="font-bold text-foreground mb-6">Mentee Feedback</h3>
          
          <div className="flex flex-col items-center justify-center flex-1 py-8 border-b border-border/40">
            <h1 className="text-5xl font-bold text-foreground mb-2">{dataToRender.averageRating.toFixed(1)}</h1>
            <div className="flex items-center gap-1 text-yellow-400 mb-2">
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
            </div>
            <p className="text-sm text-muted-foreground">Based on {dataToRender.totalReviews} reviews</p>
          </div>

          <div className="pt-6 space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground font-medium">5 Stars</span>
                <span className="text-muted-foreground">92%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full w-[92%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground font-medium">4 Stars</span>
                <span className="text-muted-foreground">6%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full w-[6%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground font-medium">3 Stars</span>
                <span className="text-muted-foreground">2%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full w-[2%]"></div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}

export default MentorAnalytics

