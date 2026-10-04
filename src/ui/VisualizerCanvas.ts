import { AudioEngine } from '../audio/AudioEngine';

export class VisualizerCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audioEngine: AudioEngine;
  private animationId: number | null = null;
  private idlePhase: number = 0;

  constructor(canvas: HTMLCanvasElement, audioEngine: AudioEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.audioEngine = audioEngine;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.start();
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  public start(): void {
    if (this.animationId !== null) return;
    const render = () => {
      this.draw();
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private draw(): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    this.ctx.clearRect(0, 0, width, height);

    const freqData = this.audioEngine.getFrequencyData();
    const isPlaying = this.audioEngine.isPlaying;

    if (isPlaying && freqData && freqData.length > 0) {
      this.drawFrequencyBars(width, height, freqData);
    } else {
      this.drawIdleWave(width, height);
    }
  }

  private drawFrequencyBars(width: number, height: number, data: Uint8Array): void {
    const barCount = 36;
    const gap = 3;
    const totalGap = gap * (barCount - 1);
    const barWidth = Math.max(3, (width - totalGap) / barCount);

    const gradient = this.ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, '#00dfa2');
    gradient.addColorStop(0.5, '#00f2fe');
    gradient.addColorStop(1, '#9d4edd');

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * (data.length * 0.75));
      const value = data[dataIndex] || 0;
      const percent = value / 255;
      const barHeight = Math.max(4, percent * (height * 0.85));

      const x = i * (barWidth + gap);
      const y = height - barHeight;

      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = 'rgba(0, 242, 254, 0.5)';

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
      this.ctx.fill();

      if (barHeight > 10) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(x + barWidth / 2, y + 2, Math.min(2, barWidth / 2), 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    this.ctx.shadowBlur = 0;
  }

  private drawIdleWave(width: number, height: number): void {
    this.idlePhase += 0.03;
    const centerY = height * 0.75;

    this.ctx.beginPath();
    this.ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
    this.ctx.lineWidth = 2;

    for (let x = 0; x < width; x += 4) {
      const y = centerY + Math.sin(x * 0.02 + this.idlePhase) * 6 + Math.cos(x * 0.01 - this.idlePhase) * 4;
      if (x === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.stroke();
  }
}
