import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * PinchZoomMedia
 * 
 * Instagram-style 2-finger pinch-to-zoom for feed items & modals.
 * Allows pinching any photo or video directly in the feed or shared viewer on mobile.
 * Features:
 * - 2-finger pinch zooms in place with smooth tracking
 * - Elevates to fixed portal with a dark backdrop over the feed
 * - Smooth spring-back to original bounding box upon finger release
 * - Single-tap triggers standard click/tap (e.g. opens fullscreen modal)
 */
const PinchZoomMedia = ({ children, onTap, className = '' }) => {
  const containerRef = useRef(null);
  const [isPinching, setIsPinching] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [rect, setRect] = useState(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [backdropOpacity, setBackdropOpacity] = useState(0);

  const pinchStateRef = useRef({
    active: false,
    initialDist: 0,
    initialMidpoint: { x: 0, y: 0 },
    touchStartTime: 0,
    hasMoved: false,
  });

  const resetPinch = useCallback(() => {
    setIsReleasing(true);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setBackdropOpacity(0);

    setTimeout(() => {
      setIsPinching(false);
      setIsReleasing(false);
      pinchStateRef.current.active = false;
      pinchStateRef.current.hasMoved = false;
    }, 220);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        // Start 2-finger Instagram pinch
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;

        const bounds = el.getBoundingClientRect();
        const originX = ((midX - bounds.left) / bounds.width) * 100;
        const originY = ((midY - bounds.top) / bounds.height) * 100;

        setRect(bounds);
        setOrigin({
          x: Math.min(Math.max(originX, 0), 100),
          y: Math.min(Math.max(originY, 0), 100),
        });
        setScale(1);
        setTranslate({ x: 0, y: 0 });
        setBackdropOpacity(0);

        pinchStateRef.current = {
          active: true,
          initialDist: dist,
          initialMidpoint: { x: midX, y: midY },
          touchStartTime: Date.now(),
          hasMoved: false,
        };
        setIsPinching(true);
        setIsReleasing(false);
      } else if (e.touches.length === 1) {
        pinchStateRef.current.touchStartTime = Date.now();
        pinchStateRef.current.hasMoved = false;
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && pinchStateRef.current.active) {
        e.preventDefault(); // Stop native page zooming & scrolling
        pinchStateRef.current.hasMoved = true;

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;

        const { initialDist, initialMidpoint } = pinchStateRef.current;
        if (initialDist > 0) {
          const factor = dist / initialDist;
          const nextScale = Math.min(Math.max(factor, 0.9), 4.5);
          const nextDx = midX - initialMidpoint.x;
          const nextDy = midY - initialMidpoint.y;

          setScale(nextScale);
          setTranslate({ x: nextDx, y: nextDy });
          // Backdrop opacity scales smoothly between 0 and 0.8
          setBackdropOpacity(Math.min(0.85, Math.max(0, (nextScale - 1) * 0.55)));
        }
      }
    };

    const onTouchEnd = (e) => {
      if (pinchStateRef.current.active) {
        if (e.touches.length < 2) {
          resetPinch();
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
  }, [resetPinch]);

  const handleClick = (e) => {
    // If not pinching and not dragging, trigger tap
    if (!pinchStateRef.current.active && !pinchStateRef.current.hasMoved) {
      if (onTap) {
        e.stopPropagation();
        onTap(e);
      }
    }
  };

  return (
    <>
      <div 
        ref={containerRef} 
        onClick={handleClick}
        className={`relative ${className}`}
        style={{
          visibility: isPinching ? 'hidden' : 'visible',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>

      {/* Fullscreen Instagram-Style Zoom Overlay (Rendered directly in body) */}
      {isPinching && rect && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 pointer-events-none select-none z-[9990]">
          {/* Dimming Backdrop */}
          <div 
            className="fixed inset-0 bg-black pointer-events-none transition-opacity duration-150"
            style={{ 
              opacity: backdropOpacity,
              zIndex: 9991,
            }}
          />

          {/* Elevated Zoomed Clone */}
          <div
            className="fixed pointer-events-none will-change-transform overflow-hidden shadow-2xl rounded-lg"
            style={{
              zIndex: 9992,
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              transform: `translate3d(${translate.x}px, ${translate.y}px, 0px) scale(${scale})`,
              transformOrigin: `${origin.x}% ${origin.y}%`,
              transition: isReleasing ? 'transform 0.22s cubic-bezier(0.2, 0, 0.2, 1), opacity 0.22s ease-out' : 'none',
            }}
          >
            {children}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default PinchZoomMedia;
