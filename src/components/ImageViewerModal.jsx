import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import AutoPlayVideo from './AutoPlayVideo';
import ModalPortal from './modals/ModalPortal';

const optimizeUrl = (url) => {
  if (url && url.includes('cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/q_auto,f_auto,w_1600/');
  }
  return url;
};

const ImageViewerModal = ({ isOpen, mediaFiles = [], initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [containerEl, setContainerEl] = useState(null);

  const contentWrapperRef = useRef(null);
  const modalContainerRef = useRef(null);
  const touchMovedRef = useRef(false);

  // Normalize mediaFiles to array of objects with valid url
  const files = React.useMemo(() => {
    if (!mediaFiles) return [];
    if (typeof mediaFiles === 'string') return [{ url: mediaFiles, mediaType: 'image' }];
    if (!Array.isArray(mediaFiles)) return [];
    return mediaFiles
      .filter(Boolean)
      .map(file => {
        if (typeof file === 'string') return { url: file, mediaType: 'image' };
        return file;
      })
      .filter(file => !!file?.url);
  }, [mediaFiles]);

  const safeIndex = Math.min(Math.max(currentIndex, 0), Math.max(0, files.length - 1));
  const activeMedia = files[safeIndex] || null;
  const isVideo = activeMedia?.mediaType === 'video' || (activeMedia?.url && activeMedia.url.match(/\.(mp4|webm|ogg)$/i));

  // Mutable refs for tracking gestures across frames without stale closures
  const scaleRef = useRef(1);
  const positionRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  scaleRef.current = scale;
  positionRef.current = position;
  isDraggingRef.current = isDragging;

  const isPinchingRef = useRef(false);
  const isPanningRef = useRef(false);

  const pinchDataRef = useRef({
    initialDist: 0,
    initialScale: 1,
    initialPos: { x: 0, y: 0 },
    initialCenter: { x: 0, y: 0 },
  });

  const panDataRef = useRef({
    startX: 0,
    startY: 0,
    initialPos: { x: 0, y: 0 },
  });

  const tapDataRef = useRef({
    lastTapTime: 0,
    lastTapPos: { x: 0, y: 0 },
  });

  const swipeDataRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
  });

  const mouseStateRef = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    startPos: { x: 0, y: 0 },
  });

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    scaleRef.current = 1;
    positionRef.current = { x: 0, y: 0 };
    setIsDragging(false);
    isDraggingRef.current = false;
    isPinchingRef.current = false;
    isPanningRef.current = false;
    if (contentWrapperRef.current) {
      contentWrapperRef.current.style.transition = 'transform 0.22s cubic-bezier(0.2, 0, 0.2, 1)';
      contentWrapperRef.current.style.transform = 'translate3d(0px, 0px, 0px) scale(1)';
    }
  }, []);

  const getClampedPosition = useCallback((x, y, s) => {
    if (s <= 1.02) return { x: 0, y: 0 };
    const maxPanX = Math.max(0, ((s - 1) * window.innerWidth) / 2 + 50);
    const maxPanY = Math.max(0, ((s - 1) * window.innerHeight) / 2 + 50);
    return {
      x: Math.min(Math.max(x, -maxPanX), maxPanX),
      y: Math.min(Math.max(y, -maxPanY), maxPanY),
    };
  }, []);

  const handleZoomIn = useCallback((e) => {
    e?.stopPropagation();
    setScale(prevScale => {
      const nextScale = Math.min(prevScale + 0.5, 5);
      setPosition(prevPos => getClampedPosition(prevPos.x, prevPos.y, nextScale));
      return nextScale;
    });
  }, [getClampedPosition]);

  const handleZoomOut = useCallback((e) => {
    e?.stopPropagation();
    setScale(prevScale => {
      const nextScale = Math.max(prevScale - 0.5, 1);
      if (nextScale <= 1.05) {
        setPosition({ x: 0, y: 0 });
        return 1;
      }
      setPosition(prevPos => getClampedPosition(prevPos.x, prevPos.y, nextScale));
      return nextScale;
    });
  }, [getClampedPosition]);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetZoom();
    }
  }, [isOpen, initialIndex, resetZoom]);

  useEffect(() => {
    resetZoom();
  }, [currentIndex, resetZoom]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentIndex < files.length - 1 && scale <= 1.05) {
        setCurrentIndex(prev => prev + 1);
      }
      if (e.key === 'ArrowLeft' && currentIndex > 0 && scale <= 1.05) {
        setCurrentIndex(prev => prev - 1);
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      }
      if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
      if (e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, files.length, onClose, scale, resetZoom, handleZoomIn, handleZoomOut]);

  // Touch event listeners for 2-finger pinch, 1-finger pan, swipe navigation, and double-tap zoom
  useEffect(() => {
    const el = containerEl;
    if (!el || !isOpen) return;

    const onTouchStart = (e) => {
      touchMovedRef.current = false;

      // Ignore touches on control buttons
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('[role="button"]')) {
        return;
      }

      if (e.touches.length === 2) {
        // Two fingers: Pinch-to-zoom start
        e.preventDefault();
        isPinchingRef.current = true;
        isPanningRef.current = false;
        setIsDragging(true);
        isDraggingRef.current = true;

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const center = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };

        pinchDataRef.current = {
          initialDist: dist,
          initialScale: scaleRef.current,
          initialPos: { ...positionRef.current },
          initialCenter: center,
        };
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        const now = Date.now();
        const diff = now - tapDataRef.current.lastTapTime;
        const tapPos = { x: touch.clientX, y: touch.clientY };

        const moveDist = Math.hypot(
          tapPos.x - tapDataRef.current.lastTapPos.x,
          tapPos.y - tapDataRef.current.lastTapPos.y
        );

        swipeDataRef.current = {
          startX: touch.clientX,
          startY: touch.clientY,
          startTime: now,
        };

        // Double tap detection (< 300ms, < 35px movement)
        if (diff > 0 && diff < 300 && moveDist < 35) {
          e.preventDefault();
          if (scaleRef.current > 1.2) {
            // Zoom out back to 1x
            resetZoom();
          } else {
            // Zoom in to 2.5x centered at tapped position
            const targetScale = 2.5;
            scaleRef.current = targetScale;
            setScale(targetScale);
            const rect = el.getBoundingClientRect();
            const tapOffsetX = tapPos.x - (rect.left + rect.width / 2);
            const tapOffsetY = tapPos.y - (rect.top + rect.height / 2);
            const targetX = -tapOffsetX * 0.8;
            const targetY = -tapOffsetY * 0.8;
            const nextPos = getClampedPosition(targetX, targetY, targetScale);
            positionRef.current = nextPos;
            setPosition(nextPos);
            if (contentWrapperRef.current) {
              contentWrapperRef.current.style.transition = 'transform 0.22s cubic-bezier(0.2, 0, 0.2, 1)';
              contentWrapperRef.current.style.transform = `translate3d(${nextPos.x}px, ${nextPos.y}px, 0px) scale(${targetScale})`;
            }
          }
          tapDataRef.current.lastTapTime = 0;
          return;
        }

        tapDataRef.current.lastTapTime = now;
        tapDataRef.current.lastTapPos = tapPos;

        if (scaleRef.current > 1.05) {
          isPanningRef.current = true;
          isPinchingRef.current = false;
          setIsDragging(true);
          isDraggingRef.current = true;
          panDataRef.current = {
            startX: touch.clientX,
            startY: touch.clientY,
            initialPos: { ...positionRef.current },
          };
        }
      }
    };

    const onTouchMove = (e) => {
      // Two fingers: continuous pinch zoom
      if (e.touches.length === 2) {
        e.preventDefault();
        touchMovedRef.current = true;

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const center = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };

        if (!isPinchingRef.current || pinchDataRef.current.initialDist <= 0) {
          isPinchingRef.current = true;
          isPanningRef.current = false;
          setIsDragging(true);
          isDraggingRef.current = true;
          pinchDataRef.current = {
            initialDist: dist,
            initialScale: scaleRef.current,
            initialPos: { ...positionRef.current },
            initialCenter: center,
          };
          return;
        }

        const { initialDist, initialScale, initialPos, initialCenter } = pinchDataRef.current;
        if (initialDist > 0) {
          const factor = dist / initialDist;
          const nextScale = Math.min(Math.max(initialScale * factor, 0.75), 5.0);
          const scaleRatio = nextScale / (initialScale || 1);

          const screenCenterX = window.innerWidth / 2;
          const screenCenterY = window.innerHeight / 2;
          const cx = initialCenter.x - screenCenterX;
          const cy = initialCenter.y - screenCenterY;
          const shiftX = center.x - initialCenter.x;
          const shiftY = center.y - initialCenter.y;

          const targetX = initialPos.x * scaleRatio + cx * (1 - scaleRatio) + shiftX;
          const targetY = initialPos.y * scaleRatio + cy * (1 - scaleRatio) + shiftY;
          const nextPos = getClampedPosition(targetX, targetY, nextScale);

          scaleRef.current = nextScale;
          positionRef.current = nextPos;

          if (contentWrapperRef.current) {
            contentWrapperRef.current.style.transition = 'none';
            contentWrapperRef.current.style.transform = `translate3d(${nextPos.x}px, ${nextPos.y}px, 0px) scale(${nextScale})`;
          }
        }
      } else if (e.touches.length === 1 && isPanningRef.current && scaleRef.current > 1.05) {
        // One finger: pan zoomed image
        e.preventDefault();
        touchMovedRef.current = true;

        const touch = e.touches[0];
        const dx = touch.clientX - panDataRef.current.startX;
        const dy = touch.clientY - panDataRef.current.startY;
        const nextX = panDataRef.current.initialPos.x + dx;
        const nextY = panDataRef.current.initialPos.y + dy;
        const nextPos = getClampedPosition(nextX, nextY, scaleRef.current);

        positionRef.current = nextPos;

        if (contentWrapperRef.current) {
          contentWrapperRef.current.style.transition = 'none';
          contentWrapperRef.current.style.transform = `translate3d(${nextPos.x}px, ${nextPos.y}px, 0px) scale(${scaleRef.current})`;
        }
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length === 0) {
        isPinchingRef.current = false;
        isPanningRef.current = false;
        setIsDragging(false);
        isDraggingRef.current = false;

        if (contentWrapperRef.current) {
          contentWrapperRef.current.style.transition = 'transform 0.22s cubic-bezier(0.2, 0, 0.2, 1)';
        }

        // Spring back if below 1.05
        if (scaleRef.current < 1.05) {
          resetZoom();
        } else if (scaleRef.current > 5.0) {
          scaleRef.current = 5.0;
          setScale(5.0);
          const clamped = getClampedPosition(positionRef.current.x, positionRef.current.y, 5.0);
          positionRef.current = clamped;
          setPosition(clamped);
        } else {
          const clamped = getClampedPosition(positionRef.current.x, positionRef.current.y, scaleRef.current);
          positionRef.current = clamped;
          setScale(scaleRef.current);
          setPosition(clamped);
        }

        // Swipe navigation check when not zoomed in
        if (scaleRef.current <= 1.05 && swipeDataRef.current.startTime > 0 && e.changedTouches?.length > 0) {
          const touch = e.changedTouches[0];
          const dx = touch.clientX - swipeDataRef.current.startX;
          const dy = touch.clientY - swipeDataRef.current.startY;
          const dt = Date.now() - swipeDataRef.current.startTime;
          swipeDataRef.current.startTime = 0;

          if (dt < 400 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            if (dx < -50 && currentIndex < files.length - 1) {
              setCurrentIndex(prev => prev + 1);
            } else if (dx > 50 && currentIndex > 0) {
              setCurrentIndex(prev => prev - 1);
            }
          }
        }
      } else if (e.touches.length === 1) {
        isPinchingRef.current = false;
        if (scaleRef.current > 1.05) {
          isPanningRef.current = true;
          panDataRef.current = {
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            initialPos: { ...positionRef.current },
          };
        }
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [containerEl, isOpen, currentIndex, files.length, resetZoom, getClampedPosition]);

  // Desktop Mouse Wheel to Zoom In / Out
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = -e.deltaY * 0.0025;
    const nextScale = Math.min(Math.max(scale + zoomDelta * scale, 1), 5);
    setScale(nextScale);
    if (nextScale <= 1.02) {
      resetZoom();
    } else {
      const clamped = getClampedPosition(position.x, position.y, nextScale);
      setPosition(clamped);
    }
  };

  // Desktop Mouse Drag to Pan
  const handleMouseDown = (e) => {
    if (scale <= 1.05) return;
    e.preventDefault();
    setIsDragging(true);
    mouseStateRef.current = {
      isDown: true,
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...position },
    };
  };

  const handleMouseMove = (e) => {
    if (!mouseStateRef.current.isDown || scale <= 1.05) return;
    e.preventDefault();
    const dx = e.clientX - mouseStateRef.current.startX;
    const dy = e.clientY - mouseStateRef.current.startY;
    const nextX = mouseStateRef.current.startPos.x + dx;
    const nextY = mouseStateRef.current.startPos.y + dy;
    const clamped = getClampedPosition(nextX, nextY, scale);
    setPosition(clamped);
  };

  const handleMouseUp = () => {
    mouseStateRef.current.isDown = false;
    setIsDragging(false);
  };

  // Double click on desktop (Facebook style: toggle 1x and 2.5x)
  const handleDoubleClick = (e) => {
    if (scaleRef.current > 1.2) {
      resetZoom();
    } else {
      const nextScale = 2.5;
      scaleRef.current = nextScale;
      setScale(nextScale);
      const rect = e.currentTarget.getBoundingClientRect();
      const tapX = e.clientX - (rect.left + rect.width / 2);
      const tapY = e.clientY - (rect.top + rect.height / 2);
      const clamped = getClampedPosition(-tapX * 0.8, -tapY * 0.8, nextScale);
      positionRef.current = clamped;
      setPosition(clamped);
      if (contentWrapperRef.current) {
        contentWrapperRef.current.style.transition = 'transform 0.22s cubic-bezier(0.2, 0, 0.2, 1)';
        contentWrapperRef.current.style.transform = `translate3d(${clamped.x}px, ${clamped.y}px, 0px) scale(${nextScale})`;
      }
    }
  };

  if (!isOpen || files.length === 0 || !activeMedia) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalPortal>
          <div 
            ref={(node) => {
              modalContainerRef.current = node;
              if (node && node !== containerEl) {
                setContainerEl(node);
              }
            }}
            className="fixed inset-0 z-[250] flex items-center justify-center bg-black/95 backdrop-blur-md select-none touch-none overflow-hidden"
            onWheel={handleWheel}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Backdrop click area: Clicking outside the media closes the modal */}
            <div 
              className="absolute inset-0 z-10 cursor-zoom-out"
              onClick={() => {
                if (touchMovedRef.current) {
                  touchMovedRef.current = false;
                  return;
                }
                if (scaleRef.current > 1.1) {
                  resetZoom();
                } else {
                  onClose();
                }
              }}
            />

            {/* Top Toolbar */}
            <div 
              className="absolute top-4 left-4 right-4 flex items-center justify-between z-30 pointer-events-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Media Counter Badge */}
              <div className="pointer-events-auto flex items-center gap-2">
                {files.length > 1 && (
                  <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-medium shadow-lg">
                    {currentIndex + 1} / {files.length}
                  </span>
                )}
              </div>

              {/* Close Button */}
              <button 
                type="button"
                className="pointer-events-auto p-2 bg-white/10 hover:bg-white/25 rounded-full text-white transition-all shadow-lg cursor-pointer ml-auto"
                onClick={onClose}
                aria-label="Close media viewer"
                title="Close (Esc)"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Content Container (z-20) */}
            <div className="relative z-20 w-full h-full flex items-center justify-center p-2 sm:p-6 md:p-12 overflow-hidden pointer-events-none">
              <div
                ref={contentWrapperRef}
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick}
                style={{
                  transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0, 0.2, 1)',
                  touchAction: 'none',
                  cursor: scale > 1.05 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                }}
                className="pointer-events-auto flex items-center justify-center will-change-transform select-none max-w-full max-h-full"
              >
                {isVideo ? (
                  <AutoPlayVideo 
                    src={activeMedia.url} 
                    className="max-w-[95vw] sm:max-w-[90vw] max-h-[85vh] sm:max-h-[88vh] object-contain rounded-lg shadow-2xl cursor-default" 
                  />
                ) : (
                  <img 
                    key={activeMedia.url}
                    src={optimizeUrl(activeMedia.url)} 
                    alt="Full view" 
                    draggable={false}
                    className="max-w-[95vw] sm:max-w-[90vw] max-h-[85vh] sm:max-h-[88vh] object-contain rounded-lg shadow-2xl pointer-events-none select-none"
                  />
                )}
              </div>

              {/* Navigation Buttons (shown when not zoomed in) */}
              {files.length > 1 && scale <= 1.15 && (
                <>
                  {currentIndex > 0 && (
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev - 1); }}
                      className="pointer-events-auto absolute left-3 sm:left-6 md:left-8 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all border border-white/10 z-20 cursor-pointer shadow-xl"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-7 sm:h-7" />
                    </button>
                  )}
                  
                  {currentIndex < files.length - 1 && (
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev + 1); }}
                      className="pointer-events-auto absolute right-3 sm:right-6 md:right-8 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all border border-white/10 z-20 cursor-pointer shadow-xl"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7" />
                    </button>
                  )}

                  {/* Dots indicator */}
                  <div className="pointer-events-auto absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    {files.map((_, i) => (
                      <button 
                        key={i} 
                        type="button"
                        aria-label={`Go to slide ${i + 1}`}
                        className={`h-2 rounded-full transition-all cursor-pointer ${i === currentIndex ? 'w-6 bg-primary' : 'w-2 bg-white/40 hover:bg-white/70'}`}
                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
};

export default ImageViewerModal;
