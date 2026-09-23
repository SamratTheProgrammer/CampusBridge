import { Capacitor } from '@capacitor/core';

export const PRODUCTION_FRONTEND_URL = 'https://campus-bridge-x5rl.vercel.app';
export const PRODUCTION_BACKEND_URL = 'https://campusbridge-pdtz.onrender.com';

// Backward compatibility
export const PRODUCTION_URL = PRODUCTION_FRONTEND_URL;

/**
 * Returns the canonical frontend base URL for the application.
 * On mobile, native Capacitor platform, production builds, or when origin is localhost,
 * this strictly returns https://campus-bridge-x5rl.vercel.app.
 */
export const getAppBaseUrl = () => {
  if (typeof window !== 'undefined') {
    if (Capacitor.isNativePlatform() || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return PRODUCTION_FRONTEND_URL;
    }
    return window.location.origin;
  }
  return PRODUCTION_FRONTEND_URL;
};

/**
 * Returns a fully-qualified URL for a path using the canonical frontend URL.
 * Guarantees 'localhost' is never returned on mobile or in production.
 * @param {string} path 
 * @returns {string} E.g. 'https://campus-bridge-x5rl.vercel.app/sync-user'
 */
export const getAppUrl = (path = '') => {
  const base = getAppBaseUrl();
  if (!path) return base;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

/**
 * Returns the backend API base URL for network requests.
 * - In local development on desktop (npm run dev with Vite proxy): returns ''
 * - In production web app (Vercel) and mobile app: returns 'https://campusbridge-pdtz.onrender.com'
 */
export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL && !import.meta.env.VITE_BACKEND_URL.includes('localhost')) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (import.meta.env.DEV && typeof window !== 'undefined' && !Capacitor.isNativePlatform() && window.location.hostname === 'localhost') {
    return '';
  }
  return PRODUCTION_BACKEND_URL;
};

export default getAppUrl;
