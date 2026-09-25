import React, { useState, useEffect } from 'react'
import CardSkeleton from '../../components/skeletons/CardSkeleton'
import ProfileSkeleton from '../../components/skeletons/ProfileSkeleton'
import { MapPin, Mail, BookOpen, GraduationCap, Calendar, Loader2, ArrowLeft, X, Heart, MessageSquare, Send, Video, Briefcase, FileText, Code, Lock, UserPlus, Clock, CheckCircle2, AlertCircle, ArrowRight, Share2, Shield, MoreHorizontal, Edit3, Trash2, Eye, EyeOff, Download, Copy, MessageSquareOff, MessageCircle } from 'lucide-react'
import AutoPlayVideo from '../../components/AutoPlayVideo'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { FaLinkedin as Linkedin, FaGithub as Github, FaGlobe as Globe, FaInstagram, FaFacebook, FaTwitter } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/clerk-react'
import PostComments from '../../components/PostComments'
import API_BASE from '../../utils/api'
import { getAppUrl } from '../../utils/appUrl'
import ConfirmModal from '../../components/modals/ConfirmModal'
import ModalPortal from '../../components/modals/ModalPortal'
import ShareModal from '../../components/modals/ShareModal'
import LikesModal from '../../components/modals/LikesModal'
import defaultPP from '../../assets/default_pp.png'
import FeedMediaGrid from '../../components/FeedMediaGrid'
import AudioPlayerWidget from '../../components/common/AudioPlayerWidget'
import FormattedPostText from '../../components/common/FormattedPostText'
import { downloadMediaFile } from '../../utils/downloadHelper'
import ImageViewerModal from '../../components/ImageViewerModal'
import { formatTime } from '../../utils/dateFormatter'
import { useRealtimePosts } from '../../hooks/useRealtimePosts'

