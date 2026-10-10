import React, { useState, useEffect, useRef, useCallback } from 'react';
import ModalPortal from './ModalPortal';
import { Camera, X, Check, RefreshCw, AlertCircle, Upload, Trash2, Plus, Send, Zap, ZapOff } from 'lucide-react';
import toast from 'react-hot-toast';

const isMobileClient = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
};

export default function CameraCaptureModal({ isOpen, onClose, onCapture, onFallbackToFile }) {
  const [stream, setStream] = useState(null);
  // Default to back camera ('environment') on mobile devices, or webcam on desktop
  const [facingMode, setFacingMode] = useState(() => isMobileClient() ? 'environment' : 'user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Flash state (single toggle button, hardware torch for back camera + screen flash illumination for front/fallback)
  const [flashMode, setFlashMode] = useState('off'); // 'off' or 'on'
  const [isScreenFlashing, setIsScreenFlashing] = useState(false);

  // Multi-photo capture state (WhatsApp style)
  const [capturedPhotos, setCapturedPhotos] = useState([]); // [{ id, dataUrl, blob, file }]
  const [activePreviewIndex, setActivePreviewIndex] = useState(null); // null = live viewfinder, number = previewing photo
  const [shutterPulse, setShutterPulse] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Hardware torch controller for back camera
  const applyTorch = useCallback(async (enabled) => {
    const stream = streamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    // 1. Standard WebRTC applyConstraints torch
    try {
      await track.applyConstraints({
        advanced: [{ torch: enabled }]
      });
      return;
    } catch (_) {}

    // 2. Android fillLightMode constraint
    try {
      await track.applyConstraints({
        advanced: [{ fillLightMode: enabled ? 'flash' : 'off' }]
      });
      return;
    } catch (_) {}

    // 3. ImageCapture API fallback (Standard W3C API for camera flash/torch)
    if (typeof window !== 'undefined' && 'ImageCapture' in window) {
      try {
        const imageCapture = new window.ImageCapture(track);
        if (imageCapture.track) {
          await imageCapture.track.applyConstraints({
            advanced: [{ torch: enabled }]
          });
        }
      } catch (_) {}
    }
  }, []);

  // Stop camera tracks helper: strictly and immediately stops all hardware tracks
  const stopCamera = useCallback(() => {
    applyTorch(false);

    // 1. Stop tracks tracked in streamRef
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
            track.enabled = false;
          } catch (e) {}
        });
      } catch (e) {}
      streamRef.current = null;
    }

    // 2. Stop tracks bound to video element srcObject
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const vStream = videoRef.current.srcObject;
        if (vStream && typeof vStream.getTracks === 'function') {
          vStream.getTracks().forEach((track) => {
            try {
              track.stop();
              track.enabled = false;
            } catch (e) {}
          });
        }
      } catch (e) {}
      try {
        videoRef.current.srcObject = null;
      } catch (e) {}
    }

    setStream(null);
  }, [applyTorch]);

  // Safe close handler that always terminates hardware stream
  const handleClose = useCallback(() => {
    stopCamera();
    setCapturedPhotos([]);
    setActivePreviewIndex(null);
    onClose();
  }, [stopCamera, onClose]);

  // Check available cameras (front & back on phones)
  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      })
      .catch(() => {});
  }, []);

  // Ensure camera stops if component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Keep a ref of flashMode so startCamera can check initial flash without being re-triggered on toggle
  const flashModeRef = useRef(flashMode);
  useEffect(() => {
    flashModeRef.current = flashMode;
  }, [flashMode]);

  // When modal opens on mobile, default to back camera
  const prevIsOpenRef = useRef(isOpen);
  useEffect(() => {
    if (!prevIsOpenRef.current && isOpen && isMobileClient()) {
      setFacingMode('environment');
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  // Start Camera Stream
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhotos([]);
      setActivePreviewIndex(null);
      setError(null);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera is not supported on this device/browser');
        }

        // Clean up previous stream before opening new one
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => {
            try {
              t.stop();
              t.enabled = false;
            } catch (e) {}
          });
          streamRef.current = null;
        }

        const constraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isCancelled) {
          mediaStream.getTracks().forEach((t) => {
            try {
              t.stop();
              t.enabled = false;
            } catch (e) {}
          });
          return;
        }

        streamRef.current = mediaStream;
        setStream(mediaStream);
        setIsLoading(false);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }

        // If back camera and flash is on, apply torch immediately
        if (facingMode === 'environment' && flashModeRef.current === 'on') {
          setTimeout(() => {
            applyTorch(true);
          }, 150);
        }
      } catch (err) {
        if (isCancelled) return;
        console.error('Camera access error:', err);
        setIsLoading(false);
        setError(err.message || 'Could not access camera. Please allow camera permissions.');
      }
    };

    startCamera();

    return () => {
      isCancelled = true;
      stopCamera();
    };
  }, [isOpen, facingMode, stopCamera, applyTorch]);

  // Handle hardware torch changes when toggling flash or flipping camera
  useEffect(() => {
    if (stream && facingMode === 'environment') {
      applyTorch(flashMode === 'on');
    } else {
      applyTorch(false);
    }
  }, [stream, facingMode, flashMode, applyTorch]);

  // Ensure video element plays stream if videoRef is mounted or updated
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [stream, activePreviewIndex]);

  // Flip camera between front and back
  const handleFlipCamera = () => {
    setActivePreviewIndex(null);
    setFacingMode((prev) => {
      const next = prev === 'user' ? 'environment' : 'user';
      if (next === 'user') {
        applyTorch(false);
      }
      return next;
    });
  };

  // Toggle flash mode on/off (Single Button, silent without toast)
  const handleToggleFlash = async () => {
    const nextMode = flashMode === 'on' ? 'off' : 'on';
    setFlashMode(nextMode);

    // If back camera is active, immediately trigger the phone hardware torch!
    if (facingMode === 'environment') {
      await applyTorch(nextMode === 'on');
    }
  };

  // Capture snapshot from live stream without stopping the camera (WhatsApp multi-photo style)
  const handleCapture = async () => {
    if (!videoRef.current) return;

    // Front camera or flash mode screen illumination: lit before canvas snapshot
    if (flashMode === 'on') {
      setIsScreenFlashing(true);
      await new Promise((resolve) => setTimeout(resolve, 120));
    } else {
      setShutterPulse(true);
      setTimeout(() => setShutterPulse(false), 120);
    }

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsScreenFlashing(false);
      return;
    }

    // If front camera, mirror horizontally so photo matches mirror preview
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (flashMode === 'on') {
      setTimeout(() => setIsScreenFlashing(false), 100);
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error('Failed to capture photo');
          return;
        }
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const photoFile = new File([blob], `camera_${Date.now()}_${capturedPhotos.length + 1}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });

        const newPhotoItem = {
          id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          dataUrl,
          blob,
          file: photoFile
        };

        setCapturedPhotos((prev) => [...prev, newPhotoItem]);
        // If user was viewing an old photo, return to live viewfinder so they see they can snap more
        setActivePreviewIndex(null);
      },
      'image/jpeg',
      0.92
    );
  };

  // Remove a photo from captured strip
  const handleRemovePhoto = (index, e) => {
    if (e) e.stopPropagation();
    setCapturedPhotos((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated;
    });

    if (activePreviewIndex === index) {
      setActivePreviewIndex(null);
    } else if (activePreviewIndex !== null && activePreviewIndex > index) {
      setActivePreviewIndex((prev) => prev - 1);
    }
  };

  // Clear all captured photos and resume camera
  const handleClearAll = () => {
    setCapturedPhotos([]);
    setActivePreviewIndex(null);
  };

  // Confirm and send all captured photos
  const handleSendAll = () => {
    if (capturedPhotos.length === 0) return;

    const filesToSend = capturedPhotos.map((p) => p.file);
    stopCamera();
    onCapture(filesToSend);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[220] bg-black flex flex-col p-0 w-full h-full sm:p-6 sm:items-center sm:justify-center sm:bg-black/90 sm:backdrop-blur-md animate-in fade-in duration-200"
        onClick={handleClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            handleClose();
          }
          if (e.key === ' ' && activePreviewIndex === null) {
            e.preventDefault();
            handleCapture();
          }
          if (e.key === 'Enter') {
            e.preventDefault();
            if (capturedPhotos.length > 0) {
              handleSendAll();
            } else {
              handleCapture();
            }
          }
        }}
        tabIndex={-1}
      >
        {/* Full-screen Screen Flash for illumination (acts as flashlight/fill light on any device) */}
        {isScreenFlashing && (
          <div className="fixed inset-0 bg-[#fffdfa] pointer-events-none z-[300] transition-opacity duration-75" />
        )}

        {/* Shutter Animation Feedback */}
        {shutterPulse && (
          <div className="fixed inset-0 bg-white/40 pointer-events-none z-[260] animate-out fade-out duration-100" />
        )}

        {/* Modal Window */}
        <div
          className="relative w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[88vh] bg-slate-950 sm:border sm:border-white/10 sm:rounded-3xl overflow-hidden sm:shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-b from-black/90 via-black/60 to-transparent sm:relative sm:border-b sm:border-white/10 sm:bg-black/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide drop-shadow-md sm:drop-shadow-none flex items-center gap-2">
                  {capturedPhotos.length > 0
                    ? `Camera (${capturedPhotos.length} photo${capturedPhotos.length > 1 ? 's' : ''})`
                    : 'Camera'}
                  {activePreviewIndex === null && flashMode === 'on' && (
                    <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 tracking-wider">
                      Flash ON
                    </span>
                  )}
                </h3>
                <p className="text-[11px] sm:text-xs text-white/70 sm:text-white/50 drop-shadow-md sm:drop-shadow-none">
                  {activePreviewIndex !== null
                    ? `Viewing photo ${activePreviewIndex + 1} of ${capturedPhotos.length}`
                    : capturedPhotos.length > 0
                    ? 'Snap more photos or tap Send below'
                    : facingMode === 'user'
                    ? 'Front Camera'
                    : 'Back Camera'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Single Flash Toggle Button (Header only, clean and accessible) */}
              {activePreviewIndex === null && (
                <button
                  type="button"
                  onClick={handleToggleFlash}
                  className={`p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer border ${
                    flashMode === 'on'
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-500/30 font-bold'
                      : 'text-white/80 hover:text-white bg-black/40 hover:bg-white/10 border-white/10'
                  }`}
                  title={flashMode === 'on' ? 'Turn Flash Off' : 'Turn Flash On'}
                >
                  {flashMode === 'on' ? (
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                  ) : (
                    <ZapOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              )}

              {/* Flip camera on header */}
              {hasMultipleCameras && activePreviewIndex === null && (
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  className="p-2 sm:p-2.5 text-white/80 hover:text-white bg-black/40 hover:bg-white/10 rounded-xl transition-colors cursor-pointer border border-white/10"
                  title="Flip Camera"
                >
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                className="p-2 sm:p-2.5 text-white/80 hover:text-white bg-black/40 hover:bg-white/10 rounded-xl transition-colors cursor-pointer border border-white/10"
                title="Close Camera"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Viewfinder Body */}
          <div className="relative flex-1 min-h-0 bg-black flex items-center justify-center overflow-hidden w-full h-full sm:min-h-[360px] sm:max-h-[55vh]">
            {error ? (
              <div className="text-center p-6 max-w-md z-20">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto mb-3.5">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-white mb-1.5">Camera Unavailable</h4>
                <p className="text-xs text-white/60 mb-5 leading-relaxed">{error}</p>
                {onFallbackToFile && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onFallbackToFile();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:bg-primary/90 transition-colors shadow-lg cursor-pointer"
                  >
                    <Upload className="w-4 h-4" /> Choose from files instead
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* 1. Live Video Stream */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover sm:object-contain sm:max-h-[55vh] ${
                    facingMode === 'user' ? 'scale-x-[-1]' : ''
                  } ${activePreviewIndex !== null ? 'hidden' : 'block'}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Front Camera Softbox Glow when Flash is ON */}
                {flashMode === 'on' && facingMode === 'user' && activePreviewIndex === null && (
                  <div className="absolute inset-0 pointer-events-none ring-8 ring-amber-100/30 shadow-[inset_0_0_100px_rgba(255,248,220,0.45)] z-10 transition-all duration-300" />
                )}

                {/* 2. Active Preview Snapshot Overlay (When inspecting a clicked photo) */}
                {activePreviewIndex !== null && capturedPhotos[activePreviewIndex] && (
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    <img
                      src={capturedPhotos[activePreviewIndex].dataUrl}
                      alt="Captured snapshot"
                      className="w-full h-full object-cover sm:object-contain sm:max-h-[55vh] animate-in fade-in duration-100"
                    />
                    <div className="absolute top-16 sm:top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-semibold border border-white/10">
                      Photo {activePreviewIndex + 1} of {capturedPhotos.length}
                    </div>
                  </div>
                )}

                {/* 3. Grid Overlay for live framing */}
                {activePreviewIndex === null && (
                  <div className="absolute inset-0 pointer-events-none border border-white/10 grid grid-cols-3 grid-rows-3 opacity-20 z-5">
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div />
                  </div>
                )}

                {isLoading && activePreviewIndex === null && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white gap-2 z-20">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-xs font-medium">Starting camera...</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* WhatsApp-Style Multi-Photo Thumbnail Strip */}
          {capturedPhotos.length > 0 && !error && (
            <div className="relative z-30 px-4 py-2.5 bg-black/85 border-t border-white/10 flex items-center gap-2.5 overflow-x-auto scrollbar-none shrink-0">
              <span className="text-[11px] text-white/50 font-semibold uppercase tracking-wider shrink-0 pl-1">
                Photos ({capturedPhotos.length}):
              </span>

              <div className="flex items-center gap-2 py-0.5">
                {capturedPhotos.map((photo, idx) => {
                  const isSelected = activePreviewIndex === idx;
                  return (
                    <div
                      key={photo.id || idx}
                      onClick={() => setActivePreviewIndex(isSelected ? null : idx)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 cursor-pointer border-2 transition-all ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/40 scale-105 shadow-md'
                          : 'border-white/20 hover:border-white/50 opacity-80 hover:opacity-100'
                      }`}
                      title={`Preview photo ${idx + 1}`}
                    >
                      <img src={photo.dataUrl} alt={`Captured ${idx + 1}`} className="w-full h-full object-cover" />
                      
                      {/* Photo Index Badge */}
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/70 text-white text-[9px] font-bold">
                        {idx + 1}
                      </div>

                      {/* Remove Button on Thumbnail */}
                      <button
                        type="button"
                        onClick={(e) => handleRemovePhoto(idx, e)}
                        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="Delete photo"
                      >
                        <X className="w-2.5 h-2.5 stroke-[3]" />
                      </button>
                    </div>
                  );
                })}

                {/* "+ Take More" Tile Button */}
                <button
                  type="button"
                  onClick={() => setActivePreviewIndex(null)}
                  className={`w-14 h-14 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-white/70 hover:text-white transition-all shrink-0 cursor-pointer ${
                    activePreviewIndex === null
                      ? 'border-primary/60 bg-primary/10 text-primary'
                      : 'border-white/20 hover:border-white/40 bg-white/5'
                  }`}
                  title="Snap another photo"
                >
                  <Plus className="w-4 h-4 mb-0.5" />
                  <span className="text-[9px] font-bold leading-tight">Add</span>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Action Bar (Clean: NO duplicate flash button here) */}
          {!error && (
            <div className="relative z-30 pb-7 pt-4 px-6 bg-gradient-to-t from-black via-black/80 to-transparent sm:border-t sm:border-white/10 sm:bg-black/60 sm:py-4 shrink-0">
              {activePreviewIndex !== null ? (
                // Controls when inspecting a clicked snapshot
                <div className="w-full flex items-center justify-between gap-3 sm:gap-4 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => setActivePreviewIndex(null)}
                    className="flex-1 py-3 px-4 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer backdrop-blur-md border border-white/10 shadow-lg"
                  >
                    <Camera className="w-4 h-4" /> Back to Camera
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(activePreviewIndex)}
                    className="py-3 px-4 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-rose-500/30"
                    title="Remove this photo"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>

                  <button
                    type="button"
                    onClick={handleSendAll}
                    className="flex-1 py-3 px-4 rounded-2xl bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> Send ({capturedPhotos.length})
                  </button>
                </div>
              ) : (
                // Live Shutter & Controls
                <div className="w-full flex items-center justify-between max-w-md mx-auto">
                  {/* Left: Flip camera (or Clear All if photos exist) */}
                  <div className="w-24 flex items-center justify-start gap-2">
                    {hasMultipleCameras && (
                      <button
                        type="button"
                        onClick={handleFlipCamera}
                        className="p-3 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 text-white transition-all cursor-pointer backdrop-blur-md border border-white/10 shadow-md"
                        title="Flip Camera"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    )}

                    {capturedPhotos.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Clear all photos"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Center: Big Shutter Snap Button (Keep clicking photos) */}
                  <button
                    type="button"
                    onClick={handleCapture}
                    disabled={isLoading}
                    className="w-18 h-18 sm:w-16 sm:h-16 rounded-full border-4 border-white flex items-center justify-center p-1.5 cursor-pointer transition-transform active:scale-90 hover:scale-105 shadow-2xl disabled:opacity-50"
                    title={capturedPhotos.length > 0 ? "Take another photo" : "Take photo"}
                  >
                    <div className="w-full h-full rounded-full bg-white transition-colors" />
                  </button>

                  {/* Right: Send all or Cancel */}
                  <div className="w-24 flex justify-end">
                    {capturedPhotos.length > 0 ? (
                      <button
                        type="button"
                        onClick={handleSendAll}
                        className="py-2.5 px-3.5 sm:px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer"
                        title="Send captured photos"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send ({capturedPhotos.length})</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleClose}
                        className="text-xs sm:text-sm font-medium text-white/70 hover:text-white px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
