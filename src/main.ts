import './style.css';
import { DoublyLinkedList } from './models/DoublyLinkedList';
import { SongNode } from './models/SongNode';
import { Song, RepeatMode } from './models/types';
import { getInitialDemoSongs } from './audio/DemoSongs';
import { AudioEngine } from './audio/AudioEngine';
import { VisualizerCanvas } from './ui/VisualizerCanvas';
import { ListGraphRenderer } from './ui/ListGraphRenderer';
import { PlaylistUI } from './ui/PlaylistUI';
import { AlgorithmInspector } from './ui/AlgorithmInspector';
import { ModalUI, InsertMode } from './ui/ModalUI';
import { NotificationToast } from './ui/NotificationToast';

export class MusicPlayerApp {
  public list: DoublyLinkedList;
  public audioEngine: AudioEngine;
  public visualizer: VisualizerCanvas | null = null;
  public graphRenderer: ListGraphRenderer | null = null;
  public playlistUI: PlaylistUI | null = null;
  public inspector: AlgorithmInspector | null = null;
  public modalUI: ModalUI | null = null;

  private playPauseBtn = document.getElementById('btn-play-pause') as HTMLButtonElement | null;
  private heroPlayPauseBtn = document.getElementById('hero-play-pause-btn') as HTMLButtonElement | null;
  private prevBtn = document.getElementById('btn-prev') as HTMLButtonElement | null;
  private heroPrevBtn = document.getElementById('hero-btn-prev') as HTMLButtonElement | null;
  private nextBtn = document.getElementById('btn-next') as HTMLButtonElement | null;
  private heroNextBtn = document.getElementById('hero-btn-next') as HTMLButtonElement | null;
  private navHistoryPrev = document.getElementById('btn-nav-history-prev') as HTMLButtonElement | null;
  private navHistoryNext = document.getElementById('btn-nav-history-next') as HTMLButtonElement | null;

  private repeatBtn = document.getElementById('btn-repeat') as HTMLButtonElement | null;
  private shuffleBtn = document.getElementById('btn-shuffle') as HTMLButtonElement | null;
  private topShuffleBtn = document.getElementById('btn-top-shuffle') as HTMLButtonElement | null;
  private topReverseBtn = document.getElementById('btn-top-reverse') as HTMLButtonElement | null;
  private topClearBtn = document.getElementById('btn-top-clear') as HTMLButtonElement | null;
  private heroLikeBtn = document.getElementById('hero-btn-like') as HTMLButtonElement | null;
  private bottomLikeBtn = document.getElementById('bottom-btn-like') as HTMLButtonElement | null;

  private seekSlider = document.getElementById('seek-slider') as HTMLInputElement | null;
  private volumeSlider = document.getElementById('volume-slider') as HTMLInputElement | null;
  private volumeBtn = document.getElementById('btn-volume-icon') as HTMLButtonElement | null;
  private playbackRateSelect = document.getElementById('playback-rate-select') as HTMLSelectElement | null;
  private searchInput = document.getElementById('playlist-search-input') as HTMLInputElement | null;
  private openModalBtn = document.getElementById('btn-open-add-modal') as HTMLButtonElement | null;
  private openModalTopBtn = document.getElementById('btn-open-add-modal-top') as HTMLButtonElement | null;

  private trackTitleEl = document.getElementById('current-track-title') as HTMLElement | null;
  private trackArtistEl = document.getElementById('current-track-artist') as HTMLElement | null;
  private trackCoverEl = document.getElementById('current-cover-art') as HTMLElement | null;
  private heroDurationEl = document.getElementById('hero-song-duration') as HTMLElement | null;
  private heroNodeIndexBadge = document.getElementById('hero-node-index-badge') as HTMLElement | null;
  private trackFormatTag = document.getElementById('track-format-tag') as HTMLElement | null;
  private listSizeCounter = document.getElementById('list-size-counter') as HTMLElement | null;
  private heroBannerEl = document.getElementById('aurapulse-hero-banner') as HTMLElement | null;
  private visualizerCanvas = document.getElementById('visualizer-canvas') as HTMLCanvasElement | null;

  private heroPrevTitle = document.getElementById('hero-prev-title') as HTMLElement | null;
  private heroNextTitle = document.getElementById('hero-next-title') as HTMLElement | null;