const StudentProfile = ({ initialUser, isAdmin = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminView = isAdmin || location.pathname.startsWith('/admin');
  const { id, username } = useParams();
  const identifier = username || id;
  const { user } = useUser();
  const [student, setStudent] = useState(initialUser || null)
  const [isLoading, setIsLoading] = useState(!initialUser)
  const [viewerData, setViewerData] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('none')
  const [connectionId, setConnectionId] = useState(null)
  const [unfriendConfirm, setUnfriendConfirm] = useState(false)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectMessage, setConnectMessage] = useState('')

  // Post states
  const [posts, setPosts] = useState([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [connectionsCount, setConnectionsCount] = useState(0)
  const [activeCommentPostId, setActiveCommentPostId] = useState(null)
  const [activeDropdownId, setActiveDropdownId] = useState(null)
  const [editingPostId, setEditingPostId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [postToDelete, setPostToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareConfig, setShareConfig] = useState(null)
  const [likesModalPost, setLikesModalPost] = useState(null)

  // Real-time synchronization of posts, comments, likes for this student
  useRealtimePosts({ setPosts, userFilterId: student?.clerkId })
  const [commentText, setCommentText] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)

  useEffect(() => {
    if (initialUser) {
      setStudent(initialUser);
      setIsLoading(false);
    }
  }, [initialUser]);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        let currentStudent = student || initialUser;
        if (!currentStudent && identifier) {
          const res = await fetch(`${API_BASE}/api/users/${identifier}?viewerId=${user?.id || ''}`)
          if (res.ok) {
            currentStudent = await res.json()
            setStudent(currentStudent)
          }
        }

        if (!isAdminView && currentStudent && user && currentStudent.clerkId) {
          const connRes = await fetch(`${API_BASE}/api/connections/status/${user.id}/${currentStudent.clerkId}`)
          if (connRes.ok) {
            const connData = await connRes.json()
            setConnectionStatus(connData.status || 'none')
            setConnectionId(connData.connectionId || null)
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStudent()
  }, [identifier, user, initialUser, isAdminView])

  // Fetch posts by this student once we have their clerkId
  useEffect(() => {
    if (!student?.clerkId) return;
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/posts/user/${student.clerkId}?requestingUserId=${user?.id}`);
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
  }, [student?.clerkId, user?.id]);

  useEffect(() => {
    if (!student?.clerkId) return;
    const fetchConnectionsCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/connections/user/${student.clerkId}`)
        if (res.ok) {
          const data = await res.json()
          const accepted = data.filter(c => c.status === 'accepted')
          setConnectionsCount(accepted.length)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchConnectionsCount();
  }, [student?.clerkId])

  const handleShare = () => {
    if (!student) return;
    setShareConfig({
      shareUrl: getAppUrl(`/profile/${student.username || student.clerkId}`),
      shareType: 'profile',
      itemId: student.username || student.clerkId
    });
    setIsShareModalOpen(true);
  };

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
        const updatedComments = await res.json()
        setCommentText('')
        if (Array.isArray(updatedComments)) {
          setPosts(prev => prev.map(p => (p._id || p.id) === postId ? { ...p, comments: updatedComments } : p))
        }
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

  const handleCancelRequest = async () => {
    if (!user || !student) return;
    setIsConnecting(true);
    try {
      const res = await fetch(`${API_BASE}/api/connections/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterClerkId: user.id,
          recipientClerkId: student.clerkId || student._id
        })
      });
      if (res.ok) {
        setConnectionStatus('none');
        toast.success('Connection request cancelled');
      } else {
        toast.error('Failed to cancel request');
      }
    } catch (err) {
      console.error('Error cancelling:', err);
      toast.error('Network error');
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
    if (hasLiked) return `You and ${count - 1} other${count - 1 > 1 ? 's' : ''}`
    return `${likes[0].name || 'Someone'} and ${count - 1} other${count - 1 > 1 ? 's' : ''}`
  }

  const getAvatarFallback = (name) => {
    return defaultPP
  }

  const handleCopyPostLink = (postId) => {
    const postUrl = getAppUrl(`/?post=${postId}`);
    navigator.clipboard.writeText(postUrl);
    toast.success('Post link copied to clipboard!');
  };

  const handleDownloadPostMedia = (post) => {
    if (post.mediaFiles && post.mediaFiles.length > 0) {
      post.mediaFiles.forEach((m, idx) => {
        const ext = m.mediaType === 'audio' ? 'mp3' : m.mediaType === 'video' ? 'mp4' : 'jpg';
        downloadMediaFile(m.url, `${post.author?.name || studentName || 'post'}_media_${idx + 1}.${ext}`);
      });
    } else if (post.imageUrl) {
      downloadMediaFile(post.imageUrl, `${post.author?.name || studentName || 'post'}_media.jpg`);
    } else if (post.eventDetails?.imageUrl) {
      downloadMediaFile(post.eventDetails.imageUrl, `${post.author?.name || studentName || 'event'}_poster.jpg`);
    } else {
      toast.error('No downloadable media found');
    }
  };

  const handleSharePost = (postId) => {
    setShareConfig({
      shareUrl: getAppUrl(`/?post=${postId}`),
      shareType: 'post',
      itemId: postId
    });
    setIsShareModalOpen(true);
  };

  const handleSaveEdit = async (postId) => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorClerkId: user?.id, content: editContent })
      });
      if (res.ok) {
        toast.success('Post updated');
        setPosts(prev => prev.map(p => p._id === postId ? { ...p, content: editContent } : p));
        setEditingPostId(null);
        setEditContent('');
      } else {
        toast.error('Failed to update post');
      }
    } catch (err) {
      toast.error('Failed to update post');
    }
  };

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

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postToDelete}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorClerkId: user?.id })
      });
      if (res.ok) {
        toast.success('Post deleted');
        setPosts(prev => prev.filter(p => p._id !== postToDelete));
      } else {
        toast.error('Failed to delete post');
      }
    } catch (err) {
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(false);
      setPostToDelete(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeDropdownId && !e.target.closest('.post-dropdown-container')) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdownId]);

  if (isLoading && !student) {
    return (
      <div className="w-full">
        <ProfileSkeleton />
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
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:pb-20">
      {/* Header Profile Card */}
      <div className="bg-card border-x-0 border-t-0 sm:border border-border/50 rounded-none sm:rounded-2xl overflow-hidden shadow-sm relative">
        {!isAdminView && (
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        
        <div className="h-56 sm:h-72 md:h-80 w-full bg-muted relative">
          {(student.coverPhoto || (user?.id === (student.clerkId || student._id) ? user?.unsafeMetadata?.coverPhoto : null)) ? (
            <img 
              src={student.coverPhoto || user?.unsafeMetadata?.coverPhoto} 
              alt="Cover" 
              className={`w-full h-full object-cover object-center transition-all ${isLocked ? '' : 'cursor-pointer hover:brightness-90'}`}
              onClick={isLocked ? undefined : () => setViewerData({ files: [student.coverPhoto || user?.unsafeMetadata?.coverPhoto], index: 0 })}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600"></div>
          )}
        </div>
        
        <div className="px-6 sm:px-10 md:px-12 pb-6 relative">
          <div className="flex flex-col gap-5 sm:gap-6">
            
            {/* Top Row: Avatar and Actions */}
            <div className="flex justify-between items-end w-full -mt-16 sm:-mt-22 md:-mt-24 relative z-10">
              <div className="shrink-0 sm:ml-2 md:ml-3">
                <img 
                  src={student.imageUrl || student.image || getAvatarFallback()} 
                  alt={student.firstName || student.name} 
                  className={`w-28 h-28 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full object-cover border-4 sm:border-[5px] border-card bg-card shadow-lg transition-all ${isLocked ? '' : 'cursor-pointer hover:brightness-90'}`}
                  onClick={isLocked ? undefined : () => setViewerData({ files: [student.imageUrl || student.image || getAvatarFallback()], index: 0 })}
                />
              </div>
              
              {/* Action Buttons on Right */}
              <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-end mb-2 sm:mb-4">
                <button
                  onClick={handleShare}
                  className="bg-background border border-border/50 text-foreground hover:bg-muted p-2 sm:px-4 sm:py-2 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Share</span>
                </button>
                
                {isAdminView ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <Shield className="w-3.5 h-3.5" /> Admin Viewing
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-muted border border-border/50 text-foreground text-xs font-bold shadow-sm">
                      Role: Student
                    </span>
                  </div>
                ) : (
                  <>
                    {connectionStatus === 'none' && !isOwner && (
                  <button 
                    onClick={() => {
                      if (!user) {
                        toast.error('Please login to connect');
                        navigate('/login');
                      } else {
                        setIsConnectModalOpen(true);
                      }
                    }}
                    className="bg-primary/10 text-primary hover:bg-primary/20 p-2 sm:px-4 sm:py-2 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" /> <span className="hidden sm:inline">Connect</span>
                  </button>
                )}
                
                {connectionStatus === 'pending' && !isOwner && (
                  <button 
                    onClick={handleCancelRequest}
                    disabled={isConnecting}
                    className="bg-amber-500/10 text-amber-500 hover:text-rose-500 hover:bg-rose-500/10 border border-amber-500/20 hover:border-rose-500/30 p-2 sm:px-4 sm:py-2 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm transition-colors"
                  >
                    {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4" /> <span className="hidden sm:inline">Unsend</span></>}
                  </button>
                )}
                
                {connectionStatus === 'accepted' && (
                  <button 
                    onClick={handleUnfriend}
                    className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white p-2 sm:px-4 sm:py-2 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <X className="w-4 h-4" /> <span className="hidden sm:inline">Remove</span>
                  </button>
                )}

                {connectionStatus === 'accepted' && (
                  <>
                    <button 
                      onClick={() => {
                        const isMentor = ['mentor', 'alumni'].includes((user?.publicMetadata?.role || '').toLowerCase());
                        navigate(isMentor ? `/mentor-dashboard/messages?user=${student.clerkId}` : `/dashboard/messages?user=${student.clerkId}`);
                      }}
                      className="bg-background border border-border/50 hover:bg-muted text-foreground p-2 sm:px-4 sm:py-2 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" /> <span className="hidden sm:inline">Message</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        if (!user) {
                          toast.error('Please login to make a video call');
                          navigate('/login');
                          return;
                        }
                        const targetClerkId = student?.clerkId || student?.id;
                        if (!targetClerkId) {
                          toast.error('Recipient information missing');
                          return;
                        }
                        window.dispatchEvent(new CustomEvent('initiate_call', { 
                          detail: { 
                            targetPartner: {
                              clerkId: targetClerkId,
                              id: targetClerkId,
                              name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name || 'Student',
                              image: student.imageUrl || student.image 
                            }, 
                            type: 'video' 
                          }
                        }));
                      }}
                      className="bg-green-500/10 text-green-500 hover:bg-green-500/20 px-4 py-2 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-sm flex-1 sm:flex-none justify-center cursor-pointer active:scale-95"
                    >
                      <Video className="w-4 h-4" /> Video Call
                    </button>
                  </>
                )}
                  </>
                )}
              </div>
            </div>
            
            {/* User Info Stack */}
            <div className="mt-3 sm:mt-4 flex flex-col gap-1.5 text-left w-full sm:pl-2 md:pl-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-0.5">
                {student?.firstName && student?.lastName ? `${student.firstName} ${student.lastName}` : (student?.name || student?.username || 'Student')}
              </h1>
              {student?.username && (
                <p className="text-sm text-muted-foreground font-medium">@{student.username}</p>
              )}
              <p className="text-sm sm:text-base font-semibold text-primary">{student?.headline || 'Student'}</p>
              
              <div className="text-xs sm:text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {student?.location || 'Location not specified'}
                </span>
                {student?.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {student.address}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border/40 sm:pl-2 md:pl-3">
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
        <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-md pt-2 pb-2 border-b border-border/40 mb-2">
          <h2 className="text-xl font-bold text-foreground px-1">Posts</h2>
        </div>
        {isLoadingPosts ? (
          <div className="flex justify-center p-8">
            <CardSkeleton />
          </div>
        ) : posts.length > 0 ? (
          posts.map(post => {
            const safeLikes = post.likes || []
            const hasLiked = user && safeLikes.some(like => (like.clerkId || like) === user.id)
            const commentsArray = post.comments || []
            const showComments = activeCommentPostId === post._id

            if (post.moderationStatus === 'paused') {
              return (
                <motion.div
                  key={post._id}
                  id={`post-${post._id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-rose-500/30 bg-rose-500/5 rounded-2xl overflow-hidden shadow-sm p-5 mb-6 relative"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-rose-500/20 p-2.5 rounded-full text-rose-500 shrink-0">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-rose-600 text-base">This post has been blocked</h3>
                      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                        Your post was flagged by our moderation team and has been temporarily hidden.
                        <br />
                        <span className="font-medium text-foreground mt-1 block">Reason: {post.moderationRemark || 'Violation of community guidelines.'}</span>
                      </p>
                      <button onClick={() => navigate('/#contact')} className="mt-4 text-xs bg-background border border-border/50 hover:bg-muted text-foreground px-4 py-2 rounded-xl transition-colors inline-flex items-center gap-2 font-semibold shadow-sm">
                        Contact Support <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            }

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

                    {(() => {
                      const isAuthor = Boolean(user && (
                        post.authorClerkId === user.id ||
                        post.author?._id === user.id ||
                        post.author?.clerkId === user.id ||
                        student?.clerkId === user.id
                      )) || isAdminView;
                      const hasMedia = (post.mediaFiles && post.mediaFiles.length > 0) || Boolean(post.imageUrl) || Boolean(post.eventDetails?.imageUrl);

                      return (
                        <div className="relative post-dropdown-container">
                          <button 
                            onClick={() => setActiveDropdownId(activeDropdownId === post._id ? null : post._id)}
                            className="text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>

                          <AnimatePresence>
                            {activeDropdownId === post._id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-0 mt-1 w-52 bg-card border border-border/50 rounded-xl shadow-xl overflow-hidden z-20 py-1"
                              >
                                {isAuthor && (
                                  <>
                                    <button 
                                      onClick={() => { setEditingPostId(post._id); setEditContent(post.content); setActiveDropdownId(null); }}
                                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2 text-foreground"
                                    >
                                      <Edit3 className="w-4 h-4" /> Edit
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        handleToggleComments(post);
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2 border-t border-border/50 text-foreground"
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
                                        setActiveDropdownId(null);
                                        handleToggleLikesVisibility(post);
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2 border-t border-border/50 text-foreground"
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
                                      onClick={() => { setPostToDelete(post._id); setActiveDropdownId(null); }}
                                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2 border-t border-border/50"
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
                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2 text-foreground ${isAuthor ? 'border-t border-border/50' : ''}`}
                                  >
                                    <Download className="w-4 h-4 text-primary" /> Download Media
                                  </button>
                                )}
                                <button 
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    handleCopyPostLink(post._id);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2 border-t border-border/50 text-foreground"
                                >
                                  <Copy className="w-4 h-4 text-primary" /> Copy Link
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })()}
                  </div>

                  {editingPostId === post._id ? (
                    <div className="mb-4">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-background border border-border/50 rounded-xl p-3 text-sm focus:outline-none focus:border-primary resize-none"
                        rows="3"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setEditingPostId(null)} className="px-3 py-1.5 text-xs font-medium hover:bg-muted rounded-lg transition-colors">Cancel</button>
                        <button onClick={() => handleSaveEdit(post._id)} className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg transition-colors">Save</button>
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

                  {/* Media Rendering: Visual Media + Audio Media */}
                  {(() => {
                    const allMedia = post.mediaFiles && post.mediaFiles.length > 0 
                      ? post.mediaFiles 
                      : (post.imageUrl ? [{ url: post.imageUrl, mediaType: post.mediaType || 'image' }] : []);

                    const visualFiles = allMedia.filter(m => m.mediaType !== 'audio' && !m.url?.match(/\.(mp3|wav|ogg|m4a|aac|webm)(\?.*)?$/i));
                    const audioFiles = allMedia.filter(m => m.mediaType === 'audio' || m.url?.match(/\.(mp3|wav|ogg|m4a|aac|webm)(\?.*)?$/i));

                    return (
                      <>
                        {(visualFiles.length > 0 || post.linkPreview) && !post.bgGradient && (!post.eventDetails || !post.eventDetails.title) && (
                          <FeedMediaGrid 
                            mediaFiles={visualFiles} 
                            imageUrl={visualFiles[0]?.url} 
                            mediaType={visualFiles[0]?.mediaType}
                            linkPreview={post.linkPreview}
                            onContainerClick={() => navigate(`?post=${post._id}`, { state: { postData: post } })}
                            onImageClick={(files, idx) => setViewerData({ files, index: idx })}
                          />
                        )}

                        {audioFiles.map((audioItem, aIdx) => (
                          <div key={aIdx} className="pt-2 pb-1">
                            <AudioPlayerWidget 
                              src={audioItem.url} 
                              duration={audioItem.duration}
                              title={`${studentName || 'Student'}'s Audio`} 
                              userAvatar={avatarUrl}
                              senderName={studentName || 'Student'}
                            />
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>

                <div className="px-4 sm:px-5 py-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-3 mb-2">
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:underline"
                      onClick={() => post.likes?.length > 0 && setLikesModalPost(post)}
                    >
                      <span className="bg-rose-500 text-white rounded-full p-1"><Heart className="w-3 h-3 fill-current" /></span>
                      <span className="font-medium text-foreground/80 hover:text-primary transition-colors">{renderLikesText(post.likes, post.hideLikes)}</span>
                    </div>
                    <span className="cursor-pointer hover:underline flex items-center gap-1.5" onClick={() => setActiveCommentPostId(showComments ? null : post._id)}>
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
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 sm:flex-none justify-center
                        ${hasLiked ? 'text-rose-500 hover:bg-rose-500/10' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                      <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
                      <span>{hasLiked ? 'Liked' : 'Like'}{!post.hideLikes && (post.likes?.length || 0) > 0 ? ` (${post.likes.length})` : ''}</span>
                    </button>
                    <button 
                      onClick={() => setActiveCommentPostId(showComments ? null : post._id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 sm:flex-none justify-center ${
                        post.commentsDisabled 
                          ? 'text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted/50' 
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {post.commentsDisabled ? <MessageSquareOff className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                      <span className="hidden sm:inline">Comment</span>
                    </button>
                    <button 
                      onClick={() => handleSharePost(post._id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 flex-1 sm:flex-none justify-center"
                    >
                      <Share2 className="w-5 h-5" />
                      <span className="hidden sm:inline">Share</span>
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
                              const postsRes = await fetch(`${API_BASE}/api/posts/user/${student.clerkId}?requestingUserId=${user?.id}`);
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
        <ModalPortal>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
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
        </ModalPortal>
      )}

    {/* Lightbox / Image Viewer */}
    <ImageViewerModal 
      isOpen={!!viewerData} 
      mediaFiles={viewerData?.files} 
      initialIndex={viewerData?.index || 0} 
      onClose={() => setViewerData(null)} 
    />

    <ConfirmModal
      isOpen={unfriendConfirm}
      onClose={() => setUnfriendConfirm(false)}
      onConfirm={handleUnfriendConfirm}
      title="Remove Connection"
      message={`Are you sure you want to remove ${student?.name} from your connections?`}
      confirmText="Remove"
    />

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
                className="px-4 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeletePost}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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

    <ShareModal 
      isOpen={isShareModalOpen} 
      onClose={() => setIsShareModalOpen(false)} 
      shareUrl={shareConfig?.shareUrl} 
      shareType={shareConfig?.shareType} 
      itemId={shareConfig?.itemId} 
    />

    <LikesModal 
      isOpen={!!likesModalPost} 
      onClose={() => setLikesModalPost(null)} 
      post={likesModalPost} 
      currentUserId={user?.id}
      currentUserRole="mentor"
    />
    </div>
    </>
  )
}

export default StudentProfile
