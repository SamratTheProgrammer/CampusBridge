import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import PostSkeleton from '../../components/skeletons/PostSkeleton'
import PostComments from '../../components/PostComments'
import ImageCropModal from '../../components/ImageCropModal'
import ModalPortal from '../../components/modals/ModalPortal'
import LikesModal from '../../components/modals/LikesModal'
import PeopleYouMayKnow from '../../components/dashboard/PeopleYouMayKnow'
import MentorOnboardingBanner from '../../components/mentor/MentorOnboardingBanner'
import { calculateProfileCompleteness } from '../../utils/profileCompleteness'
import defaultPP from '../../assets/default_pp.png'
import AutoPlayVideo from '../../components/AutoPlayVideo'
import FeedMediaGrid from '../../components/FeedMediaGrid'
import ImageViewerModal from '../../components/ImageViewerModal'
import FormattedPostText from '../../components/common/FormattedPostText'
import { formatTime } from '../../utils/dateFormatter'
import { formatRoleSubtitle } from '../../utils/textFormatters'
import { useRealtimePosts } from '../../hooks/useRealtimePosts'
import { getCompanyLogo, handleImageError } from '../../utils/logoHelper'
import { getAppUrl } from '../../utils/appUrl'
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
  MapPin,
  RotateCw,
  Link as LinkIcon,
  Smile,
  Mic,
  Download,
  Upload,
  ChevronDown,
  ArrowLeft,
  MessageSquareOff,
  Eye,
  EyeOff
} from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import API_BASE from '../../utils/api'
import AudioPlayerWidget from '../../components/common/AudioPlayerWidget'
import VoiceRecorderModal from '../../components/modals/VoiceRecorderModal'
import { downloadMediaFile } from '../../utils/downloadHelper'

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
  const feedScrollRef = useRef(null)

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

  const [recentApps, setRecentApps] = useState([
    { id: 1, title: 'Frontend Developer Intern', company: 'Google', companyLogo: '', applicants: 12 },
    { id: 2, title: 'Backend SDE', company: 'Microsoft', companyLogo: '', applicants: 8 },
  ])
  
  // Post Creation State
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostMedia, setNewPostMedia] = useState([]) // Array of { file, type, previewUrl }
  const [showMediaUrlInput, setShowMediaUrlInput] = useState(false)
  const [mediaUrlText, setMediaUrlText] = useState('')
  const [mediaUrlType, setMediaUrlType] = useState('auto') // 'auto' | 'image' | 'video'
  const [selectedGradient, setSelectedGradient] = useState('')
  const [showGradients, setShowGradients] = useState(false)
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)
  const [showMediaDropdown, setShowMediaDropdown] = useState(false)
  const mediaDropdownRef = useRef(null)
  const [isPosting, setIsPosting] = useState(false)
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)

  // Comment State
  const [activeCommentPostId, setActiveCommentPostId] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)

  const [activeDropdownId, setActiveDropdownId] = useState(null)
  const [editingPostId, setEditingPostId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false)
  const editEmojiRef = useRef(null)
  const [showNewPostEmojiPicker, setShowNewPostEmojiPicker] = useState(false)
  const newPostEmojiPickerRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [postToDelete, setPostToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [likesModalPost, setLikesModalPost] = useState(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editEmojiRef.current && !editEmojiRef.current.contains(e.target)) {
        setShowEditEmojiPicker(false)
      }
      if (newPostEmojiPickerRef.current && !newPostEmojiPickerRef.current.contains(e.target)) {
        setShowNewPostEmojiPicker(false)
      }
      if (mediaDropdownRef.current && !mediaDropdownRef.current.contains(e.target)) {
        setShowMediaDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Image states
  const [cropModalData, setCropModalData] = useState(null)
  const [viewerData, setViewerData] = useState(null)

  const fileInputRef = useRef(null)

  const fetchMentorsAndConnections = async () => {
    try {
      const [mentorsRes, connsRes, userRes, jobsRes, studentAppsRes, mentorJobsRes] = await Promise.all([
        fetch(`${API_BASE}/api/users/mentors/suggested`),
        user ? fetch(`${API_BASE}/api/connections/user/${user.id}`) : Promise.resolve({ ok: false }),
        user ? fetch(`${API_BASE}/api/users/${user.id}`) : Promise.resolve({ ok: false }),
        fetch(`${API_BASE}/api/jobs`),
        user ? fetch(`${API_BASE}/api/jobs/student/applications/${user.id}`) : Promise.resolve({ ok: false }),
        user ? fetch(`${API_BASE}/api/jobs/mentor/${user.id}`) : Promise.resolve({ ok: false })
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

      if (mentorJobsRes && mentorJobsRes.ok) {
        const mJobsData = await mentorJobsRes.json()
        if (Array.isArray(mJobsData) && mJobsData.length > 0) {
          setRecentApps(mJobsData.map(j => ({
            id: j._id || j.id,
            title: j.title,
            company: j.company || 'CampusBridge',
            companyLogo: j.companyLogo || '',
            applicants: Array.isArray(j.applicants) ? j.applicants.length : (j.applicants || 0)
          })).slice(0, 3))
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Real-time synchronization of posts, comments, likes, edits, and deletions
  useRealtimePosts({ setPosts })

  // Pull-to-refresh state for Instagram-style feed reload
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [isPullRefreshing, setIsPullRefreshing] = useState(false)
  const touchStartYRef = useRef(0)

  // Fetch Posts: Only shuffles when explicitly requested (page reload or pull-to-refresh)
  const fetchPosts = async ({ shuffle = false } = {}) => {
    try {
      setIsLoadingPosts(true)
      const res = await fetch(`${API_BASE}/api/posts?shuffle=${shuffle ? 'true' : 'false'}&t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          if (shuffle) {
            // Instagram-style shuffle ONLY on explicit page reload or pull-to-refresh
            const shuffled = [...data]
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            setPosts(shuffled)
          } else {
            // In-place merge: preserve existing post order and scroll position!
            setPosts(prev => {
              if (!prev || prev.length === 0) return data;
              const dataMap = new Map(data.map(p => [p._id, p]));
              const updatedExisting = prev.map(p => dataMap.get(p._id) || p);
              const existingIds = new Set(prev.map(p => p._id));
              const newlyAdded = data.filter(p => !existingIds.has(p._id));
              return [...newlyAdded, ...updatedExisting];
            })
          }
        } else {
          setPosts([])
        }
      }
    } catch (err) {
      console.error('Failed to fetch posts', err)
    } finally {
      setIsLoadingPosts(false)
      setIsPullRefreshing(false)
    }
  }

  // Refresh or update ONLY a single post (for comments, likes) without ever shuffling or shifting the feed!
  const refreshSinglePost = useCallback(async (postId, updatedComments) => {
    if (!postId) return;
    if (Array.isArray(updatedComments)) {
      setPosts(prev => prev.map(p => (p._id === postId ? { ...p, comments: updatedComments } : p)));
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}`);
      if (res.ok) {
        const updatedPost = await res.json();
        setPosts(prev => prev.map(p => (p._id === postId ? updatedPost : p)));
      }
    } catch (err) {
      console.error('Failed to refresh post', err);
    }
  }, []);

  const isPullRefreshingRef = useRef(false);
  useEffect(() => {
    isPullRefreshingRef.current = isPullRefreshing;
  }, [isPullRefreshing]);

  const isFeedAtTop = useCallback(() => {
    const elScroll = feedScrollRef.current ? feedScrollRef.current.scrollTop : 0;
    const winScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    return elScroll <= 0 && winScroll <= 0;
  }, []);

  const triggerFeedReload = useCallback(() => {
    if (isPullRefreshingRef.current) return;
    setIsPullRefreshing(true);
    setPullDistance(56);
    fetchPosts({ shuffle: true }).finally(() => {
      setTimeout(() => {
        setPullDistance(0);
        setIsPullRefreshing(false);
      }, 500);
    });
  }, []);

  useEffect(() => {
    const el = feedScrollRef.current;
    if (!el) return;

    let touchStartY = 0;
    let isPullingTouch = false;

    const onTouchStart = (e) => {
      if (isPullRefreshingRef.current) return;
      if (isFeedAtTop() && e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
        isPullingTouch = true;
      }
    };

    const onTouchMove = (e) => {
      if (!isPullingTouch || isPullRefreshingRef.current) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartY;

      if (diff > 0 && isFeedAtTop()) {
        if (e.cancelable) e.preventDefault();
        const distance = Math.min(diff * 0.45, 80);
        setPullDistance(distance);
      } else {
        setPullDistance(0);
      }
    };

    const onTouchEnd = () => {
      if (!isPullingTouch) return;
      isPullingTouch = false;
      setPullDistance((prev) => {
        if (prev >= 48 && !isPullRefreshingRef.current) {
          triggerFeedReload();
          return 56;
        }
        return 0;
      });
    };

    // Mouse drag support for desktop / laptop testing
    let mouseStartY = 0;
    let isMouseDown = false;

    const onMouseDown = (e) => {
      if (e.button !== 0 || isPullRefreshingRef.current) return;
      if (e.target.closest('input, textarea, button, select, a, [contenteditable="true"], .no-pull')) return;
      if (isFeedAtTop()) {
        mouseStartY = e.clientY;
        isMouseDown = true;
      }
    };

    const onMouseMove = (e) => {
      if (!isMouseDown || isPullRefreshingRef.current) return;
      if (!isFeedAtTop()) {
        isMouseDown = false;
        setPullDistance(0);
        return;
      }
      const diff = e.clientY - mouseStartY;
      if (diff > 5) {
        const distance = Math.min(diff * 0.45, 80);
        setPullDistance(distance);
      } else {
        setPullDistance(0);
      }
    };

    const onMouseUp = () => {
      if (!isMouseDown) return;
      isMouseDown = false;
      setPullDistance((prev) => {
        if (prev >= 48 && !isPullRefreshingRef.current) {
          triggerFeedReload();
          return 56;
        }
        return 0;
      });
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);

      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isFeedAtTop, triggerFeedReload]);

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
    fetchPosts({ shuffle: true })
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

    const processedFiles = files.map(file => {
      let type = 'image';
      if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';
      
      return {
        file,
        type,
        previewUrl: URL.createObjectURL(file),
        name: file.name
      };
    })

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

  const detectMediaTypeFromUrl = (url) => {
    if (!url) return 'image'
    const cleanUrl = url.split('?')[0].toLowerCase()
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.webm', '.aac']
    if (audioExtensions.some(ext => cleanUrl.endsWith(ext)) || cleanUrl.includes('/audio/')) {
      return 'audio'
    }
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.mkv']
    if (videoExtensions.some(ext => cleanUrl.endsWith(ext))) {
      return 'video'
    }
    if (cleanUrl.includes('/video/') || cleanUrl.includes('/videos/') || cleanUrl.includes('video/upload')) {
      return 'video'
    }
    return 'image'
  }

  const handleDownloadPostMedia = (post) => {
    if (post.mediaFiles && post.mediaFiles.length > 0) {
      post.mediaFiles.forEach((m, idx) => {
        const ext = m.mediaType === 'audio' ? 'mp3' : m.mediaType === 'video' ? 'mp4' : 'jpg';
        downloadMediaFile(m.url, `${post.author?.name || 'post'}_media_${idx + 1}.${ext}`);
      });
    } else if (post.imageUrl) {
      downloadMediaFile(post.imageUrl, `${post.author?.name || 'post'}_media.jpg`);
    }
  }

  const handleAudioReady = (audioItem) => {
    setNewPostMedia(prev => [...prev, audioItem]);
    setSelectedGradient('');
  }

  const handleAddMediaUrl = () => {
    const trimmed = mediaUrlText.trim()
    if (!trimmed) return
    const determinedType = mediaUrlType === 'auto' ? detectMediaTypeFromUrl(trimmed) : mediaUrlType
    setNewPostMedia(prev => [
      ...prev,
      { url: trimmed, previewUrl: trimmed, type: determinedType }
    ])
    setMediaUrlText('')
    setShowMediaUrlInput(false)
  }

  const handleEmojiClick = (emojiData) => {
    setNewPostContent(prev => prev + (emojiData.emoji || ''))
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer?.files || [])
    if (files.length === 0) return

    if (newPostMedia.length + files.length > 10) {
      toast.error('You can only attach up to 10 media files.')
      return
    }

    const processedFiles = files.map(file => {
      let type = 'image'
      if (file.type.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.webm'].some(ext => file.name.toLowerCase().endsWith(ext))) {
        type = 'audio'
      } else if (file.type.startsWith('video/') || ['.mp4', '.mov', '.webm', '.mkv'].some(ext => file.name.toLowerCase().endsWith(ext))) {
        type = 'video'
      }
      return {
        file,
        type,
        previewUrl: URL.createObjectURL(file),
        name: file.name
      }
    })

    setNewPostMedia(prev => [...prev, ...processedFiles])
    setSelectedGradient('')
    toast.success(`Attached ${files.length} file${files.length > 1 ? 's' : ''}`)
  }

  const handleCreatePost = () => {
    if (!newPostContent.trim() && newPostMedia.length === 0 && !newEventDetails.title && !newJobDetails.title) {
      toast.error('Post cannot be empty')
      return
    }

    // 1. Snapshot all post payload data immediately
    const contentToSubmit = newPostContent
    const mediaToSubmit = [...newPostMedia]
    const gradientToSubmit = selectedGradient
    const eventToSubmit = newEventDetails.title ? { ...newEventDetails } : null
    const jobToSubmit = newJobDetails.title ? { ...newJobDetails } : null

    // 2. Clear post creation box instantly so user can do other work (Facebook / Instagram style)
    setNewPostContent('')
    setNewPostMedia([])
    setMediaUrlText('')
    setShowMediaUrlInput(false)
    setSelectedGradient('')
    setShowGradients(false)
    setShowNewPostEmojiPicker(false)
    setNewJobDetails({ 
      title: '', company: '', location: '', role: 'Full-time',
      source: 'manual', locationType: 'india', city: '', country: '', campusBridgeJobId: ''
    })
    setNewEventDetails({ title: '', type: 'Study Group', format: 'online', date: '', time: '', location: '' })
    setMediaType('image')

    // 3. Show non-blocking active publishing notification
    const toastId = toast.loading('Publishing your post...')

    // 4. Asynchronously perform upload and post creation in background
    ;(async () => {
      try {
        let uploadedMediaFiles = []

        if (mediaToSubmit.length > 0) {
          for (const item of mediaToSubmit) {
            if (item.file) {
              const formData = new FormData()
              formData.append('file', item.file)
              
              const uploadRes = await fetch(`${API_BASE}/api/upload/image`, {
                method: 'POST',
                body: formData
              })
              const uploadData = await uploadRes.json()
              
              if (uploadData.success) {
                uploadedMediaFiles.push({ url: uploadData.url, mediaType: item.type, duration: item.duration || 0 })
              } else {
                toast.error('Failed to upload a media file', { id: toastId })
                return
              }
            } else if (item.url) {
              uploadedMediaFiles.push({ url: item.url, mediaType: item.type || 'image', duration: item.duration || 0 })
            }
          }
        }

        let finalLocation = jobToSubmit?.location
        if (jobToSubmit?.locationType === 'india' && jobToSubmit?.city) {
          finalLocation = `${jobToSubmit.city}, India`
        } else if (jobToSubmit?.locationType === 'outside' && jobToSubmit?.country) {
          finalLocation = jobToSubmit.country
        }

        const jobPayload = jobToSubmit?.title ? {
          title: jobToSubmit.title,
          company: jobToSubmit.company,
          location: finalLocation,
          role: jobToSubmit.role,
          source: jobToSubmit.source,
          campusBridgeJobId: jobToSubmit.campusBridgeJobId,
          companyLogo: jobToSubmit.companyLogo
        } : undefined

        const res = await fetch(`${API_BASE}/api/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authorClerkId: user.id,
            content: contentToSubmit,
            imageUrl: uploadedMediaFiles.length > 0 ? uploadedMediaFiles[0].url : null,
            mediaFiles: uploadedMediaFiles,
            bgGradient: gradientToSubmit,
            eventDetails: eventToSubmit || undefined,
            jobDetails: jobPayload,
            mediaType: uploadedMediaFiles.length > 0 ? uploadedMediaFiles[0].mediaType : null
          })
        })

        if (res.ok) {
          const createdPost = await res.json()
          toast.success('Post published successfully!', { id: toastId })
          if (createdPost && (createdPost._id || createdPost.id)) {
            setPosts(prev => {
              const id = createdPost._id || createdPost.id
              if (prev.some(p => (p._id || p.id) === id)) return prev
              return [createdPost, ...prev]
            })
          }
        } else {
          toast.error('Failed to publish post', { id: toastId })
        }
      } catch (err) {
        console.error(err)
        toast.error('Failed to publish post', { id: toastId })
      }
    })()
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

  const handleToggleComments = async (post) => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post._id}/toggle-comments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to toggle comments');
      
      setPosts(prev => prev.map(p => p._id === post._id ? { ...p, commentsDisabled: data.commentsDisabled } : p));
      toast.success(data.commentsDisabled ? 'Commenting turned off' : 'Commenting turned on');
    } catch (err) {
      toast.error(err.message || 'Failed to toggle comments');
    }
  };

  const handleToggleLikesVisibility = async (post) => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post._id}/toggle-likes-visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update like count visibility');
      
      setPosts(prev => prev.map(p => p._id === post._id ? { ...p, hideLikes: data.hideLikes } : p));
      toast.success(data.hideLikes ? 'Like count hidden' : 'Like count visible');
    } catch (err) {
      toast.error(err.message || 'Failed to update like count visibility');
    }
  };

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
          newLikes = [...safeLikes, { 
            clerkId: user.id, 
            name: user.fullName || 'You', 
            image: user.imageUrl, 
            role: user.publicMetadata?.role || 'mentor',
            username: user.username || user.id
          }]
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
        const updatedComments = await res.json()
        setCommentText('')
        if (Array.isArray(updatedComments)) {
          setPosts(prev => prev.map(p => (p._id || p.id) === postId ? { ...p, comments: updatedComments } : p))
        }
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
    navigator.clipboard.writeText(getAppUrl(`/dashboard?post=${postId}`))
    toast.success('Link copied to clipboard!')
  }

  const getAvatarFallback = (name) => {
    return defaultPP
  }

  const recentOpportunities = [
    { id: 1, role: 'SDE Intern', company: 'Google', location: 'Bangalore' },
    { id: 2, role: 'Frontend Dev', company: 'Microsoft', location: 'Remote' },
  ]


  const renderLikesText = (likes, hideLikes = false) => {
    if (!likes || likes.length === 0) {
      if (hideLikes) return 'Liked by others'
      return '0 likes'
    }
    
    const hasLiked = user ? likes.some(like => (like.clerkId || like) === user.id) : false
    const count = likes.length
    
    if (hideLikes) {
      return hasLiked ? 'Liked by you and others' : 'Liked by others'
    }
    
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
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-8">
      {/* Onboarding & Verification Completeness Banner */}
      {!isLoadingProfile && (
        <MentorOnboardingBanner completeness={profileCompleteness} verificationStatus={verificationStatus} />
      )}

      <div 
        onWheel={(e) => {
          if (window.innerWidth >= 768 && feedScrollRef.current) {
            const isOverRight = e.target.closest('.right-widget-col');
            if (!isOverRight && !feedScrollRef.current.contains(e.target)) {
              feedScrollRef.current.scrollTop += e.deltaY;
            }
          }
        }}
        className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start md:h-[calc(100vh-8rem)] md:max-h-[calc(100vh-8rem)] md:overflow-hidden"
      >

      {/* Left Column (Profile & Quick Stats) */}
      <div className="hidden md:block md:col-span-3 space-y-6 md:h-full md:overflow-y-auto scrollbar-none shrink-0">
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
      <div 
        ref={feedScrollRef} 
        className="col-span-1 md:col-span-6 space-y-6 md:h-full md:overflow-y-auto scrollbar-none pb-20 overscroll-contain relative touch-pan-y"
      >
        {/* Instagram/Twitter-style Floating Pull to Refresh Indicator */}
        {(pullDistance > 0 || isPullRefreshing) && (
          <div 
            className="w-full flex items-center justify-center pointer-events-none select-none z-30 transition-all duration-150 ease-out mb-2"
            style={{
              height: isPullRefreshing ? '48px' : `${Math.max(pullDistance, 0)}px`,
              opacity: isPullRefreshing ? 1 : Math.min(pullDistance / 20, 1)
            }}
          >
            <div 
              className={`flex items-center gap-2.5 px-4 py-2 rounded-full bg-card/95 dark:bg-zinc-900/95 backdrop-blur-md border shadow-lg text-xs font-semibold transition-all duration-150 ${
                pullDistance >= 48 || isPullRefreshing 
                  ? 'border-primary ring-2 ring-primary/25 text-primary scale-100 shadow-primary/10' 
                  : 'border-border/80 text-muted-foreground scale-95'
              }`}
            >
              <RotateCw 
                className={`w-4 h-4 shrink-0 transition-transform duration-100 ${
                  isPullRefreshing ? 'animate-spin text-primary' : 'text-primary'
                }`} 
                style={{ 
                  transform: isPullRefreshing ? 'none' : `rotate(${Math.min(pullDistance * 6, 360)}deg)` 
                }}
              />
              <span className="truncate">
                {isPullRefreshing 
                  ? 'Reloading feed...' 
                  : pullDistance >= 48 
                  ? 'Release to reload' 
                  : 'Pull down to reload'}
              </span>
            </div>
          </div>
        )}

        {/* Create Post with Drag & Drop */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`bg-card border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm relative transition-all ${
            isDragging ? 'ring-2 ring-primary ring-dashed bg-primary/5' : ''
          }`}
        >
          {isDragging && (
            <div className="absolute inset-0 bg-primary/10 backdrop-blur-xs border-2 border-dashed border-primary rounded-2xl flex flex-col items-center justify-center z-30 pointer-events-none animate-in fade-in duration-150">
              <Upload className="w-10 h-10 text-primary animate-bounce mb-2" />
              <p className="text-sm font-bold text-primary">Drop media here to attach</p>
              <p className="text-xs text-muted-foreground mt-0.5">Images, videos, or audio files</p>
            </div>
          )}
          <div className="flex gap-4 mb-4">
            <img
              src={user?.hasImage ? user.imageUrl : getAvatarFallback(user?.fullName)}
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/mentor-dashboard/profile')}
            />
            <div className={`flex-1 rounded-xl relative ${selectedGradient || 'bg-background border border-border/50'}`}>
              <textarea 
                value={newPostContent}
                onChange={e => setNewPostContent(e.target.value)}
                placeholder="Start a post..."
                className={`w-full px-4 py-3 text-sm focus:outline-none resize-none min-h-[80px] ${
                  newPostContent.length > 0 ? 'pr-11' : ''
                } ${
                  selectedGradient 
                    ? 'bg-transparent text-white placeholder:text-white/70 text-xl md:text-2xl font-bold text-center flex items-center justify-center min-h-[200px]' 
                    : 'text-foreground bg-transparent'
                }`}
                style={selectedGradient ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}
              ></textarea>

              {/* Show emoji trigger inside Start a post textarea */}
              <div className="absolute right-2.5 bottom-2.5 z-10" ref={newPostEmojiPickerRef}>
                <button 
                  type="button" 
                  onClick={() => setShowNewPostEmojiPicker(!showNewPostEmojiPicker)} 
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    showNewPostEmojiPicker 
                      ? 'bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30' 
                      : selectedGradient 
                        ? 'text-white/80 hover:text-white hover:bg-white/10' 
                        : 'text-muted-foreground hover:text-amber-500 hover:bg-muted'
                  }`}
                  title="Insert emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {showNewPostEmojiPicker && (
                  <div className="absolute right-0 top-full mt-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-border/60 bg-card animate-in fade-in zoom-in-95">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                      lazyLoadEmojis={true}
                      previewConfig={{ showPreview: false }}
                      width={typeof window !== 'undefined' ? Math.min(320, window.innerWidth - 32) : 320}
                      height={360}
                      searchPlaceHolder="Search emoji..."
                    />
                  </div>
                )}
              </div>
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
            <div className="mt-4 space-y-3">
              {/* Images and Videos Grid */}
              {newPostMedia.filter(m => m.type !== 'audio').length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {newPostMedia.filter(m => m.type !== 'audio').map((media, index) => (
                    <div key={index} className="relative group">
                      <button 
                        onClick={() => {
                          setNewPostMedia(prev => prev.filter(item => item !== media))
                        }}
                        className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors z-10 opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {media.type === 'video' ? (
                        <video src={media.previewUrl} controls className="w-full h-32 object-cover rounded-lg bg-black" />
                      ) : (
                        <img src={media.previewUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Audio Attachments */}
              {newPostMedia.filter(m => m.type === 'audio').map((audioItem, idx) => (
                <div key={idx} className="relative group">
                  <button 
                    onClick={() => {
                      setNewPostMedia(prev => prev.filter(item => item !== audioItem))
                    }}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full transition-colors z-20"
                    title="Remove audio"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <AudioPlayerWidget 
                    src={audioItem.previewUrl} 
                    title={audioItem.name || 'Attached Audio'} 
                    duration={audioItem.duration}
                    allowDownload={false}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 gap-2 flex-nowrap relative z-20">
            <div className={`flex items-center gap-1 sm:gap-1.5 relative flex-nowrap overflow-visible shrink min-w-0 py-0.5 ${showMediaDropdown ? 'z-[80]' : 'z-10'}`}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleMediaSelect} 
                accept="image/*,video/*,audio/*" 
                multiple
                className="hidden" 
              />

              {/* Merged Media Button (Upload Media or Media URL) */}
              <div className={`relative shrink-0 ${showMediaDropdown ? 'z-[80]' : 'z-10'}`} ref={mediaDropdownRef}>
                <button 
                  type="button" 
                  onClick={() => setShowMediaDropdown(!showMediaDropdown)} 
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 hover:bg-muted rounded-lg transition-colors font-medium text-xs sm:text-sm whitespace-nowrap shrink-0 ${
                    showMediaDropdown ? 'bg-blue-500/15 text-blue-600 ring-1 ring-blue-500/30' : 'text-blue-500'
                  }`}
                  title="Attach media (upload file or paste URL)"
                >
                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" /> 
                  <span className="inline">Media</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showMediaDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showMediaDropdown && (
                  <div className="absolute left-0 top-full mt-2 w-56 bg-card/98 backdrop-blur-md border border-border/80 rounded-2xl shadow-2xl p-2 z-[100] animate-in fade-in zoom-in-95 pointer-events-auto">
                    <div className="px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40 mb-1.5 flex items-center justify-between">
                      <span>Select Media Option</span>
                      <button 
                        type="button" 
                        onClick={() => setShowMediaDropdown(false)}
                        className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMediaDropdown(false);
                        fileInputRef.current?.click();
                        setSelectedGradient('');
                      }}
                      className="w-full px-2.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted/80 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Upload File</div>
                        <div className="text-[10px] text-muted-foreground">From this device</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMediaDropdown(false);
                        setShowMediaUrlInput(true);
                      }}
                      className="w-full px-2.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted/80 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <LinkIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Media URL</div>
                        <div className="text-[10px] text-muted-foreground">Image or video link</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Audio Button */}
              <button 
                type="button" 
                onClick={() => setIsVoiceModalOpen(true)} 
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 hover:bg-muted rounded-lg transition-colors font-medium text-xs sm:text-sm whitespace-nowrap shrink-0 ${
                  newPostMedia.some(m => m.type === 'audio') ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/30' : 'text-purple-600 dark:text-purple-400 hover:text-purple-700'
                }`}
                title="Record voice or upload audio"
              >
                <Mic className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" /> 
                <span className="inline">Audio</span>
              </button>

              <button 
                type="button"
                onClick={() => { setShowGradients(!showGradients); setNewPostMedia([]); }} 
                className="flex items-center gap-1.5 p-1.5 sm:px-2 sm:py-1.5 hover:bg-muted rounded-lg transition-colors text-pink-500 font-medium text-xs sm:text-sm whitespace-nowrap shrink-0"
                title="Background Color"
              >
                <Palette className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" /> 
                <span className="hidden sm:inline">Background</span>
              </button>

              <button 
                type="button"
                onClick={() => setIsJobModalOpen(true)} 
                className={`flex items-center gap-1.5 p-1.5 sm:px-2 sm:py-1.5 rounded-lg transition-colors font-medium text-xs sm:text-sm whitespace-nowrap shrink-0 ${newJobDetails.title ? 'bg-purple-500/10 text-purple-600' : 'hover:bg-muted text-purple-500'}`}
                title="Attach Job"
              >
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" /> 
                <span className="hidden sm:inline">{newJobDetails.title ? 'Job Attached' : 'Job'}</span>
              </button>
            </div>
            <button 
              onClick={handleCreatePost}
              disabled={!newPostContent.trim() && newPostMedia.length === 0 && !newEventDetails.title && !newJobDetails.title}
              className="bg-primary text-primary-foreground px-4 sm:px-5 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 shrink-0 ml-2 cursor-pointer active:scale-95"
            >
              Post
            </button>
          </div>

          {/* Direct Media (Image or Video) URL input bar */}
          {showMediaUrlInput && (
            <div className="flex flex-col gap-2 p-3 mt-3 bg-muted/40 rounded-xl border border-purple-500/20 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                {/* Back button to return to Media Selection */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMediaUrlInput(false);
                    setShowMediaDropdown(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground bg-background hover:bg-muted rounded-lg border border-border/60 transition-all cursor-pointer shrink-0 shadow-2xs"
                  title="Back to media options"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <div className="w-px h-4 bg-border/60 shrink-0" />

                <LinkIcon className="w-4 h-4 text-purple-500 shrink-0" />
                <input
                  type="url"
                  value={mediaUrlText}
                  onChange={(e) => setMediaUrlText(e.target.value)}
                  placeholder="Paste image or video URL (https://...)"
                  className="flex-1 bg-transparent text-xs focus:outline-none text-foreground placeholder:text-muted-foreground min-w-0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMediaUrl();
                    }
                  }}
                />

                {/* Type Selection Pills */}
                <div className="flex items-center gap-0.5 bg-background/80 p-0.5 rounded-lg border border-border/60 text-[11px] font-medium shrink-0">
                  <button
                    type="button"
                    onClick={() => setMediaUrlType('auto')}
                    className={`px-2 py-0.5 rounded-md transition-all ${mediaUrlType === 'auto' ? 'bg-purple-600 text-white shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaUrlType('image')}
                    className={`px-2 py-0.5 rounded-md transition-all ${mediaUrlType === 'image' ? 'bg-purple-600 text-white shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaUrlType('video')}
                    className={`px-2 py-0.5 rounded-md transition-all ${mediaUrlType === 'video' ? 'bg-purple-600 text-white shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Video
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddMediaUrl}
                  disabled={!mediaUrlText.trim()}
                  className="px-3.5 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 shadow-xs"
                >
                  Attach
                </button>

                <button
                  type="button"
                  onClick={() => setShowMediaUrlInput(false)}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                <span>Supports direct links to images (.jpg, .png, etc.) and videos (.mp4, .webm, etc.)</span>
                {mediaUrlText.trim() && (
                  <span className="font-semibold text-purple-600 dark:text-purple-400 capitalize">
                    Will attach as: {mediaUrlType === 'auto' ? detectMediaTypeFromUrl(mediaUrlText.trim()) : mediaUrlType}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Suggested Connections Widget */}
        <PeopleYouMayKnow />

        {/* Feed Posts */}
        <div className="space-y-6">
          {isLoadingPosts ? (
            <div className="flex flex-col gap-4">
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
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
                            } else {
                              navigate(`/profile/${post.author?.username || post.authorClerkId}`);
                            }
                          }}
                        />
                        <div>
                          <h3 
                            className="font-bold text-foreground text-sm cursor-pointer hover:underline"
                            onClick={() => {
                              if (post.authorClerkId === user?.id) {
                                navigate('/mentor-dashboard/profile');
                              } else {
                                navigate(`/profile/${post.author?.username || post.authorClerkId}`);
                              }
                            }}
                          >
                            {post.author?.name}
                          </h3>
                          <p className="text-xs text-muted-foreground capitalize">{post.author?.role}</p>
                          <p className="text-[10px] text-muted-foreground">{formatTime(post.createdAt)}</p>
                        </div>
                      </div>
                      {(() => {
                        const isAuthor = post.authorClerkId === user?.id;
                        const hasMedia = (post.mediaFiles && post.mediaFiles.length > 0) || post.imageUrl;
                        if (!isAuthor && !hasMedia) return null;

                        return (
                          <div className="relative">
                            <button 
                              onClick={() => setActiveDropdownId(activeDropdownId === post._id ? null : post._id)}
                              className="text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors"
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                            {activeDropdownId === post._id && (
                              <div className="absolute right-0 mt-2 w-52 bg-background border border-border/50 rounded-xl shadow-lg z-10 overflow-hidden py-1">
                                {isAuthor && (
                                  <>
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
                                      onClick={() => {
                                        setActiveDropdownId(null)
                                        handleToggleComments(post)
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors border-t border-border/50"
                                    >
                                      {post.commentsDisabled ? (
                                        <>
                                          <MessageCircle className="w-4 h-4 text-primary" /> Turn on commenting
                                        </>
                                      ) : (
                                        <>
                                          <MessageSquareOff className="w-4 h-4 text-muted-foreground" /> Turn off commenting
                                        </>
                                      )}
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setActiveDropdownId(null)
                                        handleToggleLikesVisibility(post)
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors border-t border-border/50"
                                    >
                                      {post.hideLikes ? (
                                        <>
                                          <Eye className="w-4 h-4 text-primary" /> Unhide like count
                                        </>
                                      ) : (
                                        <>
                                          <EyeOff className="w-4 h-4 text-muted-foreground" /> Hide like count
                                        </>
                                      )}
                                    </button>
                                    <button 
                                      onClick={() => handleDeletePost(post._id)}
                                      className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors border-t border-border/50"
                                    >
                                      <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                  </>
                                )}
                                {hasMedia && (
                                  <button 
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      handleDownloadPostMedia(post);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors ${isAuthor ? 'border-t border-border/50' : ''}`}
                                  >
                                    <Download className="w-4 h-4 text-primary" /> Download Media
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {editingPostId === post._id ? (
                      <div className="mb-4 relative">
                        <textarea 
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-background border border-primary/50 rounded-xl px-4 py-3 text-sm focus:outline-none resize-none min-h-[100px]"
                        ></textarea>
                        
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <div className="relative" ref={editEmojiRef}>
                            <button
                              type="button"
                              onClick={() => setShowEditEmojiPicker(!showEditEmojiPicker)}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                              title="Add emoji"
                            >
                              <Smile className="w-4 h-4 text-primary" />
                              <span className="hidden sm:inline text-xs">Emoji</span>
                            </button>

                            {showEditEmojiPicker && (
                              <div className="absolute left-0 bottom-full mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-border/50 animate-in fade-in zoom-in-95 duration-150">
                                <EmojiPicker
                                  onEmojiClick={(emojiData) => {
                                    setEditContent(prev => prev + emojiData.emoji)
                                    setShowEditEmojiPicker(false)
                                  }}
                                  lazyLoadEmojis={true}
                                  searchPlaceHolder="Search emoji..."
                                  width={300}
                                  height={380}
                                />
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => { setEditingPostId(null); setShowEditEmojiPicker(false); }} 
                              className="px-3 py-1.5 text-xs font-medium bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => { handleSaveEdit(post._id); setShowEditEmojiPicker(false); }} 
                              className="px-3.5 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-xs"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : post.bgGradient ? (
                      <div className={`w-full min-h-[250px] rounded-xl flex items-center justify-center p-6 ${post.bgGradient} mb-4`}>
                        <h2 className="text-white text-2xl md:text-3xl font-bold text-center leading-snug whitespace-pre-wrap drop-shadow-md">
                          <FormattedPostText text={post.content} isGradient={true} />
                        </h2>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed mb-4">
                        <FormattedPostText text={post.content} />
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
                              if (typeof setViewerData === 'function') {
                                setViewerData({ files: [post.imageUrl || post.eventDetails.imageUrl], index: 0 });
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

                  {/* Media Rendering: Visual Media + Audio Media */}
                  {(() => {
                    const allMedia = post.mediaFiles && post.mediaFiles.length > 0 
                      ? post.mediaFiles 
                      : (post.imageUrl ? [{ url: post.imageUrl, mediaType: post.mediaType || 'image' }] : []);

                    const visualFiles = allMedia.filter(m => m.mediaType !== 'audio' && !m.url?.match(/\.(mp3|wav|ogg|m4a|aac)$/i));
                    const audioFiles = allMedia.filter(m => m.mediaType === 'audio' || m.url?.match(/\.(mp3|wav|ogg|m4a|aac)$/i));

                    return (
                      <>
                        {visualFiles.length > 0 && !post.bgGradient && (!post.eventDetails || !post.eventDetails.title) && (
                          <FeedMediaGrid 
                            mediaFiles={visualFiles} 
                            imageUrl={visualFiles[0]?.url} 
                            mediaType={visualFiles[0]?.mediaType}
                            onContainerClick={() => navigate(`?post=${post._id}`, { state: { postData: post } })}
                            onImageClick={(files, idx) => setViewerData({ files, index: idx })}
                          />
                        )}

                        {audioFiles.map((audioItem, aIdx) => (
                          <div key={aIdx} className="px-4 sm:px-5 pb-3">
                            <AudioPlayerWidget 
                              src={audioItem.url} 
                              duration={audioItem.duration}
                              title={`${post.author?.name || 'Author'}'s Audio`} 
                              userAvatar={post.author?.imageUrl}
                              senderName={post.author?.name}
                            />
                          </div>
                        ))}
                      </>
                    );
                  })()}

                  <div className="px-4 sm:px-5 py-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-3 mb-2">
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:underline"
                        onClick={() => post.likes?.length > 0 && setLikesModalPost(post)}
                      >
                        <span className="bg-rose-500 text-white rounded-full p-1"><Heart className="w-3 h-3 fill-current" /></span>
                        <span className="font-medium text-foreground/80 hover:text-primary transition-colors">{renderLikesText(post.likes, post.hideLikes)}</span>
                      </div>
                      <span 
                        className="cursor-pointer hover:underline flex items-center gap-1.5" 
                        onClick={() => setActiveCommentPostId(showComments ? null : post._id)}
                      >
                        {post.commentsDisabled ? (
                          <span className="italic text-muted-foreground/80 flex items-center gap-1">
                            <MessageSquareOff className="w-3.5 h-3.5" /> Comments off
                          </span>
                        ) : (
                          `${commentsArray.length} comments`
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start sm:gap-6 pt-1">
                      <button 
                        onClick={() => handleLike(post._id)}
                        className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors font-medium text-sm ${hasLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                      >
                        <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
                        <span>Like{!post.hideLikes && (post.likes?.length || 0) > 0 ? ` (${post.likes.length})` : ''}</span>
                      </button>
                      <button 
                        onClick={() => setActiveCommentPostId(showComments ? null : post._id)}
                        className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors font-medium text-sm ${
                          post.commentsDisabled 
                            ? 'text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted/50' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        {post.commentsDisabled ? <MessageSquareOff className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />} Comment
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
                          onRefresh={(comments) => refreshSinglePost(post._id, comments)}
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
      <div className="right-widget-col hidden lg:block md:col-span-3 space-y-6 md:h-full md:overflow-y-auto scrollbar-none pb-8 shrink-0">
        
        {/* Mentorship Requests */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Mentorship Requests</h3>
          </div>
          <div className="space-y-4 max-h-[320px] overflow-y-auto scrollbar-none pr-1">
            {pendingRequestsList.map(req => (
              <div key={req._id} className="flex gap-3 items-start border-b border-border/30 pb-3 last:border-0 last:pb-0">
                <img 
                  src={req.targetUser?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.targetUser?.name}`} 
                  alt={req.targetUser?.name} 
                  className="w-10 h-10 rounded-full object-cover shrink-0 cursor-pointer"
                  onClick={() => navigate(`/profile/${req.targetUser?.username || req.requesterClerkId}`)}
                />
                <div className="flex-1">
                  <h4 
                    className="font-semibold text-sm text-foreground leading-tight cursor-pointer hover:underline"
                    onClick={() => navigate(`/profile/${req.targetUser?.username || req.requesterClerkId}`)}
                  >
                    {req.targetUser?.name || 'Student'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">{req.targetUser?.course || (req.targetUser?.headline ? formatRoleSubtitle(req.targetUser.headline, req.targetUser.role) : 'Connecting...')}</p>
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
          <div className="space-y-4 max-h-[260px] overflow-y-auto scrollbar-none pr-1">
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
          <div className="space-y-3.5 max-h-[300px] overflow-y-auto scrollbar-none pr-1">
            {recentApps.map(job => {
              const companyName = job.company || 'Company';
              return (
                <div key={job.id} className="flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img 
                      src={getCompanyLogo(companyName, job.companyLogo)} 
                      alt={companyName}
                      onError={(e) => handleImageError(e, companyName)}
                      className="w-10 h-10 rounded-xl object-contain bg-muted/60 p-1.5 border border-border/50 shrink-0 shadow-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">{job.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {job.company ? `${job.company} • ` : ''}{job.applicants} applicants
                      </p>
                    </div>
                  </div>
                  <Link to="/mentor-dashboard/jobs" className="text-xs font-semibold text-primary hover:underline shrink-0">
                    View
                  </Link>
                </div>
              );
            })}
          </div>
          <Link to="/mentor-dashboard/jobs" className="inline-block mt-4 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
            Manage Jobs →
          </Link>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {postToDelete && (
          <ModalPortal>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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
          </ModalPortal>
        )}
      </AnimatePresence>

      {/* Likes Modal */}
      <LikesModal 
        isOpen={!!likesModalPost} 
        onClose={() => setLikesModalPost(null)} 
        post={likesModalPost} 
        currentUserId={user?.id}
        currentUserRole="mentor"
      />

      {/* Lightbox / Image Viewer */}
      <ImageViewerModal 
        isOpen={!!viewerData} 
        mediaFiles={viewerData?.files} 
        initialIndex={viewerData?.index || 0} 
        onClose={() => setViewerData(null)} 
      />

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
          <ModalPortal>
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
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
          </ModalPortal>
        )}
      </AnimatePresence>

      {/* Voice Recorder Modal */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onAudioReady={handleAudioReady}
      />

      </div>
    </div>
  )
}

export default MentorHome
