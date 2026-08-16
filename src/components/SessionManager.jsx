import React, { useEffect, useState, useCallback } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import API_BASE from '../utils/api';

const SessionManager = () => {
  const { signOut } = useClerk();
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [timeoutMs, setTimeoutMs] = useState(null);

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
              if (sessionTimeoutUnit === 'minutes') ms = sessionTimeoutValue * 60 * 1000;
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
      localStorage.removeItem('lastActivity');
      await signOut();
      navigate('/login');
    }
  }, [isSignedIn, signOut, navigate]);

  // Handle activity and check timeout
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !timeoutMs) return;

    // Admin routes might have different rules, but user wants it for ALL users
    // So we apply it everywhere.

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
          // If checkTimeout returns false, it means another tab updated lastActivity
          // So we set another timeout based on the difference
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

    // Throttle activity updates to at most once per minute to save localStorage writes
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

  return null; // This component doesn't render anything
};

export default SessionManager;
