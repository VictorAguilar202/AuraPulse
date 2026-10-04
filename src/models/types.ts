export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  cover: string;
  fileType: string;
  fileName?: string;
  sourceType: 'mp3' | 'demo';
  addedAt: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface OperationLogEntry {
  id: string;
  timestamp: string;
  title: string;
  complexity: string;
  codeSnippet: string;
  description: string;
  type: 'insert-head' | 'insert-tail' | 'insert-pos' | 'delete' | 'next' | 'prev' | 'shuffle' | 'reverse';
}
