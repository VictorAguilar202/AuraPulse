import { DoublyLinkedList } from '../models/DoublyLinkedList';
import { OperationLogEntry } from '../models/types';

export class AlgorithmInspector {
  private container: HTMLElement;
  private list: DoublyLinkedList;
  private viewMode: 'latest' | 'history' = 'latest';

  constructor(container: HTMLElement, list: DoublyLinkedList) {
    this.container = container;
    this.list = list;

    this.list.subscribe((event, data) => {
      if (event === 'operation' && data) {
        this.render();
      }
    });

    this.render();
  }

  public render(): void {
    const latest = this.list.operationHistory[0];

    if (!latest) {
      this.container.innerHTML = `
        <div class="inspector-card-pane">
          <div class="inspector-top-row">
            <div class="inspector-badge-group">
              <span class="pulse-cyan"></span>
              <span class="inspector-label">Data Structure: Doubly Linked List</span>
            </div>
            <span class="complexity-pill o-1">O(1) & O(n)</span>
          </div>
          <div class="inspector-placeholder-content">
            <p class="inspector-intro">
              Every operation on the player manipulates memory references (<code>head</code>, <code>tail</code>, <code>prev</code>, <code>next</code>).
            </p>
            <div class="inspector-quick-guide">
              <div class="guide-item">
                <span class="guide-badge o-1">O(1)</span>
                <span>Next, Prev, Insert Head/Tail, Remove by Node Reference</span>
              </div>
              <div class="guide-item">
                <span class="guide-badge o-n">O(n)</span>
                <span>Insert at Index, Reverse List, Shuffle List</span>
              </div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    if (this.viewMode === 'latest') {
      this.renderLatest(latest);
    } else {
      this.renderHistory();
    }
  }

  private renderLatest(op: OperationLogEntry): void {
    const isConstantTime = op.complexity.includes('O(1)');

    this.container.innerHTML = `
      <div class="inspector-card-pane operation-animated">
        <div class="inspector-top-row">
          <div class="inspector-badge-group">
            <span class="pulse-cyan"></span>
            <span class="inspector-op-name">${op.title}</span>
          </div>
          <div class="inspector-meta-group">
            <span class="inspector-time">${op.timestamp}</span>
            <span class="complexity-pill ${isConstantTime ? 'o-1' : 'o-n'}">${op.complexity}</span>
          </div>
        </div>

        <p class="inspector-desc-text">${op.description}</p>

        <div class="inspector-tabs-switch">
          <button class="btn-inspector-tab ${this.viewMode === 'latest' ? 'tab-active' : ''}" data-tab="latest">
            Current Operation
          </button>
          <button class="btn-inspector-tab ${this.viewMode === 'history' ? 'tab-active' : ''}" data-tab="history">
            History (${this.list.operationHistory.length})
          </button>
        </div>

        <div class="inspector-code-card">
          <div class="code-card-header">
            <div class="header-dots">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
            </div>
            <span class="code-header-title">DoublyLinkedList.${op.type}()</span>
            <span class="code-badge-ts">TypeScript</span>
          </div>
          <pre class="code-pre"><code>${this.escapeHtml(op.codeSnippet)}</code></pre>
        </div>
      </div>
    `;

    this.attachTabListeners();
  }

  private renderHistory(): void {
    const history = this.list.operationHistory.slice(0, 10);

    let html = `
      <div class="inspector-card-pane">
        <div class="inspector-top-row">
          <div class="inspector-badge-group">
            <span class="pulse-cyan"></span>
            <span class="inspector-op-name">DLL Operation History</span>
          </div>
          <span class="complexity-pill o-1">${history.length} logged</span>
        </div>

        <div class="inspector-tabs-switch">
          <button class="btn-inspector-tab ${this.viewMode === 'latest' ? 'tab-active' : ''}" data-tab="latest">
            Current Operation
          </button>
          <button class="btn-inspector-tab ${this.viewMode === 'history' ? 'tab-active' : ''}" data-tab="history">
            History (${this.list.operationHistory.length})
          </button>
        </div>

        <div class="history-list-wrapper">
    `;

    history.forEach((entry) => {
      const isO1 = entry.complexity.includes('O(1)');
      html += `
        <div class="history-log-row">
          <div class="log-left">
            <span class="log-time">${entry.timestamp}</span>
            <span class="log-title">${entry.title}</span>
          </div>
          <div class="log-right">
            <span class="complexity-mini ${isO1 ? 'o-1' : 'o-n'}">${entry.complexity}</span>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachTabListeners();
  }

  private attachTabListeners(): void {
    this.container.querySelectorAll('.btn-inspector-tab').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tab = (e.currentTarget as HTMLElement).dataset.tab as 'latest' | 'history';
        if (tab) {
          this.viewMode = tab;
          this.render();
        }
      });
    });
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
