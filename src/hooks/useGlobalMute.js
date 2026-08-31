import { useState, useEffect } from 'react';

const MUTE_STORAGE_KEY = 'campusbridge_video_muted';

export const useGlobalMute = (initialState = true) => {
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem(MUTE_STORAGE_KEY);
    return saved !== null ? saved === 'true' : initialState;
  });

  useEffect(() => {
    const handleMuteChange = (e) => {
      setIsMuted(e.detail.isMuted);
    };

    window.addEventListener('videoMuteChange', handleMuteChange);
    return () => window.removeEventListener('videoMuteChange', handleMuteChange);
  }, []);

  const toggleMute = (muted) => {
    const newMuted = typeof muted === 'boolean' ? muted : !isMuted;
    if (newMuted !== isMuted) {
      setIsMuted(newMuted);
      localStorage.setItem(MUTE_STORAGE_KEY, newMuted.toString());
      window.dispatchEvent(new CustomEvent('videoMuteChange', { detail: { isMuted: newMuted } }));
    }
  };

  return [isMuted, toggleMute];
};
