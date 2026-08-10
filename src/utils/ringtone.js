import incomingVideoCallSound from '../assets/audio/Incoming Video Call.mp3';
import incomingVoiceCallSound from '../assets/audio/Incomming Voice Call.mp3';
import ringSound from '../assets/audio/Ring Sound.mp3';
import notificationSound from '../assets/audio/Notification Sound.mp3';
import endCallSound from '../assets/audio/End Call Sound.mp3';
import callWaitingSound from '../assets/audio/Incoming Call During another call.mp3';
import busySound from '../assets/audio/Busy sound.mp3';

class RingtoneService {
  constructor() {
    this.audio = null;
    this.notificationAudio = null;
    this.oneShotAudio = null;
  }

  // Helper to safely play audio and loop if needed
  _playAudio(src, loop = false, volume = 0.5) {
    this.stop();
    try {
      this.audio = new Audio(src);
      this.audio.loop = loop;
      this.audio.volume = volume;
      this.audio.play().catch(e => console.warn('Audio play failed (maybe no interaction yet):', e));
    } catch (err) {
      console.warn('Audio setup failed:', err);
    }
  }

  // Play repeating Incoming Video Call Ringtone
  startIncomingVideoRingtone() {
    this._playAudio(incomingVideoCallSound, true, 0.6);
  }

  // Play repeating Incoming Voice Call Ringtone
  startIncomingVoiceRingtone() {
    this._playAudio(incomingVoiceCallSound, true, 0.6);
  }

  // Play repeating Outgoing Call Ringback
  startOutgoingRingtone() {
    this._playAudio(ringSound, true, 0.4);
  }

  // Play a one-shot notification sound for chat messages
  playNotificationSound() {
    try {
      if (this.notificationAudio) {
        this.notificationAudio.pause();
        this.notificationAudio.currentTime = 0;
      }
      this.notificationAudio = new Audio(notificationSound);
      this.notificationAudio.volume = 0.7;
      this.notificationAudio.play().catch(e => console.warn('Notification audio play failed:', e));
    } catch (err) {
      console.warn('Notification setup failed:', err);
    }
  }

  // Play Call End tone
  playCallEndSound() {
    this.stop();
    try {
      if (this.oneShotAudio) {
        this.oneShotAudio.pause();
        this.oneShotAudio.currentTime = 0;
      }
      this.oneShotAudio = new Audio(endCallSound);
      this.oneShotAudio.volume = 0.7;
      this.oneShotAudio.play().catch(e => console.warn('End call audio play failed:', e));
    } catch (err) {
      console.warn('End call setup failed:', err);
    }
  }

  // Play repeating Busy tone
  startBusySound() {
    this._playAudio(busySound, true, 0.6);
  }

  // Play repeating Call Waiting tone
  startCallWaitingSound() {
    this._playAudio(callWaitingSound, true, 0.6);
  }

  // Play Call Connect chime
  playCallConnectSound() {
    this.stop();
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
  }
}

export const ringtoneService = new RingtoneService();
export default ringtoneService;
