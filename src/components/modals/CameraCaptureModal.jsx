import React, { useState, useEffect, useRef, useCallback } from 'react';
import ModalPortal from './ModalPortal';
import { Camera, X, RotateCcw, Check, RefreshCw, AlertCircle, Upload, Zap, ZapOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CameraCaptureModal({ isOpen, onClose, onCapture, onFallbackToFile }) {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [error, setError] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isScreenFlashing, setIsScreenFlashing] = useState(false);
  const [flashMode, setFlashMode] = useState('off'); // 'off' or 'on'
  const [isLoading, setIsLoading] = useState(true);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Hardware torch controller for back camera
  const applyTorch = useCallback(async (enabled) => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if ('torch' in capabilities) {
        await track.applyConstraints({
          advanced: [{ torch: enabled }]
        });
      }
    } catch (_) {}
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

  // Start Camera Stream
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
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

        // If back camera and flash is on, apply torch
        if (facingMode === 'environment' && flashMode === 'on') {
          const track = mediaStream.getVideoTracks()[0];
          if (track) {
            try {
              const cap = track.getCapabilities ? track.getCapabilities() : {};
              if ('torch' in cap) {
                track.applyConstraints({ advanced: [{ torch: true }] }).catch(() => {});
              }
            } catch (_) {}
          }
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
  }, [isOpen, facingMode, stopCamera]);

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
  }, [stream, capturedImage]);

  // Flip camera between front and back
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Toggle flash mode on/off
  const handleToggleFlash = () => {
    const nextMode = flashMode === 'on' ? 'off' : 'on';
    setFlashMode(nextMode);
    toast(nextMode === 'on' ? 'Flash enabled' : 'Flash disabled', {
      icon: nextMode === 'on' ? '⚡' : '🌑',
      duration: 1400
    });
  };

  // Capture snapshot from live stream with flash support for front & back
  const handleCapture = async () => {
    if (!videoRef.current) return;

    // Front Camera Screen Flash or assist lighting
    if (flashMode === 'on') {
      setIsScreenFlashing(true);
      // Give 120ms so screen illumination lights up face before reading canvas frame
      await new Promise((resolve) => setTimeout(resolve, 120));
    } else {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 200);
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
      setTimeout(() => setIsScreenFlashing(false), 150);
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error('Failed to capture photo');
          return;
        }
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedImage({ dataUrl, blob });
      },
      'image/jpeg',
      0.92
    );
  };

  // Retake photo: clear snapshot overlay, camera underneath keeps streaming seamlessly
  const handleRetake = () => {
    setCapturedImage(null);
    if (videoRef.current) {
      if (streamRef.current && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  };

  // Confirm and attach photo
  const handleConfirm = () => {
    if (!capturedImage?.blob) return;

    const file = new File([capturedImage.blob], `photo_${Date.now()}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now()
    });

    stopCamera();
    onCapture(file);
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
          if (e.key === ' ' || e.key === 'Enter') {
            if (!capturedImage) handleCapture();
            else handleConfirm();
          }
        }}
        tabIndex={-1}
      >
        {/* Full-screen White Screen Flash (for front camera or dark environments) */}
        {isScreenFlashing && (
          <div className="fixed inset-0 bg-[#fffdfa] pointer-events-none z-[300] transition-opacity duration-75" />
        )}

        {/* Shutter Flash Animation */}
        {isFlashing && (
          <div className="fixed inset-0 bg-white pointer-events-none z-[260] animate-out fade-out duration-200" />
        )}

        {/* Modal Window */}
        <div
          className="relative w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[85vh] bg-slate-950 sm:border sm:border-white/10 sm:rounded-3xl overflow-hidden sm:shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-b from-black/90 via-black/60 to-transparent sm:relative sm:border-b sm:border-white/10 sm:bg-black/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide drop-shadow-md sm:drop-shadow-none flex items-center gap-2">
                  {capturedImage ? 'Preview Photo' : 'Camera'}
                  {!capturedImage && flashMode === 'on' && (
                    <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 tracking-wider">
                      Flash ON
                    </span>
                  )}
                </h3>
                <p className="text-[11px] sm:text-xs text-white/70 sm:text-white/50 drop-shadow-md sm:drop-shadow-none">
                  {capturedImage
                    ? 'Ready to send in chat'
                    : facingMode === 'user'
                    ? 'Front Camera (Screen flash enabled when active)'
                    : 'Back Camera (Flash torch enabled when active)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Flash Toggle button on header */}
              {!capturedImage && (
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
              {hasMultipleCameras && !capturedImage && (
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  className="p-2 sm:p-2.5 text-white/80 hover:text-white bg-black/40 hover:bg-white/10 rounded-xl transition-colors cursor-pointer border border-white/10"
                  title="Flip Camera"
                >
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

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
                  }`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Front Camera Softbox Ring when Flash is ON */}
                {flashMode === 'on' && facingMode === 'user' && !capturedImage && (
                  <div className="absolute inset-0 pointer-events-none ring-8 ring-amber-100/30 shadow-[inset_0_0_100px_rgba(255,248,220,0.45)] z-10 transition-all duration-300" />
                )}

                {/* 2. Captured Image Snapshot Overlay */}
                {capturedImage && (
                  <img
                    src={capturedImage.dataUrl}
                    alt="Captured snapshot"
                    className="absolute inset-0 w-full h-full object-cover sm:object-contain sm:max-h-[55vh] z-15 bg-black animate-in fade-in duration-100"
                  />
                )}

                {/* 3. Grid Overlay for framing */}
                {!capturedImage && (
                  <div className="absolute inset-0 pointer-events-none border border-white/10 grid grid-cols-3 grid-rows-3 opacity-25 z-5">
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

                {isLoading && !capturedImage && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white gap-2 z-20">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-xs font-medium">Starting camera...</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom Action Bar */}
          {!error && (
            <div className="absolute bottom-0 inset-x-0 z-30 pb-7 pt-5 px-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent sm:relative sm:border-t sm:border-white/10 sm:bg-black/60 sm:py-4 shrink-0">
              {capturedImage ? (
                // Retake & Confirm Controls
                <div className="w-full flex items-center justify-between gap-3 sm:gap-4 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="flex-1 py-3.5 sm:py-3 px-4 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer backdrop-blur-md border border-white/10 shadow-lg"
                  >
                    <RotateCcw className="w-4 h-4" /> Retake
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="flex-1 py-3.5 sm:py-3 px-4 rounded-2xl bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-primary/30 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Send Photo
                  </button>
                </div>
              ) : (
                // Live Shutter & Controls
                <div className="w-full flex items-center justify-between max-w-md mx-auto">
                  {/* Left: Quick controls (Flash + Flip) */}
                  <div className="w-24 flex items-center justify-start gap-2">
                    {/* Flash toggle button */}
                    <button
                      type="button"
                      onClick={handleToggleFlash}
                      className={`p-3 rounded-full transition-all cursor-pointer border backdrop-blur-md shadow-md ${
                        flashMode === 'on'
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-500/30'
                          : 'bg-white/15 hover:bg-white/25 text-white border-white/10'
                      }`}
                      title={flashMode === 'on' ? 'Turn Flash Off' : 'Turn Flash On'}
                    >
                      {flashMode === 'on' ? (
                        <Zap className="w-5 h-5 fill-current" />
                      ) : (
                        <ZapOff className="w-5 h-5" />
                      )}
                    </button>

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
                  </div>

                  {/* Center: Big Shutter Snap Button */}
                  <button
                    type="button"
                    onClick={handleCapture}
                    disabled={isLoading}
                    className="w-18 h-18 sm:w-16 sm:h-16 rounded-full border-4 border-white flex items-center justify-center p-1.5 cursor-pointer transition-transform active:scale-90 hover:scale-105 shadow-2xl disabled:opacity-50"
                    title="Take Photo"
                  >
                    <div className="w-full h-full rounded-full bg-white transition-colors" />
                  </button>

                  {/* Right: Cancel button */}
                  <div className="w-24 flex justify-end">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="text-xs sm:text-sm font-medium text-white/70 hover:text-white px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
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
