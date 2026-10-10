import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, Phone, Video, MoreVertical, MessageSquare, Loader2, Circle, Check, CheckCheck, Smile, Ban, Palette, Trash2, User, UserX, ShieldAlert, Paperclip, X, Reply, Download, FileText, Eye, FileDown, Edit2, Archive, ArchiveRestore, BellOff, Bell, Pin, PinOff, Mail, MailOpen, Heart, HeartOff, Share2, Mic, Square, Clock, AlertCircle, ArrowRight, UserPlus, RotateCcw, Plus, Play, Forward, CornerUpRight, CheckSquare, Copy, Calendar, Image as ImageIcon, Camera, Headphones } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { socket } from '../services/socket';
import MessageSkeleton from './skeletons/MessageSkeleton';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import { getPdfViewUrl } from '../utils/pdfViewer';
import API_BASE from '../utils/api'
import { formatRoleSubtitle } from '../utils/textFormatters';
import { isToday, isYesterday, format } from 'date-fns';
import { useTheme } from './ThemeProvider';
import ModalPortal from './modals/ModalPortal';
import AudioPlayerWidget from './common/AudioPlayerWidget';
import ExportChatModal from './modals/ExportChatModal';
import ShareProfileInChatModal from './modals/ShareProfileInChatModal';
import ForwardMessageModal from './modals/ForwardMessageModal';
import CameraCaptureModal from './modals/CameraCaptureModal';
import { compressImageWhatsAppStyle } from '../utils/imageCompressor';

const formatMessageDateSeparator = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
};


const THEMES = [
  // Dark Themes
  { id: 'default', name: 'Default Theme', bg: 'bg-background' },
  { id: 'midnight', name: 'Midnight Cyber (Dark)', bg: 'bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950' },
  { id: 'emerald', name: 'Emerald Forest (Dark)', bg: 'bg-gradient-to-b from-slate-950 via-emerald-950/20 to-slate-950' },
  { id: 'sunset', name: 'Sunset Glow (Dark)', bg: 'bg-gradient-to-b from-slate-950 via-rose-950/20 to-slate-950' },
  { id: 'sapphire', name: 'Deep Sapphire (Dark)', bg: 'bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950' },
  
  // Light Themes
  { id: 'light-lavender', name: 'Lavender (Light)', bg: 'bg-gradient-to-b from-slate-50 via-purple-100/50 to-slate-50 dark:from-slate-950 dark:via-purple-900/10 dark:to-slate-950' },
  { id: 'light-mint', name: 'Mint Breeze (Light)', bg: 'bg-gradient-to-b from-slate-50 via-emerald-100/50 to-slate-50 dark:from-slate-950 dark:via-emerald-900/10 dark:to-slate-950' },
  { id: 'light-peach', name: 'Peach Morning (Light)', bg: 'bg-gradient-to-b from-slate-50 via-rose-100/50 to-slate-50 dark:from-slate-950 dark:via-rose-900/10 dark:to-slate-950' },
  { id: 'light-sky', name: 'Sky Blue (Light)', bg: 'bg-gradient-to-b from-slate-50 via-blue-100/50 to-slate-50 dark:from-slate-950 dark:via-blue-900/10 dark:to-slate-950' }
];

// Helper to format role names cleanly without bulky all-caps text
const formatRoleBadge = (rawRole) => {
  if (!rawRole) return 'Student';
  const r = String(rawRole).toLowerCase();
  if (r.includes('mentor')) return 'Mentor';
  if (r.includes('alumni')) return 'Alumni';
  if (r.includes('admin')) return 'Admin';
  return 'Student';
};

const getRoleBadgeClasses = (role) => {
  const formatted = formatRoleBadge(role);
  switch (formatted) {
    case 'Mentor':
      return 'bg-purple-500/10 text-purple-400 dark:text-purple-300 border border-purple-500/25';
    case 'Alumni':
      return 'bg-amber-500/10 text-amber-500 dark:text-amber-300 border border-amber-500/25';
    case 'Admin':
      return 'bg-rose-500/10 text-rose-500 dark:text-rose-300 border border-rose-500/25';
    default:
      return 'bg-blue-500/10 text-blue-500 dark:text-blue-300 border border-blue-500/25';
  }
};

// Global in-memory cache for ultra-fast instant thumbnail loading across messages
const shareThumbnailCache = new Map();

const SharedPostThumbnail = ({ share, onPostUnavailable }) => {
  const cached = share?.itemId ? shareThumbnailCache.get(`post_${share.itemId}`) : null;
  const [mediaInfo, setMediaInfo] = useState({
    imageUrl: share.imageUrl || cached?.imageUrl || '',
    mediaType: share.mediaType || cached?.mediaType || ''
  });
  const checkedRef = useRef(Boolean(cached));

  useEffect(() => {
    if (checkedRef.current || share.isDeleted) return;
    if (share.type === 'post' && share.itemId) {
      checkedRef.current = true;
      let isMounted = true;
      fetch(`${API_BASE}/api/posts/${share.itemId}`)
        .then(res => {
          if (res.status === 404) {
            onPostUnavailable?.();
            return null;
          }
          return res.json();
        })
        .then(data => {
          if (!isMounted || !data) return;
          const post = data.post || data;
          if (post.moderationStatus === 'deleted' || post.isDeleted) {
            onPostUnavailable?.();
            return;
          }
          let thumb = '';
          let type = '';
          if (post.mediaFiles && post.mediaFiles.length > 0) {
            const first = post.mediaFiles[0];
            const isVid = first.mediaType === 'video' || (first.url && first.url.match(/\.(mp4|webm|mov|ogg)$/i));
            type = isVid ? 'video' : 'image';
            if (first.thumbnailUrl) {
              thumb = first.thumbnailUrl;
            } else if (first.url) {
              if (isVid && first.url.includes('cloudinary.com')) {
                thumb = first.url.replace('/video/upload/', '/video/upload/so_auto,w_600,c_fill,f_jpg/').replace(/\.(mp4|webm|mov|ogg)$/i, '.jpg');
              } else {
                thumb = first.url;
              }
            }
          } else if (post.imageUrl) {
            thumb = post.imageUrl;
            type = post.mediaType || 'image';
          } else if (post.eventDetails?.imageUrl) {
            thumb = post.eventDetails.imageUrl;
            type = 'image';
          } else if (post.jobDetails?.companyLogo) {
            thumb = post.jobDetails.companyLogo;
            type = 'image';
          } else if (post.linkPreview?.image || post.linkPreview?.thumbnailUrl) {
            thumb = post.linkPreview.image || post.linkPreview.thumbnailUrl;
            type = 'link';
          }
          if (thumb) {
            shareThumbnailCache.set(`post_${share.itemId}`, { imageUrl: thumb, mediaType: type });
            setMediaInfo({ imageUrl: thumb, mediaType: type });
          }
        })
        .catch(() => {});
      return () => { isMounted = false; };
    }
  }, [share.itemId, share.type, share.isDeleted, mediaInfo.imageUrl]);

  const currentUrl = mediaInfo.imageUrl || share.imageUrl || cached?.imageUrl;
  if (!currentUrl) return null;

  const isVideo = (mediaInfo.mediaType === 'video' || share.mediaType === 'video' || currentUrl.match(/\.(mp4|webm|mov|ogg)$/i)) && !currentUrl.match(/\.(jpg|jpeg|png|webp)$/i);

  return (
    <div className="relative w-full aspect-[4/3] bg-black/80 overflow-hidden">
      {isVideo ? (
        <video
          src={currentUrl}
          className="w-full h-full object-cover pointer-events-none"
          muted
          preload="metadata"
          playsInline
        />
      ) : (
        <img 
          src={currentUrl} 
          alt="Post preview" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="eager"
        />
      )}
      {(mediaInfo.mediaType === 'video' || share.mediaType === 'video' || currentUrl.includes('.mp4') || currentUrl.includes('/video/')) && (
        <>
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors pointer-events-none">
            <div className="w-11 h-11 rounded-full bg-black/65 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            </div>
          </div>
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1 shadow-sm pointer-events-none">
            <Video className="w-3 h-3 text-white" />
            <span>Video</span>
          </div>
        </>
      )}
    </div>
  );
};

const SharedEventThumbnail = ({ share }) => {
  const cached = share?.itemId ? shareThumbnailCache.get(`event_${share.itemId}`) : null;
  const [imageUrl, setImageUrl] = useState(share.imageUrl || cached?.imageUrl || '');
  const checkedRef = useRef(Boolean(cached || share.imageUrl));

  useEffect(() => {
    if (checkedRef.current) return;
    if (share.itemId) {
      checkedRef.current = true;
      let isMounted = true;
      fetch(`${API_BASE}/api/events/${share.itemId}`)
        .then(res => res.ok ? res.json() : null)
        .then(event => {
          if (!isMounted || !event) return;
          const img = event.imageUrl || event.image || '';
          if (img) {
            shareThumbnailCache.set(`event_${share.itemId}`, { imageUrl: img });
            setImageUrl(img);
          }
        })
        .catch(() => {});
      return () => { isMounted = false; };
    }
  }, [share.itemId]);

  const currentUrl = imageUrl || share.imageUrl || cached?.imageUrl;
  if (!currentUrl) return null;

  return (
    <div className="relative w-full aspect-[16/9] bg-black/80 overflow-hidden">
      <img
        src={currentUrl}
        alt="Event preview"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="eager"
      />
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1 shadow-sm pointer-events-none">
        <Calendar className="w-3 h-3 text-primary" />
        <span>Event</span>
      </div>
    </div>
  );
};

