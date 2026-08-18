import React, { useEffect, useState } from 'react';
import { useToaster } from 'react-hot-toast';
import notificationSound from '../assets/audio/notification-sound.mp3';

export default function ToastSoundEffect() {
  const { toasts } = useToaster();
  const [playedIds, setPlayedIds] = useState(new Set());

  useEffect(() => {
    const newToasts = toasts.filter(t => t.visible && !playedIds.has(t.id));
    
    if (newToasts.length > 0) {
      const audio = new Audio(notificationSound);
      audio.play().catch(e => console.error('Audio playback failed:', e));
      
      setPlayedIds(prev => {
        const next = new Set(prev);
        newToasts.forEach(t => next.add(t.id));
        return next;
      });
    }
  }, [toasts, playedIds]);

  // Cleanup old ids to prevent memory leak
  useEffect(() => {
    const visibleIds = new Set(toasts.map(t => t.id));
    setPlayedIds(prev => {
      const next = new Set(prev);
      for (const id of next) {
        if (!visibleIds.has(id)) {
          next.delete(id);
        }
      }
      return next;
    });
  }, [toasts]);

  return null;
}
