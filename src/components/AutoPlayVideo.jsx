import React, { useRef, useEffect, useState } from 'react';
import { useGlobalMute } from '../hooks/useGlobalMute';

const AutoPlayVideo = ({ src, className, controls = true }) => {
  const videoRef = useRef(null);
  const [isMuted, toggleMute] = useGlobalMute(true);
  const [aspectRatio, setAspectRatio] = useState(null);

  if (!src) return null;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (videoRef.current) {
              videoRef.current.play().catch(err => console.log('Autoplay blocked:', err));
            }
          } else {
            if (videoRef.current) {
              videoRef.current.pause();
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  // Sync video's muted property with global state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Sync global state when user clicks native mute button
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVolumeChange = () => {
      if (video.muted !== isMuted) {
        toggleMute(video.muted);
      }
    };

    video.addEventListener('volumechange', handleVolumeChange);
    return () => video.removeEventListener('volumechange', handleVolumeChange);
  }, [isMuted, toggleMute]);

  const handleLoadedMetadata = (e) => {
    const { videoWidth, videoHeight } = e.target;
    if (videoWidth && videoHeight) {
      setAspectRatio(videoWidth / videoHeight);
    }
  };

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className || ''}`}>
      <video
        ref={videoRef}
        src={src}
        onLoadedMetadata={handleLoadedMetadata}
        style={aspectRatio ? { aspectRatio: `${aspectRatio}` } : undefined}
        className={className?.includes('object-cover') ? "w-full h-full object-cover" : "w-auto max-w-full h-auto max-h-full object-contain"}
        controls={controls}
        autoPlay
        loop
        playsInline
      />
    </div>
  );
};

export default AutoPlayVideo;
