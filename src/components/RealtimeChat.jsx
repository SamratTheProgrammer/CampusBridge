import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, Phone, Video, MoreVertical, MessageSquare, Loader2, Circle, Check, CheckCheck, Smile, Ban, Palette, Trash2, User, UserX, ShieldAlert, Paperclip, X, Reply, Download, FileText, Eye, FileDown, Edit2, Archive, ArchiveRestore, BellOff, Bell, Pin, PinOff, Mail, MailOpen, Heart, HeartOff, Share2, Mic, Square, Clock, AlertCircle, ArrowRight, UserPlus, RotateCcw } from 'lucide-react';
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

  // 3-Dots Menu & Settings State
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [activeContactMenu, setActiveContactMenu] = useState(null);
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


  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const menuRef = useRef(null);

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
      if (!e.target.closest('.message-context-menu') && !e.target.closest('.message-menu-trigger')) {
        setActiveMessageMenu(null);
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
        setContacts(data);
        if (data.length > 0 && !activeContact && !targetUserId) {
          setActiveContact(data[0]);
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
        setActiveContact(existing);
        setIsMobileChatOpen(true);
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
  useEffect(() => {
    if (!user || !activeContact) return;

    const conversationId = activeContact.conversationId || getConvId(user.id, activeContact.clerkId);
    setIsLoadingMessages(true);
    setIsOtherTyping(false);
    setShowMoreMenu(false);

    // Join socket room
    socket.emit('join_room', { conversationId, userId: user.id });
    socket.emit('mark_read', { conversationId, userId: user.id });

    // Fetch conversation messages history
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/messages/${conversationId}?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
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
      const activeConvId = activeContact.conversationId || getConvId(user.id, activeContact.clerkId);
      const isForActiveContact =
        msg.conversationId === activeConvId ||
        (msg.senderClerkId === activeContact.clerkId && msg.recipientClerkId === user.id) ||
        (msg.senderClerkId === user.id && msg.recipientClerkId === activeContact.clerkId);

      if (isForActiveContact) {
        setMessages((prev) => {
          const tempIdx = prev.findIndex(
            (m) =>
              String(m._id).startsWith('temp_') &&
              m.senderClerkId === msg.senderClerkId &&
              ((m.attachment?.url && m.attachment?.url === msg.attachment?.url) ||
               (m.type === 'audio' && msg.type === 'audio') ||
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
        }
      }
      fetchContacts();
    };

    const handleUserTyping = ({ userId, isTyping }) => {
      if (userId !== user.id && userId === activeContact.clerkId) {
        setIsOtherTyping(isTyping);
      }
    };

    const handleMessagesRead = ({ conversationId: cId }) => {
      const activeConvId = activeContact.conversationId || getConvId(user.id, activeContact.clerkId);
      if (cId === activeConvId) {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      }
    };

    const handleMessagesDelivered = ({ userId }) => {
      if (activeContact && (activeContact.clerkId === userId || activeContact.id === userId)) {
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

    socket.on('receive_message', handleReceiveMessage);
    socket.on('new_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('messages_read', handleMessagesRead);
    socket.on('user_messages_delivered', handleMessagesDelivered);
    socket.on('message_deleted_for_me', handleMessageDeletedMe);
    socket.on('message_deleted_for_everyone', handleMessageDeletedEveryone);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_restored_everyone', handleMessageRestoredEveryone);

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
    };
  }, [activeContact, user]);

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
      const fileType = fileToSend.type.startsWith('image/') ? 'image' 
                     : fileToSend.type.startsWith('video/') ? 'video' 
                     : fileToSend.type.startsWith('audio/') ? 'audio'
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
        formData.append('type', fileType === 'document' ? 'raw' : 'auto');

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
            setMessages((prev) => prev.map((m) => m._id === tempId ? { ...m, isUploading: false, isError: true } : m));
            toast.error('Failed to upload file');
          }
        } catch (err) {
          console.error('Upload error:', err);
          setMessages((prev) => prev.map((m) => m._id === tempId ? { ...m, isUploading: false, isError: true } : m));
          toast.error('Upload error');
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

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
    e.target.value = '';
  };

  // Commit permanent message deletion to socket and database
  const commitDelete = useCallback(async (itemToCommit) => {
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

    // 1. Socket emit
    socket.emit('delete_message', {
      messageId,
      type,
      userId: user.id,
      conversationId
    });

    // 2. REST API persistence
    try {
      await fetch(`${API_BASE}/api/messages/${messageId}?type=${type}&userId=${user.id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Error committing message deletion:', err);
    }

    // 3. Re-fetch contacts to ensure server-side consistency
    fetchContacts();
  }, [user?.id, fetchContacts]);

  // Handle Delete with WhatsApp-style Undo window (5 seconds)
  const handleDeleteMessage = (messageOrId, type = 'me') => {
    let targetMsg = null;
    if (typeof messageOrId === 'object' && messageOrId !== null) {
      targetMsg = messageOrId;
    } else {
      targetMsg = messages.find((m) => String(m._id) === String(messageOrId));
    }
    if (!targetMsg) return;

    const messageId = targetMsg._id;

    // If another deletion was already pending, commit it immediately before starting this one
    if (pendingDeleteRef.current) {
      commitDelete(pendingDeleteRef.current);
    }

    // 1. Optimistic local messages update
    if (type === 'everyone') {
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(messageId)
            ? { ...m, isDeleted: true, text: '', attachment: null }
            : m
        )
      );
    } else {
      setMessages((prev) => prev.filter((m) => String(m._id) !== String(messageId)));
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
      const exists = prev.some((m) => String(m._id) === String(message._id));
      if (exists) {
        return prev.map((m) => String(m._id) === String(message._id) ? message : m);
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

  // Commit any pending message deletion on contact switch
  useEffect(() => {
    return () => {
      if (pendingDeleteRef.current) {
        commitDelete(pendingDeleteRef.current);
      }
    };
  }, [activeContact?.clerkId, commitDelete]);

  // Commit on window unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingDeleteRef.current) {
        commitDelete(pendingDeleteRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [commitDelete]);

  // Block / Unblock User
  const toggleBlockUser = async () => {
    if (!activeContact || !user) return;
    try {
      const res = await fetch(`${API_BASE}/api/messages/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockerClerkId: user.id,
          blockedClerkId: activeContact.clerkId
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isBlocked) {
          const updated = [...blockedUsers, activeContact.clerkId];
          setBlockedUsers(updated);
          localStorage.setItem('campusbridge_blocked_users', JSON.stringify(updated));
          toast.error(`Blocked ${activeContact.name}`);
        } else {
          const updated = blockedUsers.filter((id) => id !== activeContact.clerkId);
          setBlockedUsers(updated);
          localStorage.setItem('campusbridge_blocked_users', JSON.stringify(updated));
          toast.success(`Unblocked ${activeContact.name}`);
        }
      }
    } catch (err) {
      console.error('Error toggling block:', err);
    }
    setShowMoreMenu(false);
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
  const viewPartnerProfile = () => {
    if (!activeContact) return;
    navigate(`/profile/${activeContact.username || activeContact.clerkId}`);
    setShowMoreMenu(false);
  };

  const isCurrentPartnerBlocked = activeContact && blockedUsers.includes(activeContact.clerkId);
  const currentTheme = THEMES[chatThemeIndex];

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full max-w-full min-w-0 md:max-w-7xl md:mx-auto h-[calc(100dvh-4rem)] md:h-[calc(100dvh-8.5rem)] flex bg-card md:border border-0 md:border-border/50 rounded-none md:rounded-2xl md:shadow-lg overflow-hidden">
      
      {/* Left Contacts Sidebar */}
      <div className={`w-full max-w-full min-w-0 md:w-72 lg:w-80 xl:w-96 border-r border-border/40 flex-col h-full bg-card shrink-0 ${activeContact && isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border/40">
          <div className="flex items-center justify-between mb-4">
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
              const isActive = activeContact?.clerkId === contact.clerkId || activeContact?.id === contact.id;
              const isBlocked = blockedUsers.includes(contact.clerkId) || blockedUsers.includes(contact.id);
              const isContactOnline = onlineUsers.includes(contact.clerkId) || onlineUsers.includes(contact.id) || onlineUsers.includes(contact._id);
              const roleTag = (contact.userRole || (contact.role?.toLowerCase().includes('mentor') ? 'mentor' : 'student')).toLowerCase();

              return (
                <div
                  key={contact.clerkId}
                  onClick={() => { setActiveContact(contact); setIsMobileChatOpen(true); }}
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
                        <h4 className={`font-semibold text-sm truncate ${contact.unread > 0 ? 'text-foreground font-bold' : 'text-foreground/90'}`}>
                          {contact.name}
                        </h4>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                          roleTag === 'mentor'
                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            : roleTag === 'alumni'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : roleTag === 'admin'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        }`}>
                          {roleTag}
                        </span>
                        {isBlocked && <Ban className="w-3 h-3 text-red-500 shrink-0" title="Blocked" />}
                      </div>
                      {contact.lastMessageTime && (
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                          {formatMessageTime(contact.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${contact.unread > 0 ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                      {isBlocked ? 'User is blocked' : contact.lastMessage}
                    </p>
                  </div>
                  {contact.unread > 0 && !isBlocked && (
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 animate-bounce">
                      {contact.unread}
                    </span>
                  )}
                  
                  {/* Hover 3-dot menu */}
                  <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveContactMenu(activeContactMenu === contact.clerkId ? null : contact.clerkId);
                      }}
                      className="p-1 rounded-full bg-background border border-border/50 text-muted-foreground hover:text-foreground shadow-md hover:bg-muted"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                    {activeContactMenu === contact.clerkId && (
                      <div 
                        className="absolute right-0 top-full mt-1 w-36 bg-card border border-border/60 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChatPerson(contact);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs font-medium text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                        >
                          <UserX className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-sm font-medium">No active conversations</p>
              <p className="text-xs text-muted-foreground">Connect with mentors or mentees to start chatting!</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Chat Area */}
      {activeContact ? (
        <div className={`flex-1 flex-col h-full w-full max-w-full min-w-0 overflow-hidden ${currentTheme.bg} transition-colors duration-300 relative ${isMobileChatOpen ? 'flex' : 'hidden md:flex'}`}>
          {/* Header */}
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
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                    (activeContact.userRole || (activeContact.role?.toLowerCase().includes('mentor') ? 'mentor' : 'student')).toLowerCase() === 'mentor'
                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                      : (activeContact.userRole || (activeContact.role?.toLowerCase().includes('mentor') ? 'mentor' : 'student')).toLowerCase() === 'alumni'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : (activeContact.userRole || (activeContact.role?.toLowerCase().includes('mentor') ? 'mentor' : 'student')).toLowerCase() === 'admin'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  }`}>
                    {activeContact.userRole || (activeContact.role?.toLowerCase().includes('mentor') ? 'mentor' : 'student')}
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
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 custom-scrollbar w-full min-w-0">
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
                
                if (msg.type === 'call_log') {
                  const isMissed = msg.callInfo?.status === 'missed' || msg.callInfo?.status === 'rejected';
                  return (
                    <React.Fragment key={msg._id || Math.random()}>
                      {renderDateSeparator}
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                        <div className={`flex items-start gap-1.5 sm:gap-2 max-w-[92%] sm:max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
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
                            isMissed
                              ? 'bg-red-500/10 border-red-500/30 text-red-500 dark:text-red-400'
                              : 'bg-primary/10 border-primary/20 text-foreground'
                          }`}>
                            <div className={`p-2.5 rounded-full shrink-0 ${
                              isMissed ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'
                            }`}>
                              {msg.callInfo?.callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs sm:text-sm truncate">{msg.text}</p>
                              <span className="text-[10px] text-muted-foreground">{formatMessageTime(msg.createdAt)}</span>
                            </div>
                            <button
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('initiate_call', {
                                  detail: { targetPartner: activeContact, type: msg.callInfo?.callType || 'video' }
                                }));
                              }}
                              className="px-2.5 py-1 bg-background border border-border/50 hover:bg-muted rounded-lg text-[11px] font-semibold text-foreground transition-colors shrink-0 shadow-xs"
                            >
                              Call Back
                            </button>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                }

                return (
                  <React.Fragment key={msg._id || Math.random()}>
                    {renderDateSeparator}
                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                      <div className={`flex items-start gap-1.5 sm:gap-2 max-w-[92%] sm:max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Message Bubble Context Menu */}
                      <div className={`relative opacity-50 hover:opacity-100 transition-opacity flex items-center ${isMe ? 'pr-2' : 'pl-2'} mt-2`}>
                        <button onClick={(e) => { e.stopPropagation(); setActiveMessageMenu(activeMessageMenu === msg._id ? null : msg._id); }} className="message-menu-trigger p-1 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                          <MoreVertical className="w-4 h-4 pointer-events-none" />
                        </button>
                        {activeMessageMenu === msg._id && (
                          <div className={`message-context-menu absolute ${isMe ? 'right-8' : 'left-8'} top-0 w-44 bg-card border border-border/60 rounded-xl shadow-lg py-1 z-30`}>
                            {!msg.isDeleted && (
                              <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); setActiveMessageMenu(null); }} className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2">
                                <Reply className="w-3.5 h-3.5" /> Reply
                              </button>
                            )}
                            {isMe && !msg.isDeleted && msg.type === 'text' && (
                              <button onClick={(e) => { e.stopPropagation(); setEditingMessage(msg); setInputText(msg.text); setActiveMessageMenu(null); }} className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2">
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                              </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); setDeleteModalMsg(msg); setActiveMessageMenu(null); }} className="w-full px-3 py-2 text-left text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-2">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>

                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} min-w-0 max-w-full`}>
                        <div
                          className={`${
                            (!msg.text && msg.attachment?.type === 'image') ? 'p-1' : 'px-3.5 py-2 sm:px-4 sm:py-2.5'
                          } rounded-2xl text-sm shadow-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] flex flex-col max-w-full ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-card border border-border/50 text-foreground rounded-tl-sm'
                          } ${msg.isDeleted ? 'italic text-muted-foreground bg-transparent border border-border/50 shadow-none' : ''}`}
                        >
                          {msg.isDeleted ? (
                            <span className="flex items-center gap-1.5"><Ban className="w-3.5 h-3.5" /> This message was deleted</span>
                          ) : (
                            <>
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
                                      onClick={() => setFullscreenAttachment({ url: msg.attachment.url, type: 'image' })} 
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
                                      onClick={() => setFullscreenAttachment({ url: msg.attachment.url, type: 'document' })} 
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
                                <div 
                                  onClick={() => {
                                    if (msg.share.type === 'profile') {
                                      navigate(`/profile/${msg.share.itemId}`);
                                    } else {
                                      navigate(`?${msg.share.type}=${msg.share.itemId}`);
                                    }
                                  }}
                                  className={`mb-2 p-3 sm:p-3.5 rounded-2xl border cursor-pointer hover:opacity-95 transition-all flex flex-col gap-2 ${
                                    isMe 
                                      ? 'bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/15' 
                                      : 'bg-card border-border/70 hover:border-primary/40 shadow-sm'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl shrink-0 ${isMe ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                                      {msg.share.type === 'profile' ? <User className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? 'opacity-80' : 'text-primary'}`}>
                                          Shared {msg.share.type}
                                        </span>
                                      </div>
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
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </div>
                                </div>
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

          {/* WhatsApp-Style Undo Delete Snackbar */}
          {pendingDelete && (
            <div className="mx-2 sm:mx-4 mb-2 p-2.5 sm:p-3 bg-zinc-900/95 dark:bg-zinc-800/95 text-white rounded-2xl shadow-2xl border border-zinc-700/60 backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 z-30 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Trash2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-semibold truncate text-zinc-100">
                    {pendingDelete.type === 'everyone' ? 'Message deleted for everyone' : 'Message deleted for me'}
                  </span>
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                    Undo available for <span className="font-bold text-amber-400 font-mono">{undoSecondsLeft}s</span>
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
                  Undo
                </button>
                <button
                  type="button"
                  onClick={handleDismissUndo}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
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
              <div className="mb-2 mx-1 sm:mx-2 p-2 bg-muted/30 border border-border/50 rounded-xl flex items-center justify-between w-fit max-w-[200px]">
                <div className="flex items-center gap-2 min-w-0">
                  {filePreview ? (
                    <img src={filePreview} alt="preview" className="w-8 h-8 rounded object-cover shrink-0" />
                  ) : (
                    <FileText className="w-6 h-6 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-xs truncate">{selectedFile.name}</span>
                </div>
                <button onClick={() => { setSelectedFile(null); setFilePreview(null); }} className="p-1 hover:bg-background rounded-full ml-2 text-muted-foreground">
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
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCurrentPartnerBlocked}
                  className="p-2 sm:p-3 bg-muted/40 hover:bg-muted text-muted-foreground rounded-xl transition-colors disabled:opacity-50 h-[38px] w-[38px] sm:h-[46px] sm:w-[46px] flex items-center justify-center shrink-0 cursor-pointer"
                  title="Attach file or audio"
                >
                  <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareProfileModalOpen(true)}
                  disabled={isCurrentPartnerBlocked}
                  className="p-2 sm:p-3 bg-muted/40 hover:bg-muted hover:text-primary text-muted-foreground rounded-xl transition-colors disabled:opacity-50 h-[38px] w-[38px] sm:h-[46px] sm:w-[46px] flex items-center justify-center shrink-0 cursor-pointer"
                  title="Share profile in chat"
                >
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="flex-1 relative flex items-center min-w-0">
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
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
    </div>
  );
};

export default RealtimeChat;