  private bottomTrackTitle = document.getElementById('bottom-track-title') as HTMLElement | null;
  private bottomTrackArtist = document.getElementById('bottom-track-artist') as HTMLElement | null;
  private bottomCoverThumb = document.getElementById('bottom-cover-thumbnail') as HTMLElement | null;
  private bottomNodeChip = document.getElementById('bottom-node-chip') as HTMLElement | null;
  private currentTimeEl = document.getElementById('current-time-text') as HTMLElement | null;
  private durationTimeEl = document.getElementById('total-duration-text') as HTMLElement | null;
  private repeatBadgeText = document.getElementById('repeat-badge-text') as HTMLElement | null;
  private bottomPrevPtr = document.getElementById('bottom-prev-ptr') as HTMLElement | null;
  private bottomNextPtr = document.getElementById('bottom-next-ptr') as HTMLElement | null;

  private sidebarSizeBadge = document.getElementById('sidebar-size-badge') as HTMLElement | null;
  private sidebarHeadName = document.getElementById('sidebar-head-name') as HTMLElement | null;
  private sidebarCurrentName = document.getElementById('sidebar-current-name') as HTMLElement | null;
  private sidebarTailName = document.getElementById('sidebar-tail-name') as HTMLElement | null;

  private isDraggingSeek: boolean = false;
  private previousVolume: number = 0.8;

  constructor() {
    this.list = new DoublyLinkedList();

    this.audioEngine = new AudioEngine({
      onPlayStateChange: (isPlaying) => this.handlePlayStateChange(isPlaying),
      onTimeUpdate: (currentTime, duration) => this.handleTimeUpdate(currentTime, duration),
      onSongEnd: () => this.handleSongEnd(),
      onError: (err) => NotificationToast.show(err.message, 'warn')
    });

    const demoSongs = getInitialDemoSongs();
    for (const song of demoSongs) {
      this.list.insertAtEnd(song);
    }

    this.initUIComponents();
    this.setupEventListeners();

    if (this.list.head) {
      this.list.current = this.list.head;
      this.audioEngine.loadSong(this.list.head.data, false);
      this.updatePlayerDisplay(this.list.head.data);
    }

    this.updateCounters();
    (window as unknown as { musicPlayerApp: MusicPlayerApp }).musicPlayerApp = this;
  }

  private initUIComponents(): void {
    if (this.visualizerCanvas) {
      this.visualizer = new VisualizerCanvas(this.visualizerCanvas, this.audioEngine);
    }

    const inspectorContainer = document.getElementById('algorithm-inspector-container');
    if (inspectorContainer) {
      this.inspector = new AlgorithmInspector(inspectorContainer, this.list);
    }

    const graphContainer = document.getElementById('linked-list-graph-container');
    if (graphContainer) {
      this.graphRenderer = new ListGraphRenderer(
        graphContainer,
        this.list,
        (node) => this.playSongNode(node),
        (node) => this.removeSongNode(node)
      );
    }

    const playlistContainer = document.getElementById('playlist-list-container');
    if (playlistContainer) {
      this.playlistUI = new PlaylistUI(
        playlistContainer,
        this.list,
        (node) => this.playSongNode(node),
        (node) => this.removeSongNode(node)
      );
    }

    const modalOverlay = document.getElementById('add-song-modal-overlay');
    if (modalOverlay) {
      this.modalUI = new ModalUI(modalOverlay, this.list, (song, mode, pos) => {
        this.handleSongAdded(song, mode, pos);
      });
    }

    this.list.subscribe((event, data) => {
      this.updateCounters();
      if (event === 'current-change') {
        const currentNode = data as SongNode | null;
        if (currentNode) {
          this.updatePlayerDisplay(currentNode.data);
        } else {
          this.resetPlayerDisplay();
        }
      }
    });
  }

