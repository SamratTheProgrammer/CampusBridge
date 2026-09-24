import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { useTheme } from '../ThemeProvider';
import { socket } from '../../services/socket';
import toast from 'react-hot-toast';

const ROOT_PATHS = ['/', '/dashboard', '/mentor-dashboard', '/admin', '/login', '/signup'];

const CapacitorInit = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const lastBackPressRef = useRef(0);

  // Initialize native platform features (Status Bar, Splash Screen, Back Button)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Mark native app environment for mobile-specific top gap and safe areas
    document.documentElement.classList.add('cb-capacitor-app');
    document.body.classList.add('cb-capacitor-app');

    // Hide native splash screen once React has mounted
    const hideSplash = async () => {
      try {
        await SplashScreen.hide({ fadeOutDuration: 300 });
      } catch (err) {
        console.warn('Splash screen hide error:', err);
      }
    };
    hideSplash();

    // Android Hardware Back Button Handling
    let backListener = null;
    const setupBackListener = async () => {
      try {
        backListener = await CapApp.addListener('backButton', ({ canGoBack }) => {
          const currentPath = window.location.pathname;
          const isAtRoot = ROOT_PATHS.includes(currentPath);

          // If at a root screen, require double tap within 2 seconds to exit the app
          if (isAtRoot) {
            const now = Date.now();
            if (now - lastBackPressRef.current < 2000) {
              CapApp.exitApp();
            } else {
              lastBackPressRef.current = now;
              toast('Press back again to exit CampusBridge', {
                id: 'exit-toast',
                duration: 2000,
                icon: '📱',
              });
            }
          } else {
            // Navigate back in React Router history
            navigate(-1);
          }
        });
      } catch (err) {
        console.warn('Back button listener error:', err);
      }
    };

    setupBackListener();

    // Reconnect Socket & restore RTC signaling when app resumes from background
    let appStateListener = null;
    const setupAppStateListener = async () => {
      try {
        appStateListener = await CapApp.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            if (!socket.connected) {
              socket.connect();
            }
            window.dispatchEvent(new CustomEvent('capacitor-app-resumed'));
          }
        });
      } catch (err) {
        console.warn('AppState listener error:', err);
      }
    };

    setupAppStateListener();

    return () => {
      if (backListener && typeof backListener.remove === 'function') {
        backListener.remove();
      }
      if (appStateListener && typeof appStateListener.remove === 'function') {
        appStateListener.remove();
      }
    };
  }, [navigate]);

  // Sync native status bar with current app theme
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const updateStatusBar = async () => {
      try {
        const isDark = document.documentElement.classList.contains('dark') || theme === 'dark';
        await StatusBar.setStyle({
          style: isDark ? Style.Dark : Style.Light,
        });
        await StatusBar.setBackgroundColor({
          color: isDark ? '#0a0f1d' : '#ffffff',
        });
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.show();
      } catch (err) {
        console.warn('Status bar update error:', err);
      }
    };

    updateStatusBar();
  }, [theme, location.pathname]);

  return null;
};

export default CapacitorInit;
