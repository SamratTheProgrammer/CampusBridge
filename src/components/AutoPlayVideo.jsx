import React, { useRef, useEffect } from 'react';

const AutoPlayVideo = ({ src, className, controls = true }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Video is visible, try to play
            if (videoRef.current) {
              videoRef.current.play().catch(err => console.log('Autoplay blocked:', err));
            }
          } else {
            // Video is out of viewport, pause
            if (videoRef.current) {
              videoRef.current.pause();
            }
          }
        });
      },
      { threshold: 0.5 } // Play when at least 50% of the video is visible
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

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      controls={controls}
      muted
      loop
      playsInline
    />
  );
};

export default AutoPlayVideo;