const RealtimeChat = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  
  const searchParams = new URLSearchParams(location.search);
  const targetUserId = searchParams.get('userId') || location.state?.selectedUserId || location.state?.clerkId;

  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const activeContactRef = useRef(activeContact);
  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Helper to generate consistent conversation ID
  const getConvId = (id1, id2) => {
    if (!id1 || !id2) return '';
    return [id1, id2].sort().join('_');
  };

  // New Chat Features State
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [fullscreenAttachment, setFullscreenAttachment] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShareProfileModalOpen, setIsShareProfileModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // Multi-Selection, Forwarding & Context Menu State (WhatsApp-style)
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null); // { x: number, y: number, message: any }
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [messagesToForward, setMessagesToForward] = useState([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  // Mobile Touch Long-Press Refs
  const longPressTimerRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const isLongPressTriggeredRef = useRef(false);

  // Reset selection & context menu on switching contacts
  useEffect(() => {
    setIsSelectMode(false);
    setSelectedMessageIds(new Set());
    setContextMenu(null);
  }, [activeContact?.clerkId]);

  // Voice recording state
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const voiceRecorderRef = useRef(null);
  const voiceStreamRef = useRef(null);
  const voiceChunksRef = useRef([]);
  const [deleteModalMsg, setDeleteModalMsg] = useState(null);

  // WhatsApp-style Undo Delete State
  const [pendingDelete, setPendingDelete] = useState(null);
  const [undoSecondsLeft, setUndoSecondsLeft] = useState(5);
  const pendingDeleteTimeoutRef = useRef(null);
  const pendingDeleteIntervalRef = useRef(null);
  const pendingDeleteRef = useRef(null);
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const fileInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  const docInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const attachmentMenuRef = useRef(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // 3-Dots Menu & Settings State
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [activeContactMenu, setActiveContactMenu] = useState(null);
  const [contactContextMenu, setContactContextMenu] = useState(null); // { x: number, y: number, contact: any }
  const [personToDelete, setPersonToDelete] = useState(null);
  const [chatThemeIndex, setChatThemeIndex] = useState(0);
  const [blockedUsers, setBlockedUsers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('campusbridge_blocked_users') || '[]');
    } catch {
      return [];
    }
  });

  // Local Chat Preferences
  const [pinnedChats, setPinnedChats] = useState(() => JSON.parse(localStorage.getItem('cb_pinned_chats') || '[]'));
  const [mutedChats, setMutedChats] = useState(() => JSON.parse(localStorage.getItem('cb_muted_chats') || '[]'));
  const [favouriteChats, setFavouriteChats] = useState(() => JSON.parse(localStorage.getItem('cb_favourite_chats') || '[]'));
  const [archivedChats, setArchivedChats] = useState(() => JSON.parse(localStorage.getItem('cb_archived_chats') || '[]'));
  const [forceUnreadChats, setForceUnreadChats] = useState(() => JSON.parse(localStorage.getItem('cb_unread_chats') || '[]'));
  const [chatFilter, setChatFilter] = useState('all'); // 'all' | 'unread' | 'archived'


  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const menuRef = useRef(null);
  const mobileActionMenuRef = useRef(null);
  const [showMobileActionMenu, setShowMobileActionMenu] = useState(false);

  // Auto-scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOtherTyping]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(e.target) && !e.target.closest('.attachment-menu-trigger')) {
        setShowAttachmentMenu(false);
      }
      if (mobileActionMenuRef.current && !mobileActionMenuRef.current.contains(e.target)) {
        setShowMobileActionMenu(false);
      }
      if (!e.target.closest('.message-context-menu') && !e.target.closest('.message-menu-trigger')) {
        setActiveMessageMenu(null);
      }
      if (!e.target.closest('.message-floating-context-menu')) {
        setContextMenu(null);
      }
      if (!e.target.closest('.contact-context-menu') && !e.target.closest('.contact-menu-trigger')) {
        setActiveContactMenu(null);
      }
      if (!e.target.closest('.contact-floating-context-menu')) {
        setContactContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // Global Socket Event Listeners
    const handleOnlineUsers = (users) => setOnlineUsers(users);
    const handleUpdateSidebar = () => {
      if (user?.id) fetchContacts();
    };

    socket.on('online_users_update', handleOnlineUsers);
    socket.on('update_sidebar', handleUpdateSidebar);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      socket.off('online_users_update', handleOnlineUsers);
      socket.off('update_sidebar', handleUpdateSidebar);
    };
  }, [user]);

  // Load contacts list for current user
  const fetchContacts = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/messages/conversations/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const currentActive = activeContactRef.current;
        const currentActiveId = currentActive?.clerkId || currentActive?.id;

        // If an active contact is currently open, keep its unread count as 0 locally so it doesn't flicker
        const updatedData = data.map((c) => {
          if (currentActiveId && (c.clerkId === currentActiveId || c.id === currentActiveId)) {
            return { ...c, unread: 0 };
          }
          return c;
        });
        setContacts(updatedData);

        // ONLY auto-select first contact if NO contact is selected yet AND no targetUserId
        if (updatedData.length > 0 && !currentActive && !targetUserId) {
          setActiveContact(updatedData[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    if (user?.id) {
      const register = () => {
        socket.emit('register_user', user.id);
        socket.emit('get_online_users');
      };

      register();
      socket.on('connect', register);

      fetch(`${API_BASE}/api/messages/blocked/${user.id}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setBlockedUsers(data))
        .catch((err) => console.error('Error fetching blocked list:', err));

      return () => {
        socket.off('connect', register);
      };
    }
  }, [user]);

  // Handle URL query target user auto-selection
  useEffect(() => {
    if (!targetUserId || !user) return;

    const loadTargetUser = async () => {
      const existing = contacts.find((c) => c.clerkId === targetUserId || c.id === targetUserId);
      if (existing) {
        const currentActiveId = activeContactRef.current?.clerkId || activeContactRef.current?.id;
        if (currentActiveId !== targetUserId) {
          setActiveContact(existing);
          setIsMobileChatOpen(true);
        }
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/users/${targetUserId}`);
        if (res.ok) {
          const u = await res.json();
          const newContact = {
            id: u.clerkId,
            clerkId: u.clerkId,
            name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.name || 'User'),
            role: formatRoleSubtitle(u.headline, u.role),
            userRole: u.role || 'student',
            headline: formatRoleSubtitle(u.headline, u.role),
            image: u.imageUrl,
            username: u.username,
            conversationId: getConvId(user.id, u.clerkId),
            lastMessage: 'Start a conversation',
            unread: 0
          };
          setContacts((prev) => [newContact, ...prev.filter((c) => c.clerkId !== u.clerkId)]);
          setActiveContact(newContact);
          setIsMobileChatOpen(true);
        }
      } catch (err) {
        console.error('Error loading target user into chat:', err);
      }
    };

    loadTargetUser();
  }, [targetUserId, user, contacts.length]);

  // Handle active contact selection & room joining
  const activeContactId = activeContact?.clerkId || activeContact?.id;

  useEffect(() => {
    if (!user || !activeContact) return;

    const conversationId = activeContact.conversationId || getConvId(user.id, activeContact.clerkId);
    setIsLoadingMessages(true);
    setIsOtherTyping(false);
    setShowMoreMenu(false);

    // Join socket room
    socket.emit('join_room', { conversationId, userId: user.id });
    socket.emit('mark_read', { conversationId, userId: user.id });

    // Instantly clear unread badge for this contact if it had unread messages
    if (activeContact.unread > 0) {
      const unreadCount = activeContact.unread;
      activeContact.unread = 0;
      setContacts((prev) =>
        prev.map((c) =>
          c.clerkId === activeContactId || c.id === activeContactId || c.conversationId === conversationId
            ? { ...c, unread: 0 }
            : c
        )
      );
      window.dispatchEvent(
        new CustomEvent('campusbridge:messages_read', {
          detail: { conversationId, count: unreadCount, userId: user.id }
        })
      );
      fetch(`${API_BASE}/api/messages/read/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id })
      }).catch(() => {});
    }

    // Fetch conversation messages history
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/messages/${conversationId}?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => {
            const pendingOptimistic = prev.filter(
              (m) => String(m._id).startsWith('temp_') && m.conversationId === conversationId
            );
            return [...data, ...pendingOptimistic];
          });
        }
      } catch (err) {
        console.error('Error fetching message history:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchHistory();

    // Socket Event Listeners
    const handleReceiveMessage = (msg) => {
      // Ignore duplicate text messages generated for calls (only show the red/call_log card)
      if (msg.type !== 'call_log' && typeof msg.text === 'string') {
        const t = msg.text.trim().toLowerCase();
        if (
          t === 'missed video call' ||
          t === 'missed voice call' ||
          t === 'declined video call' ||
          t === 'declined voice call' ||
          t.startsWith('video call •') ||
          t.startsWith('voice call •')
        ) {
          fetchContacts();
          return;
        }
      }

      const activeConvId = conversationId;
      const isForActiveContact =
        msg.conversationId === activeConvId ||
        (msg.senderClerkId === activeContactId && msg.recipientClerkId === user.id) ||
        (msg.senderClerkId === user.id && msg.recipientClerkId === activeContactId);

      if (isForActiveContact) {
        setMessages((prev) => {
          const tempIdx = prev.findIndex(
            (m) =>
              String(m._id).startsWith('temp_') &&
              m.senderClerkId === msg.senderClerkId &&
              ((m.attachment?.url && m.attachment?.url === msg.attachment?.url) ||
               (m.type === 'audio' && msg.type === 'audio') ||
               (m.share?.itemId && m.share?.itemId === msg.share?.itemId) ||
               (m.isForwarded && (m.text === msg.text || m.type === msg.type)) ||
               (m.text && m.text === msg.text))
          );
          if (tempIdx !== -1) {
            const updated = [...prev];
            updated[tempIdx] = msg;
            return updated;
          }
          if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
          return [...prev, msg];
        });
        if (msg.recipientClerkId === user.id) {
          socket.emit('mark_read', { conversationId: activeConvId, userId: user.id });
          window.dispatchEvent(
            new CustomEvent('campusbridge:messages_read', {
              detail: { conversationId: activeConvId, count: 1, userId: user.id }
            })
          );
          fetch(`${API_BASE}/api/messages/read/${activeConvId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clerkId: user.id })
          }).catch(() => {});
        }
      }
      fetchContacts();
    };

    const handleUserTyping = ({ userId, isTyping }) => {
      if (userId !== user.id && userId === activeContactId) {
        setIsOtherTyping(isTyping);
      }
    };

    const handleMessagesRead = ({ conversationId: cId }) => {
      if (cId === conversationId) {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      }
    };

    const handleMessagesDelivered = ({ userId }) => {
      if (userId === activeContactId) {
        setMessages((prev) => prev.map((m) => (!m.isDelivered && m.recipientClerkId === userId) ? { ...m, isDelivered: true } : m));
      }
    };

    const handleMessageDeletedMe = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => String(m._id) !== String(messageId)));
      fetchContacts();
    };

    const handleMessageDeletedEveryone = ({ messageId }) => {
      setMessages((prev) => prev.map((m) => String(m._id) === String(messageId) ? { ...m, isDeleted: true, text: '', attachment: null } : m));
      fetchContacts();
    };

    const handleMessageEdited = ({ messageId, newText, editedAt }) => {
      setMessages((prev) => prev.map((m) => String(m._id) === String(messageId) ? { ...m, text: newText, isEdited: true, editedAt } : m));
    };

    const handleMessageRestoredEveryone = ({ messageId, message: restoredMsg }) => {
      setMessages((prev) => prev.map((m) => String(m._id) === String(messageId) ? (restoredMsg || { ...m, isDeleted: false }) : m));
      fetchContacts();
    };

    const handlePostDeleted = ({ postId }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.type === 'share' && String(m.share?.itemId) === String(postId)) {
            return {
              ...m,
              share: { ...m.share, isDeleted: true }
            };
          }
          return m;
        })
      );
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('new_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('messages_read', handleMessagesRead);
    socket.on('user_messages_delivered', handleMessagesDelivered);
    socket.on('message_deleted_for_me', handleMessageDeletedMe);
    socket.on('message_deleted_for_everyone', handleMessageDeletedEveryone);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_restored_everyone', handleMessageRestoredEveryone);
    socket.on('post_deleted', handlePostDeleted);

    return () => {
      socket.emit('leave_room', { conversationId });
      socket.off('receive_message', handleReceiveMessage);
      socket.off('new_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('messages_read', handleMessagesRead);
      socket.off('user_messages_delivered', handleMessagesDelivered);
      socket.off('message_deleted_for_me', handleMessageDeletedMe);
      socket.off('message_deleted_for_everyone', handleMessageDeletedEveryone);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_restored_everyone', handleMessageRestoredEveryone);
      socket.off('post_deleted', handlePostDeleted);
    };
  }, [activeContactId, user?.id]);

  // Handle Typing Indicator
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!activeContact || !user) return;

    const conversationId = activeContact.conversationId;
    socket.emit('typing', { conversationId, userId: user.id, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { conversationId, userId: user.id, isTyping: false });
    }, 2000);
  };

  // Handle Send / Edit Message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !selectedFile) || !activeContact || !user) return;

    if (isCurrentPartnerBlocked) {
      toast.error('Unblock user to send messages');
      return;
    }

    const text = inputText.trim();

    // Handling Message Edit
    if (editingMessage) {
      const msgId = editingMessage._id;
      const editedTime = new Date().toISOString();

      // 1. Optimistic local update
      setMessages((prev) => prev.map((m) => String(m._id) === String(msgId) ? { ...m, text, isEdited: true, editedAt: editedTime } : m));
      setInputText('');
      setEditingMessage(null);

      // 2. Socket emit
      socket.emit('edit_message', {
        messageId: msgId,
        newText: text,
        userId: user.id,
        conversationId: activeContact.conversationId
      });

      // 3. REST API persistence
      try {
        await fetch(`${API_BASE}/api/messages/${msgId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newText: text, userId: user.id })
        });
      } catch (err) {
        console.error('Error saving edited message:', err);
      }
      return;
    }

    const replyData = replyingTo ? {
      messageId: replyingTo._id,
      text: replyingTo.type === 'image' ? '📸 Image' : replyingTo.type === 'video' ? '🎥 Video' : (replyingTo.type === 'audio' || replyingTo.attachment?.type === 'audio') ? '🎤 Voice Note' : replyingTo.type === 'document' ? '📄 Document' : replyingTo.text,
      senderName: replyingTo.senderClerkId === user.id ? 'You' : activeContact.name
    } : null;

    const currentConvId = activeContact.conversationId || getConvId(user.id, activeContact.clerkId);
    const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // If there is an attachment to send
    if (selectedFile) {
      const fileToSend = selectedFile;
      const isAudio = fileToSend.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(fileToSend.name);
      const isDoc = !!fileToSend._isDocument || 
                    (!fileToSend.type.startsWith('image/') && 
                     !fileToSend.type.startsWith('video/') && 
                     !isAudio);

      const fileType = isDoc ? 'document'
                     : fileToSend.type.startsWith('image/') ? 'image' 
                     : fileToSend.type.startsWith('video/') ? 'video' 
                     : isAudio ? 'audio'
                     : 'document';
      
      const localPreviewUrl = URL.createObjectURL(fileToSend);

      const tempMessage = {
        _id: tempId,
        conversationId: currentConvId,
        senderClerkId: user.id,
        recipientClerkId: activeContact.clerkId,
        text,
        type: fileType,
        attachment: {
          url: localPreviewUrl,
          name: fileToSend.name,
          type: fileType,
          size: fileToSend.size
        },
        replyTo: replyData,
        createdAt: new Date().toISOString(),
        isRead: false,
        isUploading: true
      };

      // Optimistic update & immediately free up the input bar
      setMessages((prev) => [...prev, tempMessage]);
      setInputText('');
      setSelectedFile(null);
      setFilePreview(null);
      setReplyingTo(null);

      // Update contacts sidebar
      setContacts(prev => {
        const updated = prev.map(c => {
          if (c.clerkId === activeContact.clerkId) {
            return {
              ...c,
              lastMessage: text || (fileType === 'image' ? '📸 Image' : fileType === 'video' ? '🎥 Video' : fileType === 'audio' ? '🎙️ Voice Message' : '📄 Document'),
              lastMessageTime: new Date().toISOString()
            };
          }
          return c;
        });
        return updated.sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0));
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit('typing', { conversationId: currentConvId, userId: user.id, isTyping: false });

      // Background asynchronous upload (WhatsApp style)
      (async () => {
        const formData = new FormData();
        formData.append('file', fileToSend);
        formData.append('type', isDoc ? 'raw' : (fileType === 'video' ? 'video' : 'auto'));

        try {
          const uploadRes = await fetch(`${API_BASE}/api/upload/file`, { method: 'POST', body: formData });
          if (uploadRes.ok) {
            const data = await uploadRes.json();
            const realAttachment = {
              url: data.url,
              name: data.name || fileToSend.name,
              type: fileType,
              size: data.size || fileToSend.size
            };

            setMessages((prev) => prev.map((m) => m._id === tempId ? {
              ...m,
              isUploading: false,
              attachment: realAttachment
            } : m));

            socket.emit('send_message', {
              senderClerkId: user.id,
              recipientClerkId: activeContact.clerkId,
              conversationId: currentConvId,
              text,
              type: fileType,
              attachment: realAttachment,
              replyTo: replyData
            });
          } else {
            const errData = await uploadRes.json().catch(() => ({}));
            setMessages((prev) => prev.map((m) => m._id === tempId ? { ...m, isUploading: false, isError: true } : m));
            toast.error(errData.message || 'Failed to upload file');
          }
        } catch (err) {
          console.error('Upload error:', err);
          setMessages((prev) => prev.map((m) => m._id === tempId ? { ...m, isUploading: false, isError: true } : m));
          toast.error(err.message || 'Upload error');
        }
      })();
      return;
    }

    // Normal text message (immediate sending)
    const tempMessage = {
      _id: tempId,
      conversationId: currentConvId,
      senderClerkId: user.id,
      recipientClerkId: activeContact.clerkId,
      text,
      type: 'text',
      attachment: null,
      replyTo: replyData,
      createdAt: new Date().toISOString(),
      isRead: false,
      isUploading: false
    };

    setMessages((prev) => [...prev, tempMessage]);
    setInputText('');
    setReplyingTo(null);

    // Update contacts list to move the active contact to the top
    setContacts(prev => {
      const updated = prev.map(c => {
        if (c.clerkId === activeContact.clerkId) {
          return {
            ...c,
            lastMessage: text,
            lastMessageTime: new Date().toISOString()
          };
        }
        return c;
      });
      return updated.sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0));
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing', { conversationId: currentConvId, userId: user.id, isTyping: false });

    // Emit live message via Socket.io
    socket.emit('send_message', {
      senderClerkId: user.id,
      recipientClerkId: activeContact.clerkId,
      conversationId: currentConvId,
      text,
      type: 'text',
      attachment: null,
      replyTo: replyData
    });
  };

  const handleMediaSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      let fileToUse = file;
      const isImg = file.type.startsWith('image/') || /\.(jpe?g|png|webp|jfif|avif|heic|bmp)$/i.test(file.name);
      
      // Silently optimize large images in background without toast alerts
      if (isImg && file.size > 500 * 1024) {
        try {
          fileToUse = await compressImageWhatsAppStyle(file);
        } catch (err) {}
      }

      fileToUse._isDocument = false;
      setSelectedFile(fileToUse);
      if (fileToUse.type.startsWith('image/') || fileToUse.type.startsWith('video/')) {
        setFilePreview(URL.createObjectURL(fileToUse));
      } else {
        setFilePreview(null);
      }
    }
    e.target.value = '';
    setShowAttachmentMenu(false);
  };

  const handleDocumentSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Mark as document: sent raw without compression, preserving 100% original quality
      file._isDocument = true;
      setSelectedFile(file);
      setFilePreview(null);
    }
    e.target.value = '';
    setShowAttachmentMenu(false);
  };

  const handleAudioSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      file._isDocument = false;
      setSelectedFile(file);
      setFilePreview(null);
    }
    e.target.value = '';
    setShowAttachmentMenu(false);
  };

  const handleCameraPhotoCaptured = async (file) => {
    let fileToUse = file;
    if (file.size > 500 * 1024) {
      try {
        fileToUse = await compressImageWhatsAppStyle(file);
      } catch (err) {}
    }
    fileToUse._isDocument = false;
    setSelectedFile(fileToUse);
    setFilePreview(URL.createObjectURL(fileToUse));
  };

  const handleFileSelect = handleMediaSelect;

  // Handle Pasting Images and Videos from Clipboard
  const handlePasteMedia = (e) => {
    if (isCurrentPartnerBlocked || !activeContact) return;

    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    let mediaFile = null;

    // Check files array from clipboard
    if (clipboardData.files && clipboardData.files.length > 0) {
      for (let i = 0; i < clipboardData.files.length; i++) {
        const file = clipboardData.files[i];
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          mediaFile = file;
          break;
        }
      }
    }

    // Check clipboard items (e.g. copied screenshots from Windows Snipping Tool, browser)
    if (!mediaFile && clipboardData.items && clipboardData.items.length > 0) {
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.kind === 'file' && (item.type.startsWith('image/') || item.type.startsWith('video/'))) {
          mediaFile = item.getAsFile();
          if (mediaFile) break;
        }
      }
    }

    if (mediaFile) {
      e.preventDefault();
      // Ensure file has a friendly name with appropriate extension
      let finalFile = mediaFile;
      if (!finalFile.name || finalFile.name === 'image.png' || finalFile.name === 'blob') {
        const isVid = finalFile.type.startsWith('video/');
        const ext = finalFile.type.split('/')[1] || (isVid ? 'mp4' : 'png');
        finalFile = new File([mediaFile], `pasted_${Date.now()}.${ext}`, { type: mediaFile.type });
      }

      // WhatsApp-style compress if image is large
      (async () => {
        let fileToUse = finalFile;
        if (finalFile.type.startsWith('image/') && finalFile.size > 500 * 1024) {
          try {
            fileToUse = await compressImageWhatsAppStyle(finalFile);
          } catch (err) {}
        }
        fileToUse._isDocument = false;
        setSelectedFile(fileToUse);
        setFilePreview(URL.createObjectURL(fileToUse));
        const isVideo = fileToUse.type.startsWith('video/');
        toast.success(isVideo ? 'Video pasted from clipboard! 🎥' : 'Image pasted from clipboard! 📸', { duration: 2500 });
      })();
    }
  };

  const userRef = useRef(user);
  const fetchContactsRef = useRef(fetchContacts);
  useEffect(() => {
    userRef.current = user;
    fetchContactsRef.current = fetchContacts;
  });

  // Commit permanent message deletion to socket and database
  const commitDelete = (itemToCommit) => {
    const item = itemToCommit || pendingDeleteRef.current;
    if (!item) return;

    if (pendingDeleteTimeoutRef.current) {
      clearTimeout(pendingDeleteTimeoutRef.current);
      pendingDeleteTimeoutRef.current = null;
    }
    if (pendingDeleteIntervalRef.current) {
      clearInterval(pendingDeleteIntervalRef.current);
      pendingDeleteIntervalRef.current = null;
    }

    pendingDeleteRef.current = null;
    setPendingDelete(null);

    const { message, type, conversationId } = item;
    const messageId = message._id;
    const currentUserId = userRef.current?.id;

    // 1. Socket emit
    socket.emit('delete_message', {
      messageId,
      type,
      userId: currentUserId,
      conversationId
    });

    // 2. REST API persistence
    fetch(`${API_BASE}/api/messages/${messageId}?type=${type}&userId=${currentUserId}`, {
      method: 'DELETE'
    }).catch((err) => {
      console.error('Error committing message deletion:', err);
    });

    // 3. Re-fetch contacts to ensure server-side consistency
    if (fetchContactsRef.current) fetchContactsRef.current();
  };

  // Handle Delete with WhatsApp-style Undo window (5 seconds)
  const handleDeleteMessage = (messageOrId, type = 'me') => {
    let targetMsg = null;
    if (typeof messageOrId === 'object' && messageOrId !== null) {
      targetMsg = messageOrId;
    } else {
      targetMsg = messages.find((m) => String(m._id || m.id) === String(messageOrId));
    }
    if (!targetMsg) return;

    const messageId = targetMsg._id || targetMsg.id;

    // If another deletion was already pending, commit it immediately before starting this one
    if (pendingDeleteRef.current) {
      commitDelete(pendingDeleteRef.current);
    }

    // 1. Optimistic local messages update
    if (type === 'everyone') {
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id || m.id) === String(messageId)
            ? { ...m, isDeleted: true, text: '', attachment: null }
            : m
        )
      );
    } else {
      setMessages((prev) => prev.filter((m) => String(m._id || m.id) !== String(messageId)));
    }
    setActiveMessageMenu(null);
    setDeleteModalMsg(null);

    // 2. Immediately recalculate sidebar snippet for active contact
    if (activeContact) {
      const remainingMessages = messages.filter((m) => String(m._id) !== String(messageId));
      const newLastMsg = remainingMessages.length > 0 ? remainingMessages[remainingMessages.length - 1] : null;

      let displaySnippet = 'Start a conversation';
      if (newLastMsg) {
        if (newLastMsg.isDeleted) displaySnippet = '🚫 This message was deleted';
        else if (newLastMsg.type === 'call_log') displaySnippet = `${newLastMsg.callInfo?.callType === 'video' ? '📹' : '📞'} ${newLastMsg.text || 'Call'}`;
        else if (newLastMsg.type === 'share') displaySnippet = `🔗 Shared ${newLastMsg.share?.type || 'item'}`;
        else if (
          newLastMsg.type === 'voice' || 
          newLastMsg.type === 'audio' || 
          newLastMsg.attachment?.type === 'audio' || 
          newLastMsg.attachment?.name === 'Voice Message' || 
          (typeof newLastMsg.attachment?.name === 'string' && /\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(newLastMsg.attachment.name))
        ) displaySnippet = `🎙️ ${newLastMsg.attachment?.name || 'Voice Message'}`;
        else if (newLastMsg.attachment?.name) displaySnippet = `📄 ${newLastMsg.attachment.name}`;
        else displaySnippet = newLastMsg.text || `[${newLastMsg.type || 'Attachment'}]`;
      }

      setContacts((prev) => prev.map((c) => {
        if (c.clerkId === activeContact.clerkId || c.id === activeContact.clerkId) {
          return {
            ...c,
            lastMessage: displaySnippet,
            lastMessageTime: newLastMsg ? newLastMsg.createdAt : null
          };
        }
        return c;
      }));
    }

    // 3. Store pending delete item for 5-second Undo
    const convId = activeContact?.conversationId || getConvId(user.id, activeContact?.clerkId);
    const newPending = {
      message: { ...targetMsg },
      type,
      conversationId: convId,
      originalIndex: messages.findIndex((m) => String(m._id) === String(messageId))
    };

    pendingDeleteRef.current = newPending;
    setPendingDelete(newPending);
    setUndoSecondsLeft(5);

    // 4. Start 5-second countdown & commit timer
    if (pendingDeleteIntervalRef.current) clearInterval(pendingDeleteIntervalRef.current);
    pendingDeleteIntervalRef.current = setInterval(() => {
      setUndoSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(pendingDeleteIntervalRef.current);
          pendingDeleteIntervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    if (pendingDeleteTimeoutRef.current) clearTimeout(pendingDeleteTimeoutRef.current);
    pendingDeleteTimeoutRef.current = setTimeout(() => {
      commitDelete(newPending);
    }, 5000);
  };

  // Undo Delete: restore the message to the chat
  const handleUndoDelete = () => {
    const item = pendingDeleteRef.current;
    if (!item) return;

    if (pendingDeleteTimeoutRef.current) {
      clearTimeout(pendingDeleteTimeoutRef.current);
      pendingDeleteTimeoutRef.current = null;
    }
    if (pendingDeleteIntervalRef.current) {
      clearInterval(pendingDeleteIntervalRef.current);
      pendingDeleteIntervalRef.current = null;
    }

    const { message, originalIndex } = item;

    // Restore message in messages state
    setMessages((prev) => {
      const targetId = message._id || message.id;
      const exists = prev.some((m) => String(m._id || m.id) === String(targetId));
      if (exists) {
        return prev.map((m) => String(m._id || m.id) === String(targetId) ? message : m);
      }
      const copy = [...prev];
      if (originalIndex >= 0 && originalIndex <= copy.length) {
        copy.splice(originalIndex, 0, message);
      } else {
        copy.push(message);
        copy.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      }
      return copy;
    });

    pendingDeleteRef.current = null;
    setPendingDelete(null);

    // Recalculate sidebar snippet
    fetchContacts();

    toast.success('Message restored');
  };

  // Dismiss Undo banner immediately committing deletion
  const handleDismissUndo = () => {
    if (pendingDeleteRef.current) {
      commitDelete(pendingDeleteRef.current);
    }
  };

  // Commit any pending message deletion ONLY when actually switching to another contact
  const prevContactIdRef = useRef(activeContact?.clerkId);
  useEffect(() => {
    if (prevContactIdRef.current && prevContactIdRef.current !== activeContact?.clerkId) {
      if (pendingDeleteRef.current) {
        commitDelete(pendingDeleteRef.current);
      }
    }
    prevContactIdRef.current = activeContact?.clerkId;
  }, [activeContact?.clerkId]);

  // Commit on window unload & unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingDeleteRef.current) {
        commitDelete(pendingDeleteRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (pendingDeleteRef.current) {
        commitDelete(pendingDeleteRef.current);
      }
    };
  }, []);

  // Copy message text helper
  const copyMessageText = (text) => {
    if (!text) return;
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      toast.success('Copied to clipboard', { icon: '📋' });
    } catch (_) {
      toast.error('Failed to copy');
    }
  };

  // Universal message content extractor
  const getMessageContentToCopy = (msg) => {
    if (!msg || msg.isDeleted) return '';
    if (msg.text && typeof msg.text === 'string' && msg.text.trim()) {
      return msg.text;
    }
    if (msg.attachment?.url) {
      return msg.attachment.url;
    }
    if (msg.audioUrl) {
      return msg.audioUrl;
    }
    if (msg.share?.url) {
      return msg.share.url;
    }
    if (msg.share?.title) {
      return `${msg.share.title}${msg.share.link ? ' - ' + msg.share.link : ''}`;
    }
    if (msg.type === 'call_log') {
      const typeStr = msg.callInfo?.callType === 'video' ? 'Video call' : 'Voice call';
      const timeStr = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      return `${typeStr} • ${timeStr}`;
    }
    return '';
  };

  // Copy any message (text, attachment, link, shared post)
  const copyMessage = (msg) => {
    const textToCopy = getMessageContentToCopy(msg);
    if (!textToCopy) {
      toast.error('Nothing to copy from this message');
      return;
    }
    copyMessageText(textToCopy);
  };

  // Copy selected messages
  const handleCopySelected = () => {
    if (selectedMessageIds.size === 0) return;
    const selectedMsgs = messages.filter((m) => selectedMessageIds.has(m._id));
    const combinedText = selectedMsgs
      .map((m) => getMessageContentToCopy(m))
      .filter(Boolean)
      .join('\n');
    if (combinedText) {
      copyMessageText(combinedText);
      exitSelectMode();
    } else {
      toast.error('Nothing to copy from selected messages');
    }
  };

  // WhatsApp-style Multi-Select Methods
  const toggleSelectMessage = (msgId) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
      } else {
        next.add(msgId);
      }
      return next;
    });
  };

  const startSelectMode = (initialMsgId) => {
    setIsSelectMode(true);
    setSelectedMessageIds(new Set(initialMsgId ? [initialMsgId] : []));
    setActiveMessageMenu(null);
    setContextMenu(null);
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedMessageIds(new Set());
  };

  // Forwarding Methods
  const isMessageForwardable = (msg) => {
    return Boolean(msg && !msg.isDeleted && !(msg.type === 'share' && msg.share?.isDeleted));
  };

  const handleForwardSingle = (msg) => {
    if (!isMessageForwardable(msg)) {
      toast.error('Unavailable posts cannot be forwarded');
      return;
    }
    setMessagesToForward([msg]);
    setForwardModalOpen(true);
    setActiveMessageMenu(null);
    setContextMenu(null);
  };

  const handleForwardSelected = () => {
    const selectedList = messages.filter((m) => selectedMessageIds.has(m._id));
    if (selectedList.length === 0) {
      toast.error('Select at least one message to forward');
      return;
    }
    const forwardableList = selectedList.filter(isMessageForwardable);
    if (forwardableList.length === 0) {
      toast.error('Unavailable posts cannot be forwarded');
      return;
    }
    if (forwardableList.length < selectedList.length) {
      toast('Unavailable posts were excluded from forwarding', { icon: 'ℹ️' });
    }
    setMessagesToForward(forwardableList);
    setForwardModalOpen(true);
  };

  // Forwarding Execution (WhatsApp style: Instant modal close, instant chat switch & optimistic send)
  const handleForwardInitiated = ({ recipientClerkIds, messages: msgsToForward, targetContacts }) => {
    const validMsgs = (msgsToForward || []).filter(isMessageForwardable);
    if (!recipientClerkIds || recipientClerkIds.length === 0 || !validMsgs || validMsgs.length === 0) return;

    // 1. If only 1 recipient is selected, navigate/switch to that contact's chat immediately (like WhatsApp)
    const singleTargetId = recipientClerkIds.length === 1 ? recipientClerkIds[0] : null;
    let targetContact = null;

    if (singleTargetId) {
      targetContact = contacts.find((c) => c.clerkId === singleTargetId || c.id === singleTargetId) || targetContacts?.[0];
      if (targetContact) {
        const currentActiveId = activeContact?.clerkId || activeContact?.id;
        if (currentActiveId !== singleTargetId) {
          setContacts((prev) => {
            if (!prev.some((c) => c.clerkId === singleTargetId || c.id === singleTargetId)) {
              return [targetContact, ...prev];
            }
            return prev;
          });
          setActiveContact(targetContact);
          setIsMobileChatOpen(true);
        }
      }
    }

    const currentChatUser = targetContact || activeContact;
    const currentChatId = currentChatUser?.clerkId || currentChatUser?.id;

    // 2. Optimistically add message(s) directly into the active chat with clock (isUploading: true)
    let optimisticMsgs = [];
    if (currentChatId && recipientClerkIds.includes(currentChatId)) {
      const convId = currentChatUser.conversationId || getConvId(user.id, currentChatId);
      optimisticMsgs = validMsgs.map((m) => ({
        _id: 'temp_fwd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        conversationId: convId,
        senderClerkId: user.id,
        recipientClerkId: currentChatId,
        type: m.type || (m.share ? 'share' : 'text'),
        text: m.text || '',
        attachment: m.attachment || null,
        share: m.share || null,
        callInfo: m.callInfo || null,
        isForwarded: true,
        isUploading: true, // WhatsApp clock icon
        createdAt: new Date().toISOString()
      }));

      setMessages((prev) => [...prev, ...optimisticMsgs]);
    }

    // 3. Update sidebar contacts last message and re-sort
    setContacts((prev) => {
      const firstMsg = validMsgs[0];
      let snippet = firstMsg.text || 'Forwarded message';
      if (firstMsg.type === 'share') snippet = `🔗 Shared ${firstMsg.share?.type || 'item'}`;
      else if (firstMsg.attachment) snippet = `📎 ${firstMsg.attachment.name || 'Attachment'}`;

      return prev.map((c) => {
        if (recipientClerkIds.includes(c.clerkId) || recipientClerkIds.includes(c.id)) {
          return {
            ...c,
            lastMessage: snippet,
            lastMessageTime: new Date().toISOString()
          };
        }
        return c;
      }).sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0));
    });

    // 4. Exit multi-selection mode
    exitSelectMode();

    // 5. Asynchronous background send (user is already in chat watching it send!)
    fetch(`${API_BASE}/api/messages/forward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderClerkId: user.id,
        recipientClerkIds,
        messageIds: validMsgs.map((m) => m._id)
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.messages) {
          // Update optimistic messages to sent (clock icon disappears, checkmark appears)
          setMessages((prev) => {
            let updated = [...prev];
            optimisticMsgs.forEach((tempM, idx) => {
              const saved = data.messages.find(
                (sm) =>
                  sm.recipientClerkId === tempM.recipientClerkId &&
                  (sm.text === tempM.text || sm.type === tempM.type)
              ) || data.messages[idx];
              if (saved) {
                updated = updated.map((m) => (m._id === tempM._id ? saved : m));
              } else {
                updated = updated.map((m) => (m._id === tempM._id ? { ...m, isUploading: false } : m));
              }
            });
            return updated;
          });
          fetchContacts();
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              optimisticMsgs.some((om) => om._id === m._id)
                ? { ...m, isUploading: false, isError: true }
                : m
            )
          );
          toast.error(data.message || 'Failed to forward');
        }
      })
      .catch((err) => {
        console.error('Error in forwarding:', err);
        setMessages((prev) =>
          prev.map((m) =>
            optimisticMsgs.some((om) => om._id === m._id)
              ? { ...m, isUploading: false, isError: true }
              : m
          )
        );
        toast.error('Failed to forward');
      });
  };

  // Bulk Delete Messages
  const handleBulkDeleteConfirm = async (type = 'me') => {
    const ids = Array.from(selectedMessageIds);
    if (ids.length === 0) return;

    try {
      const res = await fetch(`${API_BASE}/api/messages/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          messageIds: ids,
          type
        })
      });

      if (res.ok) {
        if (type === 'everyone') {
          setMessages((prev) =>
            prev.map((m) =>
              ids.includes(m._id) && m.senderClerkId === user.id
                ? { ...m, isDeleted: true, text: '', attachment: null }
                : m
            )
          );
        } else {
          setMessages((prev) => prev.filter((m) => !ids.includes(m._id)));
        }
        toast.success(`Deleted ${ids.length} message${ids.length > 1 ? 's' : ''}`);
        exitSelectMode();
        fetchContacts();
      } else {
        toast.error('Failed to delete messages');
      }
    } catch (err) {
      console.error('Error bulk deleting messages:', err);
      toast.error('Error deleting messages');
    }
    setBulkDeleteModalOpen(false);
  };

  // Mobile Touch Long-Press handlers (tap & hold ~450ms copies message on phone)
  const handleTouchStart = (e, msg) => {
    if (isSelectMode) return;
    if (msg.isDeleted) return;

    isLongPressTriggeredRef.current = false;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(50); } catch (_) {}
      }
      copyMessage(msg);
    }, 450);
  };

  const handleTouchMove = (e) => {
    if (!longPressTimerRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Desktop Right-Click Context Menu handler
  const handleMessageContextMenu = (e, msg) => {
    if (msg.isDeleted) return;
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 190;
    const menuHeight = 250;
    const x = Math.max(10, Math.min(e.clientX, window.innerWidth - menuWidth - 16));
    const y = Math.max(10, Math.min(e.clientY, window.innerHeight - menuHeight - 16));

    setContextMenu({ x, y, message: msg });
    setActiveMessageMenu(null);
  };

  // Block / Unblock Contact
  const toggleBlockContact = async (target = activeContact) => {
    if (!target || !user) return;
    const targetClerkId = target.clerkId || target.id;
    if (!targetClerkId) return;

    try {
      const res = await fetch(`${API_BASE}/api/messages/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockerClerkId: user.id,
          blockedClerkId: targetClerkId
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isBlocked) {
          const updated = [...new Set([...blockedUsers, targetClerkId])];
          setBlockedUsers(updated);
          localStorage.setItem('campusbridge_blocked_users', JSON.stringify(updated));
          toast.error(`Blocked ${target.name || 'User'}`);
        } else {
          const updated = blockedUsers.filter((id) => id !== targetClerkId);
          setBlockedUsers(updated);
          localStorage.setItem('campusbridge_blocked_users', JSON.stringify(updated));
          toast.success(`Unblocked ${target.name || 'User'}`);
        }
      }
    } catch (err) {
      console.error('Error toggling block:', err);
    }
    setShowMoreMenu(false);
    setActiveContactMenu(null);
    setContactContextMenu(null);
  };

  const toggleBlockUser = () => toggleBlockContact(activeContact);

  // Toggle Archive Chat
  const toggleArchiveChat = (contact) => {
    if (!contact) return;
    const id = contact.clerkId || contact.id;
    setArchivedChats((prev) => {
      const isArchived = prev.includes(id);
      const next = isArchived ? prev.filter((c) => c !== id) : [...prev, id];
      localStorage.setItem('cb_archived_chats', JSON.stringify(next));
      toast(isArchived ? `Unarchived ${contact.name}` : `Archived ${contact.name}`, { icon: isArchived ? '📂' : '📦' });
      return next;
    });
    setActiveContactMenu(null);
    setContactContextMenu(null);
  };

  // Toggle Mute Chat
  const toggleMuteChat = (contact) => {
    if (!contact) return;
    const id = contact.clerkId || contact.id;
    setMutedChats((prev) => {
      const isMuted = prev.includes(id);
      const next = isMuted ? prev.filter((c) => c !== id) : [...prev, id];
      localStorage.setItem('cb_muted_chats', JSON.stringify(next));
      toast(isMuted ? `Unmuted notifications for ${contact.name}` : `Muted notifications for ${contact.name}`, { icon: isMuted ? '🔔' : '🔕' });
      return next;
    });
    setActiveContactMenu(null);
    setContactContextMenu(null);
  };

  // Toggle Pin Chat
  const togglePinChat = (contact) => {
    if (!contact) return;
    const id = contact.clerkId || contact.id;
    setPinnedChats((prev) => {
      const isPinned = prev.includes(id);
      const next = isPinned ? prev.filter((c) => c !== id) : [...prev, id];
      localStorage.setItem('cb_pinned_chats', JSON.stringify(next));
      toast(isPinned ? `Unpinned ${contact.name}` : `Pinned ${contact.name} to top`, { icon: '📌' });
      return next;
    });
    setActiveContactMenu(null);
    setContactContextMenu(null);
  };

  // Toggle Mark Unread
  const toggleMarkUnread = (contact) => {
    if (!contact) return;
    const id = contact.clerkId || contact.id;
    setForceUnreadChats((prev) => {
      const isForced = prev.includes(id);
      const isUnread = isForced || (contact.unread > 0);
      let next;
      if (isUnread) {
        // Marking as read
        next = prev.filter((c) => c !== id);
        if (contact.unread > 0) {
          setContacts((contactsList) =>
            contactsList.map((c) =>
              c.clerkId === id || c.id === id ? { ...c, unread: 0 } : c
            )
          );
        }
        toast(`Marked ${contact.name} as read`, { icon: '✉️' });
      } else {
        // Marking as unread
        next = [...prev, id];
        toast(`Marked ${contact.name} as unread`, { icon: '📩' });
      }
      localStorage.setItem('cb_unread_chats', JSON.stringify(next));
      return next;
    });
    setActiveContactMenu(null);
    setContactContextMenu(null);
  };

  // Desktop Right-Click Contact Context Menu handler
  const handleContactContextMenu = (e, contact) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 210;
    const menuHeight = 310;
    const x = Math.max(10, Math.min(e.clientX, window.innerWidth - menuWidth - 16));
    const y = Math.max(10, Math.min(e.clientY, window.innerHeight - menuHeight - 16));

    setContactContextMenu({ x, y, contact });
    setActiveContactMenu(null);
    setContextMenu(null);
  };

  // Contact 3-Dot Button handler (opens floating context menu anchored to button)
  const handleContactThreeDotClick = (e, contact) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 210;
    const menuHeight = 310;
    let x = rect.right - menuWidth;
    if (x < 10) x = 10;
    if (x + menuWidth > window.innerWidth - 10) {
      x = window.innerWidth - menuWidth - 10;
    }

    let y = rect.bottom + 4;
    if (y + menuHeight > window.innerHeight - 10) {
      y = Math.max(10, rect.top - menuHeight - 4);
    }

    setContactContextMenu({ x, y, contact });
    setActiveContactMenu(null);
    setContextMenu(null);
  };

  // Change Theme
  const cycleTheme = () => {
    const nextThemeIndex = (chatThemeIndex + 1) % THEMES.length;
    setChatThemeIndex(nextThemeIndex);
    toast.success(`Theme: ${THEMES[nextThemeIndex].name}`);
    setShowMoreMenu(false);
  };

  // Clear Chat History
  const clearChatHistory = () => {
    setMessages([]);
    toast.success('Chat cleared');
    setShowMoreMenu(false);
  };

  // Voice recording methods
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceStreamRef.current = stream;

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      voiceRecorderRef.current = mediaRecorder;
      voiceChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          voiceChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200);
      setIsVoiceRecording(true);
      setVoiceDuration(0);

      voiceTimerRef.current = setInterval(() => {
        setVoiceDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting voice recording:', err);
      toast.error('Could not access microphone');
    }
  };

  const cancelVoiceRecording = () => {
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    if (voiceRecorderRef.current && voiceRecorderRef.current.state !== 'inactive') {
      voiceRecorderRef.current.stop();
    }
    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach(t => t.stop());
      voiceStreamRef.current = null;
    }
    setIsVoiceRecording(false);
    setVoiceDuration(0);
  };

  const sendVoiceRecording = () => {
    if (!voiceRecorderRef.current) return;
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);

    const recorder = voiceRecorderRef.current;
    const mimeType = recorder.mimeType || 'audio/webm';
    const recordedDuration = Math.max(1, voiceDuration);

    // Immediately close recording UI without any waiting
    setIsVoiceRecording(false);
    setVoiceDuration(0);

    recorder.onstop = async () => {
      if (voiceStreamRef.current) {
        voiceStreamRef.current.getTracks().forEach(t => t.stop());
        voiceStreamRef.current = null;
      }
      const audioBlob = new Blob(voiceChunksRef.current, { type: mimeType });
      if (audioBlob.size < 100) {
        toast.error('Recording too short');
        return;
      }

      const fileExt = mimeType.includes('mp4') ? 'm4a' : 'webm';
      const audioFile = new File([audioBlob], `voice_${Date.now()}.${fileExt}`, { type: mimeType });
      const localBlobUrl = URL.createObjectURL(audioBlob);

      const currentConvId = activeContact.conversationId || getConvId(user.id, activeContact.clerkId);
      const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

      const tempMessage = {
        _id: tempId,
        conversationId: currentConvId,
        senderClerkId: user.id,
        recipientClerkId: activeContact.clerkId,
        text: '',
        type: 'audio',
        attachment: {
          url: localBlobUrl,
          name: 'Voice Message',
          type: 'audio',
          size: audioBlob.size,
          duration: recordedDuration
        },
        createdAt: new Date().toISOString(),
        isRead: false,
        isUploading: true
      };

      // Optimistically add to message thread immediately
      setMessages((prev) => [...prev, tempMessage]);

      // Update contacts sidebar to show voice message immediately
      setContacts((prev) => {
        const updated = prev.map((c) => {
          if (c.clerkId === activeContact.clerkId) {
            return {
              ...c,
              lastMessage: '🎙️ Voice Message',
              lastMessageTime: new Date().toISOString()
            };
          }
          return c;
        });
        return updated.sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0));
      });

      // Background asynchronous upload (WhatsApp style)
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('type', 'auto');

      try {
        const uploadRes = await fetch(`${API_BASE}/api/upload/file`, { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          const realAttachment = {
            url: uploadData.url,
            name: 'Voice Message',
            type: 'audio',
            size: uploadData.size || audioBlob.size,
            duration: recordedDuration
          };

          setMessages((prev) => prev.map((m) => m._id === tempId ? {
            ...m,
            isUploading: false,
            attachment: realAttachment
          } : m));

          socket.emit('send_message', {
            senderClerkId: user.id,
            recipientClerkId: activeContact.clerkId,
            conversationId: currentConvId,
            text: '',
            type: 'audio',
            attachment: realAttachment
          });
        } else {
          setMessages((prev) => prev.map((m) => m._id === tempId ? { ...m, isUploading: false, isError: true } : m));
          toast.error('Failed to upload voice message');
        }
      } catch (err) {
        console.error(err);
        setMessages((prev) => prev.map((m) => m._id === tempId ? { ...m, isUploading: false, isError: true } : m));
        toast.error('Error sending voice message');
      }
    };

    recorder.stop();
  };

  // Delete Person from chat
  const deleteChatPerson = (contactToRemove = activeContact) => {
    if (!contactToRemove) return;
    setPersonToDelete(contactToRemove);
    setShowMoreMenu(false);
    setActiveContactMenu(null);
  };

  const deleteChatPersonConfirm = async () => {
    if (!personToDelete) return;
    try {
      const res = await fetch(`${API_BASE}/api/messages/conversation/${personToDelete.conversationId || getConvId(user.id, personToDelete.clerkId)}?userId=${user.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setContacts((prev) => prev.filter(c => c.clerkId !== personToDelete.clerkId && c.id !== personToDelete.id));
        if (activeContact?.clerkId === personToDelete.clerkId) {
          setActiveContact(null);
          setMessages([]);
        }
        toast.success('Person removed from chat');
      } else {
        toast.error('Failed to remove person');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error removing person');
    }
    setPersonToDelete(null);
  };

  // View Profile
  const viewContactProfile = (contact) => {
    if (!contact) return;
    const profileId = contact.username || contact.clerkId || contact.id;
    if (profileId) {
      navigate(`/profile/${profileId}`);
    }
    setShowMoreMenu(false);
    setActiveContactMenu(null);
    setContactContextMenu(null);
  };

  const viewPartnerProfile = () => viewContactProfile(activeContact);

  const isCurrentPartnerBlocked = activeContact && blockedUsers.includes(activeContact.clerkId);
  const currentTheme = THEMES[chatThemeIndex];

  // Calculate total counts for filter badges
  const unreadCountTotal = contacts.filter((c) => {
    const cId = c.clerkId || c.id;
    return (c.unread > 0 || forceUnreadChats.includes(cId)) && !archivedChats.includes(cId);
  }).length;

  const archivedCountTotal = contacts.filter((c) => {
    const cId = c.clerkId || c.id;
    return archivedChats.includes(cId);
  }).length;

  const filteredContacts = contacts
    .filter((c) => {
      const cId = c.clerkId || c.id;
      const isArchived = archivedChats.includes(cId);
      const isUnread = c.unread > 0 || forceUnreadChats.includes(cId);
      const query = searchQuery.trim().toLowerCase();

      const matchesSearch = !query ||
        c.name?.toLowerCase().includes(query) ||
        c.role?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (query) {
        if (chatFilter === 'archived') return isArchived;
        if (chatFilter === 'unread') return isUnread;
        return true;
      }

      if (chatFilter === 'archived') return isArchived;
      if (chatFilter === 'unread') return isUnread;
      return !isArchived;
    })
    .sort((a, b) => {
      const aId = a.clerkId || a.id;
      const bId = b.clerkId || b.id;
      const aPinned = pinnedChats.includes(aId) ? 1 : 0;
      const bPinned = pinnedChats.includes(bId) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return 0;
    });

  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full h-full max-w-full min-w-0 flex flex-1 bg-card border-0 overflow-hidden">
      
      {/* Left Contacts Sidebar */}
      <div className={`w-full max-w-full min-w-0 md:w-72 lg:w-80 xl:w-96 border-r border-border/40 flex-col h-full bg-card shrink-0 ${activeContact && isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-foreground">Chat with anyone</h2>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border/50 rounded-xl focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground transition-all"
            />
          </div>

          {/* Filter Pills: All / Unread / Archived */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setChatFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                chatFilter === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setChatFilter('unread')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                chatFilter === 'unread'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <span>Unread</span>
              {unreadCountTotal > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  chatFilter === 'unread' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary text-primary-foreground'
                }`}>
                  {unreadCountTotal}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setChatFilter('archived')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                chatFilter === 'archived'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Archive className="w-3 h-3" />
              <span>Archived</span>
              {archivedCountTotal > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  chatFilter === 'archived' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'
                }`}>
                  {archivedCountTotal}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-border/30">
          {isLoadingContacts ? (
            <div className="flex flex-col">
              {[...Array(6)].map((_, i) => (
                <MessageSkeleton key={i} variant="contact" />
              ))}
            </div>
          ) : filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => {
              const cId = contact.clerkId || contact.id;
              const isActive = activeContact?.clerkId === contact.clerkId || activeContact?.id === contact.id;
              const isBlocked = blockedUsers.includes(contact.clerkId) || blockedUsers.includes(contact.id);
              const isContactOnline = onlineUsers.includes(contact.clerkId) || onlineUsers.includes(contact.id) || onlineUsers.includes(contact._id);
              const isPinned = pinnedChats.includes(cId);
              const isMuted = mutedChats.includes(cId);
              const isArchived = archivedChats.includes(cId);
              const isUnread = (contact.unread > 0) || forceUnreadChats.includes(cId);
              const roleTag = (contact.userRole || (contact.role?.toLowerCase().includes('mentor') ? 'mentor' : 'student')).toLowerCase();

              return (
                <div
                  key={cId}
                  onContextMenu={(e) => handleContactContextMenu(e, contact)}
                  onClick={() => {
                    if (contact.unread > 0 || forceUnreadChats.includes(cId)) {
                      const unreadCount = contact.unread || 0;
                      setContacts((prev) =>
                        prev.map((c) =>
                          c.clerkId === contact.clerkId || c.id === contact.id ? { ...c, unread: 0 } : c
                        )
                      );
                      if (forceUnreadChats.includes(cId)) {
                        setForceUnreadChats((prev) => {
                          const next = prev.filter((id) => id !== cId);
                          localStorage.setItem('cb_unread_chats', JSON.stringify(next));
                          return next;
                        });
                      }
                      if (unreadCount > 0) {
                        window.dispatchEvent(
                          new CustomEvent('campusbridge:messages_read', {
                            detail: { conversationId: contact.conversationId, count: unreadCount, userId: user.id }
                          })
                        );
                      }
                    }
                    const currentActiveId = activeContactRef.current?.clerkId || activeContactRef.current?.id;
                    const targetId = contact.clerkId || contact.id;
                    if (currentActiveId !== targetId) {
                      setActiveContact(contact);
                    }
                    setIsMobileChatOpen(true);
                  }}
                  className={`group p-3.5 sm:p-4 cursor-pointer transition-colors flex items-center gap-3.5 relative ${
                    isActive ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-muted/40 border-l-4 border-l-transparent'
                  }`}
                  onMouseLeave={() => setActiveContactMenu(null)}
                >
                  <div className="relative shrink-0">
                    {contact.image ? (
                      <img
                        src={contact.image}
                        alt={contact.name}
                        className="w-12 h-12 rounded-full object-cover border border-border/50"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full border border-border/50 bg-muted flex items-center justify-center">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-card ${
                      isContactOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-400'
                    }`} title={isContactOnline ? 'Online' : 'Offline'} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <h4 className={`font-semibold text-sm truncate ${isUnread ? 'text-foreground font-bold' : 'text-foreground/90'}`}>
                          {contact.name}
                        </h4>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 tracking-tight leading-none ${getRoleBadgeClasses(roleTag)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            formatRoleBadge(roleTag) === 'Mentor' ? 'bg-purple-400' :
                            formatRoleBadge(roleTag) === 'Alumni' ? 'bg-amber-400' :
                            formatRoleBadge(roleTag) === 'Admin' ? 'bg-rose-400' : 'bg-blue-400'
                          }`} />
                          {formatRoleBadge(roleTag)}
                        </span>
                        {isPinned && (
                          <span title="Pinned to top" className="inline-flex items-center text-amber-500 shrink-0">
                            <Pin className="w-3 h-3 fill-amber-500/20 rotate-45" />
                          </span>
                        )}
                        {isMuted && (
                          <span title="Notifications muted" className="inline-flex items-center text-muted-foreground shrink-0">
                            <BellOff className="w-3 h-3" />
                          </span>
                        )}
                        {isArchived && (
                          <span className="text-[9px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-1.5 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-0.5">
                            <Archive className="w-2.5 h-2.5" /> Archived
                          </span>
                        )}
                        {isBlocked && (
                          <span className="text-[9px] bg-red-500/15 text-red-500 border border-red-500/25 px-1.5 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-0.5">
                            <Ban className="w-2.5 h-2.5" /> Blocked
                          </span>
                        )}
                      </div>
                      {contact.lastMessageTime && (
                        <span className={`text-[10px] shrink-0 ml-1 ${isUnread ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                          {formatMessageTime(contact.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs truncate flex-1 ${isUnread ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                        {isBlocked ? 'User is blocked' : contact.lastMessage}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isUnread && !isBlocked && (
                          <span className="bg-primary text-primary-foreground text-[10px] font-bold min-w-5 h-5 px-1.5 rounded-full shrink-0 flex items-center justify-center animate-pulse">
                            {contact.unread > 0 ? contact.unread : '•'}
                          </span>
                        )}
                        {/* 3-dot trigger button */}
                        <button
                          type="button"
                          onClick={(e) => handleContactThreeDotClick(e, contact)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            handleContactThreeDotClick(e, contact);
                          }}
                          className="contact-menu-trigger p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                          title="Chat options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground space-y-2">
              {chatFilter === 'archived' ? (
                <>
                  <Archive className="w-8 h-8 mx-auto opacity-40 text-indigo-400" />
                  <p className="text-sm font-medium">No archived conversations</p>
                  <p className="text-xs text-muted-foreground">Conversations you archive will appear here.</p>
                </>
              ) : chatFilter === 'unread' ? (
                <>
                  <MailOpen className="w-8 h-8 mx-auto opacity-40 text-emerald-400" />
                  <p className="text-sm font-medium">No unread conversations</p>
                  <p className="text-xs text-muted-foreground">You are all caught up!</p>
                </>
              ) : (
                <>
                  <MessageSquare className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-sm font-medium">No active conversations</p>
                  <p className="text-xs text-muted-foreground">Connect with mentors or mentees to start chatting!</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Chat Area */}
      {activeContact ? (
        <div className={`flex-1 flex-col h-full w-full max-w-full min-w-0 overflow-hidden ${currentTheme.bg} transition-colors duration-300 relative ${isMobileChatOpen ? 'flex' : 'hidden md:flex'}`}>
          {/* Header */}
          {isSelectMode ? (
            <div className="h-16 px-3 sm:px-6 border-b border-border/40 flex items-center justify-between bg-card/95 backdrop-blur z-20 shrink-0 w-full animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={exitSelectMode}
                  className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Cancel Selection"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="font-bold text-foreground text-sm sm:text-base">
                  {selectedMessageIds.size} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySelected}
                  disabled={selectedMessageIds.size === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  title="Copy Selected"
                >
                  <Copy className="w-4 h-4 text-blue-500" />
                  <span className="hidden sm:inline">Copy</span>
                </button>
                <button
                  onClick={handleForwardSelected}
                  disabled={selectedMessageIds.size === 0}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  title="Forward Selected"
                >
                  <Forward className="w-4 h-4" />
                  <span className="hidden sm:inline">Forward</span>
                </button>
                <button
                  onClick={() => setBulkDeleteModalOpen(true)}
                  disabled={selectedMessageIds.size === 0}
                  className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Delete Selected"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-16 px-3 sm:px-6 border-b border-border/40 flex items-center justify-between bg-card/90 backdrop-blur z-20 shrink-0 relative w-full max-w-full min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0 flex-1 mr-2" onClick={viewPartnerProfile}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsMobileChatOpen(false); }}
                  className="md:hidden p-2 -ml-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                </button>

                <div className="relative shrink-0">
                  {activeContact.image ? (
                    <img
                      src={activeContact.image}
                      alt={activeContact.name}
                      className="w-10 h-10 rounded-full object-cover border border-border/50"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full border border-border/50 bg-muted flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                    (onlineUsers.includes(activeContact.clerkId) || onlineUsers.includes(activeContact.id) || onlineUsers.includes(activeContact._id)) ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-400'
                  }`} />
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
                    <span className="truncate">{activeContact.name}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 tracking-tight leading-none ${getRoleBadgeClasses(activeContact.userRole || activeContact.role)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        formatRoleBadge(activeContact.userRole || activeContact.role) === 'Mentor' ? 'bg-purple-400' :
                        formatRoleBadge(activeContact.userRole || activeContact.role) === 'Alumni' ? 'bg-amber-400' :
                        formatRoleBadge(activeContact.userRole || activeContact.role) === 'Admin' ? 'bg-rose-400' : 'bg-blue-400'
                      }`} />
                      {formatRoleBadge(activeContact.userRole || activeContact.role)}
                    </span>
                    {isCurrentPartnerBlocked && <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full font-medium shrink-0">Blocked</span>}
                  </h3>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0 truncate">
                    {isOtherTyping ? (
                      <span className="text-primary font-semibold animate-pulse truncate">typing...</span>
                    ) : (
                      <div className="truncate flex items-center gap-1.5 min-w-0">
                        {(onlineUsers.includes(activeContact.clerkId) || onlineUsers.includes(activeContact.id) || onlineUsers.includes(activeContact._id)) ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold shrink-0"><Circle className="w-2 h-2 fill-current text-emerald-400" /> Online</span>
                        ) : (
                          <span className="flex items-center gap-1 text-muted-foreground shrink-0"><Circle className="w-2 h-2 fill-current text-slate-500" /> Offline</span>
                        )}
                        <span className="shrink-0">&bull;</span>
                        <span className="truncate">{formatRoleSubtitle(activeContact.headline, activeContact.role || activeContact.userRole)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground shrink-0">
                <button 
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('initiate_call', {
                      detail: { targetPartner: activeContact, type: 'audio' }
                    }));
                  }}
                  className="p-2 rounded-lg hover:bg-muted hover:text-foreground transition-colors" 
                  title="Audio Call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('initiate_call', {
                      detail: { targetPartner: activeContact, type: 'video' }
                    }));
                  }}
                  className="p-2 rounded-lg hover:bg-muted hover:text-foreground transition-colors" 
                  title="Video Call"
                >
                  <Video className="w-4 h-4" />
                </button>

                {/* 3-Dots Dropdown Menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="p-2 rounded-lg hover:bg-muted hover:text-foreground transition-colors"
                    title="Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showMoreMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border/60 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                      <button
                        onClick={viewPartnerProfile}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-primary" /> View Profile
                      </button>
                      {(() => {
                        const targetId = activeContact?.clerkId || activeContact?.id;
                        const isPinned = pinnedChats.includes(targetId);
                        const isMuted = mutedChats.includes(targetId);
                        const isArchived = archivedChats.includes(targetId);
                        return (
                          <>
                            <button
                              onClick={() => {
                                togglePinChat(activeContact);
                                setShowMoreMenu(false);
                              }}
                              className="w-full px-4 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              {isPinned ? <PinOff className="w-3.5 h-3.5 text-amber-500" /> : <Pin className="w-3.5 h-3.5 text-amber-500" />}
                              {isPinned ? 'Unpin Chat' : 'Pin to Top'}
                            </button>
                            <button
                              onClick={() => {
                                toggleMuteChat(activeContact);
                                setShowMoreMenu(false);
                              }}
                              className="w-full px-4 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              {isMuted ? <Bell className="w-3.5 h-3.5 text-blue-500" /> : <BellOff className="w-3.5 h-3.5 text-blue-500" />}
                              {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                            </button>
                            <button
                              onClick={() => {
                                toggleArchiveChat(activeContact);
                                setShowMoreMenu(false);
                              }}
                              className="w-full px-4 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              {isArchived ? <ArchiveRestore className="w-3.5 h-3.5 text-indigo-500" /> : <Archive className="w-3.5 h-3.5 text-indigo-500" />}
                              {isArchived ? 'Unarchive Chat' : 'Archive Chat'}
                            </button>
                          </>
                        );
                      })()}
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          setIsSelectMode(true);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-400" /> Select Messages
                      </button>
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          setIsShareProfileModalOpen(true);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-emerald-400" /> Share Profile to Chat
                      </button>
                      <button
                        onClick={cycleTheme}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors"
                      >
                        <Palette className="w-3.5 h-3.5 text-purple-400" /> Change Theme ({currentTheme.name})
                      </button>
                      <button
                        onClick={clearChatHistory}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-amber-400" /> Clear Chat History
                      </button>
                      <button
                        onClick={() => { setShowMoreMenu(false); setIsExportModalOpen(true); }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-500" /> Export Chat (.txt, .pdf, .doc)
                      </button>
                      <button
                        onClick={deleteChatPerson}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
                      >
                        <UserX className="w-3.5 h-3.5 text-red-500" /> Delete Person
                      </button>
                      <div className="border-t border-border/40 my-1"></div>
                      <button
                        onClick={toggleBlockUser}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5 text-red-500" /> {isCurrentPartnerBlocked ? 'Unblock User' : 'Block User'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Block Banner Alert */}
          {isCurrentPartnerBlocked && (
            <div className="bg-red-500/15 border-b border-red-500/20 px-6 py-2 flex items-center justify-between text-xs text-red-500 font-medium z-10">
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> You have blocked this user.
              </span>
              <button onClick={toggleBlockUser} className="underline font-bold hover:text-red-400">
                Unblock
              </button>
            </div>
          )}

          {/* Chat Messages */}
          <div onPaste={handlePasteMedia} tabIndex={0} className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 custom-scrollbar w-full min-w-0 focus:outline-none">
            {isLoadingMessages ? (
              <MessageSkeleton variant="chat" />
            ) : messages.length > 0 ? (
              messages.map((msg, index) => {
                const isMe = msg.senderClerkId === user?.id;
                
                const currentMsgDate = new Date(msg.createdAt).toDateString();
                const prevMsgDate = index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null;
                const showDateSeparator = currentMsgDate !== prevMsgDate;

                const renderDateSeparator = showDateSeparator && (
                  <div className="flex justify-center my-4">
                    <span className="bg-muted text-muted-foreground text-[10px] sm:text-xs font-semibold px-3 py-1 rounded-full shadow-sm border border-border/50">
                      {formatMessageDateSeparator(msg.createdAt)}
                    </span>
                  </div>
                );
                
                // Never display duplicate text bubbles for calls (only show the red/call_log card)
                if (msg.type !== 'call_log' && typeof msg.text === 'string') {
                  const t = msg.text.trim().toLowerCase();
                  if (
                    t === 'missed video call' ||
                    t === 'missed voice call' ||
                    t === 'declined video call' ||
                    t === 'declined voice call' ||
                    t.startsWith('video call •') ||
                    t.startsWith('voice call •')
                  ) {
                    return null;
                  }
                }

                if (msg.type === 'call_log') {
                  const isMissed = msg.callInfo?.status === 'missed' || msg.callInfo?.status === 'rejected';
                  return (
                    <React.Fragment key={msg._id || Math.random()}>
                      {renderDateSeparator}
                      <div 
                        onContextMenu={(e) => handleMessageContextMenu(e, msg)}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                      >
                        <div className={`flex items-start gap-1.5 sm:gap-2 max-w-[92%] sm:max-w-[80%] md:max-w-[65%] lg:max-w-[50%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Call Log Context Menu */}
                          <div className={`relative opacity-50 hover:opacity-100 transition-opacity flex items-center ${isMe ? 'pr-2' : 'pl-2'} mt-2`}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setActiveMessageMenu(activeMessageMenu === msg._id ? null : msg._id); }} 
                              className="message-menu-trigger p-1 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 pointer-events-none" />
                            </button>
                            {activeMessageMenu === msg._id && (
                              <div className={`message-context-menu absolute ${isMe ? 'right-8' : 'left-8'} top-0 w-36 bg-card border border-border/60 rounded-xl shadow-lg py-1 z-30`}>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setDeleteModalMsg(msg); setActiveMessageMenu(null); }} 
                                  className="w-full px-3 py-2 text-left text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            )}
                          </div>

                          <div className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-2xl border text-xs shadow-sm ${
                            isMe
                              ? 'bg-purple-500/10 dark:bg-purple-950/40 border-purple-500/30 text-purple-800 dark:text-purple-200'
                              : isMissed
                              ? 'bg-red-500/10 dark:bg-red-950/40 border-red-500/30 text-red-600 dark:text-red-400'
                              : 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            <div className={`p-2.5 rounded-full shrink-0 ${
                              isMe
                                ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300'
                                : isMissed
                                ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {msg.callInfo?.callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-xs sm:text-sm truncate ${
                                isMe
                                  ? 'text-purple-800 dark:text-purple-200'
                                  : isMissed
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-foreground'
                              }`}>{msg.text}</p>
                              <span className={`text-[10px] ${
                                isMe
                                  ? 'text-purple-700/80 dark:text-purple-300/70'
                                  : isMissed
                                  ? 'text-red-500/80 dark:text-red-400/70'
                                  : 'text-muted-foreground'
                              }`}>{formatMessageTime(msg.createdAt)}</span>
                            </div>
                            <button
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('initiate_call', {
                                  detail: { targetPartner: activeContact, type: msg.callInfo?.callType || 'video' }
                                }));
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer shadow-xs ${
                                isMe
                                  ? 'bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500/30 dark:hover:bg-purple-500/50 dark:text-purple-100 border border-purple-600 dark:border-purple-400/40'
                                  : 'bg-background border border-border/60 hover:bg-muted text-foreground'
                              }`}
                            >
                              {isMe ? 'Call Again' : 'Call Back'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                }

                const isSelected = selectedMessageIds.has(msg._id);

                return (
                  <React.Fragment key={msg._id || Math.random()}>
                    {renderDateSeparator}
                    <div 
                      onContextMenu={(e) => handleMessageContextMenu(e, msg)}
                      onTouchStart={(e) => handleTouchStart(e, msg)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onClick={(e) => {
                        if (isSelectMode) {
                          e.stopPropagation();
                          toggleSelectMessage(msg._id);
                        }
                      }}
                      className={`flex items-center gap-2 ${isMe ? 'justify-end' : 'justify-start'} group transition-colors rounded-2xl ${
                        isSelectMode ? 'cursor-pointer p-1.5 hover:bg-muted/30 select-none' : ''
                      } ${isSelected ? 'bg-primary/10' : ''}`}
                    >
                      {/* WhatsApp-style Selection Checkbox */}
                      {isSelectMode && (
                        <div className={`shrink-0 flex items-center justify-center ${isMe ? 'order-last pl-1' : 'order-first pr-1'}`}>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground scale-105 shadow-xs'
                              : 'border-muted-foreground/40 bg-card hover:border-primary/60'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      )}

                      <div className={`flex items-start gap-1.5 sm:gap-2 max-w-[92%] sm:max-w-[80%] md:max-w-[65%] lg:max-w-[50%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Message Bubble Context Menu */}
                      {!isSelectMode && (
                        <div className={`relative opacity-50 hover:opacity-100 transition-opacity flex items-center ${isMe ? 'pr-2' : 'pl-2'} mt-2`}>
                          <button onClick={(e) => { e.stopPropagation(); setActiveMessageMenu(activeMessageMenu === msg._id ? null : msg._id); }} className="message-menu-trigger p-1 hover:bg-muted rounded-full text-muted-foreground transition-colors cursor-pointer">
                            <MoreVertical className="w-4 h-4 pointer-events-none" />
                          </button>
                          {activeMessageMenu === msg._id && (
                            <div className={`message-context-menu absolute ${isMe ? 'right-8' : 'left-8'} top-0 w-44 bg-card border border-border/60 rounded-xl shadow-lg py-1 z-30`}>
                              {!msg.isDeleted && (
                                <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); setActiveMessageMenu(null); }} className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2 cursor-pointer">
                                  <Reply className="w-3.5 h-3.5 text-primary" /> Reply
                                </button>
                              )}
                              {isMessageForwardable(msg) && (
                                <button onClick={(e) => { e.stopPropagation(); handleForwardSingle(msg); }} className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2 cursor-pointer">
                                  <Forward className="w-3.5 h-3.5 text-emerald-500" /> Forward
                                </button>
                              )}
                              {!msg.isDeleted && (
                                <button onClick={(e) => { e.stopPropagation(); copyMessage(msg); setActiveMessageMenu(null); }} className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2 cursor-pointer">
                                  <Copy className="w-3.5 h-3.5 text-blue-500" /> Copy
                                </button>
                              )}
                              {!msg.isDeleted && (
                                <button onClick={(e) => { e.stopPropagation(); startSelectMode(msg._id); }} className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2 cursor-pointer">
                                  <CheckSquare className="w-3.5 h-3.5 text-indigo-500" /> Select
                                </button>
                              )}
                              {isMe && !msg.isDeleted && msg.type === 'text' && (
                                <button onClick={(e) => { e.stopPropagation(); setEditingMessage(msg); setInputText(msg.text); setActiveMessageMenu(null); }} className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2 cursor-pointer">
                                  <Edit2 className="w-3.5 h-3.5 text-amber-500" /> Edit
                                </button>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); setDeleteModalMsg(msg); setActiveMessageMenu(null); }} className="w-full px-3 py-2 text-left text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} min-w-0 max-w-full`}>
                        <div
                          onContextMenu={(e) => handleMessageContextMenu(e, msg)}
                          className={`${
                            (!msg.text && msg.attachment?.type === 'image') ? 'p-1' : 'px-3.5 py-2 sm:px-4 sm:py-2.5'
                          } rounded-2xl text-sm shadow-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] flex flex-col max-w-full ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-card border border-border/50 text-foreground rounded-tl-sm'
                          } ${msg.isDeleted ? 'italic text-muted-foreground bg-transparent border border-border/50 shadow-none' : ''} ${
                            isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                          }`}
                        >
                          {msg.isDeleted ? (
                            <span className="flex items-center gap-1.5"><Ban className="w-3.5 h-3.5" /> This message was deleted</span>
                          ) : (
                            <>
                              {/* WhatsApp-style Forwarded indicator */}
                              {msg.isForwarded && (
                                <div className={`flex items-center gap-1.5 text-[11px] font-medium italic mb-1.5 select-none ${
                                  isMe ? 'text-primary-foreground/85' : 'text-muted-foreground'
                                }`}>
                                  <CornerUpRight className="w-3.5 h-3.5 inline-block shrink-0 stroke-[2.2]" />
                                  <span>Forwarded</span>
                                </div>
                              )}
                              {/* Reply Snippet */}
                              {msg.replyTo && (
                                <div className={`mb-2 p-2 rounded-lg text-xs border-l-2 flex flex-col gap-0.5 opacity-90 ${isMe ? 'bg-black/10 border-white' : 'bg-muted/50 border-primary'}`}>
                                  <span className="font-bold">{msg.replyTo.senderName}</span>
                                  <span className="truncate max-w-[200px] sm:max-w-[300px]">{msg.replyTo.text}</span>
                                </div>
                              )}

                              {/* Attachment Rendering */}
                              {msg.attachment && (
                                <div className="mb-2">
                                  {msg.attachment.type === 'image' ? (
                                    <div 
                                      onClick={() => {
                                        if (isSelectMode) return;
                                        setFullscreenAttachment({ url: msg.attachment.url, type: 'image' });
                                      }} 
                                      className="cursor-pointer relative overflow-hidden rounded-xl"
                                    >
                                      <img src={msg.attachment.url} alt="attachment" className={`rounded-xl max-h-60 w-auto object-cover hover:opacity-90 transition-opacity ${msg.isUploading ? 'opacity-75 blur-[0.5px]' : ''}`} />
                                      {msg.isUploading && (
                                        <div className="absolute inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center">
                                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                                        </div>
                                      )}
                                    </div>
                                  ) : msg.attachment.type === 'video' ? (
                                    <div className="relative rounded-xl overflow-hidden">
                                      <video src={msg.attachment.url} controls className="rounded-xl max-h-60 w-auto" />
                                      {msg.isUploading && (
                                        <div className="absolute inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center pointer-events-none">
                                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    msg.attachment.type === 'audio' || 
                                    msg.type === 'audio' || 
                                    (typeof msg.attachment?.url === 'string' && /\.(webm|mp3|wav|ogg|m4a|aac)(\?.*)?$/i.test(msg.attachment.url)) ||
                                    (typeof msg.attachment?.name === 'string' && /\.(webm|mp3|wav|ogg|m4a|aac)$/i.test(msg.attachment.name))
                                  ) ? (
                                    <AudioPlayerWidget 
                                      src={msg.attachment.url} 
                                      variant="bubble" 
                                      title="Voice Message" 
                                      duration={msg.attachment?.duration || msg.attachment?.durationSecs}
                                      isMe={isMe}
                                      userAvatar={isMe ? (user.imageUrl || null) : (activeContact.image || null)}
                                      senderName={isMe ? 'You' : (activeContact.name || 'User')}
                                      className={isMe ? 'bg-primary-foreground/15 border-white/20 text-white' : ''}
                                    />
                                  ) : (
                                    <div 
                                      onClick={() => {
                                        if (isSelectMode) return;
                                        setFullscreenAttachment({ url: msg.attachment.url, type: 'document' });
                                      }} 
                                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${isMe ? 'bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20' : 'bg-muted/50 border-border/50 hover:bg-muted'} transition-colors relative`}
                                    >
                                      <div className="p-2 bg-background/50 rounded-lg shrink-0">
                                        {msg.isUploading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <FileText className="w-5 h-5" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate" title={msg.attachment.name}>{msg.attachment.name}</p>
                                        <p className="text-[10px] opacity-70 mt-0.5">{(msg.attachment.size / 1024).toFixed(1)} KB {msg.isUploading && '• Uploading...'}</p>
                                      </div>
                                      <Eye className="w-4 h-4 shrink-0 opacity-70" />
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Share Rendering */}
                              {msg.type === 'share' && msg.share && (
                                msg.share.isDeleted ? (
                                  /* Deleted / Unavailable Post Card */
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toast('This post was deleted and is no longer available.', { icon: 'ℹ️' });
                                    }}
                                    className={`mb-2 rounded-2xl border transition-all overflow-hidden w-full max-w-[280px] sm:max-w-xs shadow-sm p-3.5 select-none ${
                                      isMe 
                                        ? 'bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground' 
                                        : 'bg-muted/40 border-border/70 text-muted-foreground'
                                    }`}
                                    title="This post has been deleted"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                        isMe ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-muted-foreground/15 text-muted-foreground'
                                      }`}>
                                        <Trash2 className="w-4 h-4 opacity-80" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold leading-tight flex items-center gap-1.5">
                                          <span>Post unavailable</span>
                                        </p>
                                        <p className="text-[11px] opacity-75 mt-0.5 leading-snug">
                                          This post was deleted
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div 
                                    onClick={(e) => {
                                      if (isSelectMode) {
                                        e.stopPropagation();
                                        toggleSelectMessage(msg._id);
                                        return;
                                      }
                                      if (msg.share.type === 'profile') {
                                        navigate(`/profile/${msg.share.itemId}`);
                                      } else {
                                        navigate(`?${msg.share.type}=${msg.share.itemId}`);
                                      }
                                    }}
                                    className={`mb-2 rounded-2xl border cursor-pointer hover:opacity-95 transition-all overflow-hidden w-full max-w-[280px] sm:max-w-xs shadow-md group ${
                                      isMe 
                                        ? 'bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/15 text-primary-foreground' 
                                        : 'bg-card border-border/80 hover:border-primary/40 text-card-foreground'
                                    }`}
                                  >
                                    {msg.share.type === 'post' ? (
                                      /* Instagram-Style Post Share Card */
                                      <div className="flex flex-col">
                                        {/* Creator Header */}
                                        <div className={`flex items-center gap-2 px-3 py-2 border-b text-xs ${
                                          isMe ? 'border-primary-foreground/15 bg-primary-foreground/5' : 'border-border/40 bg-muted/30'
                                        }`}>
                                          {msg.share.authorAvatar ? (
                                            <img 
                                              src={msg.share.authorAvatar} 
                                              alt={msg.share.authorName || 'Author'} 
                                              className="w-5 h-5 rounded-full object-cover shrink-0 border border-border/40" 
                                            />
                                          ) : (
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                              isMe ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/20 text-primary'
                                            }`}>
                                              {(msg.share.authorName || msg.share.title || 'U').charAt(0).toUpperCase()}
                                            </div>
                                          )}
                                          <span className="font-semibold truncate flex-1 text-xs">
                                            {msg.share.authorName || msg.share.title || 'Post'}
                                          </span>
                                          <span className={`text-[10px] uppercase font-bold tracking-wider opacity-75`}>
                                            Post
                                          </span>
                                        </div>

                                        {/* Post Media Thumbnail */}
                                        <SharedPostThumbnail 
                                          share={msg.share} 
                                          onPostUnavailable={() => {
                                            setMessages((prev) =>
                                              prev.map((m) =>
                                                String(m._id) === String(msg._id) && m.share
                                                  ? { ...m, share: { ...m.share, isDeleted: true } }
                                                  : m
                                              )
                                            );
                                          }}
                                        />

                                        {/* Post Content / Caption */}
                                        {msg.share.description && (
                                          <div className="px-3 pt-2 pb-1.5">
                                            <p className="text-xs line-clamp-2 leading-relaxed opacity-90 font-normal">
                                              {msg.share.description}
                                            </p>
                                          </div>
                                        )}

                                        {/* Footer Action */}
                                        <div className={`flex items-center justify-between px-3 py-2 border-t text-xs font-semibold ${
                                          isMe ? 'border-primary-foreground/15 text-primary-foreground' : 'border-border/40 text-primary'
                                        }`}>
                                          <span>View Post</span>
                                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                      </div>
                                    ) : msg.share.type === 'event' ? (
                                      /* Rich Event / Hackathon Share Card */
                                      <div className="flex flex-col">
                                        {/* Event Header */}
                                        <div className={`flex items-center gap-2 px-3 py-2 border-b text-xs ${
                                          isMe ? 'border-primary-foreground/15 bg-primary-foreground/5' : 'border-border/40 bg-muted/30'
                                        }`}>
                                          <div className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                            isMe ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/20 text-primary'
                                          }`}>
                                            <Calendar className="w-3 h-3" />
                                          </div>
                                          <span className="font-semibold truncate flex-1 text-xs">
                                            {msg.share.title || 'Event / Hackathon'}
                                          </span>
                                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                                            Event
                                          </span>
                                        </div>

                                        {/* Event Media / Poster Thumbnail */}
                                        <SharedEventThumbnail share={msg.share} />

                                        {/* Event Content / Details */}
                                        {(msg.share.title || msg.share.description) && (
                                          <div className="px-3 pt-2 pb-1.5 flex flex-col gap-0.5">
                                            {msg.share.title && (
                                              <p className="text-xs font-bold truncate">
                                                {msg.share.title}
                                              </p>
                                            )}
                                            {msg.share.description && (
                                              <p className="text-[11px] line-clamp-2 leading-relaxed opacity-85">
                                                {msg.share.description}
                                              </p>
                                            )}
                                          </div>
                                        )}

                                        {/* Footer Action */}
                                        <div className={`flex items-center justify-between px-3 py-2 border-t text-xs font-semibold ${
                                          isMe ? 'border-primary-foreground/15 text-primary-foreground' : 'border-border/40 text-primary'
                                        }`}>
                                          <span>View Event</span>
                                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                      </div>
                                    ) : (
                                    /* Profile, Job Share Card */
                                    <div className="p-3 sm:p-3.5 flex flex-col gap-2">
                                      <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl shrink-0 ${isMe ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                                          {msg.share.type === 'profile' ? <User className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? 'opacity-80' : 'text-primary'}`}>
                                            Shared {msg.share.type}
                                          </span>
                                          {msg.share.title && <p className="text-sm font-bold truncate mt-0.5">{msg.share.title}</p>}
                                          {msg.share.description && <p className="text-xs opacity-80 truncate">{msg.share.description}</p>}
                                        </div>
                                        {msg.share.imageUrl ? (
                                          <img 
                                            src={msg.share.imageUrl} 
                                            alt="preview" 
                                            className={`w-12 h-12 object-cover shrink-0 border border-border/40 ${
                                              msg.share.type === 'profile' ? 'rounded-full shadow-sm' : 'rounded-xl'
                                            }`} 
                                          />
                                        ) : msg.share.type === 'profile' ? (
                                          <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                                            {(msg.share.title || 'U').charAt(0).toUpperCase()}
                                          </div>
                                        ) : null}
                                      </div>

                                      <div className={`flex items-center justify-between pt-1.5 border-t text-xs font-semibold ${
                                        isMe ? 'border-primary-foreground/15 text-primary-foreground/90' : 'border-border/40 text-primary'
                                      }`}>
                                        <span>View {msg.share.type === 'profile' ? 'Profile' : msg.share.type.charAt(0).toUpperCase() + msg.share.type.slice(1)}</span>
                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            )}

                              <div className="flex items-end gap-2">
                                <span>{msg.text}</span>
                                {msg.isEdited && <span className="text-[10px] opacity-60 mb-0.5">(edited)</span>}
                              </div>
                            </>
                          )}
                        </div>
                        <div className={`text-[10px] text-muted-foreground mt-1 flex items-center gap-1`}>
                          <span>{formatMessageTime(msg.createdAt)}</span>
                          {isMe && (
                            msg.isUploading ? (
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/80 font-medium" title="Sending...">
                                <Clock className="w-3.5 h-3.5 animate-pulse text-muted-foreground" />
                              </span>
                            ) : msg.isError ? (
                              <span className="flex items-center gap-0.5 text-red-500 text-[10px] font-medium" title="Failed to send">
                                <AlertCircle className="w-3.5 h-3.5" />
                              </span>
                            ) : msg.isRead || msg.isDelivered ? (
                              <CheckCheck className={`w-3.5 h-3.5 ${msg.isRead ? 'text-blue-500' : 'text-muted-foreground/60'}`} />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-muted-foreground/60" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm font-medium">Say hello to {activeContact.name} 👋</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Messages are end-to-end connected via Socket.io</p>
              </div>
            )}

            {/* Typing Animation Indicator */}
            {isOtherTyping && (
              <div className="flex justify-start">
                <div className="bg-card border border-border/50 px-4 py-2 rounded-2xl rounded-bl-xs text-xs text-muted-foreground flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  <span className="ml-1 text-[11px] font-medium">{activeContact.name} is typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* WhatsApp-Style Floating Undo Delete Snackbar */}
          {pendingDelete && (
            <div className="relative shrink-0 z-40">
              <div className="absolute bottom-2 left-3 right-3 sm:left-6 sm:right-6 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto">
                <div className="bg-zinc-900/95 dark:bg-zinc-800/95 text-white rounded-2xl shadow-2xl border border-zinc-700/60 backdrop-blur-md p-3 flex items-center justify-between gap-3 relative overflow-hidden">
                  {/* Visual Timer Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                    <div
                      className="h-full bg-amber-400 transition-all duration-1000 ease-linear rounded-b-2xl"
                      style={{ width: `${(undoSecondsLeft / 5) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-semibold truncate text-zinc-100">
                        {pendingDelete.type === 'everyone' ? 'Message deleted for everyone' : 'Message deleted for me'}
                      </span>
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                        Undo available for <span className="font-bold text-amber-400 font-mono bg-amber-400/10 px-1.5 py-0.5 rounded">{undoSecondsLeft}s</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleUndoDelete}
                      className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs sm:text-sm font-bold rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Undo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDismissUndo}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input Footer */}
          <div className="p-2.5 sm:p-4 bg-card/90 backdrop-blur border-t border-border/40 shrink-0 w-full max-w-full min-w-0">
            {editingMessage && (
              <div className="mb-2 mx-1 sm:mx-2 p-2 sm:p-2.5 bg-muted/50 border-l-4 border-l-primary rounded-r-xl flex items-start justify-between">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-primary mb-0.5 flex items-center gap-1.5"><Edit2 className="w-3 h-3" /> Edit Message</span>
                  <span className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-sm">
                    {editingMessage.text}
                  </span>
                </div>
                <button onClick={() => { setEditingMessage(null); setInputText(''); }} className="p-1 hover:bg-background rounded-full text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {replyingTo && (
              <div className="mb-2 mx-1 sm:mx-2 p-2 sm:p-2.5 bg-muted/50 border-l-4 border-l-primary rounded-r-xl flex items-start justify-between">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-primary mb-0.5">Replying to {replyingTo.senderClerkId === user.id ? 'yourself' : activeContact.name}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-sm">
                    {replyingTo.type === 'image' ? '📸 Image' : replyingTo.type === 'video' ? '🎥 Video' : replyingTo.type === 'document' ? '📄 Document' : replyingTo.text}
                  </span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-background rounded-full text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {selectedFile && (
              <div className="mb-2 mx-1 sm:mx-2 p-2 bg-muted/40 border border-border/60 rounded-xl flex items-center justify-between w-fit max-w-[320px] shadow-sm animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {filePreview && !selectedFile._isDocument ? (
                    selectedFile.type.startsWith('video/') ? (
                      <div className="w-9 h-9 rounded-lg bg-black overflow-hidden relative shrink-0 flex items-center justify-center border border-border/40">
                        <video src={filePreview} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play className="w-3.5 h-3.5 text-white fill-white" />
                        </div>
                      </div>
                    ) : (
                      <img src={filePreview} alt="preview" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-border/40" />
                    )
                  ) : (selectedFile.type?.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(selectedFile.name)) ? (
                    <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                      <Headphones className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold truncate text-foreground">{selectedFile.name}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                      <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>
                        {selectedFile._isDocument
                          ? 'Document'
                          : selectedFile.type?.startsWith('video/')
                          ? 'Video'
                          : (selectedFile.type?.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(selectedFile.name))
                          ? 'Audio'
                          : 'Image'}
                      </span>
                    </span>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => { setSelectedFile(null); setFilePreview(null); }} 
                  className="p-1 hover:bg-muted rounded-full ml-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Remove attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Recording Bar or Text Input Form */}
            {isVoiceRecording ? (
              <div className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-2.5 sm:p-3 animate-pulse w-full">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-bold text-red-500">Recording voice note...</span>
                  <span className="font-mono text-xs font-bold text-foreground bg-background/60 px-2 py-0.5 rounded-md">
                    {Math.floor(voiceDuration / 60)}:{(voiceDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelVoiceRecording}
                    className="p-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-colors text-xs font-medium flex items-center gap-1"
                    title="Cancel Recording"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                  <button
                    type="button"
                    onClick={sendVoiceRecording}
                    className="p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all shadow-md text-xs font-bold flex items-center gap-1"
                    title="Send Voice Note"
                  >
                    <Send className="w-4 h-4" /> Send
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 sm:gap-2 w-full max-w-full min-w-0">
                {/* Hidden File Inputs */}
                <input 
                  type="file" 
                  ref={docInputRef} 
                  accept="*/*" 
                  onChange={handleDocumentSelect} 
                  className="hidden" 
                />
                <input 
                  type="file" 
                  ref={cameraInputRef} 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleMediaSelect} 
                  className="hidden" 
                />
                <input 
                  type="file" 
                  ref={mediaInputRef} 
                  accept="image/*,video/*" 
                  onChange={handleMediaSelect} 
                  className="hidden" 
                />
                <input 
                  type="file" 
                  ref={audioInputRef} 
                  accept="audio/*" 
                  onChange={handleAudioSelect} 
                  className="hidden" 
                />

                {/* Attachment Action Menu Trigger & Dropdown */}
                <div className="relative" ref={attachmentMenuRef}>
                  {/* Mobile Plus Button */}
                  <button
                    type="button"
                    onClick={() => setShowAttachmentMenu((prev) => !prev)}
                    disabled={isCurrentPartnerBlocked}
                    className={`p-2 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-all disabled:opacity-50 h-[38px] w-[38px] flex sm:hidden items-center justify-center shrink-0 cursor-pointer active:scale-95 attachment-menu-trigger ${
                      showAttachmentMenu ? 'bg-primary/20 text-primary ring-1 ring-primary/40' : ''
                    }`}
                    title="Add attachment"
                  >
                    <Plus className={`w-4 h-4 transition-transform duration-200 ${showAttachmentMenu ? 'rotate-45' : ''}`} />
                  </button>

                  {/* Desktop Paperclip Button */}
                  <button
                    type="button"
                    onClick={() => setShowAttachmentMenu((prev) => !prev)}
                    disabled={isCurrentPartnerBlocked}
                    className={`hidden sm:flex p-3 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-all disabled:opacity-50 h-[46px] w-[46px] items-center justify-center shrink-0 cursor-pointer attachment-menu-trigger ${
                      showAttachmentMenu ? 'bg-primary/20 text-primary ring-1 ring-primary/40' : ''
                    }`}
                    title="Attach file"
                  >
                    <Paperclip className={`w-5 h-5 transition-transform duration-200 ${showAttachmentMenu ? 'scale-110 text-primary' : ''}`} />
                  </button>

                  {/* Attachment Options Menu */}
                  {showAttachmentMenu && (
                    <div className="absolute left-0 bottom-full mb-2 w-56 sm:w-64 bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 origin-bottom-left">
                      {/* 1. Document Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAttachmentMenu(false);
                          docInputRef.current?.click();
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted/80 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground">Document</span>
                          <span className="text-[10px] text-muted-foreground truncate">Send files or documents</span>
                        </div>
                      </button>

                      {/* 2. Camera Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAttachmentMenu(false);
                          setIsCameraModalOpen(true);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted/80 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground">Camera</span>
                          <span className="text-[10px] text-muted-foreground truncate">Take a photo</span>
                        </div>
                      </button>

                      {/* 3. Photos & Videos Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAttachmentMenu(false);
                          mediaInputRef.current?.click();
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted/80 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground">Photos & Videos</span>
                          <span className="text-[10px] text-muted-foreground truncate">Send photos or videos</span>
                        </div>
                      </button>

                      {/* 4. Audio Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAttachmentMenu(false);
                          audioInputRef.current?.click();
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted/80 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <Headphones className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground">Audio</span>
                          <span className="text-[10px] text-muted-foreground truncate">Send audio or music</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Desktop: Share Profile Direct Shortcut */}
                <div className="hidden sm:flex items-center">
                  <button
                    type="button"
                    onClick={() => setIsShareProfileModalOpen(true)}
                    disabled={isCurrentPartnerBlocked}
                    className="p-3 bg-muted/40 hover:bg-muted hover:text-primary text-muted-foreground rounded-xl transition-colors disabled:opacity-50 h-[46px] w-[46px] flex items-center justify-center shrink-0 cursor-pointer"
                    title="Share profile in chat"
                  >
                    <UserPlus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 relative flex items-center min-w-0">
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    onPaste={handlePasteMedia}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    disabled={isCurrentPartnerBlocked}
                    placeholder={isCurrentPartnerBlocked ? 'You have blocked this user' : `Message ${activeContact.name}...`}
                    className="w-full bg-muted/40 border border-border/50 rounded-xl pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-3 h-[38px] sm:h-[46px] text-xs sm:text-sm focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-2.5 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-16 right-0 z-50 shadow-2xl rounded-2xl overflow-hidden" style={{ maxWidth: 'calc(100vw - 32px)' }}>
                      <EmojiPicker 
                        theme={isDark ? 'dark' : 'light'} 
                        previewConfig={{ showPreview: false }}
                        width={typeof window !== 'undefined' ? Math.min(320, window.innerWidth - 32) : 320}
                        height={380}
                        lazyLoadEmojis={true}
                        searchPlaceHolder="Search emoji..."
                        onEmojiClick={(emojiData) => {
                          setInputText(prev => prev + emojiData.emoji);
                          setShowEmojiPicker(false);
                        }} 
                      />
                    </div>
                  )}
                </div>

                {/* Voice Note Button */}
                {!inputText.trim() && !selectedFile && (
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    disabled={isCurrentPartnerBlocked}
                    className="p-2 sm:p-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl transition-colors h-[38px] w-[38px] sm:h-[46px] sm:w-[46px] flex items-center justify-center shrink-0 border border-purple-500/20 active:scale-95"
                    title="Record voice message"
                  >
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={(!inputText.trim() && !selectedFile) || isCurrentPartnerBlocked}
                  className="bg-primary text-primary-foreground p-2 sm:p-3 h-[38px] w-[38px] sm:h-[46px] sm:w-[46px] flex items-center justify-center rounded-xl hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-background p-8 text-center">
          <div className="space-y-3 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Your Messages</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Select a conversation from the sidebar to start chatting live with Socket.io real-time connection.
            </p>
          </div>
        </div>
      )}

      {/* Delete Message Modal */}
      {deleteModalMsg && (
        <ModalPortal>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-lg font-bold text-foreground mb-1">Delete message?</h2>
              <p className="text-sm text-muted-foreground mb-6">You will have 5 seconds to undo this deletion.</p>
              
              <div className="flex flex-col gap-2">
                {deleteModalMsg.senderClerkId === user.id && !deleteModalMsg.isDeleted && (
                  <button 
                    onClick={() => handleDeleteMessage(deleteModalMsg, 'everyone')}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-3 rounded-xl transition-colors text-sm"
                  >
                    Delete for everyone
                  </button>
                )}
                
                <button 
                  onClick={() => handleDeleteMessage(deleteModalMsg, 'me')}
                  className="w-full bg-muted/50 hover:bg-muted text-foreground font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  Delete for me
                </button>
                
                <button 
                  onClick={() => setDeleteModalMsg(null)}
                  className="w-full bg-transparent border border-border/50 hover:bg-muted text-foreground font-semibold py-3 rounded-xl transition-colors text-sm mt-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
      {/* Delete Person Modal */}
      {personToDelete && (
        <ModalPortal>
          <div className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 shadow-2xl rounded-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Delete Chat?</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Are you sure you want to delete your chat with <span className="font-semibold text-foreground">{personToDelete.name}</span>? This will permanently delete your chat history from the database and it cannot be undone.
            </p>
            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setPersonToDelete(null)}
                className="px-4 py-2.5 text-sm font-semibold text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors w-full"
              >
                Cancel
              </button>
              <button
                onClick={deleteChatPersonConfirm}
                className="px-4 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors shadow-lg shadow-red-500/20 w-full"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Fullscreen Attachment Viewer Modal */}
      {fullscreenAttachment && (
        <ModalPortal>
          <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <button 
            onClick={() => setFullscreenAttachment(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
          
          <a 
            href={fullscreenAttachment.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-6 right-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Download Original"
          >
            <Download className="w-6 h-6" />
          </a>
          
          <div className="max-w-6xl w-full h-[85vh] flex items-center justify-center relative mt-8">
            {fullscreenAttachment.type === 'image' ? (
              <img 
                src={fullscreenAttachment.url} 
                alt="Fullscreen View" 
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : fullscreenAttachment.type === 'document' ? (
              <iframe 
                src={getPdfViewUrl(fullscreenAttachment.url)} 
                title="Document Viewer"
                className="w-full h-full bg-white rounded-xl shadow-2xl"
              />
            ) : null}
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Export Chat Modal */}
      <ExportChatModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        contact={activeContact}
        messages={messages}
        currentUser={user}
      />

      {/* Share Profile In Chat Modal */}
      <ShareProfileInChatModal
        isOpen={isShareProfileModalOpen}
        onClose={() => setIsShareProfileModalOpen(false)}
        currentUser={user}
        activeContact={activeContact}
      />

      {/* Live Camera Viewfinder Modal */}
      {isCameraModalOpen && (
        <CameraCaptureModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          onCapture={handleCameraPhotoCaptured}
          onFallbackToFile={() => cameraInputRef.current?.click()}
        />
      )}

      {/* Floating Right Click Context Menu */}
      {contextMenu && (
        <ModalPortal>
          <div 
            className="fixed inset-0 z-[150] bg-transparent"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
          >
            <div
              className="message-floating-context-menu absolute w-48 bg-card/95 backdrop-blur-md border border-border/70 rounded-2xl shadow-2xl py-1.5 z-[151] animate-in fade-in zoom-in-95 duration-100"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={(e) => e.stopPropagation()}
            >
              {!contextMenu.message.isDeleted && (
                <button
                  onClick={() => {
                    setReplyingTo(contextMenu.message);
                    setContextMenu(null);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Reply className="w-3.5 h-3.5 text-primary" /> Reply
                </button>
              )}
              {isMessageForwardable(contextMenu.message) && (
                <button
                  onClick={() => {
                    handleForwardSingle(contextMenu.message);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Forward className="w-3.5 h-3.5 text-emerald-500" /> Forward
                </button>
              )}
              {!contextMenu.message.isDeleted && (
                <button
                  onClick={() => {
                    copyMessage(contextMenu.message);
                    setContextMenu(null);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-500" /> Copy Message
                </button>
              )}
              {!contextMenu.message.isDeleted && (
                <button
                  onClick={() => {
                    startSelectMode(contextMenu.message._id);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-500" /> Select
                </button>
              )}
              {contextMenu.message.senderClerkId === user?.id && contextMenu.message.type === 'text' && !contextMenu.message.isDeleted && (
                <button
                  onClick={() => {
                    setEditingMessage(contextMenu.message);
                    setInputText(contextMenu.message.text);
                    setContextMenu(null);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-500" /> Edit
                </button>
              )}
              <div className="border-t border-border/40 my-1" />
              <button
                onClick={() => {
                  setDeleteModalMsg(contextMenu.message);
                  setContextMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" /> Delete
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Floating Contact Context Menu (Right Click & 3-Dot) */}
      {contactContextMenu && contactContextMenu.contact && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[150] bg-transparent"
            onClick={() => setContactContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContactContextMenu(null);
            }}
          >
            <div
              className="contact-floating-context-menu absolute w-52 bg-card/95 backdrop-blur-md border border-border/70 rounded-2xl shadow-2xl py-1.5 z-[151] animate-in fade-in zoom-in-95 duration-100"
              style={{ left: contactContextMenu.x, top: contactContextMenu.y }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Contact Info Header */}
              <div className="px-3.5 py-2 border-b border-border/40 mb-1 flex items-center gap-2.5">
                {contactContextMenu.contact.image ? (
                  <img
                    src={contactContextMenu.contact.image}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover border border-border/50 shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-muted border border-border/50 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-foreground truncate">
                    {contactContextMenu.contact.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground capitalize truncate">
                    {formatRoleBadge(contactContextMenu.contact.userRole || contactContextMenu.contact.role)}
                  </p>
                </div>
              </div>

              {/* Pin / Unpin */}
              {(() => {
                const cId = contactContextMenu.contact.clerkId || contactContextMenu.contact.id;
                const isPinned = pinnedChats.includes(cId);
                return (
                  <button
                    onClick={() => togglePinChat(contactContextMenu.contact)}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    {isPinned ? (
                      <>
                        <PinOff className="w-3.5 h-3.5 text-amber-500" />
                        <span>Unpin Chat</span>
                      </>
                    ) : (
                      <>
                        <Pin className="w-3.5 h-3.5 text-amber-500" />
                        <span>Pin to Top</span>
                      </>
                    )}
                  </button>
                );
              })()}

              {/* Mute / Unmute Notifications */}
              {(() => {
                const cId = contactContextMenu.contact.clerkId || contactContextMenu.contact.id;
                const isMuted = mutedChats.includes(cId);
                return (
                  <button
                    onClick={() => toggleMuteChat(contactContextMenu.contact)}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    {isMuted ? (
                      <>
                        <Bell className="w-3.5 h-3.5 text-blue-500" />
                        <span>Unmute Notifications</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-3.5 h-3.5 text-blue-500" />
                        <span>Mute Notifications</span>
                      </>
                    )}
                  </button>
                );
              })()}

              {/* Archive / Unarchive */}
              {(() => {
                const cId = contactContextMenu.contact.clerkId || contactContextMenu.contact.id;
                const isArchived = archivedChats.includes(cId);
                return (
                  <button
                    onClick={() => toggleArchiveChat(contactContextMenu.contact)}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    {isArchived ? (
                      <>
                        <ArchiveRestore className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Unarchive Chat</span>
                      </>
                    ) : (
                      <>
                        <Archive className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Archive Chat</span>
                      </>
                    )}
                  </button>
                );
              })()}

              {/* Mark as Read / Unread */}
              {(() => {
                const cId = contactContextMenu.contact.clerkId || contactContextMenu.contact.id;
                const isUnread = contactContextMenu.contact.unread > 0 || forceUnreadChats.includes(cId);
                return (
                  <button
                    onClick={() => toggleMarkUnread(contactContextMenu.contact)}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    {isUnread ? (
                      <>
                        <MailOpen className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Mark as Read</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Mark as Unread</span>
                      </>
                    )}
                  </button>
                );
              })()}

              {/* View Profile */}
              <button
                onClick={() => viewContactProfile(contactContextMenu.contact)}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-purple-500" />
                <span>View Profile</span>
              </button>

              <div className="border-t border-border/40 my-1" />

              {/* Block / Unblock User */}
              {(() => {
                const cId = contactContextMenu.contact.clerkId || contactContextMenu.contact.id;
                const isBlocked = blockedUsers.includes(cId);
                return (
                  <button
                    onClick={() => toggleBlockContact(contactContextMenu.contact)}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    {isBlocked ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Unblock User</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-red-500">Block User</span>
                      </>
                    )}
                  </button>
                );
              })()}

              {/* Delete Chat */}
              <button
                onClick={() => deleteChatPerson(contactContextMenu.contact)}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Delete Chat</span>
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Bulk Delete Modal */}
      {bulkDeleteModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-card border border-border/50 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-1">
                  Delete {selectedMessageIds.size} message{selectedMessageIds.size > 1 ? 's' : ''}?
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Choose how you want to delete the selected messages.
                </p>

                <div className="flex flex-col gap-2">
                  {Array.from(selectedMessageIds).every((id) => {
                    const m = messages.find((msg) => msg._id === id);
                    return m && m.senderClerkId === user?.id && !m.isDeleted;
                  }) && (
                    <button
                      onClick={() => handleBulkDeleteConfirm('everyone')}
                      className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-3 rounded-xl transition-colors text-sm cursor-pointer"
                    >
                      Delete for everyone
                    </button>
                  )}

                  <button
                    onClick={() => handleBulkDeleteConfirm('me')}
                    className="w-full bg-muted/60 hover:bg-muted text-foreground font-bold py-3 rounded-xl transition-colors text-sm cursor-pointer"
                  >
                    Delete for me
                  </button>

                  <button
                    onClick={() => setBulkDeleteModalOpen(false)}
                    className="w-full bg-transparent border border-border/50 hover:bg-muted text-foreground font-semibold py-3 rounded-xl transition-colors text-sm mt-1 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* WhatsApp-style Forward Message Modal */}
      <ForwardMessageModal
        isOpen={forwardModalOpen}
        onClose={() => setForwardModalOpen(false)}
        messages={messagesToForward}
        currentUserId={user?.id}
        initialContacts={contacts}
        onForwardInitiated={handleForwardInitiated}
      />
    </div>
  );
};

export default RealtimeChat;

