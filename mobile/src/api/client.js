import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://campus-bridge-five.vercel.app';

const apiClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Clerk token
apiClient.interceptors.request.use(
  (config) => {
    if (config.token) {
      config.headers.Authorization = `Bearer ${config.token}`;
      delete config.token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — handled at screen level
      console.warn('Unauthorized request');
    }
    return Promise.reject(error);
  }
);

// Helper to make auth'd requests
export const authRequest = async (method, url, getToken, data = null) => {
  const token = await getToken();
  const config = { token };
  if (data) {
    return apiClient[method](url, data, config);
  }
  return apiClient[method](url, config);
};

export default apiClient;
