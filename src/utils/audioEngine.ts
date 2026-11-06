/**
 * Clean Web Audio Engine for music streaming and synthesis
 * Handles playback, timing, seek, and volume without stems mixing.
 */

class StreamAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timerId: number | null = null;
  private step = 0;
  private bpm = 120;
  private keyFreq = 220; // A3

  private masterGain: GainNode | null = null;
  private onTickCallback?: (currentTimeSec: number) => void;
  private startTime = 0;
  private pausedAt = 0;
  private currentVolume = 0.85;
  private htmlAudio: HTMLAudioElement | null = null;
  private activeAudioUrl: string | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playTrack(
    bpm: number,
    rootKey: string,
    onTick?: (sec: number) => void,
    audioUrl?: string
  ) {
    this.onTickCallback = onTick;

    // Stop any previous timers
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    // If an uploaded audio file URL is provided, play it via HTMLAudioElement
    if (audioUrl) {
      if (this.activeAudioUrl !== audioUrl || !this.htmlAudio) {
        if (this.htmlAudio) {
          this.htmlAudio.pause();
          this.htmlAudio.src = '';
        }
        this.htmlAudio = new Audio(audioUrl);
        this.htmlAudio.volume = this.currentVolume;
        this.activeAudioUrl = audioUrl;
      }

      this.isPlaying = true;
      this.htmlAudio.play().catch((err) => {
        console.warn('Audio playback fallback to synth:', err);
      });

      this.timerId = window.setInterval(() => {
        if (this.htmlAudio && this.onTickCallback && this.isPlaying) {
          this.onTickCallback(this.htmlAudio.currentTime);
        }
      }, 200);
      return;
    }

    // Otherwise stop any previous HTMLAudioElement and run WebAudio synthesis
    if (this.htmlAudio) {
      this.htmlAudio.pause();
      this.activeAudioUrl = null;
    }

    this.initContext();
    this.bpm = bpm || 120;
    this.keyFreq = this.parseKey(rootKey);

    this.isPlaying = true;
    this.startTime = (this.ctx?.currentTime || 0) - this.pausedAt;

    const intervalMs = (60 / this.bpm) * 250; // 16th notes
    this.timerId = window.setInterval(() => {
      this.scheduleStep();
    }, intervalMs);
  }

  public pause() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.htmlAudio && this.activeAudioUrl) {
      this.htmlAudio.pause();
      return;
    }
    if (this.ctx) {
      this.pausedAt = this.ctx.currentTime - this.startTime;
    }
  }

  public seek(seconds: number) {
    if (this.htmlAudio && this.activeAudioUrl) {
      this.htmlAudio.currentTime = Math.max(0, seconds);
      return;
    }
    if (this.ctx) {
      this.pausedAt = Math.max(0, seconds);
      this.startTime = this.ctx.currentTime - this.pausedAt;
      this.step = Math.floor(seconds * (this.bpm / 15));
    }
  }

  public setMasterVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.htmlAudio) {
      this.htmlAudio.volume = this.currentVolume;
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.currentVolume,
        this.ctx.currentTime,
        0.05
      );
    }
  }

  private scheduleStep() {
    if (!this.ctx || !this.isPlaying || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const currentSongTime = now - this.startTime;

    if (this.onTickCallback) {
      this.onTickCallback(currentSongTime);
    }

    const s = this.step % 16;

    // Rhythmic pattern: kick on downbeats, hats, bass groove, synth wash
    if (s === 0 || s === 8 || s === 14) {
      this.triggerKick(now);
    }
    if (s % 2 === 0) {
      this.triggerHat(now, s % 4 === 2);
    }

    const scale = [0, 3, 5, 7, 10];
    const note = scale[(s + Math.floor(this.step / 16)) % scale.length];
    const bassFreq = (this.keyFreq / 2) * Math.pow(2, note / 12);
    if (s % 2 === 0) {
      this.triggerBass(now, bassFreq, 0.2);
    }

    if (s === 0 || s === 6 || s === 12) {
      this.triggerSynthChord(now, this.keyFreq);
    }

    this.step++;
  }

  private triggerKick(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  private triggerHat(time: number, accent: boolean) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 0.03;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(accent ? 0.3 : 0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.035);
  }

  private triggerBass(time: number, freq: number, dur: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.exponentialRampToValueAtTime(80, time + dur);

    gain.gain.setValueAtTime(0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  private triggerSynthChord(time: number, root: number) {
    if (!this.ctx || !this.masterGain) return;
    [0, 4, 7, 11].forEach((semi) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(root * Math.pow(2, semi / 12), time);

      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + 0.45);
    });
  }

  private parseKey(keyStr: string): number {
    const baseMap: Record<string, number> = {
      C: 130.81,
      'C#': 138.59,
      Db: 138.59,
      D: 146.83,
      'D#': 155.56,
      Eb: 155.56,
      E: 164.81,
      F: 174.61,
      'F#': 185.0,
      Gb: 185.0,
      G: 196.0,
      'G#': 207.65,
      Ab: 207.65,
      A: 220.0,
      'A#': 233.08,
      Bb: 233.08,
      B: 246.94,
    };
    const cleanKey = keyStr.split(' ')[0] || 'A';
    return baseMap[cleanKey] || 220;
  }
}

export const audioEngine = new StreamAudioEngine();
