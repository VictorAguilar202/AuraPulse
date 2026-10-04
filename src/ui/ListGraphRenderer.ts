import { DoublyLinkedList } from '../models/DoublyLinkedList';
import { SongNode } from '../models/SongNode';

export class ListGraphRenderer {
  private container: HTMLElement;
  private list: DoublyLinkedList;
  private onSelectSong: (node: SongNode) => void;
  private onDeleteNode: (node: SongNode) => void;

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

    this.list.subscribe((event) => {
      if (event === 'change' || event === 'current-change') {
        this.render();
      }
    });

    this.render();
  }

  public render(): void {
    const nodes = this.list.toArray();

    if (nodes.length === 0) {
      this.container.innerHTML = `
        <div class="empty-graph-card">
          <div class="empty-graph-icon">⇄</div>
          <h3>Doubly Linked List is Empty</h3>
          <p>Both <code>head</code> and <code>tail</code> pointers currently point to <code>null</code>. Add tracks to populate the node graph.</p>
        </div>
      `;
      return;
    }

    let html = `
      <div class="graph-scroll-track">
        <div class="graph-terminal-node terminal-start">
          <div class="terminal-box">
            <span class="terminal-text">null</span>
            <span class="terminal-sub">← prev(head)</span>
          </div>
          <div class="terminal-arrow-connector">
            <span>⇄</span>
          </div>
        </div>
    `;

    nodes.forEach((node, index) => {
      const isHead = this.list.head === node;
      const isTail = this.list.tail === node;
      const isCurrent = this.list.current === node;

      const prevTitle = node.prev ? `"${node.prev.data.title.substring(0, 12)}..."` : 'null';
      const nextTitle = node.next ? `"${node.next.data.title.substring(0, 12)}..."` : 'null';

      html += `
        <div class="graph-node-wrapper" data-id="${node.id}">
          <div class="graph-node-card ${isCurrent ? 'node-active' : ''} ${isHead ? 'node-head' : ''} ${isTail ? 'node-tail' : ''}">
            
            <div class="node-card-badges">
              ${isHead ? '<span class="badge badge-head">HEAD</span>' : ''}
              ${isTail ? '<span class="badge badge-tail">TAIL</span>' : ''}
              ${isCurrent ? '<span class="badge badge-current"><span class="pulse-dot"></span> ACTIVE</span>' : ''}
              <span class="badge badge-idx">#${index}</span>
            </div>

            <div class="node-main-info">
              <div class="node-cover-disc" style="background: ${node.data.cover};">
                <span class="disc-icon">${isCurrent ? '▶' : '♪'}</span>
              </div>
              <div class="node-text-group">
                <h4 class="node-title" title="${node.data.title}">${node.data.title}</h4>
                <p class="node-artist">${node.data.artist}</p>
              </div>
            </div>

            <div class="node-pointers-grid">
              <div class="node-ptr prev-ptr" title="Pointer to previous node">
                <span class="ptr-key">prev:</span>
                <span class="ptr-val ${node.prev ? 'has-node' : 'is-null'}">${prevTitle}</span>
              </div>
              <div class="node-ptr next-ptr" title="Pointer to next node">
                <span class="ptr-key">next:</span>
                <span class="ptr-val ${node.next ? 'has-node' : 'is-null'}">${nextTitle}</span>
              </div>
            </div>

            <div class="node-card-footer">
              <button class="btn-node-action btn-node-play" data-play-id="${node.id}">
                ${isCurrent ? 'Playing' : 'Play Node'}
              </button>
              <button class="btn-node-action btn-node-del" data-del-id="${node.id}" title="Remove node O(1)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>

          ${index < nodes.length - 1 ? `
            <div class="graph-connector" title="Bidirectional link: next (→) and prev (←)">
              <div class="connector-line forward-line">
                <span class="connector-label">next</span>
                <span class="connector-arrow">→</span>
              </div>
              <div class="connector-line backward-line">
                <span class="connector-arrow">←</span>
                <span class="connector-label">prev</span>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    });

    if (this.list.repeatMode === 'all' && nodes.length > 1) {
      html += `
        <div class="graph-terminal-node terminal-loop" title="Circular Mode: Tail connects to Head">
          <div class="terminal-arrow-connector">
            <span>⇄</span>
          </div>
          <div class="terminal-box loop-box">
            <span class="terminal-text">Loop</span>
            <span class="terminal-sub">Tail → Head</span>
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="graph-terminal-node terminal-end">
          <div class="terminal-arrow-connector">
            <span>⇄</span>
          </div>
          <div class="terminal-box">
            <span class="terminal-text">null</span>
            <span class="terminal-sub">next(tail) →</span>
          </div>
        </div>
      `;
    }

    html += `</div>`;
    this.container.innerHTML = html;

    this.container.querySelectorAll('[data-play-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (btn as HTMLElement).dataset.playId!;
        const node = this.list.findNodeById(id);
        if (node) this.onSelectSong(node);
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

    this.container.querySelectorAll('.graph-node-card').forEach((card) => {
      card.addEventListener('click', () => {
        const wrapper = card.closest('.graph-node-wrapper') as HTMLElement;
        if (wrapper && wrapper.dataset.id) {
          const node = this.list.findNodeById(wrapper.dataset.id);
          if (node) this.onSelectSong(node);
        }
      });
    });
  }
}
