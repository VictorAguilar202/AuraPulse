import { SongNode } from './src/models/SongNode';
import { DoublyLinkedList } from './src/models/DoublyLinkedList';
import type { Song } from './src/models/types';
import { AudioEngine } from './src/audio/AudioEngine';

export { SongNode } from './src/models/SongNode';
export { DoublyLinkedList } from './src/models/DoublyLinkedList';
export type { Song, RepeatMode, OperationLogEntry } from './src/models/types';
export { AudioEngine } from './src/audio/AudioEngine';

export class MusicPlayer {
  public list: DoublyLinkedList;
  public audioEngine?: AudioEngine;

  constructor(enableAudio: boolean = false) {
    this.list = new DoublyLinkedList();
    if (enableAudio && typeof window !== 'undefined') {
      this.audioEngine = new AudioEngine();
    }
  }

  public addSongAtBeginning(song: Song): SongNode {
    return this.list.insertAtBeginning(song);
  }

  public addSongAtEnd(song: Song): SongNode {
    return this.list.insertAtEnd(song);
  }

  public addSongAtPosition(index: number, song: Song): SongNode {
    return this.list.insertAtPosition(index, song);
  }

  public removeSong(nodeOrId: SongNode | string): boolean {
    if (typeof nodeOrId === 'string') {
      return this.list.removeById(nodeOrId);
    }
    return this.list.removeNode(nodeOrId);
  }

  public nextTrack(): SongNode | null {
    const nextNode = this.list.next();
    if (nextNode && this.audioEngine) {
      this.audioEngine.loadSong(nextNode.data, true);
    }
    return nextNode;
  }

  public prevTrack(): SongNode | null {
    const prevNode = this.list.prev();
    if (prevNode && this.audioEngine) {
      this.audioEngine.loadSong(prevNode.data, true);
    }
    return prevNode;
  }

  public reversePlaylist(): void {
    this.list.reverse();
  }

  public shufflePlaylist(): void {
    this.list.shuffle();
  }

  public getCurrentSong(): Song | null {
    return this.list.current ? this.list.current.data : null;
  }

  public getPlaylist(): Song[] {
    return this.list.toArray().map((node) => node.data);
  }

  public get size(): number {
    return this.list.size;
  }
}

export default MusicPlayer;
