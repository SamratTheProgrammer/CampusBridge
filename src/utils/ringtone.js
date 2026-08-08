class RingtoneService {
  constructor() {
    this.audioCtx = null;
    this.timer = null;
    this.isPlaying = false;
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  // Play a dual frequency tone pair (e.g. 440Hz + 480Hz) for durationSec
  playTone(freq1 = 440, freq2 = 480, duration = 1.2, volume = 0.15) {
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(freq1, this.audioCtx.currentTime);
      osc2.frequency.setValueAtTime(freq2, this.audioCtx.currentTime);

      // Envelope to soften clicks
      gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, this.audioCtx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(this.audioCtx.currentTime + duration);
      osc2.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  }

  // Play repeating Incoming Call Ringtone (440Hz + 480Hz tone for 1.2s every 3s)
  startIncomingRingtone() {
    this.stop();
    this.isPlaying = true;

    const playLoop = () => {
      if (!this.isPlaying) return;
      this.playTone(440, 480, 1.2, 0.18);
      this.timer = setTimeout(playLoop, 2800);
    };

    playLoop();
  }

  // Play repeating Outgoing Call Ringback (440Hz + 480Hz soft tone for 1.8s every 4.5s)
  startOutgoingRingtone() {
    this.stop();
    this.isPlaying = true;

    const playLoop = () => {
      if (!this.isPlaying) return;
      this.playTone(440, 480, 1.8, 0.12);
      this.timer = setTimeout(playLoop, 4500);
    };

    playLoop();
  }

  // Play Call End tone
  playCallEndSound() {
    this.stop();
    this.playTone(400, 280, 0.4, 0.15);
  }

  // Play Call Connect chime
  playCallConnectSound() {
    this.stop();
    this.playTone(523.25, 659.25, 0.35, 0.15);
  }

  stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export const ringtoneService = new RingtoneService();
export default ringtoneService;
