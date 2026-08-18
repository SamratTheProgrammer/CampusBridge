import React, { useState, useEffect } from 'react'
import { MapPin, Mail, BookOpen, GraduationCap, Calendar, Loader2, ArrowLeft, X, Heart, MessageSquare, Send, Video, Briefcase, FileText, Code, Lock, UserPlus, Clock, CheckCircle2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { FaLinkedin as Linkedin, FaGithub as Github, FaGlobe as Globe, FaInstagram, FaFacebook, FaTwitter } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/clerk-react'
import PostComments from '../../components/PostComments'
import API_BASE from '../../utils/api'
import ConfirmModal from '../../components/modals/ConfirmModal'
import defaultPP from '../../assets/default_pp.png'

const StudentProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();
  const [student, setStudent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewingImage, setViewingImage] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('none')
  const [connectionId, setConnectionId] = useState(null)
  const [unfriendConfirm, setUnfriendConfirm] = useState(false)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectMessage, setConnectMessage] = useState('')

  // Post states
  const [posts, setPosts] = useState([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [activeCommentPostId, setActiveCommentPostId] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)

  useEffect(() => {
    if (!id || id === 'undefined') {
      setIsLoading(false);
      toast.error("Failed to load student profile");
      return;
    }
    const fetchStudent = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/${id}`)
        if (res.ok) {
          const data = await res.json()
          setStudent(data)

          if (user && data.clerkId) {
            const connRes = await fetch(`${API_BASE}/api/connections/status/${user.id}/${data.clerkId}`)
            if (connRes.ok) {
              const connData = await connRes.json()
              setConnectionStatus(connData.status || 'none')
              setConnectionId(connData.connectionId || null)
            }
          }
        } else {
          toast.error("Failed to load student profile");
        }
      } catch (err) {
        console.error(err)
        toast.error("An error occurred");
      } finally {
        setIsLoading(false)
      }
    }
    fetchStudent()
  }, [id])

  // Fetch posts by this student once we have their clerkId
  useEffect(() => {
    if (!student?.clerkId) return;
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/posts/user/${student.clerkId}`);
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
  }, [student]);

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
    if (!commentText.trim() || !user || !student?.clerkId) return;
    setIsCommenting(true)
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorClerkId: user.id, content: commentText })
      })
      if (res.ok) {
        setCommentText('')
        const postsRes = await fetch(`${API_BASE}/api/posts/user/${student.clerkId}`);
        if (postsRes.ok) setPosts(await postsRes.json());
      }
    } catch (err) {
      toast.error('Failed to post comment')
    } finally {
      setIsCommenting(false)
    }
  }

  const handleConnect = async () => {
    if (!user || !student) return;
    setIsConnecting(true);
    try {
      const res = await fetch(`${API_BASE}/api/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterClerkId: user.id,
          recipientClerkId: student.clerkId || student._id,
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

  const handleUnfriendConfirm = async () => {
    if (!connectionId) return;
    try {
      const res = await fetch(`${API_BASE}/api/connections/${connectionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConnectionStatus('none');
        setConnectionId(null);
        toast.success('Student removed from connections');
      } else {
        toast.error('Failed to remove student');
      }
    } catch (err) {
      console.error('Error removing connection:', err);
      toast.error('Network error');
    }
  }

  const handleUnfriend = () => {
    setUnfriendConfirm(true);
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
    return defaultPP
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-xl font-semibold text-foreground">Student not found</h2>
        <button onClick={() => navigate(-1)} className="text-primary hover:underline">
          Go Back
        </button>
      </div>
    )
  }

  const isOwner = user?.id === (student?.clerkId || student?._id);
  const isConnected = connectionStatus === 'accepted';
  const isMentorRole = user?.unsafeMetadata?.role === 'mentor';
  
  let isLocked = false;
  // User requested that profile (and social links) always be visible to everyone.

  return (
    <>
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header Profile Card */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="h-40 sm:h-48 bg-muted relative">
          {student.coverPhoto ? (
            <img 
              src={student.coverPhoto} 
              alt="Cover" 
              className={`w-full h-full object-cover transition-all ${isLocked ? '' : 'cursor-pointer hover:brightness-90'}`}
              onClick={isLocked ? undefined : () => setViewingImage(student.coverPhoto)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600"></div>
          )}
        </div>
        
        <div className="px-4 sm:px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-end mb-4">
            <div className="relative -mt-16 sm:-mt-20 shrink-0">
              <img 
                src={student.imageUrl || student.image || getAvatarFallback()} 
                alt={student.firstName || student.name} 
                className={`w-24 h-24 sm:w-40 sm:h-40 rounded-2xl object-cover border-4 border-card relative z-10 bg-card shadow-md transition-all ${isLocked ? '' : 'cursor-pointer hover:brightness-90'}`}
                onClick={isLocked ? undefined : () => setViewingImage(student.imageUrl || student.image || getAvatarFallback())}
              />
            </div>
            <div className="flex-1 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 sm:pt-0">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-foreground">{student.firstName ? `${student.firstName} ${student.lastName || ''}`.trim() : student.name}</h1>
                <p className="text-xs sm:text-base text-primary font-medium mt-0.5 sm:mt-1">{student.course}</p>
                <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground mt-1.5 sm:mt-2">
                  <MapPin className="w-3.5 h-3.5" /> <span>{student.location || 'Location not specified'}</span>
                  {student.dateOfBirth && student.ageVisibility === 'public' && (
                    <>
                      <span className="mx-1">&bull;</span>
                      <span>{Math.floor((new Date() - new Date(student.dateOfBirth).getTime()) / 3.15576e+10)} years old</span>
                    </>
                  )}
                  <span className="mx-1">&bull;</span> <Calendar className="w-3.5 h-3.5" /> <span>Joined recently</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {connectionStatus === 'none' && !isOwner && (
                  <button 
                    onClick={() => setIsConnectModalOpen(true)}
                    className="flex-1 sm:flex-none bg-primary/10 text-primary hover:bg-primary/20 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" /> Connect
                  </button>
                )}
                {connectionStatus === 'pending' && !isOwner && (
                  <button 
                    disabled
                    className="flex-1 sm:flex-none bg-amber-500/10 text-amber-500 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm cursor-not-allowed"
                  >
                    <Clock className="w-4 h-4" /> Pending
                  </button>
                )}
                {connectionStatus === 'accepted' && (
                  <button 
                    onClick={handleUnfriend}
                    className="flex-1 sm:flex-none bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
                  >
                    <X className="w-4 h-4" /> Remove
                  </button>
                )}

                {!isLocked && (
                  <>
                    <button 
                      onClick={() => navigate(`/mentor-dashboard/messages?userId=${student.clerkId || student._id}`)}
                      className="flex-1 sm:flex-none bg-background border border-border/50 text-foreground hover:bg-muted px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" /> Message
                    </button>
                    <button 
                      onClick={() => {
                        const studentName = student.firstName ? `${student.firstName} ${student.lastName || ''}`.trim() : student.name;
                        window.dispatchEvent(new CustomEvent('initiate_call', {
                          detail: { 
                            targetPartner: { 
                              clerkId: student.clerkId || student._id, 
                              name: studentName, 
                              image: student.imageUrl || student.image 
                            }, 
                            type: 'video' 
                          }
                        }))
                      }}
                      className="flex-1 sm:flex-none bg-green-500/10 text-green-500 hover:bg-green-500/20 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
                    >
                      <Video className="w-4 h-4" /> Video Call
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border/40">
            {Array.isArray(student.socialLinks) && student.socialLinks.length > 0 ? (
              student.socialLinks.map((link, i) => {
                let Icon = Globe;
                let colorClass = 'text-foreground';
                if (link.platform === 'LinkedIn') { Icon = Linkedin; colorClass = 'text-[#0A66C2]'; }
                if (link.platform === 'GitHub') { Icon = Github; }
                if (link.platform === 'Instagram') { Icon = FaInstagram; colorClass = 'text-[#E1306C]'; }
                if (link.platform === 'Facebook') { Icon = FaFacebook; colorClass = 'text-[#1877F2]'; }
                if (link.platform === 'Twitter') { Icon = FaTwitter; colorClass = 'text-[#1DA1F2]'; }

                return (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-muted/50 hover:bg-muted text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-border/50 group">
                    <Icon className={`w-4 h-4 ${colorClass} group-hover:scale-110 transition-transform`} /> 
                    {link.platform}
                  </a>
                )
              })
            ) : student.socialLinks && !Array.isArray(student.socialLinks) ? (
              <div className="flex gap-3">
                {student.socialLinks.linkedin && (
                  <a href={student.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-muted rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground">
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {student.socialLinks.github && (
                  <a href={student.socialLinks.github} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-muted rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground">
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {student.socialLinks.portfolio && (
                  <a href={student.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-muted rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground">
                    <Globe className="w-5 h-5" />
                  </a>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">No social links added yet.</span>
            )}
          </div>
        </div>
      </div>

      {isLocked ? (
        <div className="bg-card border border-border/50 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center text-center mt-6">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Profile is Locked</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Connect with {student.firstName ? `${student.firstName} ${student.lastName || ''}`.trim() : student.name} to view their full profile, experience, and posts.
          </p>
        </div>
      ) : (
      <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column - Details */}
        <div className="md:col-span-2 space-y-6">
          
          {/* About */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4">About Me</h3>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {student.aboutMe || "This student hasn't written an about me yet."}
            </p>
          </div>

          {/* Experience Section */}
          {student.experience?.length > 0 && (
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Experience
              </h3>
              <div className="space-y-4">
                {student.experience.map((exp, idx) => (
                  <div key={idx} className="relative pl-4 border-l-2 border-primary/20">
                    <div className="absolute w-2 h-2 bg-primary rounded-full -left-[5px] top-1.5" />
                    <h4 className="font-semibold text-foreground text-sm">{exp.role}</h4>
                    <p className="text-sm font-medium text-foreground/90">{exp.company}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{exp.duration}</p>
                    {exp.description && (
                      <p className="text-xs text-foreground/80 mt-2 whitespace-pre-wrap leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education Section */}
          {student.education?.length > 0 && (
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Education
              </h3>
              <div className="space-y-4">
                {student.education.map((edu, idx) => (
                  <div key={idx} className="relative pl-4 border-l-2 border-primary/20">
                    <div className="absolute w-2 h-2 bg-primary rounded-full -left-[5px] top-1.5" />
                    <h4 className="font-semibold text-foreground text-sm">{edu.degree}</h4>
                    <p className="text-sm font-medium text-foreground/90">{edu.institution}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{edu.duration || edu.year}</p>
                    {(edu.grade || edu.score) && <p className="text-xs text-muted-foreground mt-0.5">Grade: {edu.grade || edu.score}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Stats & Info */}
        <div className="space-y-6">
          
          {/* Info Card */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Academic Info
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">University</p>
                <p className="text-sm font-medium text-foreground">{student.university || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Course</p>
                <p className="text-sm font-medium text-foreground">{student.course || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Interests</p>
                <p className="text-sm font-medium text-foreground">{student.interest || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Resume Card */}
          {student.resumeUrl && (
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Resume
              </h3>
              <a 
                href={student.resumeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-medium text-sm flex justify-center transition-colors"
              >
                View Resume
              </a>
            </div>
          )}

          {/* Skills Card */}
          {student.skills?.length > 0 && (
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {student.skills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-lg">
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
            const studentName = student.firstName ? `${student.firstName} ${student.lastName || ''}`.trim() : student.name
            const studentDP = student.imageUrl || student.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.firstName || student.name}`

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
                      <img 
                        src={studentDP} 
                        alt={studentName} 
                        className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                        onClick={() => {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      />
                      <div>
                        <h3 
                          className="font-bold text-foreground text-sm cursor-pointer hover:underline"
                          onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          {studentName}
                        </h3>
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
                  
                    {post.eventDetails && post.eventDetails.title && (
                      <div 
                        onClick={() => {
                          const role = user?.publicMetadata?.role || 'student';
                          navigate(['mentor', 'alumni'].includes(role.toLowerCase()) ? '/mentor-dashboard/events' : '/dashboard/events');
                        }}
                        className="mb-4 bg-muted/30 hover:bg-muted/60 border border-border/50 rounded-2xl overflow-hidden shadow-sm cursor-pointer transition-all duration-200 group"
                      >
                        {/* FB-Style Top Image Banner */}
                        {(post.imageUrl || post.eventDetails.imageUrl) ? (
                          <div 
                            className="w-full h-48 sm:h-64 bg-muted overflow-hidden relative"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (typeof setViewingImage === 'function') {
                                setViewingImage(post.imageUrl || post.eventDetails.imageUrl);
                              } else {
                                window.open(post.imageUrl || post.eventDetails.imageUrl, '_blank');
                              }
                            }}
                          >
                            <img 
                              src={post.imageUrl || post.eventDetails.imageUrl} 
                              alt={post.eventDetails.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                            <div className="absolute top-3 left-3 flex gap-2">
                              <span className="bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
                                {post.eventDetails.type || 'Event'}
                              </span>
                              {post.eventDetails.date && new Date(post.eventDetails.date).getTime() < new Date().setHours(0,0,0,0) && (
                                <span className="bg-red-600/90 backdrop-blur-md text-white text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
                                  Expired
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-28 sm:h-36 bg-gradient-to-r from-orange-500/20 via-pink-500/10 to-primary/20 flex items-center justify-between px-6 border-b border-border/40 relative overflow-hidden">
                            <div className="flex items-center gap-3 z-10">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                                <Calendar className="w-6 h-6" />
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                  {post.eventDetails.type || 'Event'}
                                </span>
                                {post.eventDetails.date && new Date(post.eventDetails.date).getTime() < new Date().setHours(0,0,0,0) && (
                                  <span className="ml-2 text-[10px] uppercase font-bold tracking-wider bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">
                                    Expired
                                  </span>
                                )}
                              </div>
                            </div>
                            <Calendar className="w-24 h-24 text-foreground/5 absolute -right-4 -bottom-4 pointer-events-none" />
                          </div>
                        )}

                        {/* Event Info Details Bar */}
                        <div className="p-4 sm:p-5 flex items-start gap-4">
                          {post.eventDetails.date && (
                            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shrink-0 text-center shadow-xs">
                              <span className="text-[10px] sm:text-[11px] font-bold text-primary uppercase leading-tight">
                                {new Date(post.eventDetails.date).toLocaleDateString('en-US', { month: 'short' })}
                              </span>
                              <span className="text-base sm:text-lg font-black text-foreground leading-none mt-0.5">
                                {new Date(post.eventDetails.date).getDate()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base sm:text-lg font-bold text-foreground mb-1 leading-snug group-hover:text-primary transition-colors">
                              {post.eventDetails.title}
                            </h4>
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-muted-foreground mt-1.5">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-primary" /> 
                                {post.eventDetails.date ? new Date(post.eventDetails.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-primary" /> 
                                {post.eventDetails.time || 'TBD'}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-primary" /> 
                                {post.eventDetails.location || 'TBD'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {post.jobDetails && post.jobDetails.title && (
                    <div className="mb-4 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-purple-500/30 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start shadow-md relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-70 text-2xl sm:text-3xl pointer-events-none">✨🎉</div>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white text-purple-600 flex flex-col items-center justify-center shrink-0 shadow-sm z-10 overflow-hidden p-2 border border-border/50">
                        {post.jobDetails.companyLogo ? (
                          <img src={post.jobDetails.companyLogo} alt={post.jobDetails.company} className="w-full h-full object-contain" />
                        ) : (
                          <Briefcase className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 z-10">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider bg-purple-500/20 text-purple-700 px-2 py-0.5 rounded-full">
                            I Got The Job! 🚀
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider bg-background/50 backdrop-blur-sm text-foreground px-2 py-0.5 rounded-full border border-border/50">
                            {post.jobDetails.role || 'Full-time'}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-foreground mb-1 truncate">{post.jobDetails.title}</h4>
                        <p className="text-sm font-medium text-foreground/80">{post.jobDetails.company}</p>
                        {post.jobDetails.location && (
                          <p className="text-xs text-foreground/60 mt-1 flex items-center gap-1">
                            📍 {post.jobDetails.location}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {post.imageUrl && !post.bgGradient && (!post.eventDetails || !post.eventDetails.title) && (
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
                            if (student?.clerkId) {
                              const postsRes = await fetch(`${API_BASE}/api/posts/user/${student.clerkId}`);
                              if (postsRes.ok) setPosts(await postsRes.json());
                            }
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
      </>
      )}

      {/* Connect Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-2xl w-full max-w-md p-6 shadow-xl relative">
            <h2 className="text-xl font-bold text-foreground mb-2">Connect with {student.firstName || student.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Add a personalized message to your connection request (optional).
            </p>
            <textarea
              value={connectMessage}
              onChange={(e) => setConnectMessage(e.target.value)}
              placeholder="Hi, I'd like to connect with you!"
              className="w-full h-32 bg-background border border-border/50 rounded-xl p-3 text-sm focus:outline-none focus:border-primary resize-none mb-6"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="px-5 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
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

    <ConfirmModal
      isOpen={unfriendConfirm}
      onClose={() => setUnfriendConfirm(false)}
      onConfirm={handleUnfriendConfirm}
      title="Remove Connection"
      message={`Are you sure you want to remove ${student?.name} from your connections?`}
      confirmText="Remove"
    />
    </div>
    </>
  )
}

export default StudentProfile
