import { Capacitor } from '@capacitor/core';
import { getApiBaseUrl, PRODUCTION_BACKEND_URL } from './appUrl';

const API_BASE = getApiBaseUrl();

/**
 * Returns the full API URL by prepending the backend base URL.
 * @param {string} path - The API path starting with /api/...
 * @returns {string} Full URL
 */
export const apiUrl = (path) => {
  if (!path) return API_BASE;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) return cleanPath;
  return `${API_BASE}${cleanPath}`;
};

export const getProfilePath = (target, role = 'student') => {
  if (!target) return '#';
  const id = target.username || target.clerkId || target._id || target;
  if (role === 'mentor' || role === 'alumni') return '/mentor-dashboard/profile/' + id;
  if (role === 'admin') return '/profile/' + id;
  return '/dashboard/profile/' + id;
};

/**
 * Retrieve current admin authentication token from storage
 */
export const getAdminToken = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '';
};

/**
 * Returns request headers with admin authorization token attached
 */
export const getAdminHeaders = (extraHeaders = {}) => {
  const token = getAdminToken();
  const headers = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-admin-token'] = token;
  }
  return headers;
};

/**
 * Global fetch interceptor:
 * Evaluated immediately at module level so it is guaranteed to be active
 * BEFORE any React component mounts or any child useEffect fires.
 * Automatically injects the admin token for all /api/admin requests and admin_override queries.
 * Also handles 401 Unauthorized by clearing invalid tokens and redirecting to login.
 */
if (typeof window !== 'undefined' && !window.__campusBridgeFetchPatched) {
  window.__campusBridgeFetchPatched = true;
  const originalFetch = window.fetch;

  window.fetch = async (input, init = {}) => {
    let url = typeof input === 'string' ? input : input?.url;

    // Automatically route relative /api calls to API_BASE if configured
    if (url && typeof url === 'string' && url.startsWith('/api') && API_BASE) {
      const fullUrl = `${API_BASE}${url}`;
      input = typeof input === 'string' ? fullUrl : new Request(fullUrl, input);
      url = fullUrl;
    }

    // Check if this is an admin request requiring admin authorization
    // Only GET /api/admin/settings/theme is public (ThemeProvider); PUT requires admin token!
    const isMethodGet = !init.method || init.method.toUpperCase() === 'GET';
    const isPublicThemeGet = url && url.includes('/api/admin/settings/theme') && isMethodGet;

    if (
      url && 
      (url.includes('/api/admin') || url.includes('admin_override=true')) && 
      !url.includes('/api/admin/login') &&
      !isPublicThemeGet
    ) {
      const token = getAdminToken();
      if (token) {
        if (init.headers instanceof Headers) {
          if (!init.headers.has('Authorization')) init.headers.set('Authorization', `Bearer ${token}`);
          if (!init.headers.has('x-admin-token')) init.headers.set('x-admin-token', token);
        } else if (Array.isArray(init.headers)) {
          const h = new Headers(init.headers);
          if (!h.has('Authorization')) h.set('Authorization', `Bearer ${token}`);
          if (!h.has('x-admin-token')) h.set('x-admin-token', token);
          init = { ...init, headers: h };
        } else {
          init = {
            ...init,
            headers: {
              ...(init.headers || {}),
              Authorization: `Bearer ${token}`,
              'x-admin-token': token
            }
          };
        }
      }
    }

    try {
      const response = await originalFetch(input, init);

      // Handle 401 Unauthorized for admin endpoints
      if (
        response.status === 401 && 
        url && 
        (url.includes('/api/admin') || url.includes('admin_override=true')) && 
        !url.includes('/api/admin/login') &&
        !isPublicThemeGet
      ) {
        // If user is currently in the admin section, clear invalid/expired token and redirect to login
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          console.warn('[CampusBridge Admin] Session token invalid or expired. Resetting auth state.');
          localStorage.removeItem('adminToken');
          sessionStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          sessionStorage.removeItem('adminUser');
          localStorage.removeItem('adminTokenExpiry');
          sessionStorage.removeItem('adminTokenExpiry');

          if (!window.__adminRedirectTimeout) {
            window.__adminRedirectTimeout = setTimeout(() => {
              window.__adminRedirectTimeout = null;
              window.location.href = '/admin/login?expired=true';
            }, 250);
          }
        }
      }

      return response;
    } catch (fetchErr) {
      throw fetchErr;
    }
  };
}

export default API_BASE;
