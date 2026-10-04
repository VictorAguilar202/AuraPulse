# AuraPulse - Doubly Linked List Audio Engine

Interactive music player engine built with **TypeScript**, **Vite**, and custom cyber-glassmorphism CSS, powered by a **Doubly Linked List (DLL)** data structure. Fully configured for deployment on **Vercel**.

## Features

- **Bidirectional Playback Engine**: Doubly Linked List node navigation (`next` and `prev` pointers in O(1) constant time).
- **Interactive Node Graph**: Real-time visual representation of memory nodes with bidirectional links and NULL terminal indicators.
- **Dynamic Tracklist**: Instant search filtering, animated frequency equalizers, persistent favorites, and direct pointer jumping.
- **Algorithm Inspector**: Live time complexity monitor (O(1) vs O(n)) and execution log.
- **Web Audio Spectrum Analyzer**: Real-time reactive neon canvas frequency visualizer.
- **MP3 Upload**: Drag-and-drop support with insertion targeting (Head, Tail, or Index).

## Algorithm Complexity

| Operation | Method | Time Complexity |
| :--- | :--- | :---: |
| Insert at Head | `insertAtBeginning(song)` | **O(1)** |
| Insert at Tail | `insertAtEnd(song)` | **O(1)** |
| Insert at Index | `insertAtPosition(index, song)` | **O(n)** |
| Remove by Reference | `removeNode(node)` | **O(1)** |
| Next Track | `next()` | **O(1)** |
| Previous Track | `prev()` | **O(1)** |
| Reverse List | `reverse()` | **O(n)** |
| Shuffle List | `shuffle()` | **O(n)** |

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```
Build output is saved to `dist/`, ready for deployment to Vercel.
