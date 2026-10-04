import { Song } from '../models/types';

export interface AudioEngineCallbacks {
  onPlayStateChange?: (isPlaying: boolean) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onSongEnd?: () => void;
  onError?: (err: Error) => void;
}

export class AudioEngine {
  private audio: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private frequencyData: Uint8Array | null = null;
  private currentSong: Song | null = null;
  private isInitialized: boolean = false;
  private callbacks: AudioEngineCallbacks = {};

  constructor(callbacks?: AudioEngineCallbacks) {
    if (callbacks) this.callbacks = callbacks;
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.setupListeners();
  }

  private setupListeners(): void {
    this.audio.addEventListener('play', () => {
      this.initWebAudio();
      this.callbacks.onPlayStateChange?.(true);
    });

    this.audio.addEventListener('pause', () => {
      this.callbacks.onPlayStateChange?.(false);
    });

    this.audio.addEventListener('timeupdate', () => {
      const dur = isNaN(this.audio.duration) || this.audio.duration === Infinity ? (this.currentSong?.duration || 0) : this.audio.duration;
      this.callbacks.onTimeUpdate?.(this.audio.currentTime, dur);
    });

    this.audio.addEventListener('ended', () => {
      this.callbacks.onPlayStateChange?.(false);
      this.callbacks.onSongEnd?.();
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('AudioEngine error:', e);
      this.callbacks.onError?.(new Error('Unable to play audio stream.'));
    });
  }

  public initWebAudio(): void {
    if (this.isInitialized) {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
      return;
    }

    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      if (!this.analyser) {
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 128;
        this.analyser.smoothingTimeConstant = 0.8;
      }

      if (!this.sourceNode) {
        this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
      }

      if (!this.frequencyData) {
        const bufferLength = this.analyser.frequencyBinCount;
        this.frequencyData = new Uint8Array(bufferLength);
      }

      this.isInitialized = true;
    } catch (err) {
      console.warn('Web Audio initialization error:', err);
    }
  }

  public async loadSong(song: Song, autoPlay: boolean = true): Promise<void> {
    this.currentSong = song;
    this.audio.src = song.url;
    this.audio.load();

    if (autoPlay) {
      await this.play();
    }
  }

  public async play(): Promise<void> {
    this.initWebAudio();
    try {
      await this.audio.play();
      this.callbacks.onPlayStateChange?.(true);
    } catch (err) {
      console.warn('Autoplay blocked or user gesture required:', err);
      this.callbacks.onPlayStateChange?.(false);
    }
  }

  public pause(): void {
    this.audio.pause();
  }

  public stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.src = '';
    this.currentSong = null;
    this.callbacks.onPlayStateChange?.(false);
  }

  public async togglePlay(): Promise<void> {
    if (this.audio.paused) {
      await this.play();
    } else {
      this.pause();
    }
  }

  public seek(seconds: number): void {
    if (!isNaN(seconds) && isFinite(seconds)) {
      this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration || 9999));
    }
  }

  public setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  public setPlaybackRate(rate: number): void {
    this.audio.playbackRate = Math.max(0.5, Math.min(2.5, rate));
  }

  public getFrequencyData(): Uint8Array | null {
    if (this.analyser && this.frequencyData) {
      this.analyser.getByteFrequencyData(this.frequencyData as any);
      return this.frequencyData;
    }
    return null;
  }

  get isPlaying(): boolean {
    return !this.audio.paused;
  }

  get currentTime(): number {
    return this.audio.currentTime;
  }

  get duration(): number {
    return isNaN(this.audio.duration) || this.audio.duration === Infinity
      ? (this.currentSong?.duration || 0)
      : this.audio.duration;
  }

  get volume(): number {
    return this.audio.volume;
  }

  public static formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
