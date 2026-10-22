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

## 🎵 Adding More Music (Fully Automatic)

You do **not** need to edit any code or config files. The system automatically scans and syncs songs for both local development and the live website.

### Automatic Method (Easiest)
1. Drop your audio file (`.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`, or `.flac`) into the **`public/music/`** folder.
2. The background macOS service (`com.anshika.musicsync`) automatically:
   - Detects the new song.
   - Extracts title, artist, and embedded album artwork.
   - Uploads the audio and album cover to the AWS S3 Music Vault.
   - Updates `public/music-manifest.json` on S3 and locally.
   - The song is immediately playable on both localhost and the live website!

### Manual Commands (If Needed)
- **Sync existing songs to S3 cloud vault:**
  ```bash
  npm run sync-music:once
  ```
- **Run local music scanner only:**
  ```bash
  npm run scan-music
  ```
- **Re-deploy entire website to AWS Amplify:**
  ```bash
  npm run deploy:aws
  ```
