import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Upload, Check, X, Loader2, Music, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ModalPortal from './ModalPortal';
import AudioPlayerWidget from '../common/AudioPlayerWidget';

const VoiceRecorderModal = ({ isOpen, onClose, onAudioReady }) => {
  const [activeTab, setActiveTab] = useState('record'); // 'record' | 'upload'
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      cleanupRecording();
      setRecordedAudioBlob(null);
      setPreviewUrl(null);
      setAudioFile(null);
      setRecordingDuration(0);
      setIsRecording(false);
    }
  }, [isOpen]);

  const cleanupRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      cleanupRecording();
      setRecordedAudioBlob(null);
      setPreviewUrl(null);
      setAudioFile(null);
      setRecordingDuration(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioBlob(audioBlob);
        setPreviewUrl(url);

        // Convert blob to file
        const fileExt = mimeType.includes('mp4') ? 'm4a' : 'webm';
        const file = new File([audioBlob], `voice_recording_${Date.now()}.${fileExt}`, { type: mimeType });
        setAudioFile(file);
      };

      mediaRecorder.start(200); // Collect data every 200ms
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting audio recording:', err);
      toast.error('Could not access microphone. Please grant mic permissions.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  const handleDiscard = () => {
    cleanupRecording();
    setRecordedAudioBlob(null);
    setPreviewUrl(null);
    setAudioFile(null);
    setRecordingDuration(0);
    setIsRecording(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Please select a valid audio file');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Audio file size must be less than 15MB');
      return;
    }

    const url = URL.createObjectURL(file);
    setAudioFile(file);
    setPreviewUrl(url);
    setRecordedAudioBlob(file);
  };

  const handleConfirm = () => {
    if (!audioFile || !previewUrl) {
      toast.error('No audio recorded or selected');
      return;
    }

    onAudioReady({
      file: audioFile,
      previewUrl,
      type: 'audio',
      name: audioFile.name || 'Voice Note',
      duration: recordingDuration
    });

    onClose();
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-card border border-border/60 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Attach Audio / Voice</h3>
                <p className="text-xs text-muted-foreground">Share voice notes or audio files</p>
              </div>
            </div>
            <button 
              onClick={() => { cleanupRecording(); onClose(); }}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border/50 bg-muted/20">
            <button
              type="button"
              onClick={() => { if (!isRecording) setActiveTab('record'); }}
              disabled={isRecording}
              className={`flex-1 py-3 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'record' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mic className="w-4 h-4" /> Record Voice
            </button>
            <button
              type="button"
              onClick={() => { if (!isRecording) setActiveTab('upload'); }}
              disabled={isRecording}
              className={`flex-1 py-3 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'upload' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Upload className="w-4 h-4" /> Upload Audio File
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'record' ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-6">
                
                {/* Timer & Pulsing Wave Indicator */}
                <div className="flex flex-col items-center gap-3">
                  <div className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 ${
                    isRecording 
                      ? 'bg-red-500/10 text-red-500 ring-8 ring-red-500/20 animate-pulse' 
                      : previewUrl 
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {isRecording ? (
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-4 rounded-full bg-red-500 animate-ping absolute" />
                        <Mic className="w-10 h-10 text-red-500 relative z-10" />
                      </div>
                    ) : (
                      <Mic className="w-10 h-10" />
                    )}
                  </div>

                  <div className="text-center">
                    <span className="font-mono text-2xl font-black text-foreground tracking-widest">
                      {formatTimer(recordingDuration)}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isRecording ? 'Recording your voice... Speak now' : previewUrl ? 'Recording ready for preview' : 'Click the button to start recording'}
                    </p>
                  </div>
                </div>

                {/* Wave Animation during recording */}
                {isRecording && (
                  <div className="flex items-center gap-1 h-8">
                    {[40, 70, 100, 60, 90, 45, 80, 100, 65, 85, 40, 75, 95, 50, 70].map((h, i) => (
                      <div 
                        key={i} 
                        className="w-1 bg-red-500 rounded-full animate-bounce"
                        style={{ 
                          height: `${h}%`,
                          animationDelay: `${(i % 5) * 0.15}s`,
                          animationDuration: '0.8s'
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Preview Player if recorded */}
                {!isRecording && previewUrl && (
                  <div className="w-full">
                    <AudioPlayerWidget 
                      src={previewUrl} 
                      title={audioFile?.name || 'Your Voice Note'} 
                      allowDownload={false}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3 w-full pt-2">
                  {isRecording ? (
                    <>
                      <button
                        type="button"
                        onClick={handleDiscard}
                        className="flex-1 py-3 px-4 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" /> Cancel
                      </button>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md text-sm animate-pulse"
                      >
                        <Square className="w-4 h-4 fill-white" /> Done Recording
                      </button>
                    </>
                  ) : previewUrl ? (
                    <>
                      <button
                        type="button"
                        onClick={handleDiscard}
                        className="flex-1 py-3 px-4 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" /> Re-record
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirm}
                        className="flex-1 py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md text-sm"
                      >
                        <Check className="w-4 h-4" /> Attach Audio
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-md text-sm hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Mic className="w-5 h-5" /> Start Recording
                    </button>
                  )}
                </div>

              </div>
            ) : (
              /* Upload Tab */
              <div className="space-y-4 py-2">
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm,.aac"
                  className="hidden"
                />

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-primary/5 transition-all text-center group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Music className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Click to browse audio file</p>
                    <p className="text-xs text-muted-foreground mt-0.5">MP3, WAV, M4A, OGG, WEBM up to 15MB</p>
                  </div>
                </div>

                {previewUrl && (
                  <div className="space-y-3">
                    <AudioPlayerWidget 
                      src={previewUrl} 
                      title={audioFile?.name || 'Selected Audio'} 
                      allowDownload={false}
                    />

                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md text-sm"
                    >
                      <Check className="w-4 h-4" /> Attach Audio File
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </ModalPortal>
  );
};

export default VoiceRecorderModal;
