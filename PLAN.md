# Implementation Plan: SoundHaven Music Platform

A complete, high-fidelity music storage and playback system featuring React Bits HoloCard, Shredder queue management, DomeGallery 3D artwork browsing, adapted subtle Aura background, and persistent local storage & playback engine.

## Architecture

- **Backend**: Node.js + Express (TypeScript / ES Modules), SQLite3 for persistent relational data, `multer` for multi-file streaming uploads, `music-metadata` for automatic ID3 tag & cover art extraction, range-based audio streaming (HTTP 206) for responsive seeking.
- **Frontend**: React 19 + TypeScript + Vite, Lucide React icons, Vanilla CSS design tokens adhering to strict aesthetic constraints (no purple gradients, no pill buttons, no em dashes, no cursor followers, charcoal base #0c0d10, muted warm accents).
- **Audio Engine**: Singleton persistent audio controller with continuous playback across page navigation, autoplay policy recovery, seek bar with buffered range indicators, volume smoothing, repeat modes (off, one, all), non-destructive shuffle, and comprehensive keyboard shortcuts.
- **Queue System**: Synchronized playback queue powered by React Bits Shredder with drag-and-drop reordering, shredded-strip visual removal (queue-only, never deletes library files), and accessible keyboard controls.
- **Now Playing Artwork**: React Bits HoloCard with holographic foil shader (bursts/shards/stars presets), interactive tilt, glare, reduced-motion fallback, and minimize/expand/close controls placed cleanly outside the card surface.
- **Discovery**: React Bits DomeGallery for spherical artwork browsing with drag rotation, coupled with instant list/grid views, real-time search, sorting, and tag filters.
- **Playlists & Management**: Custom playlist creation, track reordering, inline metadata editing, custom cover image replacement, favorites, and playback history.

## Phased Execution

1. **Phase 1: Environment & Project Setup** - Package configuration, dependencies, TypeScript config, Vite proxy.
2. **Phase 2: Backend & Database** - SQLite schema, migrations, Express API, audio & cover storage, metadata parsing, HTTP 206 streaming.
3. **Phase 3: Design System & Shell** - Global CSS tokens, typography, layout shell (Sidebar, Main Content, Persistent Player Bar).
4. **Phase 4: Audio Engine & Core Player** - Persistent audio element, playback state store, seek, volume, speed, shortcuts, repeat, shuffle.
5. **Phase 5: React Bits Components** - HoloCard (WebGL foil shader + fallback), Shredder (queue list + shred animation), DomeGallery (3D spherical browsing), adapted non-purple Aura background.
6. **Phase 6: Library, Upload & Metadata** - Drag-and-drop multi-upload with progress, metadata editor dialog, custom artwork replacement, delete confirmation.
7. **Phase 7: Playlists, Favorites & History** - Playlist management, track ordering, favorites toggle, recent history.
8. **Phase 8: Testing & Verification** - End-to-end testing with audio files, verifying all checklist items and strict design rules.
