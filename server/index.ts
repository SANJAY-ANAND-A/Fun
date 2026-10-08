import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import * as mm from 'music-metadata';
import crypto from 'crypto';
import { dbService } from './db.js';
import { generateSyntheticWav } from './audioGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Storage directories
const uploadsDir = path.resolve(__dirname, '../uploads');
const audioDir = path.join(uploadsDir, 'audio');
const coversDir = path.join(uploadsDir, 'covers');

fs.mkdirSync(audioDir, { recursive: true });
fs.mkdirSync(coversDir, { recursive: true });

app.use(cors());
app.use(express.json());

// Serve uploaded static files
app.use('/uploads', express.static(uploadsDir));

// Multer storage configurations
const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, audioDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    cb(null, uniqueName);
  }
});

const coverStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, coversDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueName = `cover-${crypto.randomUUID()}${ext}`;
    cb(null, uniqueName);
  }
});

const uploadAudio = multer({
  storage: audioStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedExts = ['.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a', '.webm', '.opus'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format. Allowed: ${allowedExts.join(', ')}`));
    }
  }
});

const uploadCover = multer({
  storage: coverStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image format. Allowed: JPG, PNG, WEBP, SVG'));
    }
  }
});

// Seed sample tracks if library is completely empty
async function seedInitialTracksIfNeeded() {
  const existingTracks = dbService.getTracks();
  if (existingTracks.length > 0) return;

  console.log('[Seed] Seeding sample tracks with high-fidelity synthesizer audio...');

  // 1. Ambient track
  const track1Id = crypto.randomUUID();
  const track1Filename = `ambient-resonance-${track1Id}.wav`;
  const track1Path = path.join(audioDir, track1Filename);
  const track1AudioBuffer = generateSyntheticWav(18, 'ambient');
  fs.writeFileSync(track1Path, track1AudioBuffer);

  // SVG Artwork for track 1
  const cover1Filename = `cover-ambient-${track1Id}.svg`;
  const cover1Path = path.join(coversDir, cover1Filename);
  const cover1Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
    <rect width="500" height="500" fill="#13151b" />
    <circle cx="250" cy="250" r="160" fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="6,6" opacity="0.6"/>
    <circle cx="250" cy="250" r="110" fill="#1a1d26" stroke="#94a3b8" stroke-width="1.5" />
    <circle cx="250" cy="250" r="60" fill="#242938" />
    <path d="M190 250 Q250 180 310 250 T430 250" fill="none" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round"/>
    <text x="250" y="420" font-family="sans-serif" font-size="20" font-weight="600" fill="#cbd5e1" text-anchor="middle" letter-spacing="4">SOLARIS RESONANCE</text>
  </svg>`;
  fs.writeFileSync(cover1Path, cover1Svg, 'utf-8');

  dbService.createTrack({
    id: track1Id,
    title: 'Solaris Resonance',
    artist: 'Aura Synthesis',
    album: 'Atmospheres Vol. 1',
    duration: 18,
    format: 'wav',
    filePath: `/uploads/audio/${track1Filename}`,
    coverPath: `/uploads/covers/${cover1Filename}`,
    fileSize: track1AudioBuffer.length,
    year: 2026,
    genre: 'Ambient',
    tags: ['ambient', 'drone', 'analog', 'synth']
  });

  // 2. Chillhop track
  const track2Id = crypto.randomUUID();
  const track2Filename = `midnight-echoes-${track2Id}.wav`;
  const track2Path = path.join(audioDir, track2Filename);
  const track2AudioBuffer = generateSyntheticWav(16, 'chillhop');
  fs.writeFileSync(track2Path, track2AudioBuffer);

  // SVG Artwork for track 2
  const cover2Filename = `cover-midnight-${track2Id}.svg`;
  const cover2Path = path.join(coversDir, cover2Filename);
  const cover2Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
    <rect width="500" height="500" fill="#0f1115" />
    <rect x="75" y="75" width="350" height="350" fill="none" stroke="#334155" stroke-width="2" />
    <line x1="75" y1="250" x2="425" y2="250" stroke="#475569" stroke-width="1.5" />
    <line x1="250" y1="75" x2="250" y2="425" stroke="#475569" stroke-width="1.5" />
    <circle cx="250" cy="250" r="85" fill="#181c24" stroke="#e2e8f0" stroke-width="2" />
    <polygon points="250,195 295,280 205,280" fill="#2d3748" stroke="#cbd5e1" stroke-width="1.5" />
    <text x="250" y="455" font-family="sans-serif" font-size="18" font-weight="600" fill="#94a3b8" text-anchor="middle" letter-spacing="3">MIDNIGHT DRIFT</text>
  </svg>`;
  fs.writeFileSync(cover2Path, cover2Svg, 'utf-8');

  dbService.createTrack({
    id: track2Id,
    title: 'Midnight Drift',
    artist: 'Kanso Ensemble',
    album: 'City Lights Tape',
    duration: 16,
    format: 'wav',
    filePath: `/uploads/audio/${track2Filename}`,
    coverPath: `/uploads/covers/${cover2Filename}`,
    fileSize: track2AudioBuffer.length,
    year: 2026,
    genre: 'Electronic',
    tags: ['electronic', 'chill', 'lo-fi', 'beats']
  });

  // Seed default playlist
  const playlist1 = dbService.createPlaylist(crypto.randomUUID(), 'Late Night Focus', 'Curated sounds for deep listening and work.');
  dbService.addTrackToPlaylist(playlist1.id, track1Id);
  dbService.addTrackToPlaylist(playlist1.id, track2Id);
  dbService.toggleFavorite(track1Id);

  console.log('[Seed] Sample tracks seeded successfully.');
}

// ---------------- ROUTES ----------------

// GET /api/tracks
app.get('/api/tracks', (req: Request, res: Response) => {
  try {
    const { q, sort, genre, favorites } = req.query;
    const tracks = dbService.getTracks({
      search: typeof q === 'string' ? q : undefined,
      sort: typeof sort === 'string' ? sort : undefined,
      genre: typeof genre === 'string' ? genre : undefined,
      favoritesOnly: favorites === 'true'
    });
    res.json({ success: true, tracks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/tracks/:id
app.get('/api/tracks/:id', (req: Request, res: Response) => {
  try {
    const track = dbService.getTrackById(req.params.id);
    if (!track) {
      return res.status(404).json({ success: false, error: 'Track not found' });
    }
    res.json({ success: true, track });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/tracks/:id/stream - HTTP 206 Partial Content Audio Streaming
app.get('/api/tracks/:id/stream', (req: Request, res: Response) => {
  try {
    const track = dbService.getTrackById(req.params.id);
    if (!track) {
      return res.status(404).json({ success: false, error: 'Track not found' });
    }

    // Resolve disk file path
    const relativePart = track.filePath.replace(/^\/uploads\//, '');
    const absoluteFilePath = path.join(uploadsDir, relativePart);

    if (!fs.existsSync(absoluteFilePath)) {
      return res.status(404).json({ success: false, error: 'Audio file missing on disk' });
    }

    const stat = fs.statSync(absoluteFilePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Determine mime type
    const ext = path.extname(absoluteFilePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
      '.ogg': 'audio/ogg',
      '.aac': 'audio/aac',
      '.m4a': 'audio/mp4',
      '.webm': 'audio/webm',
      '.opus': 'audio/opus'
    };
    const contentType = mimeTypes[ext] || 'audio/mpeg';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).set({
          'Content-Range': `bytes */${fileSize}`
        });
        return res.end();
      }

      const chunkSize = (end - start) + 1;
      const fileStream = fs.createReadStream(absoluteFilePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType
      });

      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes'
      });

      fs.createReadStream(absoluteFilePath).pipe(res);
    }
  } catch (error: any) {
    console.error('Audio stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

// POST /api/tracks/upload - Upload multiple audio files with metadata extraction
app.post('/api/tracks/upload', uploadAudio.array('files', 20), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No audio files received' });
    }

    const createdTracks = [];

    for (const file of files) {
      const trackId = crypto.randomUUID();
      const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
      let title = path.basename(file.originalname, path.extname(file.originalname));
      let artist = 'Unknown Artist';
      let album = '';
      let duration = 0;
      let year: number | null = null;
      let genre = '';
      let coverPath = '';

      try {
        const metadata = await mm.parseFile(file.path, { duration: true });
        if (metadata.common.title) {
          title = metadata.common.title;
        }
        if (metadata.common.artist) {
          artist = metadata.common.artist;
        }
        if (metadata.common.album) {
          album = metadata.common.album;
        }
        if (metadata.common.year) {
          year = metadata.common.year;
        }
        if (metadata.common.genre && metadata.common.genre.length > 0) {
          genre = metadata.common.genre[0];
        }
        if (metadata.format.duration) {
          duration = Math.round(metadata.format.duration);
        }

        // Extract embedded album artwork
        if (metadata.common.picture && metadata.common.picture.length > 0) {
          const pic = metadata.common.picture[0];
          let picExt = '.jpg';
          if (pic.format === 'image/png') picExt = '.png';
          else if (pic.format === 'image/webp') picExt = '.webp';

          const picFilename = `cover-extracted-${trackId}${picExt}`;
          const picPath = path.join(coversDir, picFilename);
          fs.writeFileSync(picPath, pic.data);
          coverPath = `/uploads/covers/${picFilename}`;
        }
      } catch (metaErr) {
        console.warn(`Could not extract full metadata for ${file.originalname}:`, metaErr);
      }

      const relativeAudioPath = `/uploads/audio/${path.basename(file.path)}`;

      const track = dbService.createTrack({
        id: trackId,
        title,
        artist,
        album,
        duration,
        format: ext,
        filePath: relativeAudioPath,
        coverPath,
        fileSize: file.size,
        year,
        genre,
        tags: genre ? [genre.toLowerCase()] : []
      });

      createdTracks.push(track);
    }

    res.json({
      success: true,
      count: createdTracks.length,
      tracks: createdTracks
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/tracks/:id - Edit track metadata
app.patch('/api/tracks/:id', (req: Request, res: Response) => {
  try {
    const { title, artist, album, genre, year, tags, coverPath } = req.body;
    const updated = dbService.updateTrack(req.params.id, {
      title,
      artist,
      album,
      genre,
      year: year !== undefined ? (year ? Number(year) : null) : undefined,
      tags,
      coverPath
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Track not found' });
    }

    res.json({ success: true, track: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tracks/:id/cover - Custom cover artwork upload
app.post('/api/tracks/:id/cover', uploadCover.single('cover'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded' });
    }

    const track = dbService.getTrackById(req.params.id);
    if (!track) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, error: 'Track not found' });
    }

    // Clean up old custom cover if it exists in uploads/covers
    if (track.coverPath && track.coverPath.startsWith('/uploads/covers/')) {
      const oldCoverFile = path.join(uploadsDir, track.coverPath.replace(/^\/uploads\//, ''));
      if (fs.existsSync(oldCoverFile)) {
        try { fs.unlinkSync(oldCoverFile); } catch {}
      }
    }

    const newCoverPath = `/uploads/covers/${path.basename(req.file.path)}`;
    const updated = dbService.updateTrack(req.params.id, { coverPath: newCoverPath });

    res.json({ success: true, track: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/tracks/:id - Delete track and storage cleanup
app.delete('/api/tracks/:id', (req: Request, res: Response) => {
  try {
    const deleted = dbService.deleteTrack(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Track not found' });
    }

    // Clean up audio file on disk
    if (deleted.filePath && deleted.filePath.startsWith('/uploads/')) {
      const diskAudioPath = path.join(uploadsDir, deleted.filePath.replace(/^\/uploads\//, ''));
      if (fs.existsSync(diskAudioPath)) {
        try { fs.unlinkSync(diskAudioPath); } catch {}
      }
    }

    // Clean up custom cover if not shared
    if (deleted.coverPath && deleted.coverPath.startsWith('/uploads/covers/')) {
      const diskCoverPath = path.join(uploadsDir, deleted.coverPath.replace(/^\/uploads\//, ''));
      if (fs.existsSync(diskCoverPath)) {
        try { fs.unlinkSync(diskCoverPath); } catch {}
      }
    }

    res.json({ success: true, message: 'Track deleted successfully', track: deleted });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/favorites/:trackId - Toggle favorite
app.post('/api/favorites/:trackId', (req: Request, res: Response) => {
  try {
    const isFavorite = dbService.toggleFavorite(req.params.trackId);
    res.json({ success: true, isFavorite });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/playlists
app.get('/api/playlists', (_req: Request, res: Response) => {
  try {
    const playlists = dbService.getPlaylists();
    res.json({ success: true, playlists });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/playlists
app.post('/api/playlists', (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Playlist name is required' });
    }
    const id = crypto.randomUUID();
    const playlist = dbService.createPlaylist(id, name.trim(), description || '');
    res.json({ success: true, playlist });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/playlists/:id
app.get('/api/playlists/:id', (req: Request, res: Response) => {
  try {
    const playlist = dbService.getPlaylistById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, error: 'Playlist not found' });
    }
    res.json({ success: true, playlist });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/playlists/:id
app.patch('/api/playlists/:id', (req: Request, res: Response) => {
  try {
    const { name, description, coverPath } = req.body;
    const playlist = dbService.updatePlaylist(req.params.id, { name, description, coverPath });
    if (!playlist) {
      return res.status(404).json({ success: false, error: 'Playlist not found' });
    }
    res.json({ success: true, playlist });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/playlists/:id (deletes playlist only, NOT songs!)
app.delete('/api/playlists/:id', (req: Request, res: Response) => {
  try {
    const success = dbService.deletePlaylist(req.params.id);
    res.json({ success, message: 'Playlist deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/playlists/:id/tracks
app.post('/api/playlists/:id/tracks', (req: Request, res: Response) => {
  try {
    const { trackId } = req.body;
    if (!trackId) {
      return res.status(400).json({ success: false, error: 'trackId is required' });
    }
    const playlist = dbService.addTrackToPlaylist(req.params.id, trackId);
    res.json({ success: true, playlist });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/playlists/:id/tracks/:trackId
app.delete('/api/playlists/:id/tracks/:trackId', (req: Request, res: Response) => {
  try {
    const playlist = dbService.removeTrackFromPlaylist(req.params.id, req.params.trackId);
    res.json({ success: true, playlist });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/playlists/:id/reorder
app.put('/api/playlists/:id/reorder', (req: Request, res: Response) => {
  try {
    const { trackIds } = req.body;
    if (!Array.isArray(trackIds)) {
      return res.status(400).json({ success: false, error: 'trackIds array is required' });
    }
    const playlist = dbService.reorderPlaylist(req.params.id, trackIds);
    res.json({ success: true, playlist });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/history
app.get('/api/history', (_req: Request, res: Response) => {
  try {
    const history = dbService.getHistory();
    res.json({ success: true, history });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/history/:trackId
app.post('/api/history/:trackId', (req: Request, res: Response) => {
  try {
    dbService.recordHistory(req.params.trackId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/settings
app.get('/api/settings', (_req: Request, res: Response) => {
  try {
    const settings = dbService.getSettings();
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/settings
app.post('/api/settings', (req: Request, res: Response) => {
  try {
    dbService.saveSettings(req.body);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/genres
app.get('/api/genres', (_req: Request, res: Response) => {
  try {
    const tracks = dbService.getTracks();
    const genresSet = new Set<string>();
    tracks.forEach(t => {
      if (t.genre && t.genre.trim()) genresSet.add(t.genre.trim());
    });
    res.json({ success: true, genres: Array.from(genresSet).sort() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve built frontend assets from dist if available
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req: Request, res: Response) => {
    // Avoid intercepting api and uploads
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Start server
app.listen(PORT, async () => {
  console.log(`[SoundHaven API] Server listening on http://localhost:${PORT}`);
  try {
    await seedInitialTracksIfNeeded();
  } catch (err) {
    console.error('Seeding error:', err);
  }
});
