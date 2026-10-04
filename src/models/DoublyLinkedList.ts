import { SongNode } from './SongNode';
import { Song, RepeatMode, OperationLogEntry } from './types';

export type LinkedListListener = (event: 'change' | 'current-change' | 'operation', data?: unknown) => void;

export class DoublyLinkedList {
  public head: SongNode | null = null;
  public tail: SongNode | null = null;
  public current: SongNode | null = null;
  public size: number = 0;
  public repeatMode: RepeatMode = 'all';

  private listeners: LinkedListListener[] = [];
  public operationHistory: OperationLogEntry[] = [];

  public subscribe(listener: LinkedListListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit(event: 'change' | 'current-change' | 'operation', data?: unknown): void {
    for (const listener of this.listeners) {
      try {
        listener(event, data);
      } catch (err) {
        console.error('Listener error:', err);
      }
    }
  }

  private recordOperation(op: Omit<OperationLogEntry, 'id' | 'timestamp'>): void {
    const entry: OperationLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      ...op
    };
    this.operationHistory.unshift(entry);
    if (this.operationHistory.length > 50) {
      this.operationHistory.pop();
    }
    this.emit('operation', entry);
  }

  public insertAtBeginning(song: Song): SongNode {
    const newNode = new SongNode(song);

    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
      this.current = newNode;
    } else {
      newNode.next = this.head;
      this.head.prev = newNode;
      this.head = newNode;
    }

    this.size++;

    this.recordOperation({
      type: 'insert-head',
      title: `Insert at Head: "${song.title}"`,
      complexity: 'O(1)',
      description: 'Created new node and linked it as the new Head of the list.',
      codeSnippet: `const newNode = new SongNode("${song.title}");
if (!this.head) {
  this.head = this.tail = this.current = newNode;
} else {
  newNode.next = this.head;
  this.head.prev = newNode;
  this.head = newNode;
}
this.size++;`
    });

