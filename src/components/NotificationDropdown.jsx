import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Trash2, UserPlus, CheckCircle2, XCircle, Heart, MessageSquare, Calendar, Sparkles, X, Settings, User, ArrowLeft, Volume2, AlertTriangle } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../services/socket';
import { ringtoneService } from '../utils/ringtone';
import toast from 'react-hot-toast';
import API_BASE from '../utils/api'
import { formatTime } from '../utils/dateFormatter'
import ModalPortal from './modals/ModalPortal'

const NotificationDropdown = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(
    localStorage.getItem('campusbridge_notification_sound') !== 'false'
  );
  const [warningModal, setWarningModal] = useState({ isOpen: false, notification: null });
  const dropdownRef = useRef(null);

  const handleToggleSound = () => {
    const newSound = !soundEnabled;
    setSoundEnabled(newSound);
    localStorage.setItem('campusbridge_notification_sound', newSound.toString());
    if (newSound) {
      try {
        ringtoneService.playNotificationSound();
      } catch (e) {}
      toast.success('Notification sound enabled');
    } else {
      toast.success('Notification sound disabled');
    }
  };

  const fetchNotifications = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const isAdminPath = window.location.pathname.includes('/admin');
      const isAdmin = !!adminToken && isAdminPath;
      const currentUserId = isAdmin ? 'admin' : user?.id;
      if (!currentUserId) return;

      const res = await fetch(`${API_BASE}/api/notifications/${currentUserId}`, { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      // Silently ignore network/abort errors — polling will retry
      if (err.name !== 'AbortError') {
        console.debug('Notification fetch skipped:', err.message);
      }
    } finally {
      clearTimeout(timeout);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  // Fetch initial push preferences
  useEffect(() => {
    if (user?.id) {
      fetch(`${API_BASE}/api/push/preferences/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.pushEnabled !== undefined) setPushEnabled(data.pushEnabled);
        })
        .catch(err => console.error('Failed to fetch push pref:', err));
    }
  }, [user]);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleTogglePush = async () => {
    if (!user?.id) return;
    setIsPushLoading(true);
    try {
      const newPref = !pushEnabled;
      
      // Update DB preference
      await fetch(`${API_BASE}/api/push/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id, pushEnabled: newPref })
      });
      
      setPushEnabled(newPref);

      if (newPref && 'serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
          });
        }
        
        // Send to backend
        await fetch(`${API_BASE}/api/push/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clerkId: user.id, subscription })
        });
        toast.success('Push notifications enabled!');
      } else if (!newPref && 'serviceWorker' in navigator && 'PushManager' in window) {
        toast.success('Push notifications disabled.');
      }
    } catch (err) {
      console.error('Error toggling push notifications:', err);
      toast.error('Failed to update push settings. Make sure your browser allows notifications.');
      // Revert state if failed
      setPushEnabled(prev => !prev);
    } finally {
      setIsPushLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'connection_request':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'connection_accepted':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'connection_declined':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'post_like':
        return <Heart className="w-4 h-4 text-pink-500 fill-current" />;
      case 'post_comment':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'session_booked':
        return <Calendar className="w-4 h-4 text-amber-500" />;
      case 'admin':
        return <Bell className="w-4 h-4 text-amber-500" />;
      default:
        return <User className="w-4 h-4 text-primary" />;
    }
  };

  const navigateNotification = (link, notificationItem = null) => {
    if (!link) return;
    
    // Check if link opens a shared modal item (post, job, event)
    const hasItemParam = link.includes('post=') || link.includes('job=') || link.includes('event=');
    if (hasItemParam) {
      const queryIndex = link.indexOf('?');
      const search = queryIndex !== -1 ? link.substring(queryIndex) : (link.startsWith('?') ? link : `?${link}`);
      
      // Navigate on the CURRENT page's pathname so the background page NEVER reloads or unmounts.
      // SharedItemViewer is a global component and will immediately open over the current page.
      navigate(`${location.pathname}${search}`, { state: { _ts: Date.now() } });
      return;
    }

    // If it's a generic dashboard link with no item query, avoid reloading if already on a dashboard page
    if (link === '/dashboard' || link === '/mentor-dashboard') {
      if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/mentor-dashboard')) {
        return;
      }
    }

    let targetLink = link;
    const userRole = sessionStorage.getItem('campusbridge_user_role') || user?.publicMetadata?.role || 'student';
    if ((userRole === 'mentor' || userRole === 'alumni') && targetLink.startsWith('/dashboard')) {
      targetLink = targetLink.replace('/dashboard', '/mentor-dashboard');
    } else if (userRole === 'student' && targetLink.startsWith('/mentor-dashboard')) {
      targetLink = targetLink.replace('/mentor-dashboard', '/dashboard');
    }
    
    navigate(targetLink, { state: { _ts: Date.now() } });
  };

  useEffect(() => {
    const handleNewNotification = (notification) => {
      const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const isAdminPath = window.location.pathname.includes('/admin');
      const isAdmin = !!adminToken && isAdminPath;
      const currentUserId = isAdmin ? 'admin' : user?.id;

      if (notification.recipientClerkId !== currentUserId) return;

      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      try {
        const soundEnabled = localStorage.getItem('campusbridge_notification_sound') !== 'false';
        if (soundEnabled) {
          ringtoneService.playNotificationSound();
        }
      } catch(e){}

      toast.custom(
        (t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              setIsOpen(false);
              navigateNotification(notification.link, notification);
            }}
            className={`${
              t.visible ? 'animate-in slide-in-from-top-3 fade-in duration-300' : 'animate-out slide-out-to-top-3 fade-out duration-200'
            } max-w-md w-full bg-card/95 backdrop-blur-md shadow-2xl rounded-2xl pointer-events-auto flex items-stretch border border-border/80 ring-1 ring-primary/20 hover:border-primary/50 transition-all cursor-pointer group hover:scale-[1.01]`}
          >
            <div className="flex-1 min-w-0 p-4">
              <div className="flex items-start gap-3">
                {notification.senderImage ? (
                  <div className="relative shrink-0 pt-0.5">
                    <img
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-background"
                      src={notification.senderImage}
                      alt={notification.senderName || 'User'}
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center shadow-xs">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                ) : (
                  <div className="shrink-0 pt-0.5">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {notification.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0 font-medium">Just now</span>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {notification.message}
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium text-primary flex items-center gap-1 group-hover:underline">
                    Click to view {notification.type?.includes('comment') ? 'comment' : 'post'} →
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center border-l border-border/50 px-2 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t.id);
                }}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ),
        { duration: 6000, position: 'top-center' }
      );
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [user, navigate]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await fetch(`${API_BASE}/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    const isAdmin = !!adminToken;
    const currentUserId = isAdmin ? 'admin' : user?.id;
    if (!currentUserId) return;
    try {
      await fetch(`${API_BASE}/api/notifications/read-all/${currentUserId}`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE}/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => {
        const target = prev.find(n => n._id === id);
        if (target && !target.isRead) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(n => n._id !== id);
      });
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleClearAll = async () => {
    const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    const isAdmin = !!adminToken;
    const currentUserId = isAdmin ? 'admin' : user?.id;
    if (!currentUserId) return;
    try {
      await fetch(`${API_BASE}/api/notifications/clear-all/${currentUserId}`, { method: 'DELETE' });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) {
      handleMarkAsRead(n._id);
    }
    
    // Check if it's an admin warning
    if (n.type === 'admin_warning' || n.type === 'admin' || (n.title && n.title.toLowerCase().includes('warning'))) {
      setIsOpen(false);
      setWarningModal({ isOpen: true, notification: n });
      return;
    }

    setIsOpen(false);
    if (n.link) {
      navigateNotification(n.link, n);
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead) 
    : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors relative focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-destructive rounded-full border-2 border-background animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-16 right-2 left-2 sm:absolute sm:top-full sm:right-0 sm:left-auto mt-2 w-auto sm:w-[380px] bg-card border border-border/80 rounded-2xl shadow-2xl z-[100] overflow-hidden"
          >
            {isSettingsOpen ? (
              // Settings View
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-border/40 flex items-center justify-between bg-muted/20">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsSettingsOpen(false)}
                      className="p-1 -ml-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                      title="Back to notifications"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <Settings className="w-4 h-4 text-primary" /> Settings
                    </h3>
                  </div>
                  <button 
                    onClick={() => { setIsSettingsOpen(false); setIsOpen(false); }}
                    className="p-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  {/* Push Notifications */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Push Notifications</h4>
                      <p className="text-xs text-muted-foreground mt-1">Receive notifications on your device even when the app is closed.</p>
                    </div>
                    <button
                      onClick={handleTogglePush}
                      disabled={isPushLoading}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none transition-colors ${
                        pushEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                      } ${isPushLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          pushEnabled ? 'translate-x-2' : '-translate-x-2'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Notification Sound */}
                  <div className="flex items-start justify-between gap-4 pt-4 border-t border-border/40">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-primary" /> Notification Sound
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">Play sound alert when new notifications arrive.</p>
                    </div>
                    <button
                      onClick={handleToggleSound}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none transition-colors ${
                        soundEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          soundEnabled ? 'translate-x-2' : '-translate-x-2'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Notifications View
              <>
                {/* Header */}
                <div className="p-4 border-b border-border/40 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-1.5 text-xs text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  title="Notification Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="p-1.5 text-xs text-primary hover:bg-primary/10 rounded-lg font-medium transition-colors flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Read All
                  </button>
                )}
                {notifications.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    className="p-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Clear all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-border/40 px-4 py-2 gap-2 text-xs bg-card">
              <button 
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
              >
                All ({notifications.length})
              </button>
              <button 
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${filter === 'unread' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto overscroll-contain divide-y divide-border/30">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((n) => (
                  <div 
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3.5 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3 items-start relative group ${!n.isRead ? 'bg-primary/5' : ''}`}
                  >
                    {/* Icon or Sender DP */}
                    <div className="relative shrink-0 mt-0.5">
                      {n.senderImage ? (
                        <>
                          <img src={n.senderImage} alt={n.senderName} className="w-9 h-9 rounded-full object-cover border border-border/50" />
                          <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 border border-border/50 shadow-sm">
                            {getNotificationIcon(n.type)}
                          </div>
                        </>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center border border-border/50 shadow-sm">
                          {getNotificationIcon(n.type)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <p className={`text-xs font-semibold text-foreground ${!n.isRead ? 'text-primary' : ''}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>

                    {/* Actions on hover */}
                    <button 
                      onClick={(e) => handleDelete(n._id, e)}
                      className="absolute right-3 top-3 p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-muted"
                      title="Delete notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary absolute right-3 bottom-3"></span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground space-y-2">
                  <Bell className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs font-medium">No {filter === 'unread' ? 'unread' : ''} notifications</p>
                </div>
              )}
            </div>
          </>
        )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning Modal */}
      {warningModal.isOpen && warningModal.notification && (
        <ModalPortal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200 relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500"></div>
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Important Notice</h2>
              <p className="text-sm font-semibold text-foreground/90 mb-1">{warningModal.notification.title}</p>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {warningModal.notification.message}
              </p>
              
              <div className="bg-muted/30 border border-border/40 rounded-xl p-4 mb-6">
                <p className="text-xs text-muted-foreground">
                  If you have questions or believe this is a mistake, please reach out to the moderation team.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setWarningModal({ isOpen: false, notification: null })}
                  className="px-4 py-2 border border-border/60 hover:bg-muted font-semibold text-foreground rounded-xl transition-all cursor-pointer text-sm"
                >
                  Close
                </button>
                <a 
                  href="mailto:support@campusbridge.com"
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 font-semibold text-white rounded-xl transition-all shadow-sm shadow-rose-500/10 inline-flex items-center gap-2 cursor-pointer text-sm"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default NotificationDropdown;