  private setupEventListeners(): void {
    const togglePlayHandler = () => {
      if (!this.list.current && this.list.head) {
        this.list.current = this.list.head;
      }
      if (this.list.current) {
        this.audioEngine.togglePlay();
      } else {
        NotificationToast.show('No tracks in the list. Add one to start playing.', 'warn');
      }
    };

    if (this.playPauseBtn) this.playPauseBtn.addEventListener('click', togglePlayHandler);
    if (this.heroPlayPauseBtn) this.heroPlayPauseBtn.addEventListener('click', togglePlayHandler);

    const prevHandler = () => this.handlePrev();
    const nextHandler = () => this.handleNext();

    if (this.prevBtn) this.prevBtn.addEventListener('click', prevHandler);
    if (this.heroPrevBtn) this.heroPrevBtn.addEventListener('click', prevHandler);
    if (this.navHistoryPrev) this.navHistoryPrev.addEventListener('click', prevHandler);

    if (this.nextBtn) this.nextBtn.addEventListener('click', nextHandler);
    if (this.heroNextBtn) this.heroNextBtn.addEventListener('click', nextHandler);
    if (this.navHistoryNext) this.navHistoryNext.addEventListener('click', nextHandler);

    const toggleLikeHandler = () => {
      if (this.list.current && this.playlistUI) {
        const isLiked = this.playlistUI.toggleLike(this.list.current.data.id);
        this.updateLikeButtons(isLiked);
        NotificationToast.show(
          isLiked ? `Added to favorites: "${this.list.current.data.title}"` : 'Removed from favorites',
          'info'
        );
      }
    };
    if (this.heroLikeBtn) this.heroLikeBtn.addEventListener('click', toggleLikeHandler);
    if (this.bottomLikeBtn) this.bottomLikeBtn.addEventListener('click', toggleLikeHandler);

    if (this.seekSlider) {
      this.seekSlider.addEventListener('input', () => {
        this.isDraggingSeek = true;
        const targetTime = (parseFloat(this.seekSlider!.value) / 100) * this.audioEngine.duration;
        if (this.currentTimeEl) this.currentTimeEl.textContent = AudioEngine.formatTime(targetTime);
      });

      this.seekSlider.addEventListener('change', () => {
        this.isDraggingSeek = false;
        const targetTime = (parseFloat(this.seekSlider!.value) / 100) * this.audioEngine.duration;
        this.audioEngine.seek(targetTime);
      });
    }

    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', () => {
        const vol = parseFloat(this.volumeSlider!.value);
        this.audioEngine.setVolume(vol);
        this.updateVolumeIcon(vol);
      });
    }

    if (this.volumeBtn) {
      this.volumeBtn.addEventListener('click', () => {
        if (this.audioEngine.volume > 0) {
          this.previousVolume = this.audioEngine.volume;
          this.audioEngine.setVolume(0);
          if (this.volumeSlider) this.volumeSlider.value = '0';
          this.updateVolumeIcon(0);
        } else {
          const restore = this.previousVolume > 0 ? this.previousVolume : 0.8;
          this.audioEngine.setVolume(restore);
          if (this.volumeSlider) this.volumeSlider.value = restore.toString();
          this.updateVolumeIcon(restore);
        }
      });
    }

    if (this.playbackRateSelect) {
      this.playbackRateSelect.addEventListener('change', () => {
        const rate = parseFloat(this.playbackRateSelect!.value);
        this.audioEngine.setPlaybackRate(rate);
        NotificationToast.show(`Playback speed: ${rate}x`, 'info');
      });
    }

    if (this.repeatBtn) {
      this.repeatBtn.addEventListener('click', () => {
        const modes: RepeatMode[] = ['all', 'one', 'off'];
        const nextIdx = (modes.indexOf(this.list.repeatMode) + 1) % modes.length;
        this.list.repeatMode = modes[nextIdx];
        this.updateRepeatButton();
        if (this.graphRenderer) this.graphRenderer.render();
        NotificationToast.show(
          `Repeat mode: ${
            this.list.repeatMode === 'all'
              ? 'Repeat All (Circular)'
              : this.list.repeatMode === 'one'
              ? 'Repeat One Track'
              : 'Repeat Off'
          }`,
          'info'
        );
      });
    }

    const shuffleHandler = () => {
      if (this.list.size <= 1) {
        NotificationToast.show('Need at least 2 tracks to shuffle.', 'warn');
        return;
      }
      this.list.shuffle();
      NotificationToast.show('Tracklist shuffled randomly (O(n))', 'success');
    };
    if (this.shuffleBtn) this.shuffleBtn.addEventListener('click', shuffleHandler);
    if (this.topShuffleBtn) this.topShuffleBtn.addEventListener('click', shuffleHandler);

    if (this.topReverseBtn) {
      this.topReverseBtn.addEventListener('click', () => {
        if (this.list.size <= 1) {
          NotificationToast.show('Need at least 2 tracks to reverse list.', 'warn');
          return;
        }
        this.list.reverse();
        NotificationToast.show('Reversed Doubly Linked List: Head and Tail swapped (O(n))', 'success');
      });
    }

    if (this.topClearBtn) {
      this.topClearBtn.addEventListener('click', () => {
        if (this.list.size === 0) return;
        if (confirm('Are you sure you want to clear the entire tracklist?')) {
          this.audioEngine.stop();
          this.list.clear();
          this.resetPlayerDisplay();
          NotificationToast.show('Tracklist cleared.', 'info');
        }
      });
    }

    if (this.openModalBtn) this.openModalBtn.addEventListener('click', () => this.modalUI?.open());
    if (this.openModalTopBtn) this.openModalTopBtn.addEventListener('click', () => this.modalUI?.open());

    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        if (this.playlistUI) {
          this.playlistUI.setSearchQuery(this.searchInput!.value);
        }
      });
    }

    document.querySelectorAll('.sidebar-nav .nav-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        document.querySelectorAll('.sidebar-nav .nav-item').forEach((n) => n.classList.remove('active'));
        const target = e.currentTarget as HTMLElement;
        target.classList.add('active');
        const view = target.dataset.view;
        this.switchView(view);
      });
    });

    document.querySelectorAll('.aurapulse-content-tabs .tab-pill').forEach((pill) => {
      pill.addEventListener('click', (e) => {
        document.querySelectorAll('.aurapulse-content-tabs .tab-pill').forEach((p) => p.classList.remove('active'));
        const target = e.currentTarget as HTMLElement;
        target.classList.add('active');

        const sectionId = target.dataset.tabTarget;
        if (sectionId) {
          document.querySelectorAll('.view-section').forEach((sec) => sec.classList.remove('active'));
          const targetSection = document.getElementById(sectionId);
          if (targetSection) targetSection.classList.add('active');
        }
      });
    });

    window.addEventListener('keydown', (e) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayHandler();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        nextHandler();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prevHandler();
      }
    });
  }

  private switchView(view?: string): void {
    if (!view) return;

    document.querySelectorAll('.view-section').forEach((sec) => sec.classList.remove('active'));
    document.querySelectorAll('.aurapulse-content-tabs .tab-pill').forEach((p) => p.classList.remove('active'));

    if (view === 'home' || view === 'library') {
      const sec = document.getElementById('section-library');
      if (sec) sec.classList.add('active');
      const tab = document.querySelector('[data-tab-target="section-library"]');
      if (tab) tab.classList.add('active');
    } else if (view === 'graph') {
      const sec = document.getElementById('section-graph');
      if (sec) sec.classList.add('active');
      const tab = document.querySelector('[data-tab-target="section-graph"]');
      if (tab) tab.classList.add('active');
    } else if (view === 'inspector') {
      const sec = document.getElementById('section-inspector');
      if (sec) sec.classList.add('active');
      const tab = document.querySelector('[data-tab-target="section-inspector"]');
      if (tab) tab.classList.add('active');
    }
  }

  private handleNext(): void {
    if (this.list.size === 0) {
      NotificationToast.show('No tracks in the list.', 'warn');
      return;
    }
    const nextNode = this.list.next();
    if (nextNode) {
      this.audioEngine.loadSong(nextNode.data, true);
      NotificationToast.show(`Forward (O(1)): "${nextNode.data.title}"`, 'info');
    } else {
      this.audioEngine.pause();
      NotificationToast.show('Reached the end of the tracklist.', 'info');
    }
  }

  private handlePrev(): void {
    if (this.list.size === 0) {
      NotificationToast.show('No tracks in the list.', 'warn');
      return;
    }
    const prevNode = this.list.prev();
    if (prevNode) {
      this.audioEngine.loadSong(prevNode.data, true);
      NotificationToast.show(`Rewind (O(1)): "${prevNode.data.title}"`, 'info');
    } else {
      NotificationToast.show('You are at the beginning of the tracklist.', 'info');
    }
  }

  private playSongNode(node: SongNode): void {
    if (this.list.current === node) {
      if (this.audioEngine.isPlaying) {
        this.audioEngine.pause();
      } else {
        this.audioEngine.play();
      }
      return;
    }

    this.list.setCurrent(node);
    this.audioEngine.loadSong(node.data, true);
    NotificationToast.show(`Playing: "${node.data.title}"`, 'info');
  }

  private removeSongNode(node: SongNode): void {
    const title = node.data.title;
    const wasCurrent = this.list.current === node;
    const isPlaying = this.audioEngine.isPlaying;

    this.list.removeNode(node);
    NotificationToast.show(`Removed: "${title}"`, 'warn');

    if (wasCurrent) {
      if (this.list.current) {
        this.audioEngine.loadSong(this.list.current.data, isPlaying);
      } else {
        this.audioEngine.stop();
        this.resetPlayerDisplay();
      }
    }
  }

  private handleSongAdded(song: Song, mode: InsertMode, position?: number): void {
    let node: SongNode;
    let message = '';

    if (mode === 'beginning') {
      node = this.list.insertAtBeginning(song);
      message = `Added at HEAD (O(1)): "${song.title}"`;
    } else if (mode === 'position') {
      const pos = position !== undefined ? position : 0;
      node = this.list.insertAtPosition(pos, song);
      message = `Added at Index [${pos}] (O(n)): "${song.title}"`;
    } else {
      node = this.list.insertAtEnd(song);
      message = `Added at TAIL (O(1)): "${song.title}"`;
    }

    NotificationToast.show(message, 'success');

    if (this.list.size === 1) {
      this.playSongNode(node);
    }
  }

  private handlePlayStateChange(isPlaying: boolean): void {
    const playSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    const pauseSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

    if (this.playPauseBtn) this.playPauseBtn.innerHTML = isPlaying ? pauseSvg : playSvg;
    if (this.heroPlayPauseBtn) this.heroPlayPauseBtn.innerHTML = isPlaying ? pauseSvg : playSvg;

    if (this.playlistUI) {
      this.playlistUI.setPlayState(isPlaying);
    }

    if (this.heroBannerEl) {
      if (isPlaying) {
        this.heroBannerEl.classList.add('is-playing-glow');
      } else {
        this.heroBannerEl.classList.remove('is-playing-glow');
      }
    }
  }

  private handleTimeUpdate(currentTime: number, duration: number): void {
    if (!this.isDraggingSeek && this.seekSlider) {
      const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
      this.seekSlider.value = percent.toString();
      if (this.currentTimeEl) this.currentTimeEl.textContent = AudioEngine.formatTime(currentTime);
      if (this.durationTimeEl) this.durationTimeEl.textContent = AudioEngine.formatTime(duration);
    }
  }

  private handleSongEnd(): void {
    if (this.list.repeatMode === 'one' && this.list.current) {
      this.audioEngine.seek(0);
      this.audioEngine.play();
    } else {
      this.handleNext();
    }
  }

  private updatePlayerDisplay(song: Song): void {
    if (this.trackTitleEl) this.trackTitleEl.textContent = song.title;
    if (this.trackArtistEl) this.trackArtistEl.textContent = song.artist;
    if (this.trackCoverEl) this.trackCoverEl.style.background = song.cover;
    if (this.heroDurationEl) this.heroDurationEl.textContent = AudioEngine.formatTime(song.duration);
    if (this.trackFormatTag) this.trackFormatTag.textContent = song.sourceType === 'mp3' ? 'MP3 AUDIO' : 'SYNTH DEMO';

    if (this.bottomTrackTitle) this.bottomTrackTitle.textContent = song.title;
    if (this.bottomTrackArtist) this.bottomTrackArtist.textContent = song.artist;
    if (this.bottomCoverThumb) this.bottomCoverThumb.style.background = song.cover;
    if (this.durationTimeEl) this.durationTimeEl.textContent = AudioEngine.formatTime(song.duration);

    const currNode = this.list.current;
    if (currNode) {
      const idx = this.list.indexOf(currNode);
      if (this.heroNodeIndexBadge) this.heroNodeIndexBadge.textContent = `Node #${idx}`;
      if (this.bottomNodeChip) this.bottomNodeChip.textContent = `Node ${idx + 1} of ${this.list.size}`;

      const prevTitle = currNode.prev ? currNode.prev.data.title : 'null (HEAD)';
      const nextTitle = currNode.next ? currNode.next.data.title : 'null (TAIL)';
      if (this.heroPrevTitle) this.heroPrevTitle.textContent = prevTitle;
      if (this.heroNextTitle) this.heroNextTitle.textContent = nextTitle;

      if (this.bottomPrevPtr) this.bottomPrevPtr.textContent = currNode.prev ? `← ${currNode.prev.data.title.substring(0, 10)}...` : '← null';
      if (this.bottomNextPtr) this.bottomNextPtr.textContent = currNode.next ? `${currNode.next.data.title.substring(0, 10)}... →` : 'null →';
    }

    if (this.heroBannerEl) {
      this.heroBannerEl.style.setProperty('--hero-ambient-color', song.cover);
    }

    const isLiked = this.playlistUI?.likedSongs.has(song.id) || false;
    this.updateLikeButtons(isLiked);
  }

  private resetPlayerDisplay(): void {
    if (this.trackTitleEl) this.trackTitleEl.textContent = 'No track selected';
    if (this.trackArtistEl) this.trackArtistEl.textContent = 'Tracklist is empty';
    if (this.trackCoverEl) this.trackCoverEl.style.background = 'linear-gradient(135deg, #12141c 0%, #1a1e2c 100%)';
    if (this.bottomTrackTitle) this.bottomTrackTitle.textContent = 'Idle';
    if (this.bottomTrackArtist) this.bottomTrackArtist.textContent = 'Empty queue';
    if (this.bottomCoverThumb) this.bottomCoverThumb.style.background = '#1a1e2c';
    if (this.currentTimeEl) this.currentTimeEl.textContent = '00:00';
    if (this.durationTimeEl) this.durationTimeEl.textContent = '00:00';
    if (this.seekSlider) this.seekSlider.value = '0';
    this.handlePlayStateChange(false);
  }

  private updateLikeButtons(isLiked: boolean): void {
    const filledHeart = `<svg width="20" height="20" viewBox="0 0 24 24" fill="#00f2fe" stroke="#00f2fe" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
    const emptyHeart = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;

    if (this.heroLikeBtn) this.heroLikeBtn.innerHTML = isLiked ? filledHeart : emptyHeart;
    if (this.bottomLikeBtn) this.bottomLikeBtn.innerHTML = isLiked ? filledHeart : emptyHeart;
  }

  private updateVolumeIcon(vol: number): void {
    if (!this.volumeBtn) return;
    if (vol === 0) {
      this.volumeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;
    } else if (vol < 0.5) {
      this.volumeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>`;
    } else {
      this.volumeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
    }
  }

  private updateRepeatButton(): void {
    if (!this.repeatBtn) return;
    if (this.list.repeatMode === 'all') {
      if (this.repeatBadgeText) this.repeatBadgeText.textContent = 'ALL';
      this.repeatBtn.classList.add('btn-active');
    } else if (this.list.repeatMode === 'one') {
      if (this.repeatBadgeText) this.repeatBadgeText.textContent = '1';
      this.repeatBtn.classList.add('btn-active');
    } else {
      if (this.repeatBadgeText) this.repeatBadgeText.textContent = 'OFF';
      this.repeatBtn.classList.remove('btn-active');
    }
  }

  private updateCounters(): void {
    const count = this.list.size;
    const text = `${count} ${count === 1 ? 'track' : 'tracks'}`;

    if (this.listSizeCounter) this.listSizeCounter.textContent = text;
    if (this.sidebarSizeBadge) this.sidebarSizeBadge.textContent = text;

    if (this.sidebarHeadName) {
      this.sidebarHeadName.textContent = this.list.head ? this.list.head.data.title : 'null';
    }
    if (this.sidebarCurrentName) {
      this.sidebarCurrentName.textContent = this.list.current ? this.list.current.data.title : 'null';
    }
    if (this.sidebarTailName) {
      this.sidebarTailName.textContent = this.list.tail ? this.list.tail.data.title : 'null';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MusicPlayerApp();
});
