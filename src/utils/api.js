/**
 * Central API configuration utility.
 * Reads VITE_BACKEND_URL from environment and provides the base URL for all API calls.
 * In development, Vite proxy handles routing so this can be empty.
 * In production (Vercel), this should point to the deployed backend URL.
 */

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

/**
 * Returns the full API URL by prepending the backend base URL.
 * @param {string} path - The API path starting with /api/...
 * @returns {string} Full URL
 */
export const apiUrl = (path) => `${API_BASE}${path}`;

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
  return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken') || '';
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

    // Check if this is an admin request requiring admin authorization
    if (url && (url.includes('/api/admin') || url.includes('admin_override=true')) && !url.includes('/api/admin/login')) {
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
        !url.includes('/api/admin/login')
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
