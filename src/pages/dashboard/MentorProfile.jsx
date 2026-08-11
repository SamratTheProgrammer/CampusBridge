import React, { useState, useEffect } from 'react'
import { MapPin, Mail, CheckCircle2, MessageSquare, UserPlus, Briefcase, GraduationCap, Calendar, Loader2, X, Heart, Send, Clock, Video } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { FaLinkedin as Linkedin, FaGithub as Github, FaInstagram as Instagram, FaFacebook as Facebook, FaTwitter as Twitter } from 'react-icons/fa'
import { Globe } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import PostComments from '../../components/PostComments'
import API_BASE from '../../utils/api'

const MentorProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();
  const [mentor, setMentor] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState('none')
  const [connectionId, setConnectionId] = useState(null)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [connectMessage, setConnectMessage] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [viewingImage, setViewingImage] = useState(null)

  // Post states
  const [posts, setPosts] = useState([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [activeCommentPostId, setActiveCommentPostId] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)

  useEffect(() => {
    const fetchMentorAndConnection = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/${id}`)
        if (res.ok) {
          const data = await res.json()
          setMentor(data)
          
          if (user && data.clerkId) {
            const connRes = await fetch(`${API_BASE}/api/connections/status/${user.id}/${data.clerkId}`)
            if (connRes.ok) {
              const connData = await connRes.json()
              setConnectionStatus(connData.status || 'none')
              setConnectionId(connData.connectionId || null)
            }
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMentorAndConnection()
  }, [id, user])

  // Fetch posts by this mentor
  useEffect(() => {
    if (!id) return;
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/posts/user/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setIsLoadingPosts(false);
      }
    };
    fetchPosts();
  }, [id]);

  const handleLike = async (postId) => {
    if (!user) return;
    setPosts(posts.map(p => {
      if (p._id === postId) {
        const safeLikes = p.likes || []
        const hasLiked = safeLikes.some(like => (like.clerkId || like) === user.id)
        let newLikes;
        if (hasLiked) {
          newLikes = safeLikes.filter(like => (like.clerkId || like) !== user.id)
        } else {
          newLikes = [...safeLikes, { clerkId: user.id, name: user.fullName || 'You', image: user.imageUrl }]
        }
        return { ...p, likes: newLikes }
      }
      return p
    }))
    try {
      await fetch(`${API_BASE}/api/posts/${postId}/like`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id })
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleComment = async (postId) => {
    if (!commentText.trim() || !user) return;
    setIsCommenting(true)
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorClerkId: user.id, content: commentText })
      })
      if (res.ok) {
        setCommentText('')
        // Refresh posts
        const postsRes = await fetch(`${API_BASE}/api/posts/user/${id}`);
        if (postsRes.ok) setPosts(await postsRes.json());
      }
    } catch (err) {
      toast.error('Failed to post comment')
    } finally {
      setIsCommenting(false)
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    return `${Math.floor(diffInSeconds / 86400)}d`
  }

  const renderLikesText = (likes) => {
    if (!likes || likes.length === 0) return '0 likes'
    const hasLiked = user ? likes.some(like => (like.clerkId || like) === user.id) : false
    const count = likes.length
    if (count === 1) {
      if (hasLiked) return 'You liked this'
      return `${likes[0].name || 'Someone'} liked this`
    }
    if (hasLiked) return `You and ${count - 1} other${count - 1 > 1 ? 's' : ''}`
    return `${likes[0].name || 'Someone'} and ${count - 1} other${count - 1 > 1 ? 's' : ''}`
  }

  const getAvatarFallback = (name) => {
    if (!name) return `https://ui-avatars.com/api/?name=U&background=random`
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
  }

  const handleConnect = async () => {
    if (!user || !mentor) return;
    setIsConnecting(true);
    try {
      const res = await fetch(`${API_BASE}/api/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterClerkId: user.id,
          recipientClerkId: mentor.clerkId,
          message: connectMessage
        })
      });
      if (res.ok) {
        setConnectionStatus('pending');
        setIsConnectModalOpen(false);
        toast.success('Connection request sent!');
      } else {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          toast.error(data.message || 'Failed to send request');
        } catch (e) {
          console.error('Invalid JSON response:', text);
          toast.error(`Server error: ${res.status}`);
        }
      }
    } catch (err) {
      console.error('Connection request failed:', err);
      toast.error(`Network error: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  }

  const handleUnfriend = async () => {
    if (!connectionId) return;
    try {
      const res = await fetch(`${API_BASE}/api/connections/${connectionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConnectionStatus('none');
        setConnectionId(null);
        toast.success('Connection removed');
      } else {
        toast.error('Failed to remove connection');
      }
    } catch (err) {
      console.error('Error removing connection:', err);
      toast.error('Network error');
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!mentor) {
    return (
      <div className="text-center py-20 bg-card border border-border/50 rounded-2xl max-w-5xl mx-auto">
        <p className="text-muted-foreground">Mentor not found.</p>
      </div>
    )
  }

  const fullName = `${mentor.firstName} ${mentor.lastName || ''}`.trim()
  const avatarUrl = mentor.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.firstName}`
  const coverUrl = mentor.coverPhoto || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"

  return (
    <div className="max-w-5xl mx-auto pb-8">
      {/* Cover & Header Section */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden mb-6 shadow-sm">
        <div className="h-48 sm:h-64 w-full bg-muted relative">
          <img
            src={coverUrl}
            alt="Cover"
            className="w-full h-full object-cover cursor-pointer hover:brightness-90 transition-all"
            onClick={() => setViewingImage(coverUrl)}
          />
        </div>
        <div className="px-6 sm:px-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
            <div className="flex items-end gap-5">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-card relative z-10 bg-card cursor-pointer hover:brightness-90 transition-all"
                  onClick={() => setViewingImage(avatarUrl)}
                />
              </div>
              <div className="mb-2 sm:mb-4 relative z-10 pt-16 sm:pt-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{fullName}</h1>
                  {mentor.role === 'mentor' && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                </div>
                <p className="text-sm font-medium text-foreground mb-1">{mentor.headline || 'Mentor'}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> {mentor.location || 'Location not specified'} 
                  {mentor.address && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground"></span> {mentor.address}
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
               {/* Add any specific badges here if needed */}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/dashboard/mentor/${id}/book`)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-sm shadow-primary/20"
            >
              <Calendar className="w-4 h-4" /> Book Session
            </button>
            
            {connectionStatus === 'none' && (
              <button 
                onClick={() => setIsConnectModalOpen(true)}
                className="bg-background border border-border/50 text-foreground hover:bg-muted px-6 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-sm hidden sm:flex">
                <UserPlus className="w-4 h-4" /> Connect
              </button>
            )}
            
            {connectionStatus === 'pending' && (
              <button 
                disabled
                className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm hidden sm:flex cursor-not-allowed">
                <Clock className="w-4 h-4" /> Request Sent ⏳
              </button>
            )}
            
            {connectionStatus === 'accepted' && (
              <div className="flex gap-2">
                <button 
                  disabled
                  className="bg-green-500/10 text-green-500 border border-green-500/20 px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm hidden sm:flex cursor-default">
                  <CheckCircle2 className="w-4 h-4" /> Connected
                </button>
                <button 
                  onClick={handleUnfriend}
                  className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-sm hidden sm:flex">
                  Unfriend
                </button>
              </div>
            )}

            <button 
              onClick={() => navigate(`/dashboard/messages?userId=${mentor.clerkId || mentor._id}`)}
              className="bg-background border border-border/50 text-foreground hover:bg-muted px-4 sm:px-6 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-sm"
            >
              <MessageSquare className="w-4 h-4" /> <span className="hidden sm:inline">Message</span>
            </button>

            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('initiate_call', {
                  detail: { 
                    targetPartner: { 
                      clerkId: mentor.clerkId || mentor._id, 
                      name: fullName, 
                      image: avatarUrl 
                    }, 
                    type: 'video' 
                  }
                }))
              }}
              className="bg-green-500/10 text-green-500 hover:bg-green-500/20 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-sm"
            >
              <Video className="w-4 h-4" /> Video Call
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Section */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">About</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {mentor.aboutMe || "No about information provided yet."}
            </p>
          </div>

          {/* Experience Section */}
          {mentor.experience && mentor.experience.length > 0 && (
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-4">Experience</h2>
              <div className="space-y-6">
                {mentor.experience.map((exp, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 border border-border/50">
                      <Briefcase className="w-5 h-5 text-foreground/70" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm sm:text-base">{exp.title}</h4>
                      <p className="text-sm text-foreground/80 mt-0.5">{exp.company}</p>
                      <p className="text-xs text-muted-foreground mt-1">{exp.type ? `${exp.type} • ` : ''}{exp.duration}</p>
                      {exp.description && (
                        <p className="text-sm text-foreground/70 mt-2 leading-relaxed">{exp.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education Section */}
          {mentor.education && mentor.education.length > 0 && (
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-4">Education</h2>
              <div className="space-y-6">
                {mentor.education.map((edu, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 border border-border/50">
                      <GraduationCap className="w-5 h-5 text-foreground/70" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {edu.level && edu.level !== 'Other' && <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">{edu.level}</span>}
                        <h4 className="font-bold text-foreground text-sm sm:text-base">{edu.degree}</h4>
                      </div>
                      <p className="text-sm text-foreground/80 mt-0.5">{edu.institution}</p>
                      <p className="text-xs text-muted-foreground mt-1">{edu.duration}</p>
                      {edu.grade && <p className="text-sm text-foreground/70 mt-1">Grade: {edu.grade}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          {/* Contact Details */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">Contact & Links</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <Mail className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Email</p>
                  <a href={`mailto:${mentor.email}`} className="text-sm text-primary hover:underline">{mentor.email}</a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Location</p>
                  <p className="text-sm text-foreground">{mentor.location || 'Not specified'}</p>
                  {mentor.address && (
                    <p className="text-xs text-muted-foreground mt-0.5">{mentor.address}</p>
                  )}
                </div>
              </li>
              {mentor.socialLinks?.map((link, i) => {
                let Icon = Globe;
                let colorClass = 'text-muted-foreground';
                if (link.platform === 'LinkedIn') { Icon = Linkedin; colorClass = 'text-[#0A66C2]'; }
                if (link.platform === 'GitHub') { Icon = Github; }
                if (link.platform === 'Instagram') { Icon = Instagram; colorClass = 'text-[#E1306C]'; }
                if (link.platform === 'Facebook') { Icon = Facebook; colorClass = 'text-[#1877F2]'; }
                if (link.platform === 'Twitter') { Icon = Twitter; colorClass = 'text-[#1DA1F2]'; }
                
                return (
                  <li key={i} className="flex items-center gap-4">
                    <Icon className={`w-5 h-5 shrink-0 ${colorClass}`} />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">{link.platform}</p>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline max-w-[200px] truncate block">
                        {link.url}
                      </a>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Skills */}
          {mentor.skills && mentor.skills.length > 0 && (
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {mentor.skills.map((skill, index) => (
                  <span key={index} className="bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Posts Section */}
      <div className="space-y-4 mt-6">
        <h2 className="text-xl font-bold text-foreground px-1">Posts</h2>
        {isLoadingPosts ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : posts.length > 0 ? (
          posts.map(post => {
            const safeLikes = post.likes || []
            const hasLiked = user && safeLikes.some(like => (like.clerkId || like) === user.id)
            const commentsArray = post.comments || []
            const showComments = activeCommentPostId === post._id
            const postAuthorDP = avatarUrl

            return (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-3">
                      <img src={postAuthorDP} alt={fullName} className="w-12 h-12 rounded-full object-cover" />
                      <div>
                        <h3 className="font-bold text-foreground text-sm">{fullName}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1">{formatTime(post.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {post.bgGradient ? (
                    <div className={`w-full min-h-[250px] rounded-xl flex items-center justify-center p-6 ${post.bgGradient} mb-4`}>
                      <h2 className="text-white text-2xl md:text-3xl font-bold text-center leading-snug whitespace-pre-wrap drop-shadow-md">
                        {post.content}
                      </h2>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed mb-4">
                      {post.content}
                    </p>
                  )}

                  {post.imageUrl && !post.bgGradient && (
                    <div className="rounded-xl overflow-hidden border border-border/40 mb-4 bg-muted/30 flex items-center justify-center">
                      <img 
                        src={post.imageUrl} 
                        alt="Post content" 
                        className="w-full h-auto max-h-[500px] object-contain cursor-pointer" 
                        onClick={() => setViewingImage(post.imageUrl)}
                      />
                    </div>
                  )}
                </div>

                <div className="px-4 sm:px-5 py-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-500 text-white rounded-full p-1"><Heart className="w-3 h-3 fill-current" /></span>
                      <span className="font-medium text-foreground/80">{renderLikesText(post.likes)}</span>
                    </div>
                    <span className="cursor-pointer hover:underline" onClick={() => setActiveCommentPostId(showComments ? null : post._id)}>{commentsArray.length} comments</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start sm:gap-6 pt-1">
                    <button 
                      onClick={() => handleLike(post._id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 sm:flex-none justify-center
                        ${hasLiked ? 'text-blue-500 hover:bg-blue-500/10' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                      <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
                      <span className="hidden sm:inline">{hasLiked ? 'Liked' : 'Like'}</span>
                    </button>
                    <button 
                      onClick={() => setActiveCommentPostId(showComments ? null : post._id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 flex-1 sm:flex-none justify-center"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span className="hidden sm:inline">Comment</span>
                    </button>
                  </div>
                </div>

                  <AnimatePresence>
                    {showComments && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border/40 bg-muted/10 overflow-hidden"
                      >
                        <PostComments 
                          post={post}
                          currentUser={user}
                          onRefresh={async () => {
                            const postsRes = await fetch(`${API_BASE}/api/posts/user/${id}`);
                            if (postsRes.ok) setPosts(await postsRes.json());
                          }}
                          formatTime={formatTime}
                          getAvatarFallback={getAvatarFallback}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
              </motion.div>
            )
          })
        ) : (
          <div className="text-center py-10 bg-card border border-border/50 rounded-2xl">
            <p className="text-muted-foreground text-sm">No posts yet.</p>
          </div>
        )}
      </div>

      {/* Connect Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-2xl w-full max-w-md p-6 shadow-xl relative">
            <h2 className="text-xl font-bold text-foreground mb-2">Connect with {mentor.firstName}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Add a personalized message to your connection request (optional).
            </p>
            <textarea
              value={connectMessage}
              onChange={(e) => setConnectMessage(e.target.value)}
              placeholder="Hi, I'd love to connect..."
              className="w-full h-24 bg-muted/50 border border-border/50 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none mb-6"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                disabled={isConnecting}
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Image Viewer */}
      <AnimatePresence>
        {viewingImage && (
          <div 
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm cursor-zoom-out"
            onClick={() => setViewingImage(null)}
          >
            <button 
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
              onClick={() => setViewingImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={viewingImage} 
              alt="Full view" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MentorProfile
