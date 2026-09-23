import { io } from 'socket.io-client';
import { Capacitor } from '@capacitor/core';
import { PRODUCTION_BACKEND_URL } from '../utils/appUrl';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL && !import.meta.env.VITE_SOCKET_URL.includes('localhost')) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (import.meta.env.VITE_BACKEND_URL && !import.meta.env.VITE_BACKEND_URL.includes('localhost')) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  // Local development on desktop
  if (import.meta.env.DEV && typeof window !== 'undefined' && !Capacitor.isNativePlatform() && window.location.hostname === 'localhost') {
    return 'http://localhost:5001';
  }
  // Production Web & Mobile App: connect to Render backend
  return PRODUCTION_BACKEND_URL;
};

export const socket = io(getSocketUrl(), {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

export default socket;
