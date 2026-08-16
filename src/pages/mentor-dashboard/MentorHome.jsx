import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import PostComments from '../../components/PostComments'
import ImageCropModal from '../../components/ImageCropModal'
import PeopleYouMayKnow from '../../components/dashboard/PeopleYouMayKnow'
import MentorOnboardingBanner from '../../components/mentor/MentorOnboardingBanner'
import { calculateProfileCompleteness } from '../../utils/profileCompleteness'
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
  MoreHorizontal,
  Loader2,
  X,
  Palette,
  Send,
  Edit3,
  Trash2,
  Check,
  BookOpen
} from 'lucide-react'
import API_BASE from '../../utils/api'

const MentorHome = () => {
  const { user, isLoaded } = useUser()

  const [posts, setPosts] = useState([])
  const [recommendedMentors, setRecommendedMentors] = useState([])
  const [profileCompleteness, setProfileCompleteness] = useState({ percentage: 0, missingFields: [] })
  const [verificationStatus, setVerificationStatus] = useState('Pending')

  // Dynamic States
  const [profileViews, setProfileViews] = useState(0)
  const [acceptedConnectionsCount, setAcceptedConnectionsCount] = useState(0)
  const [pendingRequestsList, setPendingRequestsList] = useState([])
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  const upcomingSessions = [
    { id: 1, student: 'Rahul Verma', type: 'Resume Review', date: 'Tomorrow', time: '10:00 AM' },
    { id: 2, student: 'Karan Singh', type: 'Mock Interview', date: 'Oct 24', time: '4:30 PM' },
  ]

  const recentApps = [
    { id: 1, title: 'Frontend Developer Intern', applicants: 12 },
    { id: 2, title: 'Backend SDE', applicants: 8 },
  ]
  
  // Post Creation State
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostImage, setNewPostImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedGradient, setSelectedGradient] = useState('')
  const [showGradients, setShowGradients] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)

  // Comment State
  const [activeCommentPostId, setActiveCommentPostId] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)

  const [activeDropdownId, setActiveDropdownId] = useState(null)
  const [editingPostId, setEditingPostId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [postToDelete, setPostToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [likesModalPost, setLikesModalPost] = useState(null)
  
  // Image states
  const [cropModalData, setCropModalData] = useState(null)
  const [viewingImage, setViewingImage] = useState(null)

  const fileInputRef = useRef(null)

  const fetchMentorsAndConnections = async () => {
    try {
      const [mentorsRes, connsRes, userRes] = await Promise.all([
        fetch(`${API_BASE}/api/users/mentors/suggested`),
        user ? fetch(`${API_BASE}/api/connections/user/${user.id}`) : Promise.resolve({ ok: false }),
        user ? fetch(`${API_BASE}/api/users/${user.id}`) : Promise.resolve({ ok: false })
      ])
      
      if (mentorsRes.ok) {
        const data = await mentorsRes.json()
        setRecommendedMentors(data)
      }

      if (connsRes.ok) {
        const connsData = await connsRes.json()
        
        let acceptedCount = 0
        const pending = []
        
        connsData.forEach(c => {
          if (c.status === 'accepted') {
            acceptedCount++
          } else if (c.status === 'pending' && c.recipientClerkId === user.id) {
            pending.push(c)
          }
        })
        
        setAcceptedConnectionsCount(acceptedCount)
        setPendingRequestsList(pending.slice(0, 3)) // Show top 3 pending requests
      }
      
      if (userRes.ok) {
        const userData = await userRes.json()
        setProfileViews(userData.profileViews || 0)
        const comp = calculateProfileCompleteness(userData)
        setProfileCompleteness(comp)
        if (userData.verificationStatus) setVerificationStatus(userData.verificationStatus)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Fetch Posts
  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/posts`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data)
      }
    } catch (err) {
      console.error('Failed to fetch posts', err)
    } finally {
      setIsLoadingPosts(false)
    }
  }

  // Fetch initial data
  useEffect(() => {
    fetchPosts()
    fetchMentorsAndConnections()
  }, [user])

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setCropModalData({ src: reader.result })
      }
      reader.readAsDataURL(file)
      e.target.value = '' // reset input
    }
  }

  const handleCropComplete = (croppedFile) => {
    setNewPostImage(croppedFile)
    setImagePreview(URL.createObjectURL(croppedFile))
    setCropModalData(null)
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !newPostImage) {
      toast.error('Post cannot be empty')
      return
    }

    setIsPosting(true)
    try {
      let imageUrl = null

      // If there's an image, upload it to Cloudinary first
      if (newPostImage) {
        const formData = new FormData()
        formData.append('file', newPostImage)
        
        const uploadRes = await fetch(`${API_BASE}/api/upload/image`, {
          method: 'POST',
          body: formData
        })
        const uploadData = await uploadRes.json()
        
        if (uploadData.success) {
          imageUrl = uploadData.url
        } else {
          toast.error('Failed to upload image')
          setIsPosting(false)
          return
        }
      }

      // Create the post
      const res = await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorClerkId: user.id,
          content: newPostContent,
          imageUrl: imageUrl,
          bgGradient: selectedGradient
        })
      })

      if (res.ok) {
        toast.success('Post created!')
        setNewPostContent('')
        setNewPostImage(null)
        setImagePreview(null)
        setSelectedGradient('')
        setShowGradients(false)
        fetchPosts() // refresh feed
      } else {
        toast.error('Failed to create post')
      }
    } catch (err) {
      console.error(err)
      toast.error('An error occurred')
    } finally {
      setIsPosting(false)
    }
  }

  const handleDeletePost = (postId) => {
    setPostToDelete(postId)
    setActiveDropdownId(null)
  }

  const confirmDeletePost = async () => {
    if (!postToDelete) return
    setIsDeleting(true)
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postToDelete}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorClerkId: user.id })
      })
      if (res.ok) {
        toast.success('Post deleted')
        setPosts(posts.filter(p => p._id !== postToDelete))
      } else {
        toast.error('Failed to delete post')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete post')
    } finally {
      setIsDeleting(false)
      setPostToDelete(null)
    }
  }

  const handleSaveEdit = async (postId) => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorClerkId: user.id, content: editContent })
      })
      if (res.ok) {
        toast.success('Post updated')
        setPosts(posts.map(p => p._id === postId ? { ...p, content: editContent } : p))
        setEditingPostId(null)
        setEditContent('')
      } else {
        toast.error('Failed to update post')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to update post')
    }
  }

  const handleLike = async (postId) => {
    if (!user) return
    
    setPosts(prev => prev.map(p => {
      if (p._id === postId) {
        const safeLikes = Array.isArray(p.likes) ? p.likes : []
        const hasLiked = safeLikes.some(like => (like.clerkId || like) === user.id)
        let newLikes
        if (hasLiked) {
          newLikes = safeLikes.filter(like => (like.clerkId || like) !== user.id)
        } else {
          newLikes = [...safeLikes, { clerkId: user.id, name: user.fullName || 'You', image: user.imageUrl, role: user.publicMetadata?.role || 'student' }]
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
      console.error('Failed to like post', err)
      toast.error('Failed to like post')
      fetchPosts() // Revert on failure
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
        fetchPosts() // refresh to get enriched comments
      } else {
        toast.error('Failed to post comment')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to post comment')
    } finally {
      setIsCommenting(false)
    }
  }

  const handleShare = (postId) => {
    navigator.clipboard.writeText(`${window.location.origin}/dashboard?post=${postId}`)
    toast.success('Link copied to clipboard!')
  }

  const getAvatarFallback = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random&color=fff&bold=true`
  }

  const recentOpportunities = [
    { id: 1, role: 'SDE Intern', company: 'Google', location: 'Bangalore' },
    { id: 2, role: 'Frontend Dev', company: 'Microsoft', location: 'Remote' },
  ]

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
    
    if (hasLiked) {
      return `You and ${count - 1} other${count - 1 > 1 ? 's' : ''}`
    }
    
    return `${likes[0].name || 'Someone'} and ${count - 1} other${count - 1 > 1 ? 's' : ''}`
  }

  const backgroundGradients = [
    'bg-gradient-to-r from-purple-500 to-indigo-500',
    'bg-gradient-to-r from-pink-500 to-rose-500',
    'bg-gradient-to-r from-cyan-500 to-blue-500',
    'bg-gradient-to-r from-amber-500 to-orange-500',
    'bg-gradient-to-r from-emerald-500 to-teal-500'
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Onboarding & Verification Completeness Banner */}
      {!isLoadingProfile && (
        <MentorOnboardingBanner completeness={profileCompleteness} verificationStatus={verificationStatus} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

      {/* Left Column (Profile & Quick Stats) */}
      <div className="hidden md:block md:col-span-3 space-y-6 sticky top-24 self-start">
        {/* Profile Card */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="h-20 bg-muted relative">
            <img
              src={isLoaded && user?.unsafeMetadata?.coverPhoto ? user.unsafeMetadata.coverPhoto : "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="px-4 pb-4 relative text-center">
            <div className="flex justify-center -mt-8 mb-3">
              <img 
                src={isLoaded && user ? (user.imageUrl || getAvatarFallback(user.fullName)) : getAvatarFallback('U')} 
                alt="Profile" 
                className="w-16 h-16 rounded-full object-cover border-4 border-card relative z-10 bg-card"
              />
            </div>
            {isLoaded && user ? (
              <>
                <h3 className="font-bold text-foreground">{user.fullName || 'User'}</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {user.unsafeMetadata?.headline || (user.publicMetadata?.role === 'alumni' ? 'Alumni' : 'Mentor')}
                </p>
              </>
            ) : (
              <div className="space-y-2 mb-4 flex flex-col items-center">
                <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                <div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
              </div>
            )}
            <div className="border-t border-border/40 pt-4 flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Total Posts</span>
              <span className="text-primary font-bold">{posts.filter(p => p.authorClerkId === user?.id).length}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground font-medium">Connections</span>
              <span className="text-primary font-bold">{acceptedConnectionsCount}</span>
            </div>
            <div className="mt-4">
              <Link to="/mentor-dashboard/profile" className="block w-full text-center bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground py-2 rounded-lg text-sm font-medium transition-colors">
                Go to Profile
              </Link>
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
          <Link to="/mentor-dashboard/sessions" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted/50">
            <Calendar className="w-4 h-4" /> My Sessions
          </Link>
        </div>
      </div>

      {/* Main Column (Feed) */}
      <div className="col-span-1 md:col-span-6 space-y-6">

        {/* Create Post */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex gap-4 mb-4">
            <img
              src={user?.imageUrl || getAvatarFallback(user?.fullName)}
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover shrink-0"
            />
            <div className={`flex-1 rounded-xl overflow-hidden ${selectedGradient || 'bg-background border border-border/50'}`}>
              <textarea 
                value={newPostContent}
                onChange={e => setNewPostContent(e.target.value)}
                placeholder="Start a post..."
                className={`w-full px-4 py-3 text-sm focus:outline-none resize-none min-h-[80px] ${
                  selectedGradient 
                    ? 'bg-transparent text-white placeholder:text-white/70 text-xl md:text-2xl font-bold text-center flex items-center justify-center min-h-[200px]' 
                    : 'text-foreground bg-transparent'
                }`}
                style={selectedGradient ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}
              ></textarea>
            </div>
          </div>
          
          {showGradients && !newPostImage && (
            <div className="flex gap-2 mb-4 p-2 bg-muted/50 rounded-lg overflow-x-auto">
              <button 
                onClick={() => setSelectedGradient('')} 
                className={`w-8 h-8 rounded-full bg-background border-2 shrink-0 ${!selectedGradient ? 'border-primary' : 'border-transparent'}`}
              ></button>
              {backgroundGradients.map((grad, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedGradient(grad)} 
                  className={`w-8 h-8 rounded-full ${grad} border-2 shrink-0 ${selectedGradient === grad ? 'border-primary ring-2 ring-background' : 'border-transparent'}`}
                ></button>
              ))}
            </div>
          )}

          {imagePreview && !selectedGradient && (
            <div className="mb-4 relative rounded-xl overflow-hidden bg-muted border border-border/50">
              <button 
                onClick={() => {
                  setNewPostImage(null)
                  setImagePreview(null)
                }}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-contain" />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-1 sm:gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageSelect} 
                accept="image/*" 
                className="hidden" 
              />
              <button onClick={() => { fileInputRef.current?.click(); setSelectedGradient(''); }} className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors text-blue-500 font-medium text-sm">
                <ImageIcon className="w-5 h-5" /> <span className="hidden sm:inline">Media</span>
              </button>
              <button onClick={() => { setShowGradients(!showGradients); setNewPostImage(null); setImagePreview(null); }} className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors text-pink-500 font-medium text-sm">
                <Palette className="w-5 h-5" /> <span className="hidden sm:inline">Background</span>
              </button>
              <button className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors text-orange-500 font-medium text-sm">
                <CalendarIcon className="w-5 h-5" /> <span className="hidden sm:inline">Event</span>
              </button>
              <button className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors text-purple-500 font-medium text-sm">
                <Briefcase className="w-5 h-5" /> <span className="hidden sm:inline">Job</span>
              </button>
            </div>
            <button 
              onClick={handleCreatePost}
              disabled={isPosting || (!newPostContent.trim() && !newPostImage)}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
            >
              {isPosting && <Loader2 className="w-4 h-4 animate-spin" />}
              Post
            </button>
          </div>
        </div>

        {/* Suggested Connections Widget */}
        <PeopleYouMayKnow />

        {/* Feed Posts */}
        <div className="space-y-6">
          {isLoadingPosts ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : posts.length > 0 ? (
            posts.map(post => {
              const safeLikes = post.likes || []
              const hasLiked = user && safeLikes.some(like => (like.clerkId || like) === user.id)
              const commentsArray = post.comments || []
              const postAuthorDP = (post.authorClerkId === user?.id && user?.imageUrl) ? user.imageUrl : (post.author?.image || getAvatarFallback(post.author?.name))
              const showComments = activeCommentPostId === post._id

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
                          src={postAuthorDP} 
                          alt={post.author?.name} 
                          className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                          onClick={() => {
                            if (post.authorClerkId === user?.id) {
                              navigate('/mentor-dashboard/profile');
                            } else if (post.author?.role?.toLowerCase() === 'mentor' || post.author?.role?.toLowerCase() === 'alumni') {
                              navigate(`/mentor-dashboard/mentor/${post.authorClerkId}`);
                            } else {
                              navigate(`/mentor-dashboard/student/${post.authorClerkId}`);
                            }
                          }}
                        />
                        <div>
                          <h3 
                            className="font-bold text-foreground text-sm cursor-pointer hover:underline"
                            onClick={() => {
                              if (post.authorClerkId === user?.id) {
                                navigate('/mentor-dashboard/profile');
                              } else if (post.author?.role?.toLowerCase() === 'mentor' || post.author?.role?.toLowerCase() === 'alumni') {
                                navigate(`/mentor-dashboard/mentor/${post.authorClerkId}`);
                              } else {
                                navigate(`/mentor-dashboard/student/${post.authorClerkId}`);
                              }
                            }}
                          >
                            {post.author?.name}
                          </h3>
                          <p className="text-xs text-muted-foreground capitalize">{post.author?.role}</p>
                          <p className="text-[10px] text-muted-foreground">{formatTime(post.createdAt)}</p>
                        </div>
                      </div>
                      {post.authorClerkId === user?.id && (
                        <div className="relative">
                          <button 
                            onClick={() => setActiveDropdownId(activeDropdownId === post._id ? null : post._id)}
                            className="text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                          {activeDropdownId === post._id && (
                            <div className="absolute right-0 mt-2 w-36 bg-background border border-border/50 rounded-xl shadow-lg z-10 overflow-hidden">
                              <button 
                                onClick={() => {
                                  setEditingPostId(post._id)
                                  setEditContent(post.content)
                                  setActiveDropdownId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" /> Edit
                              </button>
                              <button 
                                onClick={() => handleDeletePost(post._id)}
                                className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors border-t border-border/50"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {editingPostId === post._id ? (
                      <div className="mb-4">
                        <textarea 
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-background border border-primary/50 rounded-xl px-4 py-3 text-sm focus:outline-none resize-none min-h-[100px]"
                        ></textarea>
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => setEditingPostId(null)} className="px-3 py-1.5 text-xs font-medium bg-muted text-foreground rounded-lg hover:bg-muted/80">Cancel</button>
                          <button onClick={() => handleSaveEdit(post._id)} className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Save Changes</button>
                        </div>
                      </div>
                    ) : post.bgGradient ? (
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
                  </div>

                  {post.imageUrl && !post.bgGradient && (
                    <div className="w-full max-h-[500px] bg-muted overflow-hidden flex items-center justify-center">
                      <img 
                        src={post.imageUrl} 
                        alt="Post content" 
                        className="w-full h-full object-contain cursor-pointer" 
                        onClick={() => setViewingImage(post.imageUrl)}
                      />
                    </div>
                  )}

                  <div className="px-4 sm:px-5 py-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-3 mb-2">
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:underline"
                        onClick={() => post.likes?.length > 0 && setLikesModalPost(post)}
                      >
                        <span className="bg-blue-500 text-white rounded-full p-1"><Heart className="w-3 h-3 fill-current" /></span>
                        <span className="font-medium text-foreground/80 hover:text-primary transition-colors">{renderLikesText(post.likes)}</span>
                      </div>
                      <span className="cursor-pointer hover:underline" onClick={() => setActiveCommentPostId(showComments ? null : post._id)}>{commentsArray.length} comments</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start sm:gap-6 pt-1">
                      <button 
                        onClick={() => handleLike(post._id)}
                        className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors font-medium text-sm ${hasLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                      >
                        <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} /> Like
                      </button>
                      <button 
                        onClick={() => setActiveCommentPostId(showComments ? null : post._id)}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted py-2 px-3 rounded-lg transition-colors font-medium text-sm"
                      >
                        <MessageCircle className="w-5 h-5" /> Comment
                      </button>
                      <button onClick={() => handleShare(post._id)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted py-2 px-3 rounded-lg transition-colors font-medium text-sm">
                        <Share2 className="w-5 h-5" /> Share
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showComments && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border/40 bg-muted/10 overflow-hidden"
                      >
                        <PostComments 
                          post={post}
                          currentUser={user}
                          onRefresh={fetchPosts}
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
              <p className="text-muted-foreground text-sm">No posts yet. Be the first to share something!</p>
            </div>
          )}
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
            {pendingRequestsList.map(req => (
              <div key={req._id} className="flex gap-3 items-start border-b border-border/30 pb-3 last:border-0 last:pb-0">
                <img 
                  src={req.targetUser?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.targetUser?.name}`} 
                  alt={req.targetUser?.name} 
                  className="w-10 h-10 rounded-full object-cover shrink-0 cursor-pointer"
                  onClick={() => navigate(req.targetUser?.role === 'mentor' || req.targetUser?.role === 'alumni' ? `/mentor-dashboard/mentor/${req.requesterClerkId}` : `/mentor-dashboard/student/${req.requesterClerkId}`)}
                />
                <div className="flex-1">
                  <h4 
                    className="font-semibold text-sm text-foreground leading-tight cursor-pointer hover:underline"
                    onClick={() => navigate(req.targetUser?.role === 'mentor' || req.targetUser?.role === 'alumni' ? `/mentor-dashboard/mentor/${req.requesterClerkId}` : `/mentor-dashboard/student/${req.requesterClerkId}`)}
                  >
                    {req.targetUser?.name || 'Student'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">{req.targetUser?.course || req.targetUser?.headline || 'Connecting...'}</p>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={async () => {
                        try {
                          await fetch(`${API_BASE}/api/connections/${req._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'accepted' }) })
                          fetchMentorsAndConnections()
                          toast.success('Accepted!')
                        } catch(e) {}
                      }}
                      className="flex-1 flex justify-center items-center gap-1 bg-primary text-primary-foreground py-1.5 rounded-lg text-xs font-medium hover:bg-primary/90 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          await fetch(`${API_BASE}/api/connections/${req._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'declined' }) })
                          fetchMentorsAndConnections()
                          toast.success('Declined')
                        } catch(e) {}
                      }}
                      className="flex-1 flex justify-center items-center gap-1 bg-secondary text-secondary-foreground py-1.5 rounded-lg text-xs font-medium hover:bg-secondary/80 transition-all"
                    >
                      <X className="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {pendingRequestsList.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No pending requests.</p>
            )}
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
          <Link to="/mentor-dashboard/sessions" className="inline-block mt-4 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {postToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl w-full max-w-sm"
            >
              <h3 className="text-xl font-bold text-foreground mb-2">Delete Post?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
              <div className="flex items-center gap-3 justify-end">
                <button 
                  onClick={() => setPostToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeletePost}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Likes Modal */}
      <AnimatePresence>
        {likesModalPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setLikesModalPost(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-xl w-full max-w-sm flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500 text-white rounded-full p-1.5"><Heart className="w-4 h-4 fill-current" /></span>
                  <h3 className="font-bold text-foreground">Likes</h3>
                </div>
                <button onClick={() => setLikesModalPost(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {likesModalPost.likes.map((like, i) => (
                  <div key={like.clerkId || i} className="flex items-center gap-3">
                    <img 
                      src={like.image || getAvatarFallback(like.name)} 
                      alt={like.name} 
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-border/50" 
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate">{like.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{like.role}</p>
                    </div>
                    <button className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-medium rounded-full transition-colors">
                      View
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* Render Image Crop Modal if active */}
      <AnimatePresence>
        {cropModalData && (
          <ImageCropModal 
            imageSrc={cropModalData.src}
            aspectRatio={NaN}
            onCropComplete={handleCropComplete}
            onCancel={() => setCropModalData(null)}
          />
        )}
      </AnimatePresence>

      </div>
    </div>
  )
}

export default MentorHome
