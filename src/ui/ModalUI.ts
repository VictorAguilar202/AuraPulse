import { DoublyLinkedList } from '../models/DoublyLinkedList';
import { Song } from '../models/types';
import confetti from 'canvas-confetti';

export type InsertMode = 'beginning' | 'end' | 'position';

export class ModalUI {
  private modalOverlay: HTMLElement;
  private list: DoublyLinkedList;
  private onSongAdded: (song: Song, mode: InsertMode, position?: number) => void;

  private selectedFile: File | null = null;
  private selectedFileUrl: string | null = null;
  private detectedDuration: number = 180;
  private selectedGradient: string = 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)';

  private gradients = [
    'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
    'linear-gradient(135deg, #7928ca 0%, #ff0080 100%)',
    'linear-gradient(135deg, #00dfa2 0%, #0081a7 100%)',
    'linear-gradient(135deg, #ff4d6d 0%, #c9184a 100%)',
    'linear-gradient(135deg, #f72585 0%, #7209b7 100%)',
    'linear-gradient(135deg, #10b981 0%, #064e3b 100%)'
  ];

  constructor(
    modalOverlay: HTMLElement,
    list: DoublyLinkedList,
    onSongAdded: (song: Song, mode: InsertMode, position?: number) => void
  ) {
    this.modalOverlay = modalOverlay;
    this.list = list;
    this.onSongAdded = onSongAdded;
    this.setupListeners();
  }

  public open(): void {
    this.resetForm();
    this.updatePositionLimits();
    this.modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  public close(): void {
    this.modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  private resetForm(): void {
    this.selectedFile = null;
    this.selectedFileUrl = null;
    this.detectedDuration = 180;
    this.selectedGradient = this.gradients[0];

    const fileInput = this.modalOverlay.querySelector<HTMLInputElement>('#song-file-input');
    if (fileInput) fileInput.value = '';

    const titleInput = this.modalOverlay.querySelector<HTMLInputElement>('#song-title-input');
    if (titleInput) titleInput.value = '';

    const artistInput = this.modalOverlay.querySelector<HTMLInputElement>('#song-artist-input');
    if (artistInput) artistInput.value = '';

    const fileDetails = this.modalOverlay.querySelector<HTMLElement>('#file-info-badge');
    if (fileDetails) fileDetails.style.display = 'none';

    const endRadio = this.modalOverlay.querySelector<HTMLInputElement>('input[value="end"]');
    if (endRadio) endRadio.checked = true;

    const posInputContainer = this.modalOverlay.querySelector<HTMLElement>('#position-input-group');
    if (posInputContainer) posInputContainer.style.display = 'none';

    this.renderGradientPickers();
  }

  private updatePositionLimits(): void {
    const posInput = this.modalOverlay.querySelector<HTMLInputElement>('#song-position-input');
    const posMaxLabel = this.modalOverlay.querySelector<HTMLElement>('#pos-max-hint');
    if (posInput) {
      posInput.min = '0';
      posInput.max = this.list.size.toString();
      posInput.value = Math.min(1, this.list.size).toString();
    }
    if (posMaxLabel) {
      posMaxLabel.textContent = `(0 to ${this.list.size})`;
    }
  }

  private renderGradientPickers(): void {
    const container = this.modalOverlay.querySelector<HTMLElement>('#gradient-picker-list');
    if (!container) return;

    container.innerHTML = this.gradients
      .map(
        (g, i) => `
      <button type="button" class="grad-dot ${i === 0 ? 'selected' : ''}" style="background: ${g}" data-grad="${g}"></button>
    `
      )
      .join('');

    container.querySelectorAll('.grad-dot').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('.grad-dot').forEach((d) => d.classList.remove('selected'));
        const target = e.currentTarget as HTMLElement;
        target.classList.add('selected');
        this.selectedGradient = target.dataset.grad || this.gradients[0];
      });
    });
  }

  private handleFileSelected(file: File): void {
    const isMp3 = file.name.toLowerCase().endsWith('.mp3') || file.type === 'audio/mpeg' || file.type === 'audio/mp3';
    if (!isMp3) {
      alert('Only .mp3 audio files are supported. Please select a valid MP3 file.');
      return;
    }

    this.selectedFile = file;
    this.selectedFileUrl = URL.createObjectURL(file);

    const titleInput = this.modalOverlay.querySelector<HTMLInputElement>('#song-title-input');
    const artistInput = this.modalOverlay.querySelector<HTMLInputElement>('#song-artist-input');
    const fileBadge = this.modalOverlay.querySelector<HTMLElement>('#file-info-badge');
    const fileNameSpan = this.modalOverlay.querySelector<HTMLElement>('#file-name-text');
    const fileSizeSpan = this.modalOverlay.querySelector<HTMLElement>('#file-size-text');

    const cleanName = file.name.replace(/\.mp3$/i, '');
    if (titleInput && !titleInput.value.trim()) {
      if (cleanName.includes('-')) {
        const parts = cleanName.split('-');
        if (artistInput && !artistInput.value.trim()) artistInput.value = parts[0].trim();
        titleInput.value = parts.slice(1).join('-').trim();
      } else {
        titleInput.value = cleanName;
        if (artistInput && !artistInput.value.trim()) artistInput.value = 'Unknown Artist';
      }
    }

    const tempAudio = new Audio();
    tempAudio.src = this.selectedFileUrl;
    tempAudio.onloadedmetadata = () => {
      if (!isNaN(tempAudio.duration) && isFinite(tempAudio.duration)) {
        this.detectedDuration = Math.round(tempAudio.duration);
      }
    };

    if (fileBadge && fileNameSpan && fileSizeSpan) {
      fileNameSpan.textContent = file.name;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      fileSizeSpan.textContent = `${sizeMb} MB • Verified MP3`;
      fileBadge.style.display = 'flex';
    }
  }

  private setupListeners(): void {
    const closeBtn = this.modalOverlay.querySelector('#btn-close-modal');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.close();
      }
    });

    const modeRadios = this.modalOverlay.querySelectorAll<HTMLInputElement>('input[name="insert-mode"]');
    const posInputContainer = this.modalOverlay.querySelector<HTMLElement>('#position-input-group');

    modeRadios.forEach((radio) => {
      radio.addEventListener('change', () => {
        if (posInputContainer) {
          posInputContainer.style.display = radio.value === 'position' ? 'block' : 'none';
        }
      });
    });

    const fileInput = this.modalOverlay.querySelector<HTMLInputElement>('#song-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) this.handleFileSelected(file);
      });
    }

    const dropzone = this.modalOverlay.querySelector<HTMLElement>('.file-upload-dropzone');
    if (dropzone) {
      ['dragenter', 'dragover'].forEach((eventName) => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('drag-active');
        });
      });

      ['dragleave', 'drop'].forEach((eventName) => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('drag-active');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        const dt = (e as DragEvent).dataTransfer;
        const file = dt?.files?.[0];
        if (file) {
          this.handleFileSelected(file);
        }
      });
    }

    const form = this.modalOverlay.querySelector('#add-song-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }
  }

  private handleSubmit(): void {
    const titleInput = this.modalOverlay.querySelector<HTMLInputElement>('#song-title-input');
    const artistInput = this.modalOverlay.querySelector<HTMLInputElement>('#song-artist-input');
    const modeRadio = this.modalOverlay.querySelector<HTMLInputElement>('input[name="insert-mode"]:checked');
    const posInput = this.modalOverlay.querySelector<HTMLInputElement>('#song-position-input');

    const title = titleInput?.value.trim() || 'Untitled Track';
    const artist = artistInput?.value.trim() || 'Unknown Artist';
    const mode = (modeRadio?.value || 'end') as InsertMode;
    const position = posInput ? parseInt(posInput.value, 10) : 0;

    if (!this.selectedFileUrl) {
      alert('Please choose or drag-and-drop an MP3 file first.');
      return;
    }

    const newSong: Song = {
      id: 'song-' + Math.random().toString(36).substring(2, 9),
      title: title,
      artist: artist,
      duration: this.detectedDuration,
      url: this.selectedFileUrl,
      cover: this.selectedGradient,
      fileType: 'audio/mp3',
      fileName: this.selectedFile?.name,
      sourceType: 'mp3',
      addedAt: Date.now()
    };

    this.onSongAdded(newSong, mode, position);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#00f2fe', '#7928ca', '#00dfa2', '#ff0080', '#ffffff']
      });
    } catch {
      // Confetti unavailable
    }

    this.close();
  }
}
