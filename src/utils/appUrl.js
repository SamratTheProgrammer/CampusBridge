import { Capacitor } from '@capacitor/core';

export const PRODUCTION_URL = 'https://campus-bridge-x5rl.vercel.app';

/**
 * Returns the canonical base URL for the application.
 * On mobile, native Capacitor platform, production builds, or when origin is localhost,
 * this strictly returns https://campus-bridge-x5rl.vercel.app.
 */
export const getAppBaseUrl = () => {
  if (typeof window !== 'undefined') {
    if (Capacitor.isNativePlatform() || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return PRODUCTION_URL;
    }
    return window.location.origin;
  }
  return PRODUCTION_URL;
};

/**
 * Returns a fully-qualified URL for a path using the canonical base URL.
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

export default getAppUrl;
