import { io } from 'socket.io-client';
import { Capacitor } from '@capacitor/core';
import { PRODUCTION_BACKEND_URL } from '../utils/appUrl';

const getSocketUrl = () => {
  // If explicitly configured in env
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  // Local development on desktop/browser
  if (import.meta.env.DEV && typeof window !== 'undefined' && !Capacitor.isNativePlatform()) {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:5001`;
  }
  if (import.meta.env.VITE_BACKEND_URL && !import.meta.env.VITE_BACKEND_URL.includes('localhost')) {
    return import.meta.env.VITE_BACKEND_URL;
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
