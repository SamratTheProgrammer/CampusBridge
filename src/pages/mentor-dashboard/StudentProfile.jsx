import React, { useState, useEffect } from 'react'
import { MapPin, Mail, BookOpen, GraduationCap, Calendar, Loader2, ArrowLeft, X, Heart, MessageSquare, Send, Video, Briefcase, FileText, Code } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { FaLinkedin as Linkedin, FaGithub as Github, FaGlobe as Globe } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/clerk-react'
import PostComments from '../../components/PostComments'
import API_BASE from '../../utils/api'
import ConfirmModal from '../../components/modals/ConfirmModal'

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
    if (!name) return `https://ui-avatars.com/api/?name=U&background=random`
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
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
          <img 
            src={student.coverPhoto || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"} 
            alt="Cover" 
            className="w-full h-full object-cover cursor-pointer hover:brightness-90 transition-all"
            onClick={() => setViewingImage(student.coverPhoto || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80")}
          />
        </div>
        
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-16 sm:-mt-20 mb-4">
            <img 
              src={student.imageUrl || student.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.firstName || student.name}`} 
              alt={student.firstName || student.name} 
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover border-4 border-card relative z-10 bg-card shadow-md cursor-pointer hover:brightness-90 transition-all"
              onClick={() => setViewingImage(student.imageUrl || student.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.firstName || student.name}`)}
            />
            <div className="flex-1 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{student.firstName ? `${student.firstName} ${student.lastName || ''}`.trim() : student.name}</h1>
                <p className="text-sm sm:text-base text-primary font-medium mt-1">{student.course}</p>
                <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground mt-2">
                  <MapPin className="w-3.5 h-3.5" /> {student.location || 'Location not specified'}
                  &bull; <Calendar className="w-3.5 h-3.5" /> Joined recently
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => navigate(`/mentor-dashboard/messages?userId=${student.clerkId || student._id}`)}
                  className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-sm"
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
                  className="bg-green-500/10 text-green-500 hover:bg-green-500/20 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Video className="w-4 h-4" /> Video Call
                </button>
                {connectionStatus === 'accepted' && (
                  <button 
                    onClick={handleUnfriend}
                    className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <X className="w-4 h-4" /> Remove Student
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 pt-4 border-t border-border/50 mt-6">
            <div className="flex gap-3">
              {student.socialLinks?.linkedin && (
                <a href={student.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-muted rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground">
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {student.socialLinks?.github && (
                <a href={student.socialLinks.github} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-muted rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground">
                  <Github className="w-5 h-5" />
                </a>
              )}
              {student.socialLinks?.portfolio && (
                <a href={student.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-muted rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground">
                  <Globe className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

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
                    <p className="text-xs text-muted-foreground mt-0.5">{edu.year}</p>
                    {edu.score && <p className="text-xs text-muted-foreground mt-0.5">Score: {edu.score}</p>}
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
                      <img src={studentDP} alt={studentName} className="w-12 h-12 rounded-full object-cover" />
                      <div>
                        <h3 className="font-bold text-foreground text-sm">{studentName}</h3>
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
    </div>

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
      isDestructive={true}
    />
    </>
  )
}

export default StudentProfile
