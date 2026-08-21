import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import PostComments from '../../components/PostComments'
import ImageCropModal from '../../components/ImageCropModal'
import PeopleYouMayKnow from '../../components/dashboard/PeopleYouMayKnow'
import MentorOnboardingBanner from '../../components/mentor/MentorOnboardingBanner'
import { calculateProfileCompleteness } from '../../utils/profileCompleteness'
import defaultPP from '../../assets/default_pp.png'
import AutoPlayVideo from '../../components/AutoPlayVideo'
import FeedMediaGrid from '../../components/FeedMediaGrid'
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
  BookOpen,
  Clock,
  MapPin
} from 'lucide-react'
import API_BASE from '../../utils/api'

const indianCities = [
  "Agra", "Ahmedabad", "Ajmer", "Aligarh", "Allahabad", "Amritsar", "Aurangabad",
  "Bangalore", "Bareilly", "Bhopal", "Bhubaneswar", "Chandigarh", "Chennai",
  "Coimbatore", "Cuttack", "Dehradun", "Delhi", "Delhi NCR", "Dhanbad", "Faridabad",
  "Ghaziabad", "Gurgaon", "Guwahati", "Gwalior", "Hubli", "Hyderabad", "Indore",
  "Jabalpur", "Jaipur", "Jalandhar", "Jammu", "Jamshedpur", "Jodhpur", "Kanpur",
  "Kochi", "Kolkata", "Kota", "Kozhikode", "Lucknow", "Ludhiana", "Madurai",
  "Mangalore", "Meerut", "Moradabad", "Mumbai", "Mysore", "Nagpur", "Nashik",
  "Noida", "Patna", "Pondicherry", "Pune", "Raipur", "Rajkot", "Ranchi", "Roorkee",
  "Rourkela", "Salem", "Siliguri", "Srinagar", "Surat", "Thiruvananthapuram",
  "Tiruchirappalli", "Udaipur", "Vadodara", "Varanasi", "Vijayawada", "Visakhapatnam",
  "Warangal"
];

