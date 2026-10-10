import React, { useState, useRef, useEffect, useCallback } from 'react';
import ModalPortal from './ModalPortal';
import { X, Download, RotateCcw } from 'lucide-react';
import { getPdfViewUrl } from '../../utils/pdfViewer';

/**
 * ChatImageViewerModal
 * 
 * - Fullscreen attachment viewer for chat images and documents.
 * - Mobile: 2-finger pinch-to-zoom (up to 5x), 1-finger pan when zoomed, and double-tap zoom/reset.
 * - Desktop: Double-click to zoom in (2.5x) centered on cursor, double-click to reset back to 1x.
 * - Pan when zoomed with mouse drag (cursor-grab).
 * - Escape key to close, click backdrop to close (when not zoomed).
 */
export default function ChatImageViewerModal({ attachment, onClose }) {
  if (!attachment) return null;

  const isImage = attachment.type === 'image';
  const isDocument = attachment.type === 'document';

  // Transform state for pinch & pan
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDraggingMouse, setIsDraggingMouse] = useState(false);

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const touchStateRef = useRef({
    activePinch: false,
    activePan: false,
    startDist: 0,
    startScale: 1,
    startMidpoint: { x: 0, y: 0 },
    startPan: { x: 0, y: 0 },
    startTranslate: { x: 0, y: 0 },
    lastTapTime: 0,
    lastTapPos: { x: 0, y: 0 },
  });

  const mouseDragRef = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    startTranslate: { x: 0, y: 0 },
    hasMoved: false,
  });

  // Reset transforms
  const resetZoom = useCallback((animate = true) => {
    if (animate) {
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 260);
    } else {
      setIsTransitioning(false);
    }
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  // Clamp boundaries so zoomed image doesn't fly off screen
  const clampBounds = useCallback(() => {
    if (scale <= 1.05) {
      resetZoom(true);
      return;
    }
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 240);

    const maxTranslateX = (window.innerWidth * (scale - 1)) / 2 + 60;
    const maxTranslateY = (window.innerHeight * (scale - 1)) / 2 + 60;
    setTranslate((prev) => ({
      x: Math.max(-maxTranslateX, Math.min(maxTranslateX, prev.x)),
      y: Math.max(-maxTranslateY, Math.min(maxTranslateY, prev.y)),
    }));
  }, [scale, resetZoom]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Touch gesture listeners (Mobile 2-finger pinch & double tap)
  useEffect(() => {
    if (!isImage) return;
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      // 2 fingers: Pinch-to-zoom
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;

        setIsTransitioning(false);
        touchStateRef.current.activePinch = true;
        touchStateRef.current.activePan = false;
        touchStateRef.current.startDist = dist;
        touchStateRef.current.startScale = scale;
        touchStateRef.current.startMidpoint = { x: midX, y: midY };
        touchStateRef.current.startTranslate = { ...translate };
      } 
      // 1 finger: Pan (if zoomed) or detect mobile double-tap
      else if (e.touches.length === 1) {
        const t = e.touches[0];
        const now = Date.now();
        const timeSinceLastTap = now - touchStateRef.current.lastTapTime;
        const distFromLastTap = Math.hypot(
          t.clientX - touchStateRef.current.lastTapPos.x,
          t.clientY - touchStateRef.current.lastTapPos.y
        );

        // Double tap detection (< 300ms, < 30px drift)
        if (timeSinceLastTap < 300 && distFromLastTap < 30) {
          e.preventDefault();
          touchStateRef.current.lastTapTime = 0;
          setIsTransitioning(true);
          setTimeout(() => setIsTransitioning(false), 260);

          if (scale > 1.2) {
            // Reset to 1x
            setScale(1);
            setTranslate({ x: 0, y: 0 });
          } else {
            // Zoom to 2.5x centered around tapped point
            const targetScale = 2.5;
            const bounds = el.getBoundingClientRect();
            const relX = t.clientX - (bounds.left + bounds.width / 2);
            const relY = t.clientY - (bounds.top + bounds.height / 2);
            setScale(targetScale);
            setTranslate({
              x: -relX * (targetScale - 1) * 0.5,
              y: -relY * (targetScale - 1) * 0.5,
            });
          }
          return;
        }

        touchStateRef.current.lastTapTime = now;
        touchStateRef.current.lastTapPos = { x: t.clientX, y: t.clientY };

        if (scale > 1.05) {
          setIsTransitioning(false);
          touchStateRef.current.activePan = true;
          touchStateRef.current.startPan = { x: t.clientX, y: t.clientY };
          touchStateRef.current.startTranslate = { ...translate };
        }
      }
    };

    const onTouchMove = (e) => {
      // 2 fingers pinch
      if (e.touches.length === 2 && touchStateRef.current.activePinch) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const { startDist, startScale, startTranslate } = touchStateRef.current;

        if (startDist > 0) {
          const factor = dist / startDist;
          const nextScale = Math.min(5, Math.max(0.8, startScale * factor));
          setScale(nextScale);

          const midX = (t1.clientX + t2.clientX) / 2;
          const midY = (t1.clientY + t2.clientY) / 2;
          const deltaX = midX - touchStateRef.current.startMidpoint.x;
          const deltaY = midY - touchStateRef.current.startMidpoint.y;
          setTranslate({
            x: startTranslate.x + deltaX,
            y: startTranslate.y + deltaY,
          });
        }
      } 
      // 1 finger pan while zoomed
      else if (e.touches.length === 1 && touchStateRef.current.activePan && scale > 1.05) {
        e.preventDefault();
        const t = e.touches[0];
        const dx = t.clientX - touchStateRef.current.startPan.x;
        const dy = t.clientY - touchStateRef.current.startPan.y;
        setTranslate({
          x: touchStateRef.current.startTranslate.x + dx,
          y: touchStateRef.current.startTranslate.y + dy,
        });
      }
    };

    const onTouchEnd = (e) => {
      if (touchStateRef.current.activePinch) {
        touchStateRef.current.activePinch = false;
        if (scale < 1.05) {
          resetZoom(true);
        } else {
          clampBounds();
        }
      } else if (touchStateRef.current.activePan) {
        touchStateRef.current.activePan = false;
        clampBounds();
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
  }, [isImage, scale, translate, resetZoom, clampBounds]);

  // Double-Click to Zoom (Desktop & Mouse)
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 260);

    if (scale > 1.2) {
      // Reset back to 1x
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    } else {
      // Zoom in to 2.5x centered around double-clicked point
      const targetScale = 2.5;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const relX = e.clientX - (rect.left + rect.width / 2);
        const relY = e.clientY - (rect.top + rect.height / 2);
        setScale(targetScale);
        setTranslate({
          x: -relX * (targetScale - 1) * 0.5,
          y: -relY * (targetScale - 1) * 0.5,
        });
      } else {
        setScale(targetScale);
        setTranslate({ x: 0, y: 0 });
      }
    }
  };

  // Mouse drag to pan when zoomed on Desktop
  const handleMouseDown = (e) => {
    if (scale <= 1.05 || e.button !== 0) return;
    e.preventDefault();
    mouseDragRef.current = {
      isDown: true,
      startX: e.clientX,
      startY: e.clientY,
      startTranslate: { ...translate },
      hasMoved: false,
    };
    setIsDraggingMouse(true);
    setIsTransitioning(false);
  };

  const handleMouseMove = (e) => {
    if (!mouseDragRef.current.isDown || scale <= 1.05) return;
    const dx = e.clientX - mouseDragRef.current.startX;
    const dy = e.clientY - mouseDragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      mouseDragRef.current.hasMoved = true;
    }
    setTranslate({
      x: mouseDragRef.current.startTranslate.x + dx,
      y: mouseDragRef.current.startTranslate.y + dy,
    });
  };

  const handleMouseUp = () => {
    if (mouseDragRef.current.isDown) {
      mouseDragRef.current.isDown = false;
      setIsDraggingMouse(false);
      clampBounds();
    }
  };

  const handleBackdropClick = (e) => {
    // Only close if user clicked backdrop outside and is not zoomed or dragging
    if (scale <= 1.05 && e.target === containerRef.current && !mouseDragRef.current.hasMoved) {
      onClose();
    }
  };

  return (
    <ModalPortal>
      <div 
        ref={containerRef}
        onClick={handleBackdropClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none touch-none animate-in fade-in duration-150"
      >
        {/* Top Floating Control Bar */}
        <div className="absolute top-4 inset-x-4 sm:top-6 sm:inset-x-8 z-30 flex items-center justify-between pointer-events-none">
          <div className="text-white/80 text-xs sm:text-sm font-medium truncate max-w-[50vw] drop-shadow-md">
            {attachment.name || (isImage ? 'Photo' : 'Document')}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Reset Zoom Button (Only shows when user is zoomed in) */}
            {scale > 1.15 && (
              <button
                type="button"
                onClick={() => resetZoom(true)}
                className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md transition-colors flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer"
                title="Reset zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 1x
              </button>
            )}

            {/* Download Original Button */}
            <a 
              href={attachment.url}
              download={attachment.name || 'download'}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer backdrop-blur-md shadow-md active:scale-95"
              title="Download Original"
            >
              <Download className="w-5 h-5 sm:w-6 sm:h-6" />
            </a>

            {/* Close Button */}
            <button 
              type="button"
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer backdrop-blur-md shadow-md active:scale-95"
              title="Close (Esc)"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Viewport Content */}
        <div className="w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center relative overflow-hidden">
          {isImage ? (
            <div
              onDoubleClick={handleDoubleClick}
              onMouseDown={handleMouseDown}
              className={`w-full h-full flex items-center justify-center will-change-transform ${
                scale > 1.05
                  ? isDraggingMouse
                    ? 'cursor-grabbing'
                    : 'cursor-grab'
                  : 'cursor-zoom-in'
              }`}
              style={{
                transform: `translate3d(${translate.x}px, ${translate.y}px, 0px) scale(${scale})`,
                transition: isTransitioning ? 'transform 0.25s cubic-bezier(0.2, 0, 0.2, 1)' : 'none',
                transformOrigin: 'center center',
              }}
              title={scale > 1.05 ? "Double-click to reset zoom • Drag to pan" : "Double-click to zoom in"}
            >
              <img 
                ref={imageRef}
                src={attachment.url} 
                alt={attachment.name || 'Fullscreen View'} 
                className="max-w-full max-h-full object-contain rounded-lg pointer-events-none drop-shadow-2xl select-none"
                draggable={false}
              />
            </div>
          ) : isDocument ? (
            <iframe 
              src={getPdfViewUrl(attachment.url)} 
              title="Document Viewer"
              className="w-full h-full bg-white rounded-xl shadow-2xl"
            />
          ) : null}
        </div>
      </div>
    </ModalPortal>
  );
}
