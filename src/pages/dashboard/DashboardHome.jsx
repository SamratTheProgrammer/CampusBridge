import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import CreateEventModal from '../../components/dashboard/CreateEventModal'
import CreatePostModal from '../../components/dashboard/CreatePostModal'
import { 
  Users, 
  FileText, 
  Calendar, 
  MessageSquare,
  Image as ImageIcon,
  Video,
  Calendar as CalendarIcon,
  Briefcase,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal
} from 'lucide-react'

const DashboardHome = () => {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [sentRequests, setSentRequests] = useState(new Set())
  const [likedPosts, setLikedPosts] = useState(new Set())
  const [activeCommentPostId, setActiveCommentPostId] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: {
        name: 'Arjun Mehta',
        role: 'Software Engineer at Google',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&w=150&q=80',
      },
      time: '2 hours ago',
      content: 'Just published a new article on System Design for interviews! Check it out if you are preparing for SWE roles. Let me know if you have any questions in the comments below. 👇',
      likes: 124,
      comments: 18,
      commentsList: [
        { id: 1, author: { name: 'Priya Singh', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&w=150&q=80' }, content: 'This is super helpful Arjun, thanks for sharing!', time: '1 hour ago' }
      ]
    },
    {
      id: 2,
      author: {
        name: 'Sneha Roy',
        role: 'Data Scientist at Microsoft',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&w=150&q=80',
      },
      time: '5 hours ago',
      content: 'I am thrilled to announce that I will be speaking at the upcoming Campus AI/ML Conference next week. Looking forward to connecting with students and sharing insights on the future of generative AI!',
      image: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?ixlib=rb-4.0.3&w=800&q=80',
      likes: 342,
      comments: 45,
      commentsList: []
    }
  ])

  const recommendedMentors = [
    { id: 1, name: 'Rohit Sharma', role: 'Product Manager at Amazon', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=150&q=80' },
    { id: 2, name: 'Priya Singh', role: 'UX Designer at Adobe', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&w=150&q=80' },
  ]

  const recentOpportunities = [
    { id: 1, role: 'SDE Intern', company: 'Google', location: 'Bangalore' },
    { id: 2, role: 'Frontend Dev', company: 'Microsoft', location: 'Remote' },
  ]

  const handleCommentSubmit = (postId) => {
    if (commentText.trim()) {
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: p.comments + 1,
            commentsList: [...(p.commentsList || []), {
              id: Date.now(),
              author: { name: 'Samrat Saha', image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80' },
              content: commentText.trim(),
              time: 'Just now'
            }]
          }
        }
        return p
      }))
      toast.success('Comment posted!')
      setCommentText('')
    }
  }

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
                src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-4 border-card relative z-10 bg-card"
              />
            </div>
            <h3 className="font-bold text-foreground">Samrat Saha</h3>
            <p className="text-xs text-muted-foreground mb-4">MCA Student • Seeking internships</p>

            <div className="border-t border-border/40 pt-4 flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Profile Views</span>
              <span className="text-primary font-bold">42</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground font-medium">Connections</span>
              <span className="text-primary font-bold">128</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm space-y-2">
          <Link to="/dashboard/mentorship" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted/50">
            <Users className="w-4 h-4" /> Mentorship Requests
          </Link>
          <Link to="/dashboard/applications" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted/50">
            <FileText className="w-4 h-4" /> My Applications
          </Link>
          <Link to="/dashboard/events" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted/50">
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
              src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover shrink-0"
            />
            <button 
              onClick={() => setIsPostModalOpen(true)}
              className="flex-1 text-left bg-background border border-border/50 rounded-full px-4 text-muted-foreground hover:bg-muted/50 transition-colors">
              Start a post...
            </button>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-1 sm:gap-2">
              <label className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors text-blue-500 font-medium text-sm cursor-pointer">
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*,video/*" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setSelectedMedia(e.target.files[0])
                      setIsPostModalOpen(true)
                      e.target.value = ''
                    }
                  }} 
                />
                <ImageIcon className="w-5 h-5" /> <span className="hidden sm:inline">Media</span>
              </label>
              <button onClick={() => setIsEventModalOpen(true)} className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors text-orange-500 font-medium text-sm">
                <CalendarIcon className="w-5 h-5" /> <span className="hidden sm:inline">Event</span>
              </button>
              <button onClick={() => toast.success('Job creator opened!')} className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors text-purple-500 font-medium text-sm">
                <Briefcase className="w-5 h-5" /> <span className="hidden sm:inline">Job</span>
              </button>
            </div>
            <button onClick={() => setIsPostModalOpen(true)} className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
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
                  <button onClick={() => toast.success('Options menu opened!')} className="text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed mb-4">
                  {post.content}
                </p>
              </div>

              {post.image && (
                <div className="w-full max-h-96 bg-muted overflow-hidden">
                  <img src={post.image} alt="Post content" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="px-4 sm:px-5 py-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-3 mb-2">
                  <div className="flex items-center gap-1">
                    <span className="bg-blue-500 text-white rounded-full p-0.5"><Heart className="w-3 h-3 fill-current" /></span>
                    <span>{post.likes + (likedPosts.has(post.id) ? 1 : 0)}</span>
                  </div>
                  <button 
                    onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                    className="hover:text-primary transition-colors hover:underline"
                  >
                    {post.comments} comments
                  </button>
                </div>
                <div className="flex items-center justify-between sm:justify-start sm:gap-6 pt-1">
                  <button 
                    onClick={() => {
                      setLikedPosts(prev => {
                        const newSet = new Set(prev)
                        if (newSet.has(post.id)) newSet.delete(post.id)
                        else newSet.add(post.id)
                        return newSet
                      })
                    }} 
                    className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors font-medium text-sm ${
                      likedPosts.has(post.id) ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} /> Like
                  </button>
                  <button 
                    onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)} 
                    className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors font-medium text-sm ${
                      activeCommentPostId === post.id ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" /> Comment
                  </button>
                  <button onClick={() => toast.success('Post shared successfully!')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted py-2 px-3 rounded-lg transition-colors font-medium text-sm">
                    <Share2 className="w-5 h-5" /> Share
                  </button>
                </div>
              </div>

              {activeCommentPostId === post.id && (
                <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-border/40 bg-muted/10 animate-in fade-in slide-in-from-top-2">
                  
                  {post.commentsList && post.commentsList.length > 0 && (
                    <div className="space-y-4 mb-4 mt-2">
                      {post.commentsList.map(comment => (
                        <div key={comment.id} className="flex gap-3">
                          <img src={comment.author.image} alt={comment.author.name} className="w-8 h-8 rounded-full object-cover shrink-0 mt-1" />
                          <div className="bg-background border border-border/50 rounded-2xl px-4 py-2.5 flex-1 shadow-sm">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-semibold text-sm text-foreground">{comment.author.name}</h4>
                              <span className="text-[10px] text-muted-foreground">{comment.time}</span>
                            </div>
                            <p className="text-sm text-foreground/90 leading-relaxed">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 mt-2">
                    <img 
                      src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80" 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 flex items-center bg-background border border-border/50 rounded-full px-4 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                      <input 
                        type="text" 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment..." 
                        className="flex-1 bg-transparent py-2 text-sm focus:outline-none text-foreground"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCommentSubmit(post.id)
                        }}
                        autoFocus
                      />
                      <button 
                        onClick={() => handleCommentSubmit(post.id)}
                        disabled={!commentText.trim()}
                        className="text-primary font-medium text-sm disabled:opacity-50 ml-2"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Column (Widgets) */}
      <div className="hidden lg:block md:col-span-3 space-y-6 sticky top-24 self-start">
        {/* Recommended Mentors */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Suggested Mentors</h3>
          </div>
          <div className="space-y-4">
            {recommendedMentors.map(mentor => (
              <div key={mentor.id} className="flex gap-3 items-start">
                <img src={mentor.image} alt={mentor.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm text-foreground leading-tight">{mentor.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2 line-clamp-2">{mentor.role}</p>
                  <button 
                    onClick={() => {
                      if (!sentRequests.has(mentor.id)) {
                        setSentRequests(prev => new Set(prev).add(mentor.id));
                        toast.success('Connection request sent!');
                      }
                    }} 
                    className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                      sentRequests.has(mentor.id)
                        ? 'bg-muted text-muted-foreground cursor-default'
                        : 'text-primary border border-primary/20 hover:bg-primary/10'
                    }`}
                  >
                    {sentRequests.has(mentor.id) ? 'Request Sent' : 'Connect'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Opportunities */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Recent Jobs</h3>
          </div>
          <div className="space-y-4">
            {recentOpportunities.map(job => (
              <div key={job.id} className="group cursor-pointer">
                <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{job.role}</h4>
                <p className="text-xs text-muted-foreground">{job.company} • {job.location}</p>
              </div>
            ))}
          </div>
          <Link to="/dashboard/jobs" className="inline-block mt-4 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
            View all opportunities →
          </Link>
        </div>
      </div>

      <CreateEventModal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} />
      <CreatePostModal isOpen={isPostModalOpen} onClose={() => { setIsPostModalOpen(false); setSelectedMedia(null); }} initialMedia={selectedMedia} />
    </div>
  )
}

export default DashboardHome
