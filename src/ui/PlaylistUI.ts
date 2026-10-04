import { DoublyLinkedList } from '../models/DoublyLinkedList';
import { SongNode } from '../models/SongNode';
import { AudioEngine } from '../audio/AudioEngine';

export class PlaylistUI {
  private container: HTMLElement;
  private list: DoublyLinkedList;
  private onSelectSong: (node: SongNode) => void;
  private onDeleteNode: (node: SongNode) => void;
  private searchQuery: string = '';
  private isAudioPlaying: boolean = false;
  public likedSongs: Set<string> = new Set();

  constructor(
    container: HTMLElement,
    list: DoublyLinkedList,
    onSelectSong: (node: SongNode) => void,
    onDeleteNode: (node: SongNode) => void
  ) {
    this.container = container;
    this.list = list;
    this.onSelectSong = onSelectSong;
    this.onDeleteNode = onDeleteNode;

    try {
      const saved = localStorage.getItem('aurapulse_liked_songs');
      if (saved) {
        this.likedSongs = new Set(JSON.parse(saved));
      }
    } catch {
      // Storage unavailable
    }

    this.list.subscribe((event) => {
      if (event === 'change' || event === 'current-change') {
        this.render();
      }
    });

    this.render();
  }

  public setPlayState(isPlaying: boolean): void {
    this.isAudioPlaying = isPlaying;
    this.updateActiveRowPlayingState();
  }

  public setSearchQuery(query: string): void {
    this.searchQuery = query.toLowerCase().trim();
    this.render();
  }

  public toggleLike(songId: string): boolean {
    if (this.likedSongs.has(songId)) {
      this.likedSongs.delete(songId);
    } else {
      this.likedSongs.add(songId);
    }
    try {
      localStorage.setItem('aurapulse_liked_songs', JSON.stringify(Array.from(this.likedSongs)));
    } catch {
      // Storage unavailable
    }
    this.render();
    return this.likedSongs.has(songId);
  }

  private updateActiveRowPlayingState(): void {
    const activeRow = this.container.querySelector('.track-row.active');
    if (!activeRow) return;

    const eqContainer = activeRow.querySelector('.row-num-col');
    if (eqContainer) {
      if (this.isAudioPlaying) {
        eqContainer.classList.add('is-animating');
      } else {
        eqContainer.classList.remove('is-animating');
      }
    }
  }

