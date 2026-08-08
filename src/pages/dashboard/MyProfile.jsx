import React, { useState, useEffect, useRef } from 'react'
import { Edit3, MapPin, Briefcase, GraduationCap, Link as LinkIcon, Calendar, Code, Heart, MessageSquare, Share2, MoreHorizontal, Loader2, Send, Trash2, X, Image as ImageIcon, Globe } from 'lucide-react'
import { FaLinkedin as Linkedin, FaGithub as Github, FaInstagram as Instagram, FaFacebook as Facebook, FaTwitter as Twitter } from 'react-icons/fa'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import ImageCropModal from '../../components/ImageCropModal'

const MyProfile = () => {
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

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserProfile()
      fetchUserPosts()
    }
  }, [isLoaded, user])

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`/api/users/${user.id}`)
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
      const res = await fetch(`/api/posts/user/${user.id}`)
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
      
      const uploadRes = await fetch('/api/upload/image', {
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
        await fetch(`/api/users/${user.id}/profile`, {
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
      const updatedUser = await user.setProfileImage({ file })
      
      await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: updatedUser.imageUrl })
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
      await fetch(`/api/posts/${postId}/like`, {
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
      const res = await fetch(`/api/posts/${postId}/comment`, {
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
      const res = await fetch(`/api/posts/${postToDelete}`, { method: 'DELETE' })
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
      const res = await fetch(`/api/posts/${postId}`, {
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
    if (!name) return `https://ui-avatars.com/api/?name=U&background=random`
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
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

  const coverPhotoUrl = user?.unsafeMetadata?.coverPhoto || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
  const profilePhotoUrl = user?.imageUrl || getAvatarFallback(user?.fullName)

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      
      {/* Header Profile Card */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="h-48 bg-muted relative group">
          <img 
            src={coverPhotoUrl} 
            alt="Cover" 
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setViewingImage(coverPhotoUrl)}
          />
          <input type="file" ref={coverPhotoInputRef} onChange={handleCoverPhotoSelect} accept="image/*" className="hidden" />
          <button 
            onClick={() => coverPhotoInputRef.current?.click()}
            disabled={isUploadingCover}
            className="absolute top-4 right-4 bg-background/50 backdrop-blur border border-border/50 text-foreground px-3 py-2 flex items-center gap-2 rounded-xl hover:bg-background/80 transition-colors"
          >
            {isUploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
            <span className="text-sm font-medium">Edit Cover</span>
          </button>
        </div>
        
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-16 sm:-mt-20 mb-4">
            <div className="relative group">
              <img 
                src={profilePhotoUrl} 
                alt="Profile" 
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover border-4 border-card relative z-10 bg-card shadow-md cursor-pointer"
                onClick={() => setViewingImage(profilePhotoUrl)}
              />
              <input type="file" ref={profilePicInputRef} onChange={handleProfilePicSelect} accept="image/*" className="hidden" />
              <button 
                onClick={() => profilePicInputRef.current?.click()}
                className="absolute inset-0 z-20 m-auto w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{user?.fullName}</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-0">{dbUser?.headline || user?.unsafeMetadata?.headline || (user?.publicMetadata?.role === 'mentor' ? 'Mentor' : 'Student')}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <MapPin className="w-3.5 h-3.5" /> 
                  <span>{dbUser?.location || user?.unsafeMetadata?.location || 'Add location in Settings'}</span>
                  {(dbUser?.address || user?.unsafeMetadata?.address) && (
                    <>
                      <span className="mx-1">&bull;</span>
                      <span>{dbUser?.address || user?.unsafeMetadata?.address}</span>
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
                if (link.platform === 'LinkedIn') { Icon = Linkedin; colorClass = 'text-[#0A66C2]'; }
                if (link.platform === 'GitHub') { Icon = Github; }
                if (link.platform === 'Instagram') { Icon = Instagram; colorClass = 'text-[#E1306C]'; }
                if (link.platform === 'Facebook') { Icon = Facebook; colorClass = 'text-[#1877F2]'; }
                if (link.platform === 'Twitter') { Icon = Twitter; colorClass = 'text-[#1DA1F2]'; }

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column - Details */}
        <div className="md:col-span-1 space-y-6">
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-3">
                        <img src={postAuthorDP} alt={user.fullName} className="w-12 h-12 rounded-full object-cover" />
                        <div>
                          <h3 className="font-bold text-foreground text-sm">{user.fullName}</h3>
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
                        <div className="p-4 sm:p-5 space-y-4">
                          <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {commentsArray.map((comment, i) => (
                              <div key={i} className="flex gap-3">
                                <img src={comment.author?.image || getAvatarFallback(comment.author?.name)} alt={comment.author?.name} className="w-8 h-8 rounded-full object-cover shrink-0 mt-1 border border-border/50" />
                                <div className="flex-1 min-w-0">
                                  <div className="bg-muted/50 border border-border/50 rounded-2xl rounded-tl-sm px-4 py-2.5">
                                    <h4 className="font-bold text-xs text-foreground">{comment.author?.name}</h4>
                                    <p className="text-sm text-foreground/90 mt-0.5 break-words">{comment.content}</p>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1 ml-2 text-[11px] font-medium text-muted-foreground">
                                    <span>{formatTime(comment.createdAt)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {commentsArray.length === 0 && (
                              <p className="text-xs text-muted-foreground text-center italic py-2">No comments yet. Be the first!</p>
                            )}
                          </div>

                          <div className="flex gap-3 pt-2">
                            <img src={profilePhotoUrl} alt="You" className="w-8 h-8 rounded-full object-cover shrink-0 mt-1" />
                            <div className="flex-1 relative">
                              <textarea 
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                placeholder="Write a comment..."
                                className="w-full bg-background border border-border/50 rounded-xl pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:border-primary resize-none min-h-[44px]"
                                rows="1"
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleComment(post._id)
                                  }
                                }}
                              ></textarea>
                              <button 
                                onClick={() => handleComment(post._id)}
                                disabled={isCommenting || !commentText.trim()}
                                className="absolute right-2 top-2 p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                              >
                                {isCommenting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
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
            aspectRatio={cropModalData.type === 'dp' ? 1 : 21/9}
            onCropComplete={handleCropComplete}
            onCancel={() => setCropModalData(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default MyProfile
