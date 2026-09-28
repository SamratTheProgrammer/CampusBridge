import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useClerk, useUser, useSession } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import API_BASE from '../utils/api';
import socket from '../services/socket';
import useCurrentDevice from '../hooks/useCurrentDevice';
import SessionDisconnectModal from './modals/SessionDisconnectModal';

const SessionManager = () => {
  const { signOut } = useClerk();
  const { user, isSignedIn, isLoaded } = useUser();
  const { session: currentSession } = useSession();
  const currentDeviceInfo = useCurrentDevice();
  const navigate = useNavigate();
  const location = useLocation();
  const [timeoutMs, setTimeoutMs] = useState(null);

  // Remote Disconnect State
  const [isDisconnectedModalOpen, setIsDisconnectedModalOpen] = useState(false);
  const [disconnectDetails, setDisconnectDetails] = useState(null);
  const isRegisteredRef = useRef(false);

  // Fetch session timeout settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/settings/public`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.securitySettings) {
            const { sessionTimeoutValue, sessionTimeoutUnit } = data.securitySettings;
            let ms = 60 * 60 * 1000; // default 60 minutes
            if (sessionTimeoutValue && sessionTimeoutUnit) {
              if (sessionTimeoutUnit === 'never') ms = null;
              else if (sessionTimeoutUnit === 'minutes') ms = sessionTimeoutValue * 60 * 1000;
              else if (sessionTimeoutUnit === 'days') ms = sessionTimeoutValue * 24 * 60 * 60 * 1000;
              else if (sessionTimeoutUnit === 'months') ms = sessionTimeoutValue * 30 * 24 * 60 * 60 * 1000;
            }
            setTimeoutMs(ms);
          }
        }
      } catch (err) {
        console.error('Failed to fetch security settings', err);
        setTimeoutMs(60 * 60 * 1000); // Fallback to 60 mins
      }
    };
    fetchSettings();
  }, []);

  const handleSignOut = useCallback(async () => {
    if (isSignedIn) {
      toast.error('Session expired due to inactivity.');
      sessionStorage.removeItem('campusbridge_user_role');
      localStorage.removeItem('campusbridge_user_role');
      localStorage.removeItem('campusbridge_logged_in');
      localStorage.removeItem('lastActivity');
      await signOut();
      navigate('/login');
    }
  }, [isSignedIn, signOut, navigate]);

  // Sync login status flag whenever signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      localStorage.setItem('campusbridge_logged_in', 'true');
    }
  }, [isLoaded, isSignedIn]);

  // Handle remote disconnect acknowledgement
  const handleAcknowledgeDisconnect = useCallback(async () => {
    setIsDisconnectedModalOpen(false);
    sessionStorage.removeItem('campusbridge_user_role');
    localStorage.removeItem('campusbridge_user_role');
    localStorage.removeItem('campusbridge_logged_in');
    localStorage.removeItem('lastActivity');
    try {
      await signOut();
    } catch (e) {}
    navigate('/login');
  }, [signOut, navigate]);

  const handleGoToResetPassword = useCallback(async () => {
    setIsDisconnectedModalOpen(false);
    sessionStorage.removeItem('campusbridge_user_role');
    localStorage.removeItem('campusbridge_user_role');
    localStorage.removeItem('campusbridge_logged_in');
    localStorage.removeItem('lastActivity');
    try {
      await signOut();
    } catch (e) {}
    navigate('/forgot-password');
  }, [signOut, navigate]);

  // Register device session with backend and Socket.io
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || !currentSession?.id) return;

    const sessionId = currentSession.id;
    const userId = user.id;

    const registerSession = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/device-sessions/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clerkId: userId,
            sessionId,
            deviceInfo: currentDeviceInfo,
          }),
        });

        const data = await res.json();
        if (data.revoked) {
          // This session is already revoked!
          setDisconnectDetails(data);
          setIsDisconnectedModalOpen(true);
          return;
        }

        // Register session on socket
        socket.emit('register_session', {
          userId,
          sessionId,
          deviceInfo: currentDeviceInfo,
        });
        isRegisteredRef.current = true;
      } catch (err) {
        console.debug('Session register error:', err);
      }
    };

    registerSession();

    // Re-register if socket reconnects
    const onSocketConnect = () => {
      socket.emit('register_session', {
        userId,
        sessionId,
        deviceInfo: currentDeviceInfo,
      });
    };
    socket.on('connect', onSocketConnect);

    // Listen for remote disconnect events from Socket.io
    const onSessionDisconnected = (data) => {
      if (!data?.sessionId || data.sessionId === sessionId) {
        setDisconnectDetails(data);
        setIsDisconnectedModalOpen(true);
      }
    };

    socket.on('session_disconnected', onSessionDisconnected);

    // Periodic check and check on tab focus
    const checkSessionStatus = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(
          `${API_BASE}/api/device-sessions/check-status?clerkId=${userId}&sessionId=${sessionId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.revoked) {
            setDisconnectDetails(data);
            setIsDisconnectedModalOpen(true);
          }
        }
      } catch (e) {}
    };

    const statusInterval = setInterval(checkSessionStatus, 30000);
    window.addEventListener('focus', checkSessionStatus);

    return () => {
      socket.off('connect', onSocketConnect);
      socket.off('session_disconnected', onSessionDisconnected);
      clearInterval(statusInterval);
      window.removeEventListener('focus', checkSessionStatus);
    };
  }, [isLoaded, isSignedIn, user, currentSession?.id, currentDeviceInfo]);

  // Handle activity and check timeout
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !timeoutMs) return;

    const checkTimeout = () => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity) {
        const inactiveDuration = Date.now() - parseInt(lastActivity, 10);
        if (inactiveDuration >= timeoutMs) {
          handleSignOut();
          return true; // was timed out
        }
      }
      return false;
    };

    // Check immediately on mount/reload
    if (checkTimeout()) return;

    let timeoutId;
    
    const resetTimer = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!checkTimeout()) {
          const last = parseInt(localStorage.getItem('lastActivity') || '0', 10);
          const diff = Date.now() - last;
          if (diff < timeoutMs) {
            timeoutId = setTimeout(checkTimeout, timeoutMs - diff);
          } else {
            handleSignOut();
          }
        }
      }, timeoutMs);
    };

    // Initialize timer
    resetTimer();

    // Throttle activity updates to at most once per minute
    let throttleTimeout = null;
    const updateActivity = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          resetTimer();
          throttleTimeout = null;
        }, 60000); // 1 minute throttle
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Listen to storage events to keep tabs in sync
    const handleStorageChange = (e) => {
      if (e.key === 'lastActivity') {
        resetTimer();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (throttleTimeout) clearTimeout(throttleTimeout);
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isLoaded, isSignedIn, timeoutMs, handleSignOut, location.pathname]);

  return (
    <SessionDisconnectModal
      isOpen={isDisconnectedModalOpen}
      disconnectDetails={disconnectDetails}
      onConfirmLogin={handleAcknowledgeDisconnect}
      onResetPassword={handleGoToResetPassword}
    />
  );
};

export default SessionManager;
