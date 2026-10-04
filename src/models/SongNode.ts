import { Song } from './types';

export class SongNode {
  public data: Song;
  public prev: SongNode | null = null;
  public next: SongNode | null = null;

  constructor(song: Song) {
    this.data = song;
  }

  get id(): string {
    return this.data.id;
  }

  toString(): string {
    const prevTitle = this.prev ? `"${this.prev.data.title}"` : 'null';
    const nextTitle = this.next ? `"${this.next.data.title}"` : 'null';
    return `[Prev: ${prevTitle} <- "${this.data.title}" -> Next: ${nextTitle}]`;
  }
}
