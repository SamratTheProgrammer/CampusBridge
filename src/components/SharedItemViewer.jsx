import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { X, Heart, MessageCircle, Share2, Loader2, MapPin, Building, Calendar as CalendarIcon, ExternalLink, MoreVertical, Edit3, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import API_BASE from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from '@clerk/clerk-react';
import AutoPlayVideo from './AutoPlayVideo';
import PostComments from './PostComments';
import ShareModal from './modals/ShareModal';
import ImageViewerModal from './ImageViewerModal';

const optimizeUrl = (url) => {
  if (url && url.includes('cloudinary.com') && url.includes('/upload/')) {
    // Add Cloudinary optimizations: auto format, auto quality, max width 1200px
    return url.replace('/upload/', '/upload/q_auto,f_auto,w_1200/');
  }
  return url;
};

const SharedItemViewer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const postId = searchParams.get('post');
  const jobId = searchParams.get('job');
  const eventId = searchParams.get('event');

  const [itemType, setItemType] = useState(null);
  const [itemId, setItemId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [viewerData, setViewerData] = useState(null);
  const [showCommentInput, setShowCommentInput] = useState(true);
  const [isMobileCommentsOpen, setIsMobileCommentsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  useEffect(() => {
    if (postId) {
      setItemType('post');
      setItemId(postId);
      if (location.state?.postData) setData(location.state.postData);
    } else if (jobId) {
      setItemType('job');
      setItemId(jobId);
    } else if (eventId) {
      setItemType('event');
      setItemId(eventId);
    } else {
      setItemType(null);
      setItemId(null);
      setData(null);
    }
  }, [postId, jobId, eventId, location.state]);

  const fetchData = async (silent = false) => {
    if (!itemType || !itemId) return;
    if (!silent) setLoading(true);
    try {
      let endpoint = '';
      if (itemType === 'post') endpoint = `/api/posts/${itemId}`;
      if (itemType === 'job') endpoint = `/api/jobs/${itemId}`;
      if (itemType === 'event') endpoint = `/api/events/${itemId}`;

      const res = await fetch(`${API_BASE}${endpoint}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else if (!silent) {
        toast.error('Failed to load shared item');
        closeModal();
      }
    } catch (err) {
      console.error('Error fetching shared item:', err);
      if (!silent) {
        toast.error('Server error');
        closeModal();
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const hasInitialData = !!location.state?.postData;
    fetchData(hasInitialData);
    setCurrentMediaIndex(0);
  }, [itemType, itemId]);

  const handleLike = async () => {
    if (!user || itemType !== 'post' || !data) return;

    // Optimistic Update
    const hasLiked = data.likes?.some(like => (like.clerkId || like) === user.id);
    setData(prev => ({
      ...prev,
      likes: hasLiked
        ? prev.likes.filter(like => (like.clerkId || like) !== user.id)
        : [...(prev.likes || []), { clerkId: user.id }]
    }));

    try {
      const res = await fetch(`${API_BASE}/api/posts/${data._id}/like`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id })
      });
      if (res.ok) {
        fetchData(true); // silent fetch to keep in sync
      }
    } catch (err) {
      console.error(err);
      fetchData(true); // revert if fail
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleProfileClick = () => {
    if (!data?.authorClerkId) return;
    closeModal();
    if (user?.id === data.authorClerkId) {
      navigate(user?.publicMetadata?.role === 'mentor' ? '/mentor-dashboard/profile' : '/dashboard/profile');
    } else {
      const isTargetMentor = data.author?.role?.toLowerCase() === 'mentor' || data.author?.role?.toLowerCase() === 'alumni';
      const basePath = user?.publicMetadata?.role === 'mentor' ? '/mentor-dashboard' : '/dashboard';
      navigate(`${basePath}/${isTargetMentor ? 'mentor' : 'student'}/${data.authorClerkId}`);
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/posts/${data._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorClerkId: user.id, content: editContent })
      });
      if (res.ok) {
        toast.success('Post updated');
        setEditingPostId(null);
        fetchData();
      } else {
        toast.error('Failed to update post');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error');
    }
  };

  const [connectionStatus, setConnectionStatus] = useState('none');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const fetchConnectionStatus = async () => {
      if (!user || !data?.authorClerkId || user.id === data.authorClerkId) return;
      try {
        const res = await fetch(`${API_BASE}/api/connections/status/${user.id}/${data.authorClerkId}`);
        if (res.ok) {
          const json = await res.json();
          setConnectionStatus(json.status);
        }
      } catch (err) {
        console.error('Failed to fetch connection status', err);
      }
    };
    fetchConnectionStatus();
  }, [user, data]);

  const handleConnect = async () => {
    if (!user || !data?.authorClerkId) return;
    setIsConnecting(true);
    try {
      const res = await fetch(`${API_BASE}/api/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderClerkId: user.id,
          receiverClerkId: data.authorClerkId,
          message: 'Hi, I found your post and would love to connect!'
        })
      });
      if (res.ok) {
        setConnectionStatus('pending');
        toast.success('Connection request sent!');
      } else {
        const errData = await res.json();
        toast.error(errData.message || 'Failed to connect');
      }
    } catch (err) {
      toast.error('Server error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!user || !data?.authorClerkId) return;
    setIsConnecting(true);
    try {
      const res = await fetch(`${API_BASE}/api/connections/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user.id, receiverId: data.authorClerkId })
      });
      if (res.ok) {
        setConnectionStatus('none');
        toast.success('Connection request cancelled');
      } else {
        toast.error('Failed to cancel request');
      }
    } catch (err) {
      toast.error('Server error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/posts/${data._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorClerkId: user.id })
      });
      if (res.ok) {
        toast.success('Post deleted');
        closeModal();
      } else {
        toast.error('Failed to delete post');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error');
    }
  };

  const closeModal = () => {
    // Remove the query parameter from the URL, keeping the path intact
    const params = new URLSearchParams(searchParams);
    if (itemType) params.delete(itemType);
    const newSearch = params.toString() ? `?${params.toString()}` : '';
    navigate(`${location.pathname}${newSearch}`, { replace: true });
  };

  if (!itemType || !itemId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black md:bg-black/80 md:backdrop-blur-sm md:p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 md:relative bg-card w-full md:w-max md:max-w-[95vw] h-[100dvh] md:h-[90vh] rounded-none md:rounded-2xl overflow-y-auto overflow-x-hidden md:overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-200 border-0 md:border border-border/50 mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="w-full md:w-[600px] h-full flex flex-col items-center justify-center bg-muted/20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground font-medium">Loading details...</p>
          </div>
        ) : data ? (
          <>
            {/* Left Media Area */}
            <div className="absolute inset-0 md:relative w-full md:w-[calc(90vh*9/16)] md:max-w-[calc(100vw-450px)] md:shrink bg-black flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-border/50 z-0">
              {itemType === 'post' && (
                data.jobDetails?.title ? (
                  <div
                    onClick={() => navigate(user?.publicMetadata?.role === 'mentor' || user?.publicMetadata?.role === 'alumni' ? '/mentor-dashboard/jobs' : '/dashboard/jobs')}
                    className="w-full h-full flex flex-col items-center justify-center bg-muted/10 relative cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <div className="w-full h-full bg-card/90 border-0 flex flex-col justify-center items-center text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-70 text-4xl pointer-events-none">✨🎉</div>
                      <div className="w-24 h-24 rounded-2xl bg-white text-purple-600 flex flex-col items-center justify-center shrink-0 shadow-lg z-10 overflow-hidden p-3 border border-border/50 mb-6 mt-12">
                        {data.jobDetails.companyLogo ? (
                          <img src={data.jobDetails.companyLogo} alt={data.jobDetails.company} className="w-full h-full object-contain" />
                        ) : (
                          <Building className="w-10 h-10" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 z-10 p-6 flex flex-col items-center justify-start w-full">
                        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                          <span className="text-xs uppercase font-bold tracking-wider bg-purple-500/20 text-purple-700 px-3 py-1 rounded-full">
                            I Got The Job! 🚀
                          </span>
                          <span className="text-xs uppercase font-bold tracking-wider bg-background/50 backdrop-blur-sm text-foreground px-3 py-1 rounded-full border border-border/50">
                            {data.jobDetails.role || 'Full-time'}
                          </span>
                        </div>
                        <h4 className="text-3xl font-bold text-foreground mb-2">{data.jobDetails.title}</h4>
                        <p className="text-xl font-medium text-foreground/80">{data.jobDetails.company}</p>
                        {data.jobDetails.location && (
                          <p className="text-base text-foreground/60 mt-4 flex items-center justify-center gap-1">
                            <MapPin className="w-5 h-5" /> {data.jobDetails.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : data.eventDetails?.title ? (
                  <div
                    onClick={() => navigate(user?.publicMetadata?.role === 'mentor' || user?.publicMetadata?.role === 'alumni' ? '/mentor-dashboard/events' : '/dashboard/events')}
                    className="w-full h-full flex flex-col items-center justify-center bg-muted/10 cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <div className="w-full h-full bg-card/90 border-0 flex flex-col items-center text-center relative overflow-hidden">
                      {data.eventDetails?.imageUrl || data.eventDetails?.image ? (
                        <div className="w-full h-[40%] bg-muted shrink-0 relative">
                          <img src={data.eventDetails.imageUrl || data.eventDetails.image} alt={data.eventDetails.title} className="w-full h-full object-cover" />
                          <div className="absolute top-4 right-4 p-4 bg-black/50 backdrop-blur-md rounded-full text-4xl leading-none">📅</div>
                        </div>
                      ) : (
                        <div className="w-full pt-12 md:pt-16 flex justify-center relative shrink-0">
                          <div className="absolute top-6 right-6 opacity-70 text-5xl pointer-events-none">📅</div>
                          <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-primary/10 text-primary flex items-center justify-center overflow-hidden shadow-lg border border-border/50">
                            <CalendarIcon className="w-12 h-12 md:w-16 md:h-16" />
                          </div>
                        </div>
                      )}

                      <div className="z-10 p-6 md:p-8 w-full flex flex-col items-center justify-start flex-1 gap-3 md:gap-4 mt-4 md:mt-0 pb-32 md:pb-8">
                        <span className="inline-block text-xs md:text-sm uppercase font-bold tracking-wider bg-primary/10 text-primary px-3 py-1 md:px-4 md:py-1.5 rounded-full mb-1 md:mb-3">
                          Upcoming Event
                        </span>
                        <h4 className="text-2xl md:text-3xl font-bold text-foreground mb-2 md:mb-4 px-4">{data.eventDetails.title}</h4>
                        <div className="flex flex-col items-center gap-2 md:gap-3 text-sm md:text-base text-foreground/80 bg-background/50 p-4 md:p-6 rounded-2xl w-[85%] max-w-sm">
                          <span className="flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-primary" />
                            {data.eventDetails.date ? new Date(data.eventDetails.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                          </span>
                          <span className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            {data.eventDetails.location || 'TBD'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (data.mediaFiles && data.mediaFiles.length > 0) || data.imageUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    {(() => {
                      const activeMedia = data.mediaFiles?.length > 0 ? data.mediaFiles[currentMediaIndex] : { url: data.imageUrl, mediaType: data.mediaType };
                      const isVideo = activeMedia.mediaType === 'video' || (activeMedia.url && activeMedia.url.match(/\.(mp4|webm|ogg)$/i));
                      const optimizedSrc = optimizeUrl(activeMedia.url);
                      return isVideo ? (
                        <AutoPlayVideo src={activeMedia.url} className="w-full max-h-full object-contain bg-black" />
                      ) : (
                        <img
                          src={optimizedSrc}
                          alt="Post media"
                          className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setViewerData({ files: data.mediaFiles?.length ? data.mediaFiles : [activeMedia.url], index: currentMediaIndex })}
                        />
                      );
                    })()}
                    
                    {/* Preload all images to eliminate latency when swiping */}
                    {data.mediaFiles?.length > 1 && (
                      <div className="hidden">
                        {data.mediaFiles.map((file, i) => {
                          if (file.mediaType === 'video' || (file.url && file.url.match(/\.(mp4|webm|ogg)$/i))) return null;
                          return <link rel="preload" as="image" href={optimizeUrl(file.url)} key={i} />;
                        })}
                      </div>
                    )}

                    {data.mediaFiles?.length > 1 && (
                      <>
                        {currentMediaIndex > 0 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex(prev => prev - 1); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-sm transition-all z-20 shadow-md"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                          </button>
                        )}
                        {currentMediaIndex < data.mediaFiles.length - 1 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex(prev => prev + 1); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-sm transition-all z-20 shadow-md"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                          </button>
                        )}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                          {data.mediaFiles.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentMediaIndex ? 'w-4 bg-primary' : 'w-1.5 bg-white/50'}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className={`w-full h-full flex items-center justify-center p-8 text-center ${data.backgroundGradient || 'bg-gradient-to-br from-primary/20 to-primary/5'}`}>
                    <p className="text-2xl md:text-4xl font-extrabold text-primary/80 leading-tight">
                      {data.content.substring(0, 150)}{data.content.length > 150 ? '...' : ''}
                    </p>
                  </div>
                )
              )}
              {itemType === 'job' && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted/10 relative">
                  <div className="w-full h-full bg-card/90 border-0 flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="w-32 h-32 rounded-3xl bg-white text-purple-600 flex flex-col items-center justify-center shrink-0 shadow-lg z-10 overflow-hidden p-4 border border-border/50 mb-8">
                      {data.companyLogo ? (
                        <img src={data.companyLogo} alt={data.company} className="w-full h-full object-contain" />
                      ) : (
                        <Building className="w-16 h-16" />
                      )}
                    </div>
                    <div className="flex flex-col items-center z-10 px-8 w-full">
                      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                        <span className="text-sm uppercase font-bold tracking-wider bg-background/50 backdrop-blur-sm text-foreground px-4 py-2 rounded-full border border-border/50">
                          {data.type || 'Full-time'}
                        </span>
                      </div>
                      <h4 className="text-4xl font-bold text-foreground mb-4">{data.title}</h4>
                      <p className="text-2xl font-medium text-foreground/80">{data.company}</p>
                      {data.location && (
                        <p className="text-lg text-foreground/60 mt-6 flex items-center justify-center gap-2">
                          <MapPin className="w-6 h-6" /> {data.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {itemType === 'event' && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted/10">
                  <div className="w-full h-full bg-card/90 border-0 flex flex-col items-center text-center relative overflow-hidden">
                    {data.imageUrl || data.image ? (
                      <div className="w-full h-[45%] bg-muted shrink-0 relative">
                        <img src={data.imageUrl || data.image} alt={data.name} className="w-full h-full object-cover" />
                        <div className="absolute top-6 right-6 p-5 bg-black/50 backdrop-blur-md rounded-full text-5xl leading-none">📅</div>
                      </div>
                    ) : (
                      <div className="w-full pt-16 flex justify-center relative">
                        <div className="absolute top-8 right-8 opacity-70 text-5xl pointer-events-none">📅</div>
                        <div className="w-32 h-32 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <CalendarIcon className="w-16 h-16" />
                        </div>
                      </div>
                    )}

                    <div className="z-10 p-8 w-full flex flex-col items-center justify-center flex-1 gap-6">
                      <span className="inline-block text-sm uppercase font-bold tracking-wider bg-primary/10 text-primary px-4 py-1.5 rounded-full mb-2">
                        {data.type} Event
                      </span>
                      <h4 className="text-4xl font-bold text-foreground mb-4">{data.name}</h4>
                      <div className="flex flex-col items-center gap-3 text-lg text-foreground/80 bg-background/50 p-6 rounded-2xl w-3/4 max-w-sm">
                        <span className="flex items-center gap-2">
                          <CalendarIcon className="w-6 h-6 text-primary" />
                          {data.date ? new Date(data.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                        </span>
                        <span className="flex items-center gap-2">
                          <MapPin className="w-6 h-6 text-primary" />
                          {data.location || 'TBD'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative w-full md:w-[400px] md:bg-card flex flex-col justify-end md:justify-start h-[100dvh] md:h-full overflow-visible md:overflow-hidden md:shrink-0 z-10 pointer-events-none md:pointer-events-auto">

              {/* Spacer on mobile to push content down, allowing taps to pass through */}
              <div className="flex-1 md:hidden pointer-events-none"></div>

              {/* Mobile Floating Engagement Actions (Instagram Reels style) */}
              {itemType === 'post' && (
                <div className="absolute right-3 bottom-4 flex flex-col items-center gap-6 z-20 md:hidden pointer-events-auto pb-6">
                  <button
                    onClick={handleLike}
                    className="flex flex-col items-center gap-1 transition-transform active:scale-95"
                  >
                    <Heart className={`w-8 h-8 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] ${data.likes?.some(like => (like.clerkId || like) === user?.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    <span className="font-bold text-xs text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{data.likes?.length || 0}</span>
                  </button>
                  <button
                    onClick={() => setIsMobileCommentsOpen(true)}
                    className="flex flex-col items-center gap-1 transition-transform active:scale-95"
                  >
                    <MessageCircle className="w-8 h-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
                    <span className="font-bold text-xs text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{data.comments?.length || 0}</span>
                  </button>
                  <button onClick={handleShare} className="flex flex-col items-center gap-1 transition-transform active:scale-95">
                    <Share2 className="w-8 h-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
                    <span className="font-bold text-xs text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Share</span>
                  </button>

                  {/* Post Options Menu (Mobile) */}
                  {user?.id === data.authorClerkId && (
                    <div className="relative">
                      <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex flex-col items-center gap-1 transition-transform active:scale-95 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                      >
                        <MoreVertical className="w-8 h-8" />
                      </button>
                      {isMenuOpen && (
                        <div className="absolute right-full bottom-0 mr-4 w-32 bg-popover border border-border/50 rounded-xl shadow-lg shadow-black/10 py-1 z-[60]">
                          <button
                            onClick={() => {
                              setEditingPostId(data._id);
                              setEditContent(data.content);
                              setIsMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setIsMenuOpen(false);
                              handleDeletePost();
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="w-full bg-gradient-to-t from-black/95 via-black/70 to-transparent md:bg-none flex flex-col pt-32 md:pt-0 md:h-full md:flex-1 pointer-events-none md:pointer-events-auto">

                {/* Header: Author / Company Info (Only for jobs and events) */}
                {(itemType === 'job' || itemType === 'event') && (
                  <div className="p-4 border-b border-border/50 flex items-center gap-3 bg-muted/10 shrink-0">
                    {itemType === 'job' && (
                      <>
                        <img src={data.companyLogo || `https://ui-avatars.com/api/?name=${data.company}`} className="w-10 h-10 rounded-lg border border-border bg-white object-contain" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground truncate">{data.company}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {data.location}</p>
                        </div>
                      </>
                    )}
                    {itemType === 'event' && (
                      <>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                          <CalendarIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground truncate">{data.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {new Date(data.date).toLocaleDateString()}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Content Body */}
                {itemType === 'post' ? (
                  <div className="md:flex-1 flex flex-col overflow-visible md:overflow-hidden relative pointer-events-auto">
                    {/* Author Header and Caption */}
                    <div className="p-4 pb-8 md:pb-4 shrink-0 border-b-0 md:border-b md:border-border/30 md:mb-0 pr-16 md:pr-4">
                      <div className="flex items-start gap-3 pb-4">
                        <img
                          src={data.author?.image || `https://ui-avatars.com/api/?name=${data.author?.name || 'User'}`}
                          className="w-8 h-8 rounded-full border border-border mt-1 shrink-0 cursor-pointer hover:opacity-80 transition-opacity pointer-events-auto"
                          alt=""
                          onClick={handleProfileClick}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p
                              className="text-sm font-bold text-white md:text-foreground inline drop-shadow-md md:drop-shadow-none cursor-pointer hover:underline pointer-events-auto"
                              onClick={handleProfileClick}
                            >
                              {data.author?.name}
                            </p>
                            <p className="text-xs text-white/80 md:text-muted-foreground drop-shadow-md md:drop-shadow-none"> • {data.author?.role}</p>
                            {user && data.authorClerkId !== user.id && connectionStatus !== 'accepted' && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-white/50 md:bg-border"></span>
                                {connectionStatus === 'pending' ? (
                                  <button onClick={handleCancelRequest} disabled={isConnecting} className="text-xs font-bold text-white/80 md:text-muted-foreground hover:text-white md:hover:text-foreground drop-shadow-md md:drop-shadow-none">
                                    {isConnecting ? 'Cancelling...' : 'Requested'}
                                  </button>
                                ) : (
                                  <button onClick={handleConnect} disabled={isConnecting} className="text-xs font-bold text-primary hover:text-primary/80 drop-shadow-md md:drop-shadow-none">
                                    {isConnecting ? 'Connecting...' : 'Connect'}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                          {editingPostId === data._id ? (
                            <div className="mt-2">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-background border border-border/50 rounded-xl p-3 text-sm focus:outline-none focus:border-primary resize-none min-h-[80px] text-foreground"
                              />
                              <div className="flex gap-2 justify-end mt-2">
                                <button onClick={() => setEditingPostId(null)} className="px-3 py-1.5 text-xs font-medium bg-muted text-foreground rounded-lg hover:bg-muted/80">Cancel</button>
                                <button onClick={handleSaveEdit} className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Save Changes</button>
                              </div>
                            </div>
                          ) : (
                            <div className={`max-h-[60dvh] overflow-y-auto ${isCaptionExpanded ? 'md:max-h-none' : ''}`}>
                              {(!isCaptionExpanded && data.content?.length > 100) ? (
                                <span className="text-sm text-white md:text-foreground whitespace-pre-wrap leading-relaxed drop-shadow-md md:drop-shadow-none">
                                  {data.content.substring(0, 100)}...
                                  <button onClick={() => setIsCaptionExpanded(true)} className="md:hidden text-white/60 ml-1 font-semibold hover:underline bg-transparent">
                                    more
                                  </button>
                                </span>
                              ) : (
                                <span className="text-sm text-white md:text-foreground whitespace-pre-wrap leading-relaxed drop-shadow-md md:drop-shadow-none">
                                  {data.content}
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-[10px] text-white/60 md:text-muted-foreground mt-2 uppercase tracking-wide drop-shadow-md md:drop-shadow-none">
                            {data.createdAt ? formatDistanceToNow(new Date(data.createdAt), { addSuffix: true }) : ''}
                          </p>
                        </div>

                        {/* Post Options Menu (Desktop) */}
                        {user?.id === data.authorClerkId && (
                          <div className="relative shrink-0 hidden md:block">
                            <button
                              onClick={() => setIsMenuOpen(!isMenuOpen)}
                              className="p-1 hover:bg-white/20 md:hover:bg-muted rounded-full transition-colors text-white md:text-muted-foreground drop-shadow-md md:drop-shadow-none"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            {isMenuOpen && (
                              <div className="absolute right-0 bottom-full mb-1 md:bottom-auto md:top-full md:mt-1 w-32 bg-popover border border-border/50 rounded-xl shadow-lg shadow-black/10 py-1 z-[60]">
                                <button
                                  onClick={() => {
                                    setEditingPostId(data._id);
                                    setEditContent(data.content);
                                    setIsMenuOpen(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
                                >
                                  <Edit3 className="w-4 h-4" /> Edit
                                </button>
                                <button
                                  onClick={() => {
                                    setIsMenuOpen(false);
                                    handleDeletePost();
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Comments Component (Bottom Sheet on Mobile) */}
                    <div className={`
                    flex-1 bg-card transition-transform duration-300 flex flex-col overflow-hidden
                    fixed inset-x-0 bottom-0 z-50 h-[70dvh] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] border-t border-border/50 translate-y-full
                    md:static md:h-auto md:translate-y-0 md:rounded-none md:shadow-none md:border-none md:z-auto
                    ${isMobileCommentsOpen ? '!translate-y-0' : ''}
                  `}>
                      <div className="md:hidden flex flex-col items-center justify-center py-3 border-b border-border/50 shrink-0 bg-muted/30">
                        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mb-2"></div>
                        <p className="text-sm font-bold">Comments</p>
                        <button onClick={() => setIsMobileCommentsOpen(false)} className="absolute right-4 top-4 p-1.5 bg-muted rounded-full">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <PostComments
                        post={data}
                        currentUser={user}
                        onRefresh={fetchData}
                        formatTime={(date) => formatDistanceToNow(new Date(date), { addSuffix: true })}
                        getAvatarFallback={(name) => `https://ui-avatars.com/api/?name=${name || 'User'}`}
                        fullHeight={true}
                        showCommentInput={showCommentInput || isMobileCommentsOpen}
                        beforeInputNode={
                          <div className="hidden md:flex items-center gap-4 px-1 py-2">
                            <button
                              onClick={handleLike}
                              className={`flex items-center gap-1.5 transition-colors group ${data.likes?.some(like => (like.clerkId || like) === user?.id) ? 'text-red-500' : 'text-foreground hover:text-primary'}`}
                            >
                              <Heart className={`w-6 h-6 ${data.likes?.some(like => (like.clerkId || like) === user?.id) ? 'fill-current' : 'group-hover:fill-primary/20'}`} />
                              <span className="font-bold">{data.likes?.length || 0}</span>
                            </button>
                            <button
                              onClick={() => {
                                if (window.innerWidth < 768) {
                                  setIsMobileCommentsOpen(true);
                                } else {
                                  setShowCommentInput(prev => !prev);
                                }
                              }}
                              className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors group"
                            >
                              <MessageCircle className="w-6 h-6 group-hover:fill-primary/20" />
                              <span className="font-bold">{data.comments?.length || 0}</span>
                            </button>
                            <button onClick={handleShare} className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors ml-auto group">
                              <Share2 className="w-6 h-6 group-hover:fill-primary/20" />
                            </button>
                          </div>
                        }
                      />
                    </div>

                    {/* Overlay for mobile bottom sheet */}
                    {isMobileCommentsOpen && (
                      <div
                        className="fixed inset-0 bg-black/60 z-40 md:hidden"
                        onClick={() => setIsMobileCommentsOpen(false)}
                      ></div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">

                    {itemType === 'job' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{data.title}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md">{data.type}</span>
                            <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-md">{data.workplaceType}</span>
                            {data.salary && <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-bold rounded-md">{data.salary}</span>}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5"><Building className="w-4 h-4" /> Job Description</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{data.description}</p>
                        </div>
                        {data.requirements && data.requirements.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-foreground mb-2">Requirements</h4>
                            <ul className="list-disc pl-5 space-y-1">
                              {data.requirements.map((req, i) => (
                                <li key={i} className="text-sm text-muted-foreground">{req}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {itemType === 'event' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-bold text-foreground mb-1">{data.name}</h3>
                          <p className="text-sm font-medium text-primary bg-primary/10 inline-flex px-2.5 py-1 rounded-lg">{data.type}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Date</p>
                            <p className="text-sm font-bold">{new Date(data.date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Time</p>
                            <p className="text-sm font-bold">{data.time}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground mb-1">Location</p>
                            <p className="text-sm font-bold flex items-start gap-1"><MapPin className="w-4 h-4 text-primary shrink-0" /> {data.location}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-foreground mb-2">About this event</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{data.description}</p>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* Footer Actions Area (Jobs/Events only) */}
                {(itemType === 'job' || itemType === 'event') && (
                  <div className="p-4 pt-0 border-t-0 md:border-t md:border-border/50 bg-transparent md:bg-card shrink-0 pointer-events-auto w-full z-40">
                    {itemType === 'job' && (
                      <button className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                        <ExternalLink className="w-4 h-4" /> View Full Job Details
                      </button>
                    )}
                    {itemType === 'event' && (
                      <button className="w-full py-3 bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                        <CalendarIcon className="w-4 h-4" /> View Full Event
                      </button>
                    )}
                  </div>
                )}

              </div>

            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20">
            <p className="text-muted-foreground font-medium">Item not found.</p>
          </div>
        )}
      </div>

      {/* Click outside to close (background area) */}
      <div className="absolute inset-0 z-[-1]" onClick={closeModal}></div>

      {/* Fullscreen Image Viewer Modal */}
      <ImageViewerModal 
        isOpen={!!viewerData} 
        mediaFiles={viewerData?.files} 
        initialIndex={viewerData?.index || 0} 
        onClose={() => setViewerData(null)} 
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={window.location.href}
        shareType={itemType}
        itemId={itemId}
      />
    </div>
  );
};

export default SharedItemViewer;