  public render(): void {
    let nodes = this.list.toArray();

    if (this.searchQuery) {
      nodes = nodes.filter((n) =>
        n.data.title.toLowerCase().includes(this.searchQuery) ||
        n.data.artist.toLowerCase().includes(this.searchQuery)
      );
    }

    if (nodes.length === 0) {
      this.container.innerHTML = `
        <div class="empty-tracklist">
          <div class="empty-icon-ring">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
          <h3>${this.searchQuery ? 'No matching tracks found' : 'Your tracklist is empty'}</h3>
          <p>${this.searchQuery ? 'Try another search keyword.' : 'Click "+ Add Track" to insert new nodes at the Head, Tail, or any specific Index.'}</p>
        </div>
      `;
      return;
    }

    let html = `
      <div class="tracklist-table">
        <div class="tracklist-header-row">
          <div class="col-num">#</div>
          <div class="col-title">TITLE</div>
          <div class="col-pointers">DLL POINTERS (PREV ⇄ NEXT)</div>
          <div class="col-duration">TIME</div>
          <div class="col-actions">ACTIONS</div>
        </div>
        <div class="tracklist-rows-body">
    `;

    nodes.forEach((node, index) => {
      const isCurrent = this.list.current === node;
      const isHead = this.list.head === node;
      const isTail = this.list.tail === node;
      const isLiked = this.likedSongs.has(node.data.id);

      const prevText = node.prev ? node.prev.data.title : 'null (HEAD)';
      const nextText = node.next ? node.next.data.title : 'null (TAIL)';

      html += `
        <div class="track-row ${isCurrent ? 'active' : ''}" data-id="${node.id}">
          <div class="row-num-col ${this.isAudioPlaying && isCurrent ? 'is-animating' : ''}">
            <span class="index-num">${index + 1}</span>
            <button class="btn-row-play" data-play-id="${node.id}" title="${isCurrent && this.isAudioPlaying ? 'Pause' : 'Play'}">
              ${isCurrent && this.isAudioPlaying
                ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
                : `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`
              }
            </button>
            <div class="pulse-eq-bars" title="Playing">
              <span class="eq-bar bar-1"></span>
              <span class="eq-bar bar-2"></span>
              <span class="eq-bar bar-3"></span>
              <span class="eq-bar bar-4"></span>
            </div>
          </div>

          <div class="row-title-col">
            <div class="row-cover-artwork" style="background: ${node.data.cover};">
              <span>♪</span>
            </div>
            <div class="row-info-block">
              <div class="row-title-text" title="${node.data.title}">
                <span>${node.data.title}</span>
                ${isHead ? '<span class="node-tag tag-head">HEAD</span>' : ''}
                ${isTail ? '<span class="node-tag tag-tail">TAIL</span>' : ''}
              </div>
              <div class="row-artist-sub">
                <span>${node.data.artist}</span>
                <span class="dot-sep">•</span>
                <span class="format-tag">${node.data.sourceType === 'mp3' ? 'MP3' : 'Synth Demo'}</span>
              </div>
            </div>
          </div>

          <div class="row-pointers-col">
            <div class="pointer-node-pill prev-pill" data-target-id="${node.prev ? node.prev.id : ''}" title="Previous pointer: ${prevText}">
              <span class="ptr-direction">prev:</span>
              <span class="ptr-title ${node.prev ? 'is-linked' : 'is-null'}">${prevText}</span>
            </div>
            <span class="pointer-flow-symbol">⇄</span>
            <div class="pointer-node-pill next-pill" data-target-id="${node.next ? node.next.id : ''}" title="Next pointer: ${nextText}">
              <span class="ptr-direction">next:</span>
              <span class="ptr-title ${node.next ? 'is-linked' : 'is-null'}">${nextText}</span>
            </div>
          </div>

          <div class="row-duration-col">
            <span>${AudioEngine.formatTime(node.data.duration)}</span>
          </div>

          <div class="row-actions-col">
            <button class="btn-action-like ${isLiked ? 'is-liked' : ''}" data-like-id="${node.data.id}" title="${isLiked ? 'Remove from favorites' : 'Add to favorites'}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <button class="btn-action-delete" data-del-id="${node.id}" title="Remove node O(1)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    this.container.innerHTML = html;

    this.container.querySelectorAll('[data-play-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (btn as HTMLElement).dataset.playId!;
        const node = this.list.findNodeById(id);
        if (node) this.onSelectSong(node);
      });
    });

    this.container.querySelectorAll('[data-like-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (btn as HTMLElement).dataset.likeId!;
        this.toggleLike(id);
      });
    });

    this.container.querySelectorAll('[data-del-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (btn as HTMLElement).dataset.delId!;
        const node = this.list.findNodeById(id);
        if (node) this.onDeleteNode(node);
      });
    });

    this.container.querySelectorAll('.pointer-node-pill.prev-pill, .pointer-node-pill.next-pill').forEach((pill) => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = (pill as HTMLElement).dataset.targetId;
        if (targetId) {
          const targetNode = this.list.findNodeById(targetId);
          if (targetNode) this.onSelectSong(targetNode);
        }
      });
    });

    this.container.querySelectorAll('.track-row').forEach((row) => {
      row.addEventListener('click', () => {
        const id = (row as HTMLElement).dataset.id!;
        const node = this.list.findNodeById(id);
        if (node) this.onSelectSong(node);
      });
    });
  }
}
