import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Loader2, Music, Mic, User } from 'lucide-react';
import { downloadMediaFile } from '../../utils/downloadHelper';

const formatTime = (seconds) => {
  if (isNaN(seconds) || !isFinite(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const AudioPlayerWidget = ({ 
  src, 
  title, 
  duration: initialDuration = 0,
  variant = 'card', // 'card' | 'compact' | 'bubble'
  className = '', 
  allowDownload = true,
  autoPlay = false,
  userAvatar = null,
  senderName = '',
  isMe = false
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(
    initialDuration > 0 && isFinite(initialDuration) ? Number(initialDuration) : 0
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const playerIdRef = useRef(Math.random().toString(36).substring(2, 9));
  const isSeekingRef = useRef(false);

  const updateDurationIfValid = (candidate) => {
    if (typeof candidate === 'number' && isFinite(candidate) && candidate > 0 && !isNaN(candidate)) {
      setDuration(prev => {
        if (!prev || prev === 0 || !isFinite(prev) || Math.abs(prev - candidate) > 0.5) {
          return candidate;
        }
        return prev;
      });
      return true;
    }
    return false;
  };

  // Sync initialDuration prop if supplied or updated
  useEffect(() => {
    if (initialDuration && isFinite(initialDuration) && Number(initialDuration) > 0) {
      updateDurationIfValid(Number(initialDuration));
      setIsLoading(false);
    }
  }, [initialDuration]);

  // Reset states on src change
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setHasError(false);
    if (initialDuration && isFinite(initialDuration) && Number(initialDuration) > 0) {
      setDuration(Number(initialDuration));
      setIsLoading(false);
    } else {
      setDuration(0);
      setIsLoading(true);
    }
  }, [src]);

  // WebM duration workaround for Chromium
  // MediaRecorder WebM files often lack EBML duration headers, reporting duration = Infinity.
  const fixWebmDuration = (audio) => {
    if (!audio) return;
    const initialTime = audio.currentTime;

    const onSeeked = () => {
      audio.removeEventListener('seeked', onSeeked);
      if (isFinite(audio.duration) && audio.duration > 0) {
        updateDurationIfValid(audio.duration);
      } else if (audio.currentTime > 0 && isFinite(audio.currentTime)) {
        updateDurationIfValid(audio.currentTime);
      }
      try {
        audio.currentTime = initialTime;
      } catch (_) {}
      setIsLoading(false);
    };

    audio.addEventListener('seeked', onSeeked, { once: true });
    try {
      audio.currentTime = 1e101;
    } catch (_) {
      audio.removeEventListener('seeked', onSeeked);
    }
  };

  // Web Audio API background decoder: guarantees 100% accurate duration for WebM/MP3/WAV/OGG/AAC
  useEffect(() => {
    if (!src) return;
    let isCancelled = false;

    const decodeAudioDuration = async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) return;
        const arrayBuffer = await res.arrayBuffer();
        if (isCancelled) return;

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          ctx.decodeAudioData(
            arrayBuffer,
            (buffer) => {
              if (!isCancelled && buffer?.duration && isFinite(buffer.duration)) {
                updateDurationIfValid(buffer.duration);
                setIsLoading(false);
              }
              try { ctx.close(); } catch (_) {}
            },
            () => {
              try { ctx.close(); } catch (_) {}
            }
          );
        }
      } catch (_) {
        // Fallback to HTML5 audio element handlers
      }
    };

    decodeAudioDuration();

    return () => {
      isCancelled = true;
    };
  }, [src]);

  // Global audio coordinator: pause other audio players when this or another player starts
  useEffect(() => {
    const handleGlobalPause = (e) => {
      if (e.detail?.playerId !== playerIdRef.current && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener('campusbridge_pause_all_audio', handleGlobalPause);
    return () => {
      window.removeEventListener('campusbridge_pause_all_audio', handleGlobalPause);
    };
  }, []);

  const togglePlay = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Broadcast to pause all other running audio across feed, chats, etc.
      window.dispatchEvent(new CustomEvent('campusbridge_pause_all_audio', {
        detail: { playerId: playerIdRef.current }
      }));
      audioRef.current.play()
        .then(() => {
          setIsLoading(false);
          setIsPlaying(true);
        })
        .catch(err => {
          console.warn('Audio play failed:', err);
          setIsLoading(false);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current || isSeekingRef.current) return;
    const cur = audioRef.current.currentTime;
    if (isFinite(cur)) {
      setCurrentTime(cur);
      if (cur > duration) {
        updateDurationIfValid(cur);
      }
    }
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setIsLoading(false);

    if (isFinite(audio.duration) && audio.duration > 0) {
      updateDurationIfValid(audio.duration);
    } else {
      fixWebmDuration(audio);
    }

    if (audio) {
      audio.playbackRate = playbackRate;
    }
    if (autoPlay) {
      window.dispatchEvent(new CustomEvent('campusbridge_pause_all_audio', {
        detail: { playerId: playerIdRef.current }
      }));
      audio.play().then(() => {
        setIsLoading(false);
        setIsPlaying(true);
      }).catch(() => {});
    }
  };

  // Timeline Scrubbing Handlers: keep isSeekingRef true during continuous dragging
  const handleSeekStart = (e) => {
    e.stopPropagation();
    isSeekingRef.current = true;
  };

  const handleSeekChange = (e) => {
    e.stopPropagation();
    const newTime = parseFloat(e.target.value);
    if (!isNaN(newTime) && isFinite(newTime)) {
      setCurrentTime(newTime);
    }
  };

  const handleSeekEnd = (e) => {
    e.stopPropagation();
    isSeekingRef.current = false;
    const newTime = parseFloat(e.target.value);
    if (!isNaN(newTime) && isFinite(newTime)) {
      setCurrentTime(newTime);
      if (audioRef.current) {
        try {
          audioRef.current.currentTime = newTime;
        } catch (err) {
          console.warn('Audio seek error:', err);
        }
      }
    }
  };

  const handleSeekInput = handleSeekChange;
  const handleSeekCommit = handleSeekEnd;

  // Window-level release listener ensures seek commits even if mouse/finger leaves slider thumb
  useEffect(() => {
    const handleGlobalEnd = () => {
      if (isSeekingRef.current) {
        isSeekingRef.current = false;
        if (audioRef.current && isFinite(currentTime)) {
          try {
            audioRef.current.currentTime = currentTime;
          } catch (_) {}
        }
      }
    };
    window.addEventListener('pointerup', handleGlobalEnd);
    window.addEventListener('touchend', handleGlobalEnd);
    window.addEventListener('mouseup', handleGlobalEnd);
    return () => {
      window.removeEventListener('pointerup', handleGlobalEnd);
      window.removeEventListener('touchend', handleGlobalEnd);
      window.removeEventListener('mouseup', handleGlobalEnd);
    };
  }, [currentTime]);

  const cyclePlaybackRate = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    const rates = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const toggleMute = (e) => {
    e?.stopPropagation();
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleDownload = (e) => {
    e?.stopPropagation();
    downloadMediaFile(src, title || 'audio_recording.mp3');
  };

  if (!src) return null;

  const maxSeekTime = duration > 0 ? duration : (currentTime > 0 ? currentTime + 1 : 100);

  if (variant === 'bubble') {
    return (
      <div 
        className={`flex items-center gap-2.5 sm:gap-3 py-1.5 px-2 sm:px-3 rounded-2xl w-full max-w-[280px] sm:max-w-[320px] select-none ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <audio 
          ref={audioRef}
          src={src}
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onLoadedData={() => setIsLoading(false)}
          onCanPlay={() => setIsLoading(false)}
          onCanPlayThrough={() => setIsLoading(false)}
          onPlaying={() => { setIsLoading(false); setIsPlaying(true); }}
          onPlay={() => { setIsLoading(false); setIsPlaying(true); }}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => { if (!isPlaying) setIsLoading(true); }}
          onEnded={handleEnded}
          onError={() => { setIsLoading(false); setHasError(true); }}
        />

        {/* Sender Avatar with Mic Badge (WhatsApp style) */}
        <div className="relative shrink-0">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt={senderName || "Speaker"} 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-white/20 shadow-xs" 
            />
          ) : (
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border shadow-xs ${
              isMe ? 'bg-primary-foreground/20 border-white/30 text-primary-foreground' : 'bg-muted border-border/50 text-muted-foreground'
            }`}>
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs ring-1 ring-background">
            <Mic className="w-2.5 h-2.5" />
          </div>
        </div>

        {/* Play/Pause Button */}
        <button 
          type="button"
          onClick={togglePlay}
          disabled={hasError}
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs hover:scale-105 active:scale-95 transition-all disabled:opacity-50 ${
            isMe 
              ? 'bg-primary-foreground text-primary hover:bg-primary-foreground/90' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {isLoading && !isPlaying ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Timeline Slider & Time Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          {/* Interactive Scrubbable Range */}
          <div className="relative w-full flex items-center py-0.5">
            <input 
              type="range"
              min={0}
              max={maxSeekTime}
              step="any"
              value={currentTime}
              onInput={handleSeekChange}
              onChange={handleSeekChange}
              onPointerDown={handleSeekStart}
              onPointerUp={handleSeekEnd}
              onTouchStart={handleSeekStart}
              onTouchEnd={handleSeekEnd}
              onMouseUp={handleSeekEnd}
              onKeyUp={handleSeekEnd}
              disabled={hasError || (!duration && !currentTime && isLoading)}
              className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none transition-all ${
                isMe ? 'bg-primary-foreground/30 accent-primary-foreground' : 'bg-muted-foreground/30 accent-primary'
              }`}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono leading-none">
            <span className={isMe ? 'text-primary-foreground/85' : 'text-muted-foreground'}>
              {formatTime(currentTime)}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={isMe ? 'text-primary-foreground/85' : 'text-muted-foreground'}>
                {formatTime(duration)}
              </span>
              {/* Speed Cycle Button */}
              <button
                type="button"
                onClick={cyclePlaybackRate}
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold transition-all active:scale-90 ${
                  isMe 
                    ? 'bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30' 
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
                title="Change speed (1x, 1.5x, 2x)"
              >
                {playbackRate}x
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`p-3.5 sm:p-4 rounded-2xl bg-card/90 border border-border/60 backdrop-blur-md shadow-sm transition-all hover:border-primary/40 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <audio 
        ref={audioRef}
        src={src}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        onCanPlayThrough={() => setIsLoading(false)}
        onPlaying={() => { setIsLoading(false); setIsPlaying(true); }}
        onPlay={() => { setIsLoading(false); setIsPlaying(true); }}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => { if (!isPlaying) setIsLoading(true); }}
        onEnded={handleEnded}
        onError={() => { setIsLoading(false); setHasError(true); }}
      />

      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {userAvatar ? (
            <div className="relative shrink-0">
              <img 
                src={userAvatar} 
                alt={senderName || "Speaker"} 
                className="w-9 h-9 rounded-xl object-cover border border-border shadow-xs" 
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs ring-1 ring-background">
                <Mic className="w-2.5 h-2.5" />
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Music className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{title || 'Audio Note'}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {hasError ? 'Failed to load audio' : isPlaying ? 'Playing...' : 'Audio message'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button 
            type="button"
            onClick={toggleMute}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          {allowDownload && (
            <button 
              type="button"
              onClick={handleDownload}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Download Audio"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress & Scrubber */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={togglePlay}
            disabled={hasError}
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading && !isPlaying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <div className="flex-1 min-w-0 space-y-1">
            <input 
              type="range"
              min={0}
              max={maxSeekTime}
              step="any"
              value={currentTime}
              onInput={handleSeekChange}
              onChange={handleSeekChange}
              onPointerDown={handleSeekStart}
              onPointerUp={handleSeekEnd}
              onTouchStart={handleSeekStart}
              onTouchEnd={handleSeekEnd}
              onMouseUp={handleSeekEnd}
              onKeyUp={handleSeekEnd}
              disabled={hasError || (!duration && !currentTime && isLoading)}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
            />
            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
              <span>{formatTime(currentTime)}</span>
              <div className="flex items-center gap-2">
                <span>{formatTime(duration)}</span>
                <button
                  type="button"
                  onClick={cyclePlaybackRate}
                  className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-muted hover:bg-muted/80 text-foreground transition-all"
                  title="Change speed"
                >
                  {playbackRate}x
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayerWidget;
