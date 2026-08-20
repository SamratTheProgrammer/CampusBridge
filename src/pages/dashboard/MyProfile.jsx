import React, { useState, useEffect, useRef } from 'react'
import { Edit3, MapPin, Briefcase, GraduationCap, Link as LinkIcon, Calendar, Clock, Code, Heart, MessageSquare, Share2, MoreHorizontal, Loader2, Send, Trash2, X, Image as ImageIcon, Globe, FileText, BookOpen } from 'lucide-react'
import { FaLinkedin, FaGithub, FaInstagram, FaFacebook, FaTwitter } from 'react-icons/fa'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import PostComments from '../../components/PostComments'
import { motion, AnimatePresence } from 'framer-motion'
import ImageCropModal from '../../components/ImageCropModal'
import API_BASE from '../../utils/api'
import { useNavigate } from 'react-router-dom'
import defaultPP from '../../assets/default_pp.png'
import AutoPlayVideo from '../../components/AutoPlayVideo'

const MyProfile = () => {
  const navigate = useNavigate()
  const { user, isLoaded } = useUser()
  const [dbUser, setDbUser] = useState(null)
  
  // Post states
  const [posts, setPosts] = useState([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [activeCommentPostId, setActiveCommentPostId] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)
  
  const [activeDropdownId, setActiveDropdownId] = useState(null)
  const [editingPostId, setEditingPostId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [postToDelete, setPostToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [likesModalPost, setLikesModalPost] = useState(null)

  const coverPhotoInputRef = useRef(null)
  const profilePicInputRef = useRef(null)
  const [isUploadingCover, setIsUploadingCover] = useState(false)

  // Image crop states
  const [cropModalData, setCropModalData] = useState(null) // { src, type: 'dp' | 'cover' }
  const [viewingImage, setViewingImage] = useState(null) // URL of image to view fullscreen
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showCoverMenu, setShowCoverMenu] = useState(false)

  const coverMenuRef = useRef(null)
  const profileMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (coverMenuRef.current && !coverMenuRef.current.contains(event.target)) {
        setShowCoverMenu(false)
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserProfile()
      fetchUserPosts()
    }
  }, [isLoaded, user])

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setDbUser(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchUserPosts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/user/${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingPosts(false)
    }
  }

  const handleCoverPhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCropModalData({ src: reader.result, type: 'cover' })
    }
    reader.readAsDataURL(file)
    e.target.value = '' // reset input
  }

  const uploadCoverPhoto = async (file) => {
    setIsUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadRes = await fetch(`${API_BASE}/api/upload/image`, {
        method: 'POST',
        body: formData
      })
      const uploadData = await uploadRes.json()
      
      if (uploadData.success) {
        const newUrl = uploadData.url
        
        // Update Clerk
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            coverPhoto: newUrl
          }
        })
        
        // Update MongoDB
        await fetch(`${API_BASE}/api/users/${user.id}/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            coverPhoto: newUrl,
            imageUrl: user.imageUrl 
          })
        })
        
        toast.success('Cover photo updated!')
        fetchUserProfile() // refresh
      } else {
        toast.error('Failed to upload image')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to upload cover photo')
    } finally {
      setIsUploadingCover(false)
      setCropModalData(null)
    }
  }

  const handleProfilePicSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCropModalData({ src: reader.result, type: 'dp' })
    }
    reader.readAsDataURL(file)
    e.target.value = '' // reset input
  }

  const uploadProfilePic = async (file) => {
    try {
      toast.loading('Updating profile picture...', { id: 'pic-upload' })
      await user.setProfileImage({ file })
      await user.reload()
      
      await fetch(`${API_BASE}/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: user.imageUrl })
      })
      
      toast.success('Profile picture updated!', { id: 'pic-upload' })
    } catch (error) {
      console.error(error)
      toast.error('Failed to update picture', { id: 'pic-upload' })
    } finally {
      setCropModalData(null)
    }
  }

  const handleCropComplete = (croppedFile) => {
    if (cropModalData?.type === 'cover') {
      uploadCoverPhoto(croppedFile)
    } else if (cropModalData?.type === 'dp') {
      uploadProfilePic(croppedFile)
    }
  }

  const handleRemoveCover = async () => {
    try {
      toast.loading('Removing cover photo...', { id: 'cover-remove' })
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          coverPhoto: null
        }
      })
      await fetch(`${API_BASE}/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverPhoto: '' })
      })
      toast.success('Cover photo removed!', { id: 'cover-remove' })
    } catch (error) {
      console.error(error)
      toast.error('Failed to remove cover photo', { id: 'cover-remove' })
    }
  }

  const handleRemoveProfilePic = async () => {
    try {
      toast.loading('Removing profile picture...', { id: 'pic-remove' })
      await user.setProfileImage({ file: null })
      await user.reload()
      
      await fetch(`${API_BASE}/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: user.imageUrl })
      })
      
      toast.success('Profile picture removed!', { id: 'pic-remove' })
    } catch (error) {
      console.error(error)
      toast.error('Failed to remove picture', { id: 'pic-remove' })
    }
  }

  // Same post actions as Dashboard
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
      fetchUserPosts()
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
        fetchUserPosts()
      }
    } catch (err) {
      toast.error('Failed to post comment')
    } finally {
      setIsCommenting(false)
    }
  }

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeleting(true)
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postToDelete}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Post deleted')
        setPosts(posts.filter(p => p._id !== postToDelete))
      }
    } catch (err) {
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
      }
    } catch (err) {
      toast.error('Failed to update post')
    }
  }

  const getAvatarFallback = (name) => {
    return defaultPP
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
    if (hasLiked) {
      return `You and ${count - 1} other${count - 1 > 1 ? 's' : ''}`
    }
    return `${likes[0].name || 'Someone'} and ${count - 1} other${count - 1 > 1 ? 's' : ''}`
  }

  if (!isLoaded) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>

  const coverPhotoUrl = user?.unsafeMetadata?.coverPhoto
  const profilePhotoUrl = user?.hasImage ? user.imageUrl : getAvatarFallback(user?.fullName)

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      
      {/* Header Profile Card */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="h-48 bg-muted relative group">
          {coverPhotoUrl ? (
            <img 
              src={coverPhotoUrl} 
              alt="Cover" 
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setViewingImage(coverPhotoUrl)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600"></div>
          )}
          <div className="absolute top-4 right-4 z-20 flex flex-col items-end" ref={coverMenuRef}>
            <input type="file" ref={coverPhotoInputRef} onChange={handleCoverPhotoSelect} accept="image/*" className="hidden" />
            <button 
              onClick={() => {
                if (!user?.unsafeMetadata?.coverPhoto) {
                  coverPhotoInputRef.current?.click();
                } else {
                  setShowCoverMenu(!showCoverMenu);
                }
              }}
              disabled={isUploadingCover}
              className="bg-background/50 backdrop-blur border border-border/50 text-foreground px-3 py-2 flex items-center gap-2 rounded-xl hover:bg-background/80 transition-colors shadow-sm"
            >
              {isUploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
              <span className="text-sm font-medium">Edit Cover</span>
            </button>
            {showCoverMenu && (
              <div className="mt-2 bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden w-40 flex flex-col">
                <button className="w-full text-left px-4 py-2 hover:bg-muted text-sm font-medium transition-colors" onClick={() => { coverPhotoInputRef.current?.click(); setShowCoverMenu(false); }}>Upload New</button>
                {user?.unsafeMetadata?.coverPhoto && (
                  <button className="w-full text-left px-4 py-2 hover:bg-muted text-sm text-destructive font-medium transition-colors border-t border-border/50" onClick={() => { handleRemoveCover(); setShowCoverMenu(false); }}>Remove Photo</button>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="px-4 sm:px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-end mb-4">
            <div className="relative group -mt-14 sm:-mt-20 shrink-0" ref={profileMenuRef}>
              <img 
                src={profilePhotoUrl} 
                alt="Profile" 
                className="w-24 h-24 sm:w-40 sm:h-40 rounded-2xl object-cover border-4 border-card relative z-10 bg-card shadow-md cursor-pointer"
                onClick={() => setViewingImage(profilePhotoUrl)}
              />
              <input type="file" ref={profilePicInputRef} onChange={handleProfilePicSelect} accept="image/*" className="hidden" />
              <button 
                onClick={() => {
                  if (!user?.hasImage) {
                    profilePicInputRef.current?.click();
                  } else {
                    setShowProfileMenu(!showProfileMenu);
                  }
                }}
                className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 z-20 p-1.5 hover:scale-110 transition-transform drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] bg-transparent"
              >
                <Edit3 className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white stroke-[2.5]" />
              </button>
              {showProfileMenu && (
                <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden w-40 flex flex-col z-30">
                  <button className="w-full text-left px-4 py-2 hover:bg-muted text-sm font-medium transition-colors" onClick={() => { profilePicInputRef.current?.click(); setShowProfileMenu(false); }}>Upload Photo</button>
                  {user?.hasImage && (
                    <button className="w-full text-left px-4 py-2 hover:bg-muted text-sm text-destructive font-medium transition-colors border-t border-border/50" onClick={() => { handleRemoveProfilePic(); setShowProfileMenu(false); }}>Remove Photo</button>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 sm:pt-0">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-foreground">{user?.fullName}</h1>
                <p className="text-xs sm:text-base text-muted-foreground mt-0">{dbUser?.headline || user?.unsafeMetadata?.headline || (user?.publicMetadata?.role === 'mentor' ? 'Mentor' : 'Student')}</p>
                <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground mt-1.5 sm:mt-2">
                  <MapPin className="w-3.5 h-3.5" /> 
                  <span>{dbUser?.location || user?.unsafeMetadata?.location || 'Add location in Settings'}</span>
                  {(dbUser?.address || user?.unsafeMetadata?.address) && (
                    <>
                      <span className="mx-1">&bull;</span>
                      <span>{dbUser?.address || user?.unsafeMetadata?.address}</span>
                    </>
                  )}
                  {dbUser?.dateOfBirth && (
                    <>
                      <span className="mx-1">&bull;</span>
                      <span>{Math.floor((new Date() - new Date(dbUser.dateOfBirth).getTime()) / 3.15576e+10)} years old {dbUser.ageVisibility === 'private' ? '(Hidden)' : ''}</span>
                    </>
                  )}
                  {dbUser?.gender && dbUser.gender !== 'Prefer not to say' && (
                    <>
                      <span className="mx-1">&bull;</span>
                      <span>{dbUser.gender}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border/40">
            {(dbUser?.socialLinks?.length > 0 || user?.unsafeMetadata?.socialLinks?.length > 0) ? (
              (dbUser?.socialLinks || user?.unsafeMetadata?.socialLinks).map((link, i) => {
                let Icon = Globe;
                let colorClass = 'text-foreground';
                if (link.platform === 'LinkedIn') { Icon = FaLinkedin; colorClass = 'text-[#0A66C2]'; }
                if (link.platform === 'GitHub') { Icon = FaGithub; }
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
            ) : (
              <span className="text-xs text-muted-foreground italic">No social links added yet.</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Column - Details */}
        <div className="md:col-span-1 space-y-6 md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-6rem)] md:overflow-y-auto scrollbar-none md:pr-1">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4">About Me</h3>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {dbUser?.aboutMe || user?.unsafeMetadata?.aboutMe || 'Update your bio in the Settings page to tell everyone a little more about yourself!'}
            </p>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-foreground mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {(dbUser?.skills || user?.unsafeMetadata?.skills || []).length > 0 ? (
                (dbUser?.skills || user?.unsafeMetadata?.skills).map(skill => (
                  <span key={skill} className="bg-muted text-muted-foreground text-xs font-medium px-3 py-1.5 rounded-lg border border-border/50">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No skills added yet.</span>
              )}
            </div>
          </div>

          {(dbUser?.resumeUrl || user?.unsafeMetadata?.resumeUrl) && (
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Resume
              </h3>
              <a 
                href={dbUser?.resumeUrl || user?.unsafeMetadata?.resumeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-medium text-sm flex justify-center transition-colors"
              >
                View Resume
              </a>
            </div>
          )}

          {/* Experience Section */}
          {(dbUser?.experience || user?.unsafeMetadata?.experience)?.length > 0 && (
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Experience
              </h3>
              <div className="space-y-4">
                {(dbUser?.experience || user?.unsafeMetadata?.experience).map((exp, idx) => (
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
          {(dbUser?.education || user?.unsafeMetadata?.education)?.length > 0 && (
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Education
              </h3>
              <div className="space-y-4">
                {(dbUser?.education || user?.unsafeMetadata?.education).map((edu, idx) => (
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

        {/* Right Column - User Posts */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-foreground px-1">My Posts</h2>
          {isLoadingPosts ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : posts.length > 0 ? (
            posts.map(post => {
              const safeLikes = post.likes || []
              const hasLiked = user && safeLikes.some(like => (like.clerkId || like) === user.id)
              const commentsArray = post.comments || []
              const postAuthorDP = profilePhotoUrl
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
                          alt={user.fullName} 
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
                            {user.fullName}
                          </h3>
                          <p className="text-[10px] text-muted-foreground mt-1">{formatTime(post.createdAt)}</p>
                        </div>
                      </div>
                      <div className="relative">
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
                              className="absolute right-0 mt-1 w-36 bg-card border border-border/50 rounded-xl shadow-xl overflow-hidden z-20"
                            >
                              <button 
                                onClick={() => { setEditingPostId(post._id); setEditContent(post.content); setActiveDropdownId(null); }}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                              >
                                <Edit3 className="w-4 h-4" /> Edit
                              </button>
                              <button 
                                onClick={() => { setPostToDelete(post._id); setActiveDropdownId(null); }}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
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
                    ) : (
                      <>
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

                        {post.imageUrl && !post.bgGradient && (
                          <div className="w-full max-h-[500px] bg-black overflow-hidden flex items-center justify-center relative rounded-xl mb-4 border border-border/40 bg-muted/30">
                            {post.mediaType === 'video' || post.imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                              <AutoPlayVideo 
                                src={post.imageUrl} 
                                className="w-full max-h-[500px] object-contain"
                              />
                            ) : (
                              <img 
                                src={post.imageUrl} 
                                alt="Post content" 
                                className="w-full h-auto max-h-[500px] object-contain cursor-pointer" 
                                onClick={() => setViewingImage(post.imageUrl)}
                              />
                            )}
                          </div>
                        )}
                      </>
                    )}

                  </div>

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
                          onRefresh={fetchUserPosts}
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
              <p className="text-muted-foreground text-sm">You haven't posted anything yet.</p>
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

      {/* Render Image Crop Modal if active */}
      <AnimatePresence>
        {cropModalData && (
          <ImageCropModal 
            imageSrc={cropModalData.src}
            aspectRatio={cropModalData.type === 'dp' ? 1 : NaN}
            onCropComplete={handleCropComplete}
            onCancel={() => setCropModalData(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default MyProfile
