import CardSkeleton from './skeletons/CardSkeleton'
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
import ModalPortal from './modals/ModalPortal';
import PinchZoomMedia from './common/PinchZoomMedia';
import { socket } from '../services/socket';
import FormattedPostText from './common/FormattedPostText';
import PostCaption from './common/PostCaption';
import AudioPlayerWidget from './common/AudioPlayerWidget';
import { getTotalCommentsCount } from '../utils/textFormatters';

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
  const commentId = searchParams.get('comment');
  const replyId = searchParams.get('reply');

  // Derive itemType and itemId synchronously from search parameters
  const itemType = postId ? 'post' : jobId ? 'job' : eventId ? 'event' : null;
  const itemId = postId || jobId || eventId || null;

  const [data, setData] = useState(location.state?.postData || null);
  const [loading, setLoading] = useState(false);
  const isLoading = loading || (!!itemId && !data);

  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [viewerData, setViewerData] = useState(null);
  const [showCommentInput, setShowCommentInput] = useState(true);
  const [isMobileCommentsOpen, setIsMobileCommentsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [mediaAspectRatio, setMediaAspectRatio] = useState(null);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const customFormatTime = (date) => {
    if (!date) return '';
    const dateObj = new Date(date);
    const diffDays = Math.floor((new Date() - dateObj) / (1000 * 60 * 60 * 24));
    if (diffDays >= 365) {
      const years = Math.floor(diffDays / 365);
      return `${years} yr${years > 1 ? 's' : ''} ago`;
    }
    if (diffDays >= 7) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    return formatDistanceToNow(dateObj, { addSuffix: true });
  };

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
        if (res.status === 404) {
          toast.error('This post has been deleted and is no longer available');
        } else {
          toast.error('Failed to load shared item');
        }
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
    if (itemId && itemType) {
      const hasInitialData = !!location.state?.postData;
      if (hasInitialData) {
        setData(location.state.postData);
      }
      fetchData(hasInitialData);
      setCurrentMediaIndex(0);
      if (commentId || replyId) {
        setIsMobileCommentsOpen(true);
      }
    } else {
      setData(null);
      setIsMobileCommentsOpen(false);
    }
  }, [itemType, itemId, commentId, replyId, location.state]);

  // Real-time synchronization for the currently open shared item/modal
  useEffect(() => {
    if (!socket || itemType !== 'post' || !itemId) return;

    const handleCommentsUpdated = ({ postId, comments }) => {
      if (postId === itemId) {
        setData(prev => (prev ? { ...prev, comments } : prev));
      }
    };

    const handlePostLiked = ({ postId, likes }) => {
      if (postId === itemId) {
        setData(prev => (prev ? { ...prev, likes } : prev));
      }
    };

    const handlePostUpdated = ({ postId, content }) => {
      if (postId === itemId) {
        setData(prev => (prev ? { ...prev, content } : prev));
      }
    };

    const handlePostSharesUpdated = ({ postId, sharesCount }) => {
      if (postId === itemId) {
        setData(prev => (prev ? { ...prev, sharesCount } : prev));
      }
    };

    const handlePostDeleted = ({ postId }) => {
      if (postId === itemId) {
        toast('This post was deleted.');
        closeModal();
      }
    };

    socket.on('post_comments_updated', handleCommentsUpdated);
    socket.on('post_liked', handlePostLiked);
    socket.on('post_updated', handlePostUpdated);
    socket.on('post_shares_updated', handlePostSharesUpdated);
    socket.on('post_deleted', handlePostDeleted);

    return () => {
      socket.off('post_comments_updated', handleCommentsUpdated);
      socket.off('post_liked', handlePostLiked);
      socket.off('post_updated', handlePostUpdated);
      socket.off('post_shares_updated', handlePostSharesUpdated);
      socket.off('post_deleted', handlePostDeleted);
    };
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
      navigate(`/profile/${data.author?.username || data.authorClerkId}`);
    }
  };

  const handleViewFullJob = () => {
    const targetId = data?._id || jobId || itemId;
    if (!targetId) return;
    closeModal();
    const role = sessionStorage.getItem('campusbridge_user_role') || localStorage.getItem('campusbridge_user_role') || user?.publicMetadata?.role || 'student';
    if (role === 'mentor') {
      navigate(`/mentor-dashboard/jobs/${targetId}`);
    } else {
      navigate(`/dashboard/jobs/${targetId}`);
    }
  };

  const handleViewFullEvent = () => {
    closeModal();
    const role = sessionStorage.getItem('campusbridge_user_role') || localStorage.getItem('campusbridge_user_role') || user?.publicMetadata?.role || 'student';
    if (role === 'mentor') {
      navigate('/mentor-dashboard/events');
    } else {
      navigate('/dashboard/events');
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
    // Remove the query parameters from the URL, keeping the pathname intact
    const params = new URLSearchParams(searchParams);
    params.delete('post');
    params.delete('job');
    params.delete('event');
    params.delete('comment');
    params.delete('reply');
    const newSearch = params.toString() ? `?${params.toString()}` : '';
    navigate(`${location.pathname}${newSearch}`, { replace: true });
  };

  const safeMediaList = (data?.mediaFiles && data.mediaFiles.length > 0)
    ? data.mediaFiles.filter(m => !!m?.url)
    : (data?.imageUrl ? [{ url: data.imageUrl, mediaType: data.mediaType || 'image' }] : []);

  const safeIndex = Math.min(Math.max(currentMediaIndex, 0), Math.max(0, safeMediaList.length - 1));
  const activeMedia = safeMediaList[safeIndex] || null;

  const isAudio = activeMedia?.mediaType === 'audio' || (activeMedia?.url && activeMedia.url.match(/\.(mp3|wav|ogg|m4a|aac|webm)(\?.*)?$/i));
  const isVideo = !isAudio && (activeMedia?.mediaType === 'video' || (activeMedia?.url && activeMedia.url.match(/\.(mp4|webm|ogg)$/i)));
  const hasVisualMedia = Boolean(activeMedia && !isAudio);

  useEffect(() => {
    if (!data) return;

    if (!hasVisualMedia) {
      if (data.eventDetails?.imageUrl || data.eventDetails?.image) {
        const posterUrl = optimizeUrl(data.eventDetails.imageUrl || data.eventDetails.image);
        const img = new Image();
        img.src = posterUrl;
        if (img.complete && img.naturalWidth && img.naturalHeight) {
          setMediaAspectRatio(img.naturalWidth / img.naturalHeight);
        } else {
          img.onload = () => {
            if (img.naturalWidth && img.naturalHeight) {
              setMediaAspectRatio(img.naturalWidth / img.naturalHeight);
            }
          };
        }
      } else {
        setMediaAspectRatio(1);
      }
      return;
    }

    if (!isVideo && activeMedia?.url) {
      const img = new Image();
      img.src = optimizeUrl(activeMedia.url);
      if (img.complete && img.naturalWidth && img.naturalHeight) {
        setMediaAspectRatio(img.naturalWidth / img.naturalHeight);
      } else {
        img.onload = () => {
          if (img.naturalWidth && img.naturalHeight) {
            setMediaAspectRatio(img.naturalWidth / img.naturalHeight);
          }
        };
        img.onerror = () => {
          setMediaAspectRatio(1);
        };
      }
    } else if (isVideo && activeMedia?.url) {
      setMediaAspectRatio(prev => prev || (9 / 16));
      const vid = document.createElement('video');
      vid.src = activeMedia.url;
      vid.onloadedmetadata = () => {
        if (vid.videoWidth && vid.videoHeight) {
          setMediaAspectRatio(vid.videoWidth / vid.videoHeight);
        }
      };
    }
  }, [activeMedia?.url, isVideo, hasVisualMedia, data]);

  const isDesktop = windowSize.width >= 768;
  const rawRatio = mediaAspectRatio || (hasVisualMedia ? (isVideo ? 9 / 16 : 1) : 1);
  const clampedRatio = Math.max(0.48, Math.min(rawRatio, 2.4));
  const isReel = isVideo && clampedRatio <= 0.72;

  // Responsive desktop dimensions according to media ratio
  const sidebarWidth = 400;
  const maxAvailableH = Math.min(windowSize.height * 0.88, 860);
  const maxMediaW = Math.max(280, Math.min(windowSize.width * 0.94 - sidebarWidth, 1050));

  let computedMediaW;
  let computedModalH;

  if (!hasVisualMedia) {
    computedMediaW = 460;
    computedModalH = 500;
  } else if (clampedRatio <= 1) {
    computedModalH = maxAvailableH;
    computedMediaW = Math.round(computedModalH * clampedRatio);
    if (computedMediaW > maxMediaW) {
      computedMediaW = maxMediaW;
      computedModalH = Math.round(computedMediaW / clampedRatio);
    }
  } else {
    computedMediaW = Math.min(maxMediaW, Math.round(maxAvailableH * clampedRatio));
    computedModalH = Math.round(computedMediaW / clampedRatio);
    if (computedModalH > maxAvailableH) {
      computedModalH = maxAvailableH;
      computedMediaW = Math.round(computedModalH * clampedRatio);
    }
  }

  const totalModalWidth = computedMediaW + sidebarWidth;

  if (!itemType || !itemId) return null;

  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 md:backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200"
        onClick={closeModal}
      >
        <div
          style={isDesktop ? {
            width: `${totalModalWidth}px`,
            height: `${computedModalH}px`,
            maxWidth: '96vw',
            maxHeight: '90vh'
          } : (isReel ? {
            width: '100vw',
            height: '100dvh'
          } : {
            width: 'min(95vw, 500px)',
            maxHeight: '90dvh'
          })}
          className={isDesktop 
            ? "relative bg-card rounded-2xl overflow-hidden shadow-2xl flex flex-row border border-border/50 mx-auto animate-in zoom-in-95 duration-200 transition-all"
            : (isReel 
              ? "fixed inset-0 w-full h-[100dvh] bg-black overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
              : "relative bg-card rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-border/50 mx-auto my-auto max-h-[90dvh] animate-in zoom-in-95 duration-200 transition-all"
            )
          }
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={closeModal}
            className="absolute top-3 right-3 z-50 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-md cursor-pointer shadow-lg"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

        {isLoading ? (
          <>
            {/* Left Media Area Skeleton */}
            <div 
              style={isDesktop ? { width: '460px', height: '100%' } : { width: '100%', height: '240px' }}
              className="bg-black/5 flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-border/50 z-0 shrink-0"
            >
              <div className="w-20 h-20 rounded-full bg-muted animate-pulse flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
              </div>
            </div>

            {/* Right Details Area Skeleton */}
            <div 
              style={isDesktop ? { width: '400px', height: '100%' } : { width: '100%', flex: 1 }}
              className="relative bg-card flex flex-col justify-start overflow-hidden shrink-0 z-10 p-4"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-1/3"></div>
                  <div className="h-3 bg-muted animate-pulse rounded w-1/4"></div>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-5/6"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-4/6"></div>
              </div>
              <div className="flex-1 flex flex-col gap-4 pt-4 border-t border-border/50">
                <div className="h-6 bg-muted animate-pulse rounded w-24 mb-2"></div>
                <div className="flex gap-3">
                   <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0"></div>
                   <div className="flex-1 space-y-2 mt-1">
                     <div className="h-3 bg-muted animate-pulse rounded w-1/4"></div>
                     <div className="h-3 bg-muted animate-pulse rounded w-full"></div>
                   </div>
                </div>
              </div>
            </div>
          </>
        ) : data ? (
          <>
            {/* Left Media Area */}
            <div 
              style={isDesktop ? {
                width: `${computedMediaW}px`,
                height: `${computedModalH}px`
              } : (isReel ? {
                width: '100%',
                height: '100%'
              } : (hasVisualMedia ? {
                width: '100%',
                maxHeight: '46dvh',
                aspectRatio: `${clampedRatio}`
              } : {
                width: '100%',
                minHeight: '180px',
                maxHeight: '240px'
              }))}
              className={isDesktop 
                ? "relative shrink-0 bg-black flex items-center justify-center overflow-hidden border-r border-border/50 z-0"
                : (isReel 
                  ? "absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden z-0"
                  : "relative w-full bg-black shrink-0 flex items-center justify-center overflow-hidden border-b border-border/50 z-0"
                )
              }
            >
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
                        <div className="w-full h-[40%] bg-black/95 shrink-0 relative">
                          <img src={data.eventDetails.imageUrl || data.eventDetails.image} alt={data.eventDetails.title} className="w-full h-full object-contain p-2" />
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
                      const safeMediaList = (data.mediaFiles && data.mediaFiles.length > 0)
                        ? data.mediaFiles.filter(m => !!m?.url)
                        : (data.imageUrl ? [{ url: data.imageUrl, mediaType: data.mediaType || 'image' }] : []);
                      
                      if (safeMediaList.length === 0) return null;

                      const safeIndex = Math.min(Math.max(currentMediaIndex, 0), safeMediaList.length - 1);
                      const activeMedia = safeMediaList[safeIndex];
                      if (!activeMedia || !activeMedia.url) return null;

                      const isAudio = activeMedia.mediaType === 'audio' || (activeMedia.url && activeMedia.url.match(/\.(mp3|wav|ogg|m4a|aac|webm)(\?.*)?$/i));
                      const isVideo = !isAudio && (activeMedia.mediaType === 'video' || (activeMedia.url && activeMedia.url.match(/\.(mp4|webm|ogg)$/i)));
                      const optimizedSrc = optimizeUrl(activeMedia.url);

                      return isAudio ? (
                        <div className="w-full max-w-md p-6 bg-card/90 rounded-2xl shadow-xl border border-border/50">
                          <AudioPlayerWidget 
                            src={activeMedia.url} 
                            duration={activeMedia.duration}
                            title={`${data.author?.name || 'Author'}'s Audio`} 
                            userAvatar={data.author?.imageUrl}
                            senderName={data.author?.name}
                          />
                        </div>
                      ) : isVideo ? (
                        <PinchZoomMedia 
                          className="w-full h-full flex items-center justify-center cursor-pointer"
                          onTap={() => setViewerData({ files: safeMediaList, index: safeIndex })}
                        >
                          <AutoPlayVideo 
                            src={activeMedia.url} 
                            onRatioCalculated={(r) => setMediaAspectRatio(r)}
                            className="w-full max-h-full object-contain bg-black" 
                          />
                        </PinchZoomMedia>
                      ) : (
                        <PinchZoomMedia 
                          className="w-full h-full flex items-center justify-center cursor-pointer"
                          onTap={() => setViewerData({ files: safeMediaList, index: safeIndex })}
                        >
                          <img
                            src={optimizedSrc}
                            alt="Post media"
                            onLoad={(e) => {
                              if (e.target.naturalWidth && e.target.naturalHeight) {
                                setMediaAspectRatio(e.target.naturalWidth / e.target.naturalHeight);
                              }
                            }}
                            className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        </PinchZoomMedia>
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
                      <div className="w-full h-[45%] bg-black/95 shrink-0 relative">
                        <img src={data.imageUrl || data.image} alt={data.name} className="w-full h-full object-contain p-2" />
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

            <div 
              style={isDesktop ? {
                width: `${sidebarWidth}px`,
                height: `${computedModalH}px`
              } : (isReel ? {
                width: '100%',
                height: '100dvh'
              } : {
                width: '100%',
                flex: 1,
                maxHeight: 'calc(90dvh - 200px)'
              })}
              className={isDesktop
                ? "relative flex flex-col justify-start bg-card overflow-hidden shrink-0 z-10"
                : (isReel
                  ? "relative w-full flex flex-col justify-end h-[100dvh] pointer-events-none z-10"
                  : "relative w-full flex-1 flex flex-col justify-start bg-card overflow-y-auto pointer-events-auto z-10"
                )
              }
            >

              {/* Spacer on mobile to push content down, allowing taps to pass through (only for vertical Reels) */}
              {isReel && !isDesktop && <div className="flex-1 pointer-events-none"></div>}

              {/* Mobile Floating Engagement Actions (Instagram Reels style - ONLY for vertical Reels) */}
              {itemType === 'post' && isReel && !isDesktop && (
                <div className="absolute right-3 bottom-4 flex flex-col items-center gap-6 z-20 pointer-events-auto pb-6">
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
                            className="w-full text-left px-3 py-2 text-sm text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-500/10 font-medium flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className={isReel && !isDesktop
                ? "w-full bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col pt-32 pointer-events-none"
                : "w-full bg-none flex flex-col h-full flex-1 pointer-events-auto"
              }>

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
                    <div className={`p-4 ${isReel && !isDesktop ? 'pb-8 pr-16' : 'pb-3 pr-4'} shrink-0 border-b-0 md:border-b md:border-border/30 md:mb-0`}>
                      <div className="flex items-start gap-3 pb-3">
                        <img
                          src={data.author?.image || `https://ui-avatars.com/api/?name=${data.author?.name || 'User'}`}
                          className="w-8 h-8 rounded-full border border-border mt-0.5 shrink-0 cursor-pointer hover:opacity-80 transition-opacity pointer-events-auto object-cover"
                          alt=""
                          onClick={handleProfileClick}
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`flex items-center gap-2 flex-wrap ${data.author?.role ? 'mb-0.5' : 'mb-1'}`}>
                            <p
                              className={`text-sm font-bold truncate cursor-pointer hover:underline pointer-events-auto ${isReel && !isDesktop ? 'text-white drop-shadow-md' : 'text-foreground'}`}
                              onClick={handleProfileClick}
                            >
                              {data.author?.name}
                            </p>
                            {user && data.authorClerkId !== user.id && connectionStatus !== 'accepted' && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-white/50 md:bg-border shrink-0"></span>
                                {connectionStatus === 'pending' ? (
                                  <button onClick={handleCancelRequest} disabled={isConnecting} className={`text-xs font-bold shrink-0 ${isReel && !isDesktop ? 'text-white/80 hover:text-white drop-shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
                                    {isConnecting ? 'Cancelling...' : 'Requested'}
                                  </button>
                                ) : (
                                  <button onClick={handleConnect} disabled={isConnecting} className="text-xs font-bold text-primary hover:text-primary/80 shrink-0">
                                    {isConnecting ? 'Connecting...' : 'Connect'}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                          {data.author?.role && (
                            <p className={`text-xs mb-1.5 line-clamp-2 break-words leading-tight ${isReel && !isDesktop ? 'text-white/80 drop-shadow-md' : 'text-muted-foreground'}`}>
                              {data.author?.role}
                            </p>
                          )}
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
                                <span className={`text-sm whitespace-pre-wrap leading-relaxed ${isReel && !isDesktop ? 'text-white drop-shadow-md' : 'text-foreground'}`}>
                                  <FormattedPostText text={data.content.substring(0, 100)} />...
                                  <button onClick={() => setIsCaptionExpanded(true)} className={`${isReel && !isDesktop ? 'text-white/60' : 'text-muted-foreground'} ml-1 font-semibold hover:underline bg-transparent`}>
                                    more
                                  </button>
                                </span>
                              ) : (
                                <PostCaption content={data.content} textClassName={isReel && !isDesktop ? "text-white drop-shadow-md" : "text-foreground"} />
                              )}
                            </div>
                          )}
                          <p className={`text-[10px] mt-2 uppercase tracking-wide ${isReel && !isDesktop ? 'text-white/60 drop-shadow-md' : 'text-muted-foreground'}`}>
                            {customFormatTime(data.createdAt)}
                          </p>
                        </div>

                        {/* Post Options Menu (Desktop) */}
                        {user?.id === data.authorClerkId && (
                          <div className="relative shrink-0 hidden md:block">
                            <button
                              onClick={() => setIsMenuOpen(!isMenuOpen)}
                              className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground"
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
                                  className="w-full text-left px-3 py-2 text-sm text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-500/10 font-medium flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Comments Component (Bottom Sheet on Mobile for Reels) */}
                    <div className={`
                    flex-1 bg-card transition-transform duration-300 flex flex-col overflow-hidden
                    ${isReel && !isDesktop
                      ? 'fixed inset-x-0 bottom-0 z-50 h-[70dvh] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] border-t border-border/50 ' + (isMobileCommentsOpen ? '!translate-y-0' : 'translate-y-full')
                      : 'relative w-full h-auto rounded-none shadow-none border-t border-border/40'
                    }
                  `}>
                      {isReel && !isDesktop && (
                        <div className="flex flex-col items-center justify-center py-3 border-b border-border/50 shrink-0 bg-muted/30">
                          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mb-2"></div>
                          <p className="text-sm font-bold">Comments</p>
                          <button onClick={() => setIsMobileCommentsOpen(false)} className="absolute right-4 top-4 p-1.5 bg-muted rounded-full">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <PostComments
                        post={data}
                        currentUser={user}
                        onRefresh={(updatedComments) => {
                          if (Array.isArray(updatedComments)) {
                            setData(prev => (prev ? { ...prev, comments: updatedComments } : prev));
                          } else {
                            fetchData(true);
                          }
                        }}
                        formatTime={customFormatTime}
                        getAvatarFallback={(name) => `https://ui-avatars.com/api/?name=${name || 'User'}`}
                        fullHeight={true}
                        showCommentInput={showCommentInput || isMobileCommentsOpen}
                        highlightCommentId={commentId}
                        highlightReplyId={replyId}
                        beforeInputNode={
                          <div className={`flex items-center gap-4 px-1 py-2 ${isReel && !isDesktop ? 'hidden' : 'flex'}`}>
                            <button
                              onClick={handleLike}
                              className={`flex items-center gap-1.5 transition-colors group cursor-pointer ${data.likes?.some(like => (like.clerkId || like) === user?.id) ? 'text-red-500' : 'text-foreground hover:text-primary'}`}
                            >
                              <Heart className={`w-5 h-5 ${data.likes?.some(like => (like.clerkId || like) === user?.id) ? 'fill-current' : 'group-hover:fill-primary/20'}`} />
                              <span className="font-bold text-xs">{!data.hideLikes ? (data.likes?.length || 0) : ''}</span>
                            </button>
                            <button
                              onClick={() => {
                                if (isReel && !isDesktop) {
                                  setIsMobileCommentsOpen(true);
                                } else {
                                  setShowCommentInput(prev => !prev);
                                }
                              }}
                              className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors group cursor-pointer"
                            >
                              <MessageCircle className="w-5 h-5 group-hover:fill-primary/20" />
                              <span className="font-bold text-xs">{getTotalCommentsCount(data.comments) > 0 ? getTotalCommentsCount(data.comments) : ''}</span>
                            </button>
                            <button onClick={handleShare} className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors ml-auto group cursor-pointer">
                              <Share2 className="w-5 h-5 group-hover:fill-primary/20" />
                              {(data.sharesCount || 0) > 0 && <span className="font-bold text-xs">{data.sharesCount}</span>}
                            </button>
                          </div>
                        }
                      />
                    </div>

                    {/* Overlay for mobile bottom sheet */}
                    {isReel && !isDesktop && isMobileCommentsOpen && (
                      <div
                        className="fixed inset-0 bg-black/60 z-40"
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
                      <button 
                        onClick={handleViewFullJob}
                        className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <ExternalLink className="w-4 h-4" /> View Full Job Details
                      </button>
                    )}
                    {itemType === 'event' && (
                      <button 
                        onClick={handleViewFullEvent}
                        className="w-full py-3 bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
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
    </ModalPortal>
  );
};

export default SharedItemViewer;
