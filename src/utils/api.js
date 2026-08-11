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

export default API_BASE;
