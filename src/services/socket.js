import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname;
    // If accessing via local network or dev port (e.g., 5173, 5174, etc.)
    if (window.location.port && window.location.port !== '5000' && window.location.port !== '80' && window.location.port !== '443') {
      return `${protocol}//${hostname}:5000`;
    }
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

export const socket = io(getSocketUrl(), {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

socket.on('connect', () => {
  console.log('[Socket] Connected successfully:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('[Socket] Connection error:', err.message);
});

socket.on('disconnect', (reason) => {
  console.log('[Socket] Disconnected:', reason);
});

export default socket;
