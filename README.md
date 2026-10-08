# SoundHaven - Production Music Library & Audio Player

SoundHaven is a full-stack personal audio platform with real file storage, database persistence, HTTP 206 range-based audio streaming, ID3 metadata extraction, custom playlist management, and UI integrations featuring React Bits HoloCard, Shredder, and DomeGallery.

---

## Component Integration Verification Report

| Component | Status | Implementation Details |
|---|---|---|
| **HoloCard** (React Bits) | **Integrated** | Features WebGL procedural holographic grating shader with spectral diffraction (`shards`, `bursts`, `stars` presets), tilt glare reflections, and a non-WebGL / reduced-motion fallback. Interactive minimize, expand, and close controls are placed cleanly outside the card surface. Clicking the card does not trigger playback or dismiss the view. Minimized mode collapses into a compact floating player. Re-openable at any time from the bottom player bar without interrupting playback. |
| **Shredder** (React Bits) | **Integrated** | Powers the playback queue drawer. Supports drag-and-drop reordering, keyboard reordering (Up/Down controls), and animated strip shredding on removal. Crucially, removing/shredding an item removes it from the playback queue only; underlying files and library records are never touched. Configured with `autoAnimate={false}`, `loop={false}`, and `loopAfterDelete={false}`. |
| **DomeGallery** (React Bits) | **Integrated** | 3D spherical cover browser utilizing `@use-gesture/react` for drag and swipe rotation along yaw/pitch axes. Features keyboard arrow navigation, empty states, and quick actions (Play Now, Add to Queue, Edit Details) that seamlessly synchronize with the active player and queue state. |
| **Aura Gradient** (Witch's Brew adaptation) | **Adapted** | Adapted to strictly honor design constraints: no purple gradients. Built using a deep obsidian base (`#0b0d12`) with subtle dark slate (`#2d3748`, `#1e293b`) radial layers with screen blend mode for understated depth. |
| **Cursor Ring Field** (Originkit) | **Intentionally Disabled** | Disabled per the global design rule against cursor followers and cursor animations. Documented as an optional component for future opt-in. |

---

## Design System Compliance

* **No Purple Gradients**: Curated palette built on obsidian `#0b0d12`, surfaces `#11141b` / `#171b24`, titanium `#e2e8f0`, and muted slate accents.
* **No Pill Buttons**: All buttons use rectangular styling with modest 4px to 8px corner radii (`--radius-sm`, `--radius-xs`).
* **No Emoji Icons**: 100% Lucide React vector icons.
* **No Em Dashes**: Zero em dashes in all interface text, labels, and documentation.
* **No Cursor Animations**: Default cursor preserved across all interactive elements.
* **Persistent Audio Engine**: Single persistent `<audio>` element in `AudioContext` that never unmounts across navigation, preventing playback interruptions.

---

## Technical Architecture

* **Frontend**: React 18, TypeScript, Vite, Vanilla CSS design tokens, Lucide React, `@use-gesture/react`.
* **Backend**: Node.js, Express, `node:sqlite` (native zero-dependency SQLite engine built into Node), `multer`, `music-metadata`.
* **Storage**: Local filesystem storage with automatic ID3 tag extraction and embedded artwork extraction into `/uploads/audio/` and `/uploads/covers/`.
* **Audio Streaming**: HTTP 206 Partial Content range requests for instant seeking, scrubbing, and pause/resume.
* **Database**: `data/music.db` with relational schema for tracks, playlists, playlist_tracks, favorites, playback_history, and user_settings.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development
Runs both the Express API (port 3001) and Vite dev server (port 5173) with automatic proxying:
```bash
npm run dev
```

### 3. Build & Run Production Server
```bash
npm run build
npm start
```
Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## Verification & Automated Tests
To run the automated API and storage test suite:
```bash
node scripts/test-endpoints.js
```
Verified operations:
* Audio upload, validation, and ID3 metadata extraction
* HTTP 206 Partial Content audio range streaming
* Track metadata editing and custom cover replacement
* Playlist creation, track ordering, and playlist deletion
* Favorites toggle and playback history tracking
* Persistent volume and playback preferences
