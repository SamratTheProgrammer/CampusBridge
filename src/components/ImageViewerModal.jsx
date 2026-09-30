import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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
  const [showHint, setShowHint] = useState(true);

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Normalize mediaFiles to array of objects
  const files = React.useMemo(() => {
    if (!mediaFiles) return [];
    if (typeof mediaFiles === 'string') return [{ url: mediaFiles, mediaType: 'image' }];
    return mediaFiles.map(file => {
      if (typeof file === 'string') return { url: file, mediaType: 'image' };
      return file;
    });
  }, [mediaFiles]);

  const activeMedia = files[currentIndex];
  const isVideo = activeMedia?.mediaType === 'video' || (activeMedia?.url && activeMedia.url.match(/\.(mp4|webm|ogg)$/i));

  // Mutable refs for tracking gestures across frames without stale closures
  const scaleRef = useRef(1);
  const positionRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  scaleRef.current = scale;
  positionRef.current = position;
  isDraggingRef.current = isDragging;

  const touchStateRef = useRef({
    distance: 0,
    initialScale: 1,
    startPos: { x: 0, y: 0 },
    lastTouch: { x: 0, y: 0 },
    lastTap: 0,
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
    setIsDragging(false);
    isDraggingRef.current = false;
  }, []);

  const getClampedPosition = useCallback((x, y, s) => {
    if (s <= 1.02) return { x: 0, y: 0 };
    const maxPanX = Math.max(0, ((s - 1) * window.innerWidth) / 2 + 60);
    const maxPanY = Math.max(0, ((s - 1) * window.innerHeight) / 2 + 60);
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
      setShowHint(true);
      const timer = setTimeout(() => setShowHint(false), 3500);
      return () => clearTimeout(timer);
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

  // Touch event listeners attached directly with { passive: false } for 2-finger pinch and 1-finger pan
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isOpen || isVideo) return;

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        // Two fingers: Pinch-to-zoom start
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        touchStateRef.current.distance = dist;
        touchStateRef.current.initialScale = scaleRef.current;
        touchStateRef.current.startPos = { ...positionRef.current };
        setIsDragging(true);
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        const now = Date.now();
        const timeSinceLast = now - touchStateRef.current.lastTap;

        // Double-tap to zoom in / reset
        if (timeSinceLast < 300 && timeSinceLast > 0) {
          e.preventDefault();
          if (scaleRef.current > 1.2) {
            resetZoom();
          } else {
            const nextScale = 2.5;
            setScale(nextScale);
            const rect = el.getBoundingClientRect();
            const tapX = touch.clientX - (rect.left + rect.width / 2);
            const tapY = touch.clientY - (rect.top + rect.height / 2);
            const clamped = getClampedPosition(-tapX * 0.7, -tapY * 0.7, nextScale);
            setPosition(clamped);
          }
          touchStateRef.current.lastTap = 0;
          return;
        }
        touchStateRef.current.lastTap = now;

        touchStateRef.current.lastTouch = { x: touch.clientX, y: touch.clientY };
        touchStateRef.current.startPos = { ...positionRef.current };
        if (scaleRef.current > 1.05) {
          setIsDragging(true);
        }
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2) {
        // 2 fingers pinch to zoom in/out
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

        if (touchStateRef.current.distance > 0) {
          const factor = dist / touchStateRef.current.distance;
          const nextScale = Math.min(Math.max(touchStateRef.current.initialScale * factor, 1), 5);
          setScale(nextScale);

          if (nextScale <= 1.02) {
            setPosition({ x: 0, y: 0 });
          } else {
            const clamped = getClampedPosition(positionRef.current.x, positionRef.current.y, nextScale);
            setPosition(clamped);
          }
        }
      } else if (e.touches.length === 1 && scaleRef.current > 1.05) {
        // 1 finger dragging/panning when zoomed
        e.preventDefault();
        const touch = e.touches[0];
        const dx = touch.clientX - touchStateRef.current.lastTouch.x;
        const dy = touch.clientY - touchStateRef.current.lastTouch.y;
        touchStateRef.current.lastTouch = { x: touch.clientX, y: touch.clientY };

        const nextX = positionRef.current.x + dx;
        const nextY = positionRef.current.y + dy;
        const clamped = getClampedPosition(nextX, nextY, scaleRef.current);
        setPosition(clamped);
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) {
        touchStateRef.current.distance = 0;
      }
      if (e.touches.length === 0) {
        setIsDragging(false);
        if (scaleRef.current <= 1.05) {
          resetZoom();
        }
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isOpen, isVideo, resetZoom, getClampedPosition]);

  // Desktop Mouse Wheel to Zoom In / Out
  const handleWheel = (e) => {
    if (isVideo) return;
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
    if (isVideo || scale <= 1.05) return;
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

  // Double click on desktop
  const handleDoubleClick = (e) => {
    if (isVideo) return;
    if (scale > 1.2) {
      resetZoom();
    } else {
      const nextScale = 2.5;
      setScale(nextScale);
      const rect = e.currentTarget.getBoundingClientRect();
      const tapX = e.clientX - (rect.left + rect.width / 2);
      const tapY = e.clientY - (rect.top + rect.height / 2);
      const clamped = getClampedPosition(-tapX * 0.7, -tapY * 0.7, nextScale);
      setPosition(clamped);
    }
  };

  if (!isOpen || files.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalPortal>
          <div 
            className="fixed inset-0 z-[250] flex items-center justify-center bg-black/95 backdrop-blur-md select-none touch-none overflow-hidden"
            onClick={() => {
              if (scale > 1.1) {
                resetZoom();
              } else {
                onClose();
              }
            }}
            onWheel={handleWheel}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Top Toolbar */}
            <div 
              className="absolute top-4 left-4 right-4 flex items-center justify-between z-30 pointer-events-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image Counter Badge */}
              <div className="pointer-events-auto flex items-center gap-2">
                {files.length > 1 && (
                  <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-medium shadow-lg">
                    {currentIndex + 1} / {files.length}
                  </span>
                )}
              </div>

              {/* Center Zoom Controls (Images only) */}
              {!isVideo && (
                <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 bg-black/60 backdrop-blur-md border border-white/15 rounded-full p-1 shadow-2xl">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={scale <= 1}
                    aria-label="Zoom out"
                    title="Zoom out (-)"
                    className="p-1.5 sm:p-2 rounded-full text-white/90 hover:text-white hover:bg-white/15 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={resetZoom}
                    title="Click to reset zoom"
                    className="px-2 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold text-white/90 hover:text-white hover:bg-white/15 transition-all cursor-pointer min-w-[46px] text-center"
                  >
                    {Math.round(scale * 100)}%
                  </button>

                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={scale >= 5}
                    aria-label="Zoom in"
                    title="Zoom in (+)"
                    className="p-1.5 sm:p-2 rounded-full text-white/90 hover:text-white hover:bg-white/15 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  {scale > 1.05 && (
                    <button
                      type="button"
                      onClick={resetZoom}
                      aria-label="Reset zoom"
                      title="Reset to 100% (0)"
                      className="p-1.5 sm:p-2 rounded-full text-primary hover:bg-primary/20 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Close Button */}
              <button 
                type="button"
                className="pointer-events-auto p-2 bg-white/10 hover:bg-white/25 rounded-full text-white transition-all shadow-lg cursor-pointer"
                onClick={onClose}
                aria-label="Close image viewer"
                title="Close (Esc)"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Gesture Hint (Floating badge on mobile) */}
            {!isVideo && showHint && (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white text-[11px] sm:text-xs font-medium shadow-xl z-20 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                <span>Pinch with 2 fingers or scroll to zoom • Drag to pan</span>
              </div>
            )}

            {/* Image / Video Container */}
            <div 
              ref={containerRef}
              className="relative w-full h-full flex items-center justify-center p-2 sm:p-6 md:p-12 overflow-hidden touch-none"
              onClick={(e) => {
                if (scale <= 1.05) {
                  e.stopPropagation();
                  onClose();
                }
              }}
            >
              {isVideo ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <AutoPlayVideo 
                    src={activeMedia.url} 
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default" 
                  />
                </div>
              ) : (
                <div
                  ref={imageRef}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={handleMouseDown}
                  onDoubleClick={handleDoubleClick}
                  style={{
                    transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${scale})`,
                    transition: isDragging ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0, 0.2, 1)',
                    touchAction: 'none',
                    cursor: scale > 1.05 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                  }}
                  className="flex items-center justify-center will-change-transform select-none"
                >
                  <img 
                    key={activeMedia.url}
                    src={optimizeUrl(activeMedia.url)} 
                    alt="Full view" 
                    draggable={false}
                    className="max-w-[95vw] sm:max-w-[90vw] max-h-[85vh] sm:max-h-[88vh] object-contain rounded-lg shadow-2xl pointer-events-none select-none"
                  />
                </div>
              )}

              {/* Navigation Buttons (shown when not zoomed in) */}
              {files.length > 1 && scale <= 1.15 && (
                <>
                  {currentIndex > 0 && (
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev - 1); }}
                      className="absolute left-3 sm:left-6 md:left-8 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all border border-white/10 z-20 cursor-pointer shadow-xl"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-7 sm:h-7" />
                    </button>
                  )}
                  
                  {currentIndex < files.length - 1 && (
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev + 1); }}
                      className="absolute right-3 sm:right-6 md:right-8 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all border border-white/10 z-20 cursor-pointer shadow-xl"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7" />
                    </button>
                  )}

                  {/* Dots indicator */}
                  <div className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
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
