# Happy Birthday, Anshika ♡ 🌸

A cinematic, interactive Japanese Cherry Blossom birthday web experience for **Anshika**.

## ✨ Features

- **Living Japanese Sakura World**: Multi-layered interactive environment with Mount Fuji, twilight starry sky, glowing moon, swinging lanterns with pendulum physics, drifting mountain valley mist, and interactive mouse-responsive sakura petals.
- **Native HTML5 Audio Player**: Curated playlist of 34 songs loaded from `public/music/` with real-time waveform equalizer, seeking, volume controls, shuffle, auto-advance, and searchable drawer tracklist.
- **4K Ultra-Sharp Scenery**: EDSR neural super-resolved 4K landscape artwork optimized with modern responsive WebP formatting.
- **Editorial Typography**: Romantic serif and handwritten script typography dedicated to Anshika.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
git clone https://github.com/ayan090912-ux/birthday-.git
cd birthday-
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the experience.

### Building for Production

```bash
npm run build
```

## 🎵 Adding More Music

1. Place your `.mp3` audio files into `public/music/`.
2. Add the track metadata to `src/data/content.ts` in `localPlaylistTracks`.