const MentorHome = () => {
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  const [posts, setPosts] = useState([])
  const [recommendedMentors, setRecommendedMentors] = useState([])
  const [profileCompleteness, setProfileCompleteness] = useState({ percentage: 0, missingFields: [] })
  const [verificationStatus, setVerificationStatus] = useState('Pending')

  // Dynamic States
  const [profileViews, setProfileViews] = useState(0)
  const [acceptedConnectionsCount, setAcceptedConnectionsCount] = useState(0)
  const [pendingRequestsList, setPendingRequestsList] = useState([])
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [isJobModalOpen, setIsJobModalOpen] = useState(false)
  const [acceptedJobs, setAcceptedJobs] = useState([])
  const [newJobDetails, setNewJobDetails] = useState({ 
    title: '', company: '', location: '', role: 'Full-time',
    source: 'manual',    locationType: 'india', // 'india' | 'outside'
    city: '',
    country: '',
    campusBridgeJobId: '',
    companyLogo: ''
  })
  const [newEventDetails, setNewEventDetails] = useState({ 
    title: '', type: 'Study Group', format: 'online', date: '', time: '', location: '' 
  })
  const [companySuggestions, setCompanySuggestions] = useState([])
  const [isFetchingCompanies, setIsFetchingCompanies] = useState(false)
  const [mediaType, setMediaType] = useState('image') // 'image' or 'video'

  const recentApps = [
    { id: 1, title: 'Frontend Developer Intern', applicants: 12 },
    { id: 2, title: 'Backend SDE', applicants: 8 },
  ]
  
  // Post Creation State
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostMedia, setNewPostMedia] = useState([]) // Array of { file, type, previewUrl }
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
      const [mentorsRes, connsRes, userRes, jobsRes, studentAppsRes] = await Promise.all([
        fetch(`${API_BASE}/api/users/mentors/suggested`),
        user ? fetch(`${API_BASE}/api/connections/user/${user.id}`) : Promise.resolve({ ok: false }),
        user ? fetch(`${API_BASE}/api/users/${user.id}`) : Promise.resolve({ ok: false }),
        fetch(`${API_BASE}/api/jobs`),
        user ? fetch(`${API_BASE}/api/jobs/student/applications/${user.id}`) : Promise.resolve({ ok: false })
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

      if (jobsRes.ok) {
        // Kept for backward compatibility if we use jobsRes for other feed things later
      }

      if (studentAppsRes.ok) {
        const appsData = await studentAppsRes.json()
        const acceptedApps = Array.isArray(appsData) ? appsData.filter(app => app.status === 'accepted' && app.job) : []
        const acceptedJobsList = acceptedApps.map(app => app.job)
        setAcceptedJobs(acceptedJobsList)
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

  // Fetch Upcoming Sessions
  const fetchSessions = async () => {
    if (!user) return
    try {
      const res = await fetch(`${API_BASE}/api/sessions/user/${user.id}`)
      if (res.ok) {
        const data = await res.json()
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const upcoming = data.filter(s => s.status === 'accepted' && new Date(s.date) >= now)
        setUpcomingSessions(upcoming.slice(0, 3)) // Show top 3
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    }
  }

  // Fetch initial data
  useEffect(() => {
    fetchPosts()
    fetchMentorsAndConnections()
    fetchSessions()
  }, [user])

  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    
    if (newPostMedia.length + files.length > 10) {
      toast.error('You can upload up to 10 media files max')
      return
    }

    const processedFiles = files.map(file => ({
      file,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      previewUrl: URL.createObjectURL(file)
    }))

    setNewPostMedia(prev => [...prev, ...processedFiles])
    e.target.value = ''
  }

  const handleCropComplete = (croppedFile) => {
    setNewPostMedia(prev => [...prev, {
      file: croppedFile,
      type: 'image',
      previewUrl: URL.createObjectURL(croppedFile)
    }])
    setCropModalData(null)
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && newPostMedia.length === 0 && !newEventDetails.title && !newJobDetails.title) {
      toast.error('Post cannot be empty')
      return
    }

    setIsPosting(true)
    try {
      let uploadedMediaFiles = []

      if (newPostMedia.length > 0) {
        for (const item of newPostMedia) {
          const formData = new FormData()
          formData.append('file', item.file)
          
          const uploadRes = await fetch(`${API_BASE}/api/upload/image`, {
            method: 'POST',
            body: formData
          })
          const uploadData = await uploadRes.json()
          
          if (uploadData.success) {
            uploadedMediaFiles.push({ url: uploadData.url, mediaType: item.type })
          } else {
            toast.error('Failed to upload a media file')
            setIsPosting(false)
            return
          }
        }
      }

      let finalLocation = newJobDetails.location
      if (newJobDetails.locationType === 'india' && newJobDetails.city) {
        finalLocation = `${newJobDetails.city}, India`
      } else if (newJobDetails.locationType === 'outside' && newJobDetails.country) {
        finalLocation = newJobDetails.country
      }

      const jobPayload = newJobDetails.title ? {
        title: newJobDetails.title,
        company: newJobDetails.company,
        location: finalLocation,
        role: newJobDetails.role,
        source: newJobDetails.source,
        campusBridgeJobId: newJobDetails.campusBridgeJobId,
        companyLogo: newJobDetails.companyLogo
      } : undefined

      // Create the post
      const res = await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorClerkId: user.id,
          content: newPostContent,
          imageUrl: uploadedMediaFiles.length > 0 ? uploadedMediaFiles[0].url : null,
          mediaFiles: uploadedMediaFiles,
          bgGradient: selectedGradient,
          eventDetails: newEventDetails.title ? newEventDetails : undefined,
          jobDetails: jobPayload,
          mediaType: uploadedMediaFiles.length > 0 ? uploadedMediaFiles[0].mediaType : null
        })
      })

      if (res.ok) {
        toast.success('Post created!')
        setNewPostContent('')
        setNewPostMedia([])
        setSelectedGradient('')
        setShowGradients(false)
        setNewJobDetails({ 
          title: '', company: '', location: '', role: 'Full-time',
          source: 'manual', locationType: 'india', city: '', country: '', campusBridgeJobId: ''
        })
        setNewEventDetails({ title: '', type: 'Study Group', format: 'online', date: '', time: '', location: '' })
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
    return defaultPP
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
          <div 
            className="h-20 bg-muted relative cursor-pointer group"
            onClick={() => navigate('/mentor-dashboard/profile')}
          >
            {isLoaded && user?.unsafeMetadata?.coverPhoto ? (
              <img
                src={user.unsafeMetadata.coverPhoto}
                alt="Cover"
                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 group-hover:opacity-90 transition-opacity"></div>
            )}
          </div>
          <div className="px-4 pb-4 relative text-center">
            <div className="flex justify-center -mt-8 mb-3">
              <img 
                src={isLoaded && user ? (user.hasImage ? user.imageUrl : getAvatarFallback(user.fullName)) : getAvatarFallback('U')} 
                alt="Profile" 
                className="w-16 h-16 rounded-full object-cover border-4 border-card relative z-10 bg-card cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/mentor-dashboard/profile')}
              />
            </div>
            {isLoaded && user ? (
              <>
                <h3 
                  className="font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigate('/mentor-dashboard/profile')}
                >
                  {user.fullName || 'User'}
                </h3>
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
              src={user?.hasImage ? user.imageUrl : getAvatarFallback(user?.fullName)}
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/mentor-dashboard/profile')}
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
          
          {showGradients && newPostMedia.length === 0 && (
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

          {newPostMedia.length > 0 && !selectedGradient && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {newPostMedia.map((media, index) => (
                <div key={index} className="relative group">
                  <button 
                    onClick={() => {
                      setNewPostMedia(prev => prev.filter((_, i) => i !== index))
                    }}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors z-10 opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {media.type === 'video' ? (
                    <video src={media.previewUrl} className="w-full h-32 object-cover rounded-lg" />
                  ) : (
                    <img src={media.previewUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-1 sm:gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleMediaSelect} 
                accept="image/*,video/*" 
                multiple
                className="hidden" 
              />
              <button onClick={() => { fileInputRef.current?.click(); setSelectedGradient(''); }} className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors text-blue-500 font-medium text-sm">
                <ImageIcon className="w-5 h-5" /> <span className="hidden sm:inline">Media</span>
              </button>
              <button onClick={() => { setShowGradients(!showGradients); setNewPostMedia([]); }} className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors text-pink-500 font-medium text-sm">
                <Palette className="w-5 h-5" /> <span className="hidden sm:inline">Background</span>
              </button>

              <button onClick={() => setIsJobModalOpen(true)} className={`flex items-center gap-2 p-2 rounded-lg transition-colors font-medium text-sm ${newJobDetails.title ? 'bg-purple-500/10 text-purple-600' : 'hover:bg-muted text-purple-500'}`}>
                <Briefcase className="w-5 h-5" /> <span className="hidden sm:inline">{newJobDetails.title ? 'Job Attached' : 'Job'}</span>
              </button>
            </div>
            <button 
              onClick={handleCreatePost}
              disabled={isPosting || (!newPostContent.trim() && newPostMedia.length === 0 && !newEventDetails.title && !newJobDetails.title)}
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
              const postAuthorDP = (post.authorClerkId === user?.id) ? (user?.hasImage ? user.imageUrl : getAvatarFallback(user?.fullName)) : (post.author?.image || getAvatarFallback(post.author?.name))
              const showComments = activeCommentPostId === post._id

              return (
                <motion.div
                  key={post._id}
                  id={`post-${post._id}`}
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
                                <CalendarIcon className="w-6 h-6" />
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
                            <CalendarIcon className="w-24 h-24 text-foreground/5 absolute -right-4 -bottom-4 pointer-events-none" />
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
                                <CalendarIcon className="w-3.5 h-3.5 text-primary" /> 
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

                  </div>

                  {((post.mediaFiles && post.mediaFiles.length > 0) || post.imageUrl) && !post.bgGradient && (!post.eventDetails || !post.eventDetails.title) && (
                    <FeedMediaGrid 
                      mediaFiles={post.mediaFiles} 
                      imageUrl={post.imageUrl} 
                      mediaType={post.mediaType}
                      onContainerClick={() => navigate(`?post=${post._id}`, { state: { postData: post } })}
                      onImageClick={(url) => setViewingImage(url)}
                    />
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
            {upcomingSessions.length > 0 ? upcomingSessions.map(session => (
              <div key={session._id} className="group border-l-2 border-primary pl-3 py-1 cursor-pointer" onClick={() => navigate('/mentor-dashboard/sessions')}>
                <h4 className="font-semibold text-sm text-foreground">{session.type}</h4>
                <p className="text-xs text-foreground/80 mt-0.5">with {session.student?.firstName} {session.student?.lastName}</p>
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" /> {new Date(session.date).toLocaleDateString()} • {session.time}
                </p>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground italic">No upcoming sessions.</p>
            )}
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

      {/* Job Attachment Modal */}
      <AnimatePresence>
        {isJobModalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Share a Job Update 🎉</h2>
                  <p className="text-sm text-muted-foreground">Got a new role? Share it with the network.</p>
                </div>
                <button onClick={() => setIsJobModalOpen(false)} className="text-muted-foreground hover:bg-muted p-2 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-5">
                
                {/* Source Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-foreground">Got this job from CampusBridge?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button 
                      onClick={() => setNewJobDetails({ ...newJobDetails, source: 'campusbridge' })}
                      className={`py-2 px-3 text-sm font-medium rounded-xl border ${newJobDetails.source === 'campusbridge' ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border/50 text-foreground hover:bg-muted'}`}
                    >
                      Yes, from CampusBridge
                    </button>
                    <button 
                      onClick={() => setNewJobDetails({ ...newJobDetails, source: 'manual' })}
                      className={`py-2 px-3 text-sm font-medium rounded-xl border ${newJobDetails.source === 'manual' ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border/50 text-foreground hover:bg-muted'}`}
                    >
                      No, External / Manual
                    </button>
                  </div>
                </div>

                {newJobDetails.source === 'campusbridge' ? (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Select a job you were accepted for</label>
                    {acceptedJobs.length > 0 ? (
                      <select 
                        className="w-full px-3 py-2.5 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        onChange={(e) => {
                          const job = acceptedJobs.find(j => j._id === e.target.value)
                          if (job) {
                            setNewJobDetails({
                              ...newJobDetails,
                              title: job.title,
                              company: job.company,
                              campusBridgeJobId: job._id,
                              companyLogo: job.companyLogo || ''
                            })
                          }
                        }}
                        value={newJobDetails.campusBridgeJobId}
                      >
                        <option value="">-- Select a Job --</option>
                        {acceptedJobs.map(job => (
                          <option key={job._id} value={job._id}>{job.title} at {job.company}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 text-sm text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        You don't have any accepted job applications on CampusBridge yet.
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Job Title</label>
                      <input 
                        type="text" 
                        value={newJobDetails.title}
                        onChange={(e) => setNewJobDetails({...newJobDetails, title: e.target.value})}
                        className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                        placeholder="e.g. Software Engineer Intern" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Company Name</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={newJobDetails.company}
                          onChange={async (e) => {
                            const val = e.target.value;
                            setNewJobDetails({...newJobDetails, company: val, companyLogo: ''});
                            if (val.length > 2) {
                              setIsFetchingCompanies(true);
                              try {
                                const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(val)}`);
                                if (res.ok) {
                                  const data = await res.json();
                                  setCompanySuggestions(data);
                                }
                              } catch (err) {
                                console.error(err);
                              } finally {
                                setIsFetchingCompanies(false);
                              }
                            } else {
                              setCompanySuggestions([]);
                            }
                          }}
                          className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                          placeholder="e.g. Google" 
                        />
                        {companySuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-background border border-border/50 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {companySuggestions.map((company, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setNewJobDetails({
                                    ...newJobDetails,
                                    company: company.name,
                                    companyLogo: `https://www.google.com/s2/favicons?sz=128&domain=${company.domain}`
                                  });
                                  setCompanySuggestions([]);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors text-sm"
                              >
                                {company.logo || company.domain ? (
                                  <img 
                                    src={`https://www.google.com/s2/favicons?sz=128&domain=${company.domain}`} 
                                    alt={company.name} 
                                    className="w-6 h-6 object-contain rounded bg-white" 
                                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&size=32&background=7c3aed&color=fff&bold=true` }}
                                  />
                                ) : (
                                  <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                                    <Briefcase className="w-3 h-3 text-muted-foreground" />
                                  </div>
                                )}
                                <span className="font-medium text-foreground">{company.name}</span>
                                <span className="text-xs text-muted-foreground ml-auto">{company.domain}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1 space-y-3">
                    <label className="block text-sm font-semibold text-foreground">Location Type</label>
                    <div className="flex bg-muted/50 p-1 rounded-xl">
                      <button 
                        onClick={() => setNewJobDetails({...newJobDetails, locationType: 'india', country: '', city: ''})}
                        className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${newJobDetails.locationType === 'india' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                      >
                        In India
                      </button>
                      <button 
                        onClick={() => setNewJobDetails({...newJobDetails, locationType: 'outside', country: '', city: ''})}
                        className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${newJobDetails.locationType === 'outside' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                      >
                        Outside India
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-span-2 sm:col-span-1">
                    {newJobDetails.locationType === 'india' ? (
                      <div className="mt-7 sm:mt-0">
                        <label className="block text-sm font-medium text-foreground mb-1.5">City</label>
                        <select 
                          value={indianCities.includes(newJobDetails.city) ? newJobDetails.city : (newJobDetails.city ? 'Other' : '')}
                          onChange={(e) => setNewJobDetails({...newJobDetails, city: e.target.value === 'Other' ? 'Other' : e.target.value})}
                          className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">-- Select City --</option>
                          {indianCities.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          <option value="Other">Other...</option>
                        </select>
                        {(!indianCities.includes(newJobDetails.city) && newJobDetails.city !== '') && (
                          <input 
                            type="text"
                            value={newJobDetails.city === 'Other' ? '' : newJobDetails.city}
                            onChange={(e) => setNewJobDetails({...newJobDetails, city: e.target.value})}
                            placeholder="Type your city name"
                            className="mt-2 w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            autoFocus
                          />
                        )}
                      </div>
                    ) : (
                      <div className="mt-7 sm:mt-0">
                        <label className="block text-sm font-medium text-foreground mb-1.5">Country</label>
                        <select 
                          value={newJobDetails.country}
                          onChange={(e) => setNewJobDetails({...newJobDetails, country: e.target.value})}
                          className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">-- Select Country --</option>
                          {['USA', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Singapore', 'UAE', 'Other'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">Role Type</label>
                    <select 
                      value={newJobDetails.role}
                      onChange={(e) => setNewJobDetails({...newJobDetails, role: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Internship</option>
                      <option>Contract</option>
                    </select>
                  </div>
                </div>

                {/* Caption Field */}
                <div className="pt-2">
                  <label className="block text-sm font-semibold text-foreground mb-2">Caption (Optional)</label>
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Share some thoughts about this job update..."
                    className="w-full px-3 py-3 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none h-24"
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-4">
                  {newJobDetails.title && (
                    <button 
                      onClick={() => {
                        setNewJobDetails({ 
                          title: '', company: '', location: '', role: 'Full-time',
                          source: 'manual', locationType: 'india', city: '', country: '', campusBridgeJobId: '', companyLogo: ''
                        });
                        setCompanySuggestions([]);
                        setIsJobModalOpen(false);
                      }}
                      className="flex-1 bg-destructive/10 hover:bg-destructive/20 text-destructive py-2.5 rounded-xl font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setIsJobModalOpen(false);
                      setCompanySuggestions([]);
                      handleCreatePost();
                    }}
                    disabled={isPosting || !newJobDetails.title || !newJobDetails.company}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isPosting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Post Job
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>
    </div>
  )
}

export default MentorHome
