import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users,
  BookOpen,
  Calendar,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Calendar as CalendarIcon,
  Briefcase,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Check,
  X,
  FileText
} from 'lucide-react'

const MentorHome = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: {
        name: 'Rohit Sharma',
        role: 'Senior Software Engineer at Amazon',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      },
      time: '2 hours ago',
      content: 'Just published a new guide on cracking system design interviews. Happy to review resumes of any of my mentees preparing for SDE roles this season! Let me know in the comments below. 👇',
      likes: 124,
      comments: 18,
    },
    {
      id: 2,
      author: {
        name: 'Priya Singh',
        role: 'UX Designer at Adobe',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&w=150&q=80',
      },
      time: '5 hours ago',
      content: 'Thrilled to share that one of my mentees just landed an internship at Google! Consistent effort and portfolio reviews really pay off. Keep pushing everyone! ✨',
      likes: 342,
      comments: 45,
    }
  ])

  const pendingRequests = [
    { id: 1, name: 'Amit Kumar', course: 'B.Tech CS', interest: 'Frontend Dev', image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&w=150&q=80' },
    { id: 2, name: 'Sneha Gupta', course: 'MCA', interest: 'Cloud Computing', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&w=150&q=80' },
  ]

  const upcomingSessions = [
    { id: 1, student: 'Rahul Verma', type: 'Resume Review', date: 'Tomorrow', time: '10:00 AM' },
    { id: 2, student: 'Karan Singh', type: 'Mock Interview', date: 'Oct 24', time: '4:30 PM' },
  ]

  const recentApps = [
    { id: 1, title: 'Frontend Developer Intern', applicants: 12 },
    { id: 2, title: 'Backend SDE', applicants: 8 },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-8 max-w-7xl mx-auto">

      {/* Left Column (Profile & Quick Stats) */}
      <div className="hidden md:block md:col-span-3 space-y-6 sticky top-24 self-start">
        {/* Profile Card */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="h-16 bg-muted relative">
            <img
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
              alt="Cover"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="px-4 pb-4 relative text-center">
            <div className="flex justify-center -mt-8 mb-3">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-4 border-card relative z-10 bg-card"
              />
            </div>
            <h3 className="font-bold text-foreground">Rohit Sharma</h3>
            <p className="text-xs text-muted-foreground mb-4">Senior Software Engineer at Amazon</p>

            <div className="border-t border-border/40 pt-4 flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Students Mentored</span>
              <span className="text-primary font-bold">48</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground font-medium">Active Mentees</span>
              <span className="text-primary font-bold">12</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground font-medium">Connections</span>
              <span className="text-primary font-bold">326</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm space-y-2">
          <Link to="/mentor-dashboard/mentees" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted/50">
            <Users className="w-4 h-4" /> My Mentees
          </Link>
          <Link to="/mentor-dashboard/requests" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted/50">
            <BookOpen className="w-4 h-4" /> Mentorship Requests
          </Link>
          <Link to="/mentor-dashboard/jobs" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted/50">
            <Briefcase className="w-4 h-4" /> My Job Posts
          </Link>
          <Link to="/mentor-dashboard/events" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted/50">
            <Calendar className="w-4 h-4" /> Upcoming Events
          </Link>
        </div>
      </div>

      {/* Main Column (Feed) */}
      <div className="col-span-1 md:col-span-6 space-y-6">

        {/* Create Post */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex gap-4 mb-4">
            <img
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover shrink-0"
            />
            <button className="flex-1 text-left bg-background border border-border/50 rounded-full px-4 text-muted-foreground hover:bg-muted/50 transition-colors">
              Share something with your mentees...
            </button>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-1 sm:gap-2">
              <button className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors text-blue-500 font-medium text-sm">
                <ImageIcon className="w-5 h-5" /> <span className="hidden sm:inline">Media</span>
              </button>
              <button className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors text-purple-500 font-medium text-sm">
                <Briefcase className="w-5 h-5" /> <span className="hidden sm:inline">Add Job</span>
              </button>
              <button className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors text-orange-500 font-medium text-sm">
                <CalendarIcon className="w-5 h-5" /> <span className="hidden sm:inline">Create Event</span>
              </button>
              <button className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors text-green-500 font-medium text-sm">
                <FileText className="w-5 h-5" /> <span className="hidden sm:inline">Upload Resource</span>
              </button>
            </div>
            <button className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
              Post
            </button>
          </div>
        </div>

        {/* Feed Posts */}
        <div className="space-y-6">
          {posts.map(post => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-3">
                    <img src={post.author.image} alt={post.author.name} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{post.author.name}</h3>
                      <p className="text-xs text-muted-foreground">{post.author.role}</p>
                      <p className="text-[10px] text-muted-foreground">{post.time}</p>
                    </div>
                  </div>
                  <button className="text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed mb-4">
                  {post.content}
                </p>
              </div>

              <div className="px-4 sm:px-5 py-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-3 mb-2">
                  <div className="flex items-center gap-1">
                    <span className="bg-blue-500 text-white rounded-full p-0.5"><Heart className="w-3 h-3 fill-current" /></span>
                    <span>{post.likes}</span>
                  </div>
                  <span>{post.comments} comments</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start sm:gap-6 pt-1">
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted py-2 px-3 rounded-lg transition-colors font-medium text-sm">
                    <Heart className="w-5 h-5" /> Like
                  </button>
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted py-2 px-3 rounded-lg transition-colors font-medium text-sm">
                    <MessageCircle className="w-5 h-5" /> Comment
                  </button>
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted py-2 px-3 rounded-lg transition-colors font-medium text-sm">
                    <Share2 className="w-5 h-5" /> Share
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Column (Widgets) */}
      <div className="hidden lg:block md:col-span-3 space-y-6 sticky top-24 self-start">

        {/* Mentorship Requests */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Mentorship Requests</h3>
          </div>
          <div className="space-y-4">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex gap-3 items-start border-b border-border/30 pb-3 last:border-0 last:pb-0">
                <img src={req.image} alt={req.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-foreground leading-tight">{req.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">{req.course}</p>
                  <div className="flex items-center gap-2">
                    <button className="flex-1 flex justify-center items-center gap-1 bg-primary text-primary-foreground py-1.5 rounded-lg text-xs font-medium hover:bg-primary/90 transition-all">
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button className="flex-1 flex justify-center items-center gap-1 bg-secondary text-secondary-foreground py-1.5 rounded-lg text-xs font-medium hover:bg-secondary/80 transition-all">
                      <X className="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link to="/mentor-dashboard/requests" className="inline-block mt-4 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
            View all requests →
          </Link>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Upcoming Sessions</h3>
          </div>
          <div className="space-y-4">
            {upcomingSessions.map(session => (
              <div key={session.id} className="group border-l-2 border-primary pl-3 py-1">
                <h4 className="font-semibold text-sm text-foreground">{session.type}</h4>
                <p className="text-xs text-foreground/80 mt-0.5">with {session.student}</p>
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" /> {session.date} • {session.time}
                </p>
              </div>
            ))}
          </div>
          <Link to="/mentor-dashboard/events" className="inline-block mt-4 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
            View Schedule →
          </Link>
        </div>

        {/* Recent Job Applications */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Recent Job Apps</h3>
          </div>
          <div className="space-y-4">
            {recentApps.map(job => (
              <div key={job.id} className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm text-foreground">{job.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{job.applicants} applicants</p>
                </div>
                <Link to="/mentor-dashboard/jobs" className="text-xs font-medium text-primary hover:underline">
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}

export default MentorHome


