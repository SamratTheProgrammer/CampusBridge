import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Phone, Video, MoreVertical, MessageSquare, Loader2, Circle, CheckCheck, Smile, Ban, Palette, Trash2, User, ShieldAlert, Paperclip, X, Reply, Download, FileText, Eye, FileDown, Edit2 } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { socket } from '../services/socket';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import { getPdfViewUrl } from '../utils/pdfViewer';


const THEMES = [
  { id: 'default', name: 'Default Dark', bg: 'bg-background' },
  { id: 'midnight', name: 'Midnight Cyber', bg: 'bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950' },
  { id: 'emerald', name: 'Emerald Forest', bg: 'bg-gradient-to-b from-slate-950 via-emerald-950/20 to-slate-950' },
  { id: 'sunset', name: 'Sunset Glow', bg: 'bg-gradient-to-b from-slate-950 via-rose-950/20 to-slate-950' },
  { id: 'sapphire', name: 'Deep Sapphire', bg: 'bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950' }
];

const RealtimeChat = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  
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
  const [editingMessage, setEditingMessage] = useState(null);
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);
  const [deleteModalMsg, setDeleteModalMsg] = useState(null);
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const fileInputRef = useRef(null);

  // 3-Dots Menu & Settings State
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [chatThemeIndex, setChatThemeIndex] = useState(0);
  const [blockedUsers, setBlockedUsers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('campusbridge_blocked_users') || '[]');
    } catch {
      return [];
    }
  });

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
      const res = await fetch(`/api/messages/conversations/${user.id}`);
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
      socket.emit('register_user', user.id);
      socket.emit('get_online_users');
      fetch(`/api/messages/blocked/${user.id}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setBlockedUsers(data))
        .catch((err) => console.error('Error fetching blocked list:', err));
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
        const res = await fetch(`/api/users/${targetUserId}`);
        if (res.ok) {
          const u = await res.json();
          const newContact = {
            id: u.clerkId,
            clerkId: u.clerkId,
            name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.name || 'User'),
            role: u.headline || u.role || 'Member',
            userRole: u.role || 'student',
            headline: u.headline || `${u.role || 'Member'} at CampusBridge`,
            image: u.imageUrl,
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
        const res = await fetch(`/api/messages/${conversationId}?userId=${user.id}`);
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
            (m) => String(m._id).startsWith('temp_') && m.senderClerkId === msg.senderClerkId && m.text === msg.text
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

    const handleMessageDeletedMe = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => String(m._id) !== String(messageId)));
    };

    const handleMessageDeletedEveryone = ({ messageId }) => {
      setMessages((prev) => prev.map((m) => String(m._id) === String(messageId) ? { ...m, isDeleted: true, text: '', attachment: null } : m));
    };

    const handleMessageEdited = ({ messageId, newText, editedAt }) => {
      setMessages((prev) => prev.map((m) => String(m._id) === String(messageId) ? { ...m, text: newText, isEdited: true, editedAt } : m));
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('messages_read', handleMessagesRead);
    socket.on('message_deleted_for_me', handleMessageDeletedMe);
    socket.on('message_deleted_for_everyone', handleMessageDeletedEveryone);
    socket.on('message_edited', handleMessageEdited);

    return () => {
      socket.emit('leave_room', { conversationId });
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('messages_read', handleMessagesRead);
      socket.off('message_deleted_for_me', handleMessageDeletedMe);
      socket.off('message_deleted_for_everyone', handleMessageDeletedEveryone);
      socket.off('message_edited', handleMessageEdited);
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
    if ((!inputText.trim() && !selectedFile) || !activeContact || !user || isUploading) return;

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
        await fetch(`/api/messages/${msgId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newText: text, userId: user.id })
        });
      } catch (err) {
        console.error('Error saving edited message:', err);
      }
      return;
    }

    let attachmentData = null;
    let messageType = 'text';

    if (selectedFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const fileType = selectedFile.type.startsWith('image/') ? 'image' 
                     : selectedFile.type.startsWith('video/') ? 'video' 
                     : 'document';
      formData.append('type', fileType === 'document' ? 'raw' : 'auto');
      
      try {
        const uploadRes = await fetch('/api/upload/file', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          attachmentData = {
            url: data.url,
            name: data.name,
            type: fileType,
            size: data.size
          };
          messageType = fileType;
        } else {
          toast.error('Failed to upload file');
          setIsUploading(false);
          return;
        }
      } catch (err) {
        toast.error('Upload error');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const replyData = replyingTo ? {
      messageId: replyingTo._id,
      text: replyingTo.type === 'image' ? '📸 Image' : replyingTo.type === 'video' ? '🎥 Video' : replyingTo.type === 'document' ? '📄 Document' : replyingTo.text,
      senderName: replyingTo.senderClerkId === user.id ? 'You' : activeContact.name
    } : null;
    
    setReplyingTo(null);

    // 1. Optimistic Local UI update (Zero Latency)
    const tempId = 'temp_' + Date.now();
    const tempMessage = {
      _id: tempId,
      conversationId: activeContact.conversationId,
      senderClerkId: user.id,
      recipientClerkId: activeContact.clerkId,
      text,
      type: messageType,
      attachment: attachmentData,
      replyTo: replyData,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setMessages((prev) => [...prev, tempMessage]);
    setInputText('');
    setSelectedFile(null);
    setFilePreview(null);

    // Update contacts list to move the active contact to the top
    setContacts(prev => {
      const updated = prev.map(c => {
        if (c.clerkId === activeContact.clerkId) {
          return {
            ...c,
            lastMessage: text || (messageType === 'image' ? '📸 Image' : messageType === 'video' ? '🎥 Video' : '📄 Document'),
            lastMessageTime: new Date().toISOString()
          };
        }
        return c;
      });
      return updated.sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0));
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing', { conversationId: activeContact.conversationId, userId: user.id, isTyping: false });

    // 2. Emit live message via Socket.io
    socket.emit('send_message', {
      senderClerkId: user.id,
      recipientClerkId: activeContact.clerkId,
      conversationId: activeContact.conversationId,
      text,
      type: messageType,
      attachment: attachmentData,
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

  const handleDeleteMessage = async (messageId, type) => {
    // 1. Optimistic local update
    if (type === 'everyone') {
      setMessages((prev) => prev.map((m) => String(m._id) === String(messageId) ? { ...m, isDeleted: true, text: '', attachment: null } : m));
    } else {
      setMessages((prev) => prev.filter((m) => String(m._id) !== String(messageId)));
    }
    setActiveMessageMenu(null);

    // 2. Socket emit
    socket.emit('delete_message', {
      messageId,
      type,
      userId: user.id,
      conversationId: activeContact.conversationId
    });

    // 3. REST API persistence
    try {
      await fetch(`/api/messages/${messageId}?type=${type}&userId=${user.id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  // Block / Unblock User
  const toggleBlockUser = async () => {
    if (!activeContact || !user) return;
    try {
      const res = await fetch('/api/messages/block', {
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

  // View Profile
  const viewPartnerProfile = () => {
    if (!activeContact) return;
    if (activeContact.role?.toLowerCase().includes('mentor')) {
      navigate(`/dashboard/mentor/${activeContact.clerkId}`);
    } else {
      navigate(`/dashboard/student/${activeContact.clerkId}`);
    }
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
    <div className="max-w-7xl mx-auto h-[calc(100vh-8.5rem)] flex bg-card border border-border/50 rounded-2xl shadow-lg overflow-hidden">
      
      {/* Left Contacts Sidebar */}
      <div className={`w-full sm:w-80 lg:w-96 border-r border-border/40 flex-col h-full bg-card shrink-0 ${activeContact && isMobileChatOpen ? 'hidden sm:flex' : 'flex'}`}>
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
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => {
              const isActive = activeContact?.clerkId === contact.clerkId;
              const isBlocked = blockedUsers.includes(contact.clerkId);
              const isContactOnline = onlineUsers.includes(contact.clerkId);
              const roleTag = (contact.userRole || (contact.role?.toLowerCase().includes('mentor') ? 'mentor' : 'student')).toLowerCase();

              return (
                <div
                  key={contact.clerkId}
                  onClick={() => { setActiveContact(contact); setIsMobileChatOpen(true); }}
                  className={`p-3.5 sm:p-4 cursor-pointer transition-colors flex items-center gap-3.5 relative ${
                    isActive ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-muted/40 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={contact.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`}
                      alt={contact.name}
                      className="w-12 h-12 rounded-full object-cover border border-border/50"
                    />
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
        <div className={`flex-1 flex-col h-full ${currentTheme.bg} transition-colors duration-300 relative ${isMobileChatOpen ? 'flex' : 'hidden sm:flex'}`}>
          {/* Header */}
          <div className="h-16 px-4 sm:px-6 border-b border-border/40 flex items-center justify-between bg-card/90 backdrop-blur z-20 shrink-0 relative">
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0" onClick={viewPartnerProfile}>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMobileChatOpen(false); }}
                className="sm:hidden p-2 -ml-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
              </button>

              <div className="relative shrink-0">
                <img
                  src={activeContact.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeContact.name}`}
                  alt={activeContact.name}
                  className="w-10 h-10 rounded-full object-cover border border-border/50"
                />
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                  onlineUsers.includes(activeContact.clerkId) ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-400'
                }`} />
              </div>

              <div className="min-w-0">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2 truncate">
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
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                  {isOtherTyping ? (
                    <span className="text-primary font-semibold animate-pulse">typing...</span>
                  ) : (
                    <span className="truncate flex items-center gap-2">
                      {onlineUsers.includes(activeContact.clerkId) ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold"><Circle className="w-2 h-2 fill-current text-emerald-400" /> Online</span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground"><Circle className="w-2 h-2 fill-current text-slate-500" /> Offline</span>
                      )}
                      &bull; <span className="truncate">{activeContact.headline || activeContact.role || 'CampusBridge Member'}</span>
                    </span>
                  )}
                </p>
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
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {isLoadingMessages ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : messages.length > 0 ? (
              messages.map((msg) => {
                const isMe = msg.senderClerkId === user?.id;
                
                if (msg.type === 'call_log') {
                  const isMissed = msg.callInfo?.status === 'missed' || msg.callInfo?.status === 'rejected';
                  return (
                    <div key={msg._id || Math.random()} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-center gap-3 p-3 rounded-2xl border text-xs max-w-[85%] sm:max-w-[70%] shadow-sm ${
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
                  );
                }

                return (
                  <div key={msg._id || Math.random()} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                      <div className={`flex items-start gap-2 max-w-[85%] sm:max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
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

                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm leading-relaxed whitespace-pre-wrap flex flex-col ${
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
                                    <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer">
                                      <img src={msg.attachment.url} alt="attachment" className="rounded-xl max-h-60 w-auto object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                                    </a>
                                  ) : msg.attachment.type === 'video' ? (
                                    <video src={msg.attachment.url} controls className="rounded-xl max-h-60 w-auto" />
                                  ) : (
                                    <a href={getPdfViewUrl(msg.attachment.url)} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 rounded-xl border ${isMe ? 'bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20' : 'bg-muted/50 border-border/50 hover:bg-muted'} transition-colors`}>
                                      <div className="p-2 bg-background/50 rounded-lg shrink-0">
                                        <FileText className="w-5 h-5" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate" title={msg.attachment.name}>{msg.attachment.name}</p>
                                        <p className="text-[10px] opacity-70 mt-0.5">{(msg.attachment.size / 1024).toFixed(1)} KB</p>
                                      </div>
                                      <Download className="w-4 h-4 shrink-0 opacity-70" />
                                    </a>
                                  )}
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
                            <CheckCheck className={`w-3.5 h-3.5 ${msg.isRead ? 'text-blue-500' : 'text-muted-foreground/60'}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
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

          {/* Input Footer */}
          <div className="p-4 bg-card/90 backdrop-blur border-t border-border/40 shrink-0">
            {editingMessage && (
              <div className="mb-2 mx-2 p-2.5 bg-muted/50 border-l-4 border-l-primary rounded-r-xl flex items-start justify-between">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-primary mb-0.5 flex items-center gap-1.5"><Edit2 className="w-3 h-3" /> Edit Message</span>
                  <span className="text-xs text-muted-foreground truncate max-w-sm">
                    {editingMessage.text}
                  </span>
                </div>
                <button onClick={() => { setEditingMessage(null); setInputText(''); }} className="p-1 hover:bg-background rounded-full text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {replyingTo && (
              <div className="mb-2 mx-2 p-2.5 bg-muted/50 border-l-4 border-l-primary rounded-r-xl flex items-start justify-between">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-primary mb-0.5">Replying to {replyingTo.senderClerkId === user.id ? 'yourself' : activeContact.name}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-sm">
                    {replyingTo.type === 'image' ? '📸 Image' : replyingTo.type === 'video' ? '🎥 Video' : replyingTo.type === 'document' ? '📄 Document' : replyingTo.text}
                  </span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-background rounded-full text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {selectedFile && (
              <div className="mb-2 mx-2 p-2 bg-muted/30 border border-border/50 rounded-xl flex items-center justify-between w-fit max-w-[200px]">
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

            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCurrentPartnerBlocked}
                className="p-3 bg-muted/40 hover:bg-muted text-muted-foreground rounded-xl transition-colors disabled:opacity-50 h-[46px]"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <div className="flex-1 relative flex items-center">
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
                  disabled={isCurrentPartnerBlocked || isUploading}
                  placeholder={isCurrentPartnerBlocked ? 'You have blocked this user' : `Message ${activeContact.name}...`}
                  className="w-full bg-muted/40 border border-border/50 rounded-xl pl-4 pr-10 py-3 h-[46px] text-sm focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Smile className="w-5 h-5" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-16 right-0 z-50">
                    <EmojiPicker 
                      theme="auto" 
                      onEmojiClick={(emojiData) => {
                        setInputText(prev => prev + emojiData.emoji);
                        setShowEmojiPicker(false);
                      }} 
                    />
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={(!inputText.trim() && !selectedFile) || isCurrentPartnerBlocked || isUploading}
                className="bg-primary text-primary-foreground p-3 h-[46px] w-[46px] flex items-center justify-center rounded-xl hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden sm:flex flex-1 items-center justify-center bg-background p-8 text-center">
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-lg font-bold text-foreground mb-1">Delete message?</h2>
              <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
              
              <div className="flex flex-col gap-2">
                {deleteModalMsg.senderClerkId === user.id && !deleteModalMsg.isDeleted && (
                  <button 
                    onClick={() => { handleDeleteMessage(deleteModalMsg._id, 'everyone'); setDeleteModalMsg(null); }}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-3 rounded-xl transition-colors text-sm"
                  >
                    Delete for everyone
                  </button>
                )}
                
                <button 
                  onClick={() => { handleDeleteMessage(deleteModalMsg._id, 'me'); setDeleteModalMsg(null); }}
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
      )}
    </div>
  );
};

export default RealtimeChat;
