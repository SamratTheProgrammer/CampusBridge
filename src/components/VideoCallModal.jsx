import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Maximize2, Minimize2, PhoneIncoming, Volume2, VolumeX, MonitorUp, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../services/socket';
import toast from 'react-hot-toast';
import ringtoneService from '../utils/ringtone';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' }
  ]
};

const VideoCallModal = ({ currentUser }) => {
  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'incoming' | 'connected'
  const [callType, setCallType] = useState('video'); // 'video' | 'audio'
  const [partner, setPartner] = useState(null); // { clerkId, name, image }
  
  // Call Controls State
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live Timer State
  const [callDuration, setCallDuration] = useState(0); // in seconds
  const timerIntervalRef = useRef(null);
  const callTimeoutRef = useRef(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const iceCandidateQueueRef = useRef([]);
  const isCallerRef = useRef(false);
  const targetPartnerClerkIdRef = useRef(null);

  // Callback Ref for Local Video Elements (Ensures immediate stream attachment on DOM mount)
  const setLocalVideoRef = useCallback((node) => {
    localVideoRef.current = node;
    if (node && localStreamRef.current) {
      if (node.srcObject !== localStreamRef.current) {
        node.srcObject = localStreamRef.current;
      }
      node.play().catch((e) => console.warn('Local video play catch:', e));
    }
  }, []);

  // Callback Ref for Remote Video Elements
  const setRemoteVideoRef = useCallback((node) => {
    remoteVideoRef.current = node;
    if (node && remoteStreamRef.current) {
      if (node.srcObject !== remoteStreamRef.current) {
        node.srcObject = remoteStreamRef.current;
      }
      node.play().catch((e) => console.warn('Remote video play catch:', e));
    }
  }, []);

  // Register online user socket on mount
  useEffect(() => {
    if (currentUser?.id) {
      socket.emit('register_user', currentUser.id);
    }
  }, [currentUser]);

  // Start self camera preview when an incoming video call arrives
  useEffect(() => {
    if (callState === 'incoming' && callType === 'video') {
      getUserMediaStream('video')
        .then((stream) => {
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(() => {});
          }
        })
        .catch((err) => console.warn('Incoming call self camera preview error:', err));
    }
  }, [callState, callType]);

  // 60-Second Auto-Decline / No Answer Timeout Timer
  useEffect(() => {
    if (callState === 'calling' || callState === 'incoming') {
      callTimeoutRef.current = setTimeout(() => {
        console.log('Call timed out automatically after 60 seconds');
        const targetId = partner?.clerkId || targetPartnerClerkIdRef.current;
        if (targetId) {
          socket.emit('end_call', { 
            toClerkId: targetId, 
            fromClerkId: currentUser?.id 
          });
        }

        toast.error(
          callState === 'calling' ? 'No answer from user' : 'Missed call',
          { id: 'call_status_toast' }
        );

        cleanupCall('missed');
      }, 60000); // 60,000 ms = 1 minute
    } else {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
    }

    return () => {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
    };
  }, [callState]);

  // Live Call Timer Management
  useEffect(() => {
    if (callState === 'connected') {
      setCallDuration(0);
      timerIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [callState]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Save Call History Log to MongoDB
  const saveCallLogToDb = async (status, durationSec) => {
    if (!currentUser || !partner?.clerkId) return;
    try {
      const payload = {
        senderClerkId: currentUser.id,
        recipientClerkId: partner.clerkId,
        callType,
        status,
        duration: durationSec
      };

      const res = await fetch('/api/messages/call-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const callLogMsg = await res.json();
        socket.emit('send_message', {
          senderClerkId: currentUser.id,
          recipientClerkId: partner.clerkId,
          conversationId: callLogMsg.conversationId,
          text: callLogMsg.text
        });
      }
    } catch (err) {
      console.error('Error saving call log:', err);
    }
  };

  // Sound Effects Manager for Incoming, Outgoing Ringing, Connect, and End
  useEffect(() => {
    if (callState === 'incoming') {
      ringtoneService.startIncomingRingtone();
    } else if (callState === 'calling') {
      ringtoneService.startOutgoingRingtone();
    } else if (callState === 'connected') {
      ringtoneService.playCallConnectSound();
    } else if (callState === 'idle') {
      ringtoneService.stop();
    }

    return () => {
      ringtoneService.stop();
    };
  }, [callState]);

  // Clean up streams & peer connection
  const cleanupCall = (finalStatus = 'completed') => {
    toast.dismiss();
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    const finalDuration = callDuration;
    ringtoneService.playCallEndSound();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    if (callState === 'connected' || (isCallerRef.current && finalStatus === 'missed')) {
      saveCallLogToDb(finalStatus, finalDuration);
    }

    setCallState('idle');
    setPartner(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsSpeakerOn(true);
    setIsScreenSharing(false);
    setCallDuration(0);
    pendingOfferRef.current = null;
    iceCandidateQueueRef.current = [];
    isCallerRef.current = false;
  };

  // Process any queued ICE candidates after remote description is set
  const processIceQueue = async () => {
    if (!peerRef.current || !peerRef.current.remoteDescription) return;
    while (iceCandidateQueueRef.current.length > 0) {
      const candidate = iceCandidateQueueRef.current.shift();
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding queued ICE candidate:', err);
      }
    }
  };

  // Get User Media Helper with Fallbacks and track status sync
  const getUserMediaStream = async (type) => {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false
      });
    } catch (err) {
      console.warn('Ideal media constraints failed, falling back to basic audio/video:', err);
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });
    }

    // Apply current mic mute and video off settings to new stream tracks
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !isVideoOff;
    });

    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(() => {});
    }

    return stream;
  };

  // Create & configure RTCPeerConnection
  const createPeerConnection = (targetClerkId) => {
    const recipientId = targetClerkId || targetPartnerClerkIdRef.current;
    if (recipientId) {
      targetPartnerClerkIdRef.current = recipientId;
    }

    const peer = new RTCPeerConnection(ICE_SERVERS);

    peer.onicecandidate = (event) => {
      const toId = recipientId || targetPartnerClerkIdRef.current;
      if (event.candidate && toId) {
        socket.emit('ice_candidate', { 
          toClerkId: toId, 
          fromClerkId: currentUser?.id, 
          candidate: event.candidate 
        });
      }
    };

    peer.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      remoteStreamRef.current = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.play().catch((e) => console.warn('Auto-play error:', e));
      }
    };

    peer.onconnectionstatechange = () => {
      console.log('Peer connection state changed:', peer.connectionState);
      if (peer.connectionState === 'connected') {
        setCallState('connected');
      } else if (peer.connectionState === 'failed') {
        toast.error('Call connection failed', { id: 'call_status_toast' });
        cleanupCall('failed');
      }
    };

    peerRef.current = peer;
    return peer;
  };

  // Start Outgoing Call
  const startCall = async (targetPartner, type = 'video') => {
    if (!currentUser || !targetPartner?.clerkId) return;

    try {
      toast.dismiss();
      targetPartnerClerkIdRef.current = targetPartner.clerkId;
      setPartner(targetPartner);
      setCallType(type);
      setCallState('calling');
      isCallerRef.current = true;
      iceCandidateQueueRef.current = [];

      socket.emit('register_user', currentUser.id);

      const stream = await getUserMediaStream(type);

      const peer = createPeerConnection(targetPartner.clerkId);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === 'video'
      });
      await peer.setLocalDescription(offer);

      socket.emit('call_user', {
        recipientClerkId: targetPartner.clerkId,
        callerClerkId: currentUser.id,
        callerName: currentUser.fullName || 'User',
        callerImage: currentUser.imageUrl,
        offer,
        callType: type
      });
    } catch (err) {
      console.error('Error starting call:', err);
      toast.error('Could not access camera or microphone', { id: 'call_status_toast' });
      cleanupCall('failed');
    }
  };

  // Answer Incoming Call
  const answerCall = async () => {
    const pending = pendingOfferRef.current;
    const targetId = partner?.clerkId || targetPartnerClerkIdRef.current || pending?.callerClerkId;

    if (!pending || !targetId) {
      console.error('Answer call aborted: missing pending offer or target ID', { pending, targetId });
      return;
    }

    try {
      toast.dismiss();
      targetPartnerClerkIdRef.current = targetId;
      const { offer, type } = pending;
      setCallState('connected');

      socket.emit('register_user', currentUser.id);

      let stream = localStreamRef.current;
      if (!stream) {
        stream = await getUserMediaStream(type);
      }

      const peer = createPeerConnection(targetId);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      await processIceQueue();

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit('answer_call', { 
        toClerkId: targetId, 
        fromClerkId: currentUser.id, 
        answer 
      });
    } catch (err) {
      console.error('Error answering call:', err);
      toast.error('Failed to connect call', { id: 'call_status_toast' });
      cleanupCall('failed');
    }
  };

  // Reject Call
  const rejectCall = () => {
    toast.dismiss();
    if (partner?.clerkId) {
      socket.emit('reject_call', { 
        toClerkId: partner.clerkId, 
        fromClerkId: currentUser?.id 
      });
    }
    saveCallLogToDb('rejected', 0);
    cleanupCall('rejected');
  };

  // End Call
  const endCall = () => {
    toast.dismiss();
    if (partner?.clerkId) {
      socket.emit('end_call', { 
        toClerkId: partner.clerkId, 
        fromClerkId: currentUser?.id 
      });
    }
    cleanupCall('completed');
  };

  // Toggle Mute Microphone
  const toggleMute = () => {
    setIsMuted((prevMuted) => {
      const nextMuted = !prevMuted;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !nextMuted;
        });
      }
      toast(nextMuted ? 'Microphone muted 🔇' : 'Microphone unmuted 🎙️', { id: 'mic_toast' });
      return nextMuted;
    });
  };

  // Toggle Camera Video
  const toggleVideo = () => {
    setIsVideoOff((prevVideoOff) => {
      const nextVideoOff = !prevVideoOff;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = !nextVideoOff;
        });
      }
      toast(nextVideoOff ? 'Camera turned off 📹' : 'Camera turned on 🎥', { id: 'video_toast' });
      return nextVideoOff;
    });
  };

  // Toggle Speaker Output Mode
  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = isSpeakerOn;
      setIsSpeakerOn(!isSpeakerOn);
      toast.success(isSpeakerOn ? 'Speaker muted 🔇' : 'Speaker unmuted 🔊', { id: 'speaker_toast' });
    }
  };

  // Screen Share
  const toggleScreenShare = async () => {
    if (!peerRef.current) return;
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        const screenTrack = stream.getVideoTracks()[0];

        const sender = peerRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
        toast.success('Sharing your screen', { id: 'screenshare_toast' });
      } else {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        const videoTrack = localStreamRef.current?.getVideoTracks()[0];
        const sender = peerRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        setIsScreenSharing(false);
        toast('Screen sharing stopped', { id: 'screenshare_toast' });
      }
    } catch (err) {
      console.error('Screen sharing error:', err);
    }
  };

  // Socket WebRTC Listeners
  useEffect(() => {
    const handleIncomingCall = ({ callerClerkId, callerName, callerImage, offer, callType }) => {
      targetPartnerClerkIdRef.current = callerClerkId;
      setPartner({ clerkId: callerClerkId, name: callerName, image: callerImage });
      setCallType(callType || 'video');
      setCallState('incoming');
      pendingOfferRef.current = { offer, type: callType || 'video', callerClerkId };
    };

    const handleCallAccepted = async ({ answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        await processIceQueue();
        setCallState('connected');
      }
    };

    const handleCallRejected = () => {
      toast.error('Call declined', { id: 'call_status_toast' });
      cleanupCall('rejected');
    };

    const handleCallEnded = () => {
      toast('Call ended 📞', { id: 'call_status_toast' });
      cleanupCall('completed');
    };

    const handleCallFailed = ({ reason }) => {
      toast.error(reason || 'Call failed', { id: 'call_status_toast' });
      cleanupCall('missed');
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (peerRef.current && peerRef.current.remoteDescription) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      } else {
        iceCandidateQueueRef.current.push(candidate);
      }
    };

    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_ended', handleCallEnded);
    socket.on('call_failed', handleCallFailed);
    socket.on('ice_candidate', handleIceCandidate);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_ended', handleCallEnded);
      socket.off('call_failed', handleCallFailed);
      socket.off('ice_candidate', handleIceCandidate);
    };
  }, []);

  // Listen for window initiate_call trigger
  useEffect(() => {
    const handleTriggerCall = (e) => {
      const { targetPartner, type } = e.detail;
      startCall(targetPartner, type);
    };
    window.addEventListener('initiate_call', handleTriggerCall);
    return () => window.removeEventListener('initiate_call', handleTriggerCall);
  }, [currentUser]);

  if (callState === 'idle') return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        
        {/* PREMIUM INCOMING CALL SCREEN WITH SELF CAMERA PREVIEW */}
        {callState === 'incoming' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-zinc-950 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-lg w-full text-center space-y-6 overflow-hidden"
          >
            <div className="relative z-10 space-y-6">
              {/* Caller Avatar with Pulse Rings */}
              <div className="relative inline-block">
                <img
                  src={partner?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner?.name}`}
                  alt={partner?.name}
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-primary/60 mx-auto shadow-2xl relative z-10"
                />
                <span className="absolute inset-0 rounded-full ring-4 ring-primary animate-ping opacity-60"></span>
                <span className="absolute -bottom-1 -right-1 z-20 bg-primary text-primary-foreground p-2.5 rounded-full shadow-lg">
                  {callType === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">{partner?.name}</h3>
                <p className="text-sm text-primary font-semibold mt-1 flex items-center justify-center gap-1.5 animate-pulse">
                  <Sparkles className="w-4 h-4" /> Incoming {callType === 'video' ? 'Video' : 'Audio'} Call...
                </p>
              </div>

              {/* Inset Live Camera Preview Card (You Can See Yourself!) */}
              {callType === 'video' && (
                <div className="relative max-w-xs mx-auto h-44 bg-zinc-900 border border-white/20 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
                  <video
                    ref={setLocalVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                  />
                  {isVideoOff && (
                    <div className="text-xs text-white/60 font-medium">Your Camera is Off</div>
                  )}
                  <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 backdrop-blur text-white px-2 py-0.5 rounded-md border border-white/10 font-medium">
                    You (Preview)
                  </span>
                </div>
              )}

              {/* Pre-Call Audio/Video Toggle Controls */}
              <div className="flex justify-center gap-4 py-1">
                <button
                  onClick={toggleMute}
                  className={`p-3 rounded-full border transition-all ${
                    isMuted ? 'bg-red-500/30 text-red-400 border-red-500/50 shadow-md ring-2 ring-red-500/30' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
                  title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {callType === 'video' && (
                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full border transition-all ${
                      isVideoOff ? 'bg-red-500/30 text-red-400 border-red-500/50 shadow-md ring-2 ring-red-500/30' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                    title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  >
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>
                )}
              </div>

              {/* Decline & Answer Buttons */}
              <div className="flex justify-center gap-8 pt-2">
                <button
                  onClick={rejectCall}
                  className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center hover:scale-110 transition-all shadow-xl hover:bg-red-700"
                  title="Decline"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
                <button
                  onClick={answerCall}
                  className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center hover:scale-110 transition-all shadow-xl hover:bg-green-600 animate-pulse"
                  title="Answer"
                >
                  <PhoneIncoming className="w-7 h-7" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* CALLING / CONNECTED SCREEN */}
        {(callState === 'calling' || callState === 'connected') && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`relative bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-all ${
              isFullscreen ? 'w-screen h-screen rounded-none' : 'w-full max-w-4xl h-[82vh]'
            }`}
          >
            {/* Top Bar with Live Timer & Partner Name */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <img
                  src={partner?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner?.name}`}
                  alt={partner?.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/50"
                />
                <div>
                  <h4 className="text-white font-bold text-sm">{partner?.name}</h4>
                  <p className="text-xs text-zinc-300 capitalize">{callType} Call</p>
                </div>
              </div>

              {/* Live Timer Counter */}
              {callState === 'connected' && (
                <div className="flex items-center gap-2 bg-black/60 border border-white/20 px-4 py-1.5 rounded-full text-green-400 font-mono text-xs font-bold tracking-wider shadow-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span>{formatTimer(callDuration)}</span>
                </div>
              )}
            </div>

            {/* Main View Area */}
            <div className="relative flex-1 bg-zinc-950 flex items-center justify-center overflow-hidden">
              
              {/* ALWAYS MOUNT REMOTE VIDEO ELEMENT FOR AUDIO/VIDEO STREAM TRANSFER */}
              <video
                ref={setRemoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${
                  callType === 'video' && callState === 'connected' ? 'block' : 'hidden'
                }`}
              />

              {/* Avatar placeholder during Outgoing Call or Voice Call */}
              {(callType === 'audio' || callState === 'calling') && (
                <div className="text-center space-y-6 z-10 p-6">
                  <div className="relative inline-block">
                    <img
                      src={partner?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner?.name || 'User'}`}
                      alt={partner?.name}
                      className="w-36 h-36 rounded-full object-cover ring-4 ring-primary/50 mx-auto shadow-2xl"
                    />
                    {callState === 'calling' && (
                      <span className="absolute inset-0 rounded-full ring-4 ring-primary animate-ping opacity-75"></span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{partner?.name || 'Connecting...'}</h3>
                    <p className="text-sm text-primary font-medium mt-1 animate-pulse">
                      {callState === 'calling' ? 'Calling user...' : `Voice Call • ${formatTimer(callDuration)}`}
                    </p>
                  </div>
                </div>
              )}

              {/* PIP Local Camera Preview (Bottom Right Inset Box) */}
              {callType === 'video' && (
                <div className="absolute bottom-6 right-6 w-36 h-48 sm:w-48 sm:h-60 bg-zinc-900 border-2 border-white/20 rounded-2xl overflow-hidden shadow-2xl z-20">
                  <video
                    ref={setLocalVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                  />
                  {isVideoOff && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-white/60 text-xs font-medium p-2 text-center">
                      <VideoOff className="w-6 h-6 text-red-400 mb-1" />
                      Camera Off
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-black/70 backdrop-blur text-white px-1.5 py-0.5 rounded border border-white/10 font-medium">
                    You
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Control Bar */}
            <div className="p-4 bg-zinc-950/95 backdrop-blur border-t border-white/10 flex items-center justify-center gap-3 sm:gap-6 px-6 z-30">
              
              {/* Mute Mic */}
              <button
                onClick={toggleMute}
                className={`p-3.5 rounded-full transition-all ${
                  isMuted ? 'bg-red-500/30 text-red-400 border border-red-500/50 shadow-md ring-2 ring-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Toggle Camera */}
              {callType === 'video' && (
                <button
                  onClick={toggleVideo}
                  className={`p-3.5 rounded-full transition-all ${
                    isVideoOff ? 'bg-red-500/30 text-red-400 border border-red-500/50 shadow-md ring-2 ring-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              {/* Speaker Output Mode */}
              <button
                onClick={toggleSpeaker}
                className={`p-3.5 rounded-full transition-all ${
                  !isSpeakerOn ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title={isSpeakerOn ? 'Speaker On' : 'Speaker Muted'}
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              {/* Screen Share */}
              {callType === 'video' && (
                <button
                  onClick={toggleScreenShare}
                  className={`p-3.5 rounded-full transition-all ${
                    isScreenSharing ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
                >
                  <MonitorUp className="w-5 h-5" />
                </button>
              )}

              {/* End Call */}
              <button
                onClick={endCall}
                className="px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2 transition-all shadow-lg hover:scale-105"
                title="End Call"
              >
                <PhoneOff className="w-5 h-5" /> End Call
              </button>

              {/* Fullscreen */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-3.5 text-white/70 hover:text-white transition-colors ml-auto hidden sm:block"
                title="Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
};

export default VideoCallModal;