    this.emit('change');
    return newNode;
  }

  public insertAtEnd(song: Song): SongNode {
    const newNode = new SongNode(song);

    if (!this.tail) {
      this.head = newNode;
      this.tail = newNode;
      this.current = newNode;
    } else {
      this.tail.next = newNode;
      newNode.prev = this.tail;
      this.tail = newNode;
    }

    this.size++;

    this.recordOperation({
      type: 'insert-tail',
      title: `Insert at Tail: "${song.title}"`,
      complexity: 'O(1)',
      description: 'Appended new node to Tail using the tail pointer in constant time.',
      codeSnippet: `const newNode = new SongNode("${song.title}");
if (!this.tail) {
  this.head = this.tail = this.current = newNode;
} else {
  this.tail.next = newNode;
  newNode.prev = this.tail;
  this.tail = newNode;
}
this.size++;`
    });

    this.emit('change');
    return newNode;
  }

  public insertAtPosition(index: number, song: Song): SongNode {
    if (index <= 0) {
      return this.insertAtBeginning(song);
    }

    if (index >= this.size) {
      return this.insertAtEnd(song);
    }

    const newNode = new SongNode(song);
    const targetNode = this.getNodeAt(index)!;
    const prevNode = targetNode.prev!;

    newNode.prev = prevNode;
    newNode.next = targetNode;
    prevNode.next = newNode;
    targetNode.prev = newNode;

    this.size++;

    this.recordOperation({
      type: 'insert-pos',
      title: `Insert at Index [${index}]: "${song.title}"`,
      complexity: 'O(n)',
      description: `Traversed list to position ${index} and adjusted pointers between "${prevNode.data.title}" and "${targetNode.data.title}".`,
      codeSnippet: `const targetNode = this.getNodeAt(${index});
newNode.prev = targetNode.prev;
newNode.next = targetNode;
targetNode.prev.next = newNode;
targetNode.prev = newNode;
this.size++;`
    });

    this.emit('change');
    return newNode;
  }

  public removeNode(node: SongNode): boolean {
    if (!node || this.size === 0) return false;

    const removedSong = node.data;

    if (this.current === node) {
      this.current = node.next || node.prev || null;
      this.emit('current-change', this.current);
    }

    if (this.head === node && this.tail === node) {
      this.head = null;
      this.tail = null;
      this.current = null;
    } else if (this.head === node) {
      this.head = node.next;
      if (this.head) {
        this.head.prev = null;
      }
    } else if (this.tail === node) {
      this.tail = node.prev;
      if (this.tail) {
        this.tail.next = null;
      }
    } else {
      if (node.prev) {
        node.prev.next = node.next;
      }
      if (node.next) {
        node.next.prev = node.prev;
      }
    }

    node.prev = null;
    node.next = null;
    this.size--;

    this.recordOperation({
      type: 'delete',
      title: `Remove Track: "${removedSong.title}"`,
      complexity: 'O(1)',
      description: 'Disconnected prev and next pointers of target node directly.',
      codeSnippet: `if (node === this.head) {
  this.head = node.next;
  if (this.head) this.head.prev = null;
} else if (node === this.tail) {
  this.tail = node.prev;
  if (this.tail) this.tail.next = null;
} else {
  node.prev.next = node.next;
  node.next.prev = node.prev;
}
node.prev = null; node.next = null;
this.size--;`
    });

    this.emit('change');
    return true;
  }

  public removeAtPosition(index: number): boolean {
    const node = this.getNodeAt(index);
    if (!node) return false;
    return this.removeNode(node);
  }

  public removeById(id: string): boolean {
    const node = this.findNodeById(id);
    if (!node) return false;
    return this.removeNode(node);
  }

  public next(): SongNode | null {
    if (!this.current) {
      this.current = this.head;
      this.emit('current-change', this.current);
      return this.current;
    }

    if (this.repeatMode === 'one') {
      this.emit('current-change', this.current);
      return this.current;
    }

    if (this.current.next) {
      this.current = this.current.next;
    } else {
      if (this.repeatMode === 'all') {
        this.current = this.head;
      } else {
        return null;
      }
    }

    this.recordOperation({
      type: 'next',
      title: `Next Track: "${this.current?.data.title ?? 'None'}"`,
      complexity: 'O(1)',
      description: 'Moved current pointer forward to current.next.',
      codeSnippet: `if (this.current.next) {
  this.current = this.current.next;
} else if (this.repeatMode === 'all') {
  this.current = this.head;
}`
    });

    this.emit('current-change', this.current);
    return this.current;
  }

  public prev(): SongNode | null {
    if (!this.current) {
      this.current = this.tail;
      this.emit('current-change', this.current);
      return this.current;
    }

    if (this.repeatMode === 'one') {
      this.emit('current-change', this.current);
      return this.current;
    }

    if (this.current.prev) {
      this.current = this.current.prev;
    } else {
      if (this.repeatMode === 'all') {
        this.current = this.tail;
      } else {
        return null;
      }
    }

    this.recordOperation({
      type: 'prev',
      title: `Previous Track: "${this.current?.data.title ?? 'None'}"`,
      complexity: 'O(1)',
      description: 'Moved current pointer backwards to current.prev.',
      codeSnippet: `if (this.current.prev) {
  this.current = this.current.prev;
} else if (this.repeatMode === 'all') {
  this.current = this.tail;
}`
    });

    this.emit('current-change', this.current);
    return this.current;
  }

  public setCurrent(node: SongNode | null): void {
    this.current = node;
    this.emit('current-change', this.current);
  }

  public setCurrentById(id: string): SongNode | null {
    const node = this.findNodeById(id);
    if (node) {
      this.setCurrent(node);
    }
    return node;
  }

  public getNodeAt(index: number): SongNode | null {
    if (index < 0 || index >= this.size) return null;

    if (index <= Math.floor(this.size / 2)) {
      let curr = this.head;
      let count = 0;
      while (curr && count < index) {
        curr = curr.next;
        count++;
      }
      return curr;
    } else {
      let curr = this.tail;
      let count = this.size - 1;
      while (curr && count > index) {
        curr = curr.prev;
        count--;
      }
      return curr;
    }
  }

  public findNodeById(id: string): SongNode | null {
    let curr = this.head;
    while (curr) {
      if (curr.data.id === id) return curr;
      curr = curr.next;
    }
    return null;
  }

  public indexOf(node: SongNode): number {
    let curr = this.head;
    let idx = 0;
    while (curr) {
      if (curr === node) return idx;
      curr = curr.next;
      idx++;
    }
    return -1;
  }

  public toArray(): SongNode[] {
    const nodes: SongNode[] = [];
    let curr = this.head;
    while (curr) {
      nodes.push(curr);
      curr = curr.next;
    }
    return nodes;
  }

  public reverse(): void {
    if (this.size <= 1) return;

    let curr = this.head;
    let temp: SongNode | null = null;

    while (curr) {
      temp = curr.prev;
      curr.prev = curr.next;
      curr.next = temp;
      curr = curr.prev;
    }

    temp = this.head;
    this.head = this.tail;
    this.tail = temp;

    this.recordOperation({
      type: 'reverse',
      title: 'Reverse Linked List',
      complexity: 'O(n)',
      description: 'Swapped prev and next pointers for each node, and swapped Head with Tail.',
      codeSnippet: `let curr = this.head;
while (curr) {
  const temp = curr.prev;
  curr.prev = curr.next;
  curr.next = temp;
  curr = curr.prev;
}
[this.head, this.tail] = [this.tail, this.head];`
    });

    this.emit('change');
  }

  public shuffle(): void {
    if (this.size <= 1) return;

    const songs = this.toArray().map(node => node.data);
    for (let i = songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [songs[i], songs[j]] = [songs[j], songs[i]];
    }

    const currentId = this.current?.id;

    this.head = null;
    this.tail = null;
    this.current = null;
    this.size = 0;

    for (const song of songs) {
      this.insertAtEnd(song);
    }

    if (currentId) {
      this.current = this.findNodeById(currentId) || this.head;
    } else {
      this.current = this.head;
    }

    this.recordOperation({
      type: 'shuffle',
      title: 'Shuffle Linked List',
      complexity: 'O(n)',
      description: 'Randomized track order with Fisher-Yates and rebuilt bidirectional pointers.',
      codeSnippet: `for (let i = songs.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [songs[i], songs[j]] = [songs[j], songs[i]];
}
this.rebuildList(songs);`
    });

    this.emit('change');
    this.emit('current-change', this.current);
  }

  public clear(): void {
    let curr = this.head;
    while (curr) {
      const next = curr.next;
      curr.prev = null;
      curr.next = null;
      curr = next;
    }
    this.head = null;
    this.tail = null;
    this.current = null;
    this.size = 0;
    this.emit('change');
    this.emit('current-change', null);
  }
}
