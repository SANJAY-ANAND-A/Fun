import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'music.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT DEFAULT '',
    duration REAL DEFAULT 0,
    format TEXT DEFAULT 'mp3',
    file_path TEXT NOT NULL,
    cover_path TEXT DEFAULT '',
    file_size INTEGER DEFAULT 0,
    year INTEGER,
    genre TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',
    play_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist);
  CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album);
  CREATE INDEX IF NOT EXISTS idx_tracks_created ON tracks(created_at DESC);

  CREATE TABLE IF NOT EXISTS playlists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    cover_path TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id TEXT NOT NULL,
    track_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    PRIMARY KEY (playlist_id, track_id),
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS favorites (
    track_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS playback_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id TEXT NOT NULL,
    played_at TEXT NOT NULL,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

export interface TrackRow {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  format: string;
  file_path: string;
  cover_path: string;
  file_size: number;
  year: number | null;
  genre: string;
  tags: string;
  play_count: number;
  created_at: string;
  updated_at: string;
  is_favorite?: number;
}

export function formatTrack(row: TrackRow) {
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags || '[]');
  } catch {
    tags = [];
  }
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    album: row.album || '',
    duration: Number(row.duration) || 0,
    format: row.format || 'mp3',
    filePath: row.file_path,
    coverPath: row.cover_path || '',
    fileSize: Number(row.file_size) || 0,
    year: row.year,
    genre: row.genre || '',
    tags,
    playCount: Number(row.play_count) || 0,
    isFavorite: Boolean(row.is_favorite),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export const dbService = {
  getTracks(options: { search?: string; sort?: string; genre?: string; favoritesOnly?: boolean } = {}) {
    let sql = `
      SELECT t.*, CASE WHEN f.track_id IS NOT NULL THEN 1 ELSE 0 END AS is_favorite
      FROM tracks t
      LEFT JOIN favorites f ON t.id = f.track_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options.favoritesOnly) {
      sql += ` AND f.track_id IS NOT NULL`;
    }

    if (options.genre && options.genre !== 'all') {
      sql += ` AND LOWER(t.genre) = LOWER(?)`;
      params.push(options.genre);
    }

    if (options.search && options.search.trim()) {
      const q = `%${options.search.trim()}%`;
      sql += ` AND (t.title LIKE ? OR t.artist LIKE ? OR t.album LIKE ? OR t.tags LIKE ?)`;
      params.push(q, q, q, q);
    }

    switch (options.sort) {
      case 'title_asc':
        sql += ` ORDER BY LOWER(t.title) ASC`;
        break;
      case 'title_desc':
        sql += ` ORDER BY LOWER(t.title) DESC`;
        break;
      case 'artist':
        sql += ` ORDER BY LOWER(t.artist) ASC, LOWER(t.title) ASC`;
        break;
      case 'album':
        sql += ` ORDER BY LOWER(t.album) ASC, LOWER(t.title) ASC`;
        break;
      case 'duration_desc':
        sql += ` ORDER BY t.duration DESC`;
        break;
      case 'duration_asc':
        sql += ` ORDER BY t.duration ASC`;
        break;
      case 'oldest':
        sql += ` ORDER BY t.created_at ASC`;
        break;
      case 'recent':
      default:
        sql += ` ORDER BY t.created_at DESC`;
        break;
    }

    const rows = db.prepare(sql).all(...params) as unknown as TrackRow[];
    return rows.map(formatTrack);
  },

  getTrackById(id: string) {
    const row = db.prepare(`
      SELECT t.*, CASE WHEN f.track_id IS NOT NULL THEN 1 ELSE 0 END AS is_favorite
      FROM tracks t
      LEFT JOIN favorites f ON t.id = f.track_id
      WHERE t.id = ?
    `).get(id) as unknown as TrackRow | undefined;

    return row ? formatTrack(row) : null;
  },

  createTrack(track: {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration?: number;
    format?: string;
    filePath: string;
    coverPath?: string;
    fileSize?: number;
    year?: number | null;
    genre?: string;
    tags?: string[];
  }) {
    const now = new Date().toISOString();
    const tagsJson = JSON.stringify(track.tags || []);
    db.prepare(`
      INSERT INTO tracks (id, title, artist, album, duration, format, file_path, cover_path, file_size, year, genre, tags, play_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      track.id,
      track.title,
      track.artist,
      track.album || '',
      track.duration || 0,
      track.format || 'mp3',
      track.filePath,
      track.coverPath || '',
      track.fileSize || 0,
      track.year || null,
      track.genre || '',
      tagsJson,
      now,
      now
    );

    return this.getTrackById(track.id)!;
  },

  updateTrack(id: string, updates: {
    title?: string;
    artist?: string;
    album?: string;
    genre?: string;
    year?: number | null;
    tags?: string[];
    coverPath?: string;
  }) {
    const current = this.getTrackById(id);
    if (!current) return null;

    const title = updates.title !== undefined ? updates.title : current.title;
    const artist = updates.artist !== undefined ? updates.artist : current.artist;
    const album = updates.album !== undefined ? updates.album : current.album;
    const genre = updates.genre !== undefined ? updates.genre : current.genre;
    const year = updates.year !== undefined ? updates.year : current.year;
    const coverPath = updates.coverPath !== undefined ? updates.coverPath : current.coverPath;
    const tags = updates.tags !== undefined ? JSON.stringify(updates.tags) : JSON.stringify(current.tags);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE tracks
      SET title = ?, artist = ?, album = ?, genre = ?, year = ?, cover_path = ?, tags = ?, updated_at = ?
      WHERE id = ?
    `).run(title, artist, album, genre, year, coverPath, tags, now, id);

    return this.getTrackById(id);
  },

  deleteTrack(id: string) {
    const track = this.getTrackById(id);
    if (!track) return null;

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`DELETE FROM favorites WHERE track_id = ?`).run(id);
      db.prepare(`DELETE FROM playback_history WHERE track_id = ?`).run(id);
      db.prepare(`DELETE FROM playlist_tracks WHERE track_id = ?`).run(id);
      db.prepare(`DELETE FROM tracks WHERE id = ?`).run(id);
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    return track;
  },

  toggleFavorite(trackId: string) {
    const exists = db.prepare(`SELECT 1 FROM favorites WHERE track_id = ?`).get(trackId);
    if (exists) {
      db.prepare(`DELETE FROM favorites WHERE track_id = ?`).run(trackId);
      return false;
    } else {
      db.prepare(`INSERT INTO favorites (track_id, created_at) VALUES (?, ?)`).run(trackId, new Date().toISOString());
      return true;
    }
  },

  getPlaylists() {
    const rows = db.prepare(`
      SELECT p.*, COUNT(pt.track_id) AS track_count, COALESCE(SUM(t.duration), 0) AS total_duration
      FROM playlists p
      LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
      LEFT JOIN tracks t ON pt.track_id = t.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all() as any[];

    return rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      coverPath: r.cover_path || '',
      trackCount: Number(r.track_count) || 0,
      totalDuration: Number(r.total_duration) || 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  },

  getPlaylistById(id: string) {
    const p = db.prepare(`
      SELECT p.*, COUNT(pt.track_id) AS track_count, COALESCE(SUM(t.duration), 0) AS total_duration
      FROM playlists p
      LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
      LEFT JOIN tracks t ON pt.track_id = t.id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(id) as any;

    if (!p) return null;

    const trackRows = db.prepare(`
      SELECT t.*, CASE WHEN f.track_id IS NOT NULL THEN 1 ELSE 0 END AS is_favorite
      FROM playlist_tracks pt
      JOIN tracks t ON pt.track_id = t.id
      LEFT JOIN favorites f ON t.id = f.track_id
      WHERE pt.playlist_id = ?
      ORDER BY pt.position ASC
    `).all(id) as unknown as TrackRow[];

    return {
      id: p.id,
      name: p.name,
      description: p.description || '',
      coverPath: p.cover_path || '',
      trackCount: Number(p.track_count) || 0,
      totalDuration: Number(p.total_duration) || 0,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      tracks: trackRows.map(formatTrack)
    };
  },

  createPlaylist(id: string, name: string, description: string = '') {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO playlists (id, name, description, cover_path, created_at, updated_at)
      VALUES (?, ?, ?, '', ?, ?)
    `).run(id, name, description, now, now);

    return this.getPlaylistById(id)!;
  },

  updatePlaylist(id: string, updates: { name?: string; description?: string; coverPath?: string }) {
    const current = this.getPlaylistById(id);
    if (!current) return null;

    const name = updates.name !== undefined ? updates.name : current.name;
    const description = updates.description !== undefined ? updates.description : current.description;
    const coverPath = updates.coverPath !== undefined ? updates.coverPath : current.coverPath;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE playlists
      SET name = ?, description = ?, cover_path = ?, updated_at = ?
      WHERE id = ?
    `).run(name, description, coverPath, now, id);

    return this.getPlaylistById(id);
  },

  deletePlaylist(id: string) {
    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`DELETE FROM playlist_tracks WHERE playlist_id = ?`).run(id);
      db.prepare(`DELETE FROM playlists WHERE id = ?`).run(id);
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
    return true;
  },

  addTrackToPlaylist(playlistId: string, trackId: string) {
    const maxPosRow = db.prepare(`SELECT MAX(position) as maxPos FROM playlist_tracks WHERE playlist_id = ?`).get(playlistId) as any;
    const nextPos = (maxPosRow && maxPosRow.maxPos !== null && maxPosRow.maxPos !== undefined) ? Number(maxPosRow.maxPos) + 1 : 0;

    db.prepare(`
      INSERT OR REPLACE INTO playlist_tracks (playlist_id, track_id, position)
      VALUES (?, ?, ?)
    `).run(playlistId, trackId, nextPos);

    return this.getPlaylistById(playlistId);
  },

  removeTrackFromPlaylist(playlistId: string, trackId: string) {
    db.prepare(`
      DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?
    `).run(playlistId, trackId);

    return this.getPlaylistById(playlistId);
  },

  reorderPlaylist(playlistId: string, trackIds: string[]) {
    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`DELETE FROM playlist_tracks WHERE playlist_id = ?`).run(playlistId);
      const insert = db.prepare(`INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)`);
      trackIds.forEach((tId, idx) => {
        insert.run(playlistId, tId, idx);
      });
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    return this.getPlaylistById(playlistId);
  },

  recordHistory(trackId: string) {
    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`INSERT INTO playback_history (track_id, played_at) VALUES (?, ?)`).run(trackId, new Date().toISOString());
      db.prepare(`UPDATE tracks SET play_count = play_count + 1 WHERE id = ?`).run(trackId);
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  getHistory(limit: number = 50) {
    const rows = db.prepare(`
      SELECT t.*, CASE WHEN f.track_id IS NOT NULL THEN 1 ELSE 0 END AS is_favorite, h.played_at
      FROM playback_history h
      JOIN tracks t ON h.track_id = t.id
      LEFT JOIN favorites f ON t.id = f.track_id
      ORDER BY h.id DESC
      LIMIT ?
    `).all(limit) as unknown as (TrackRow & { played_at: string })[];

    return rows.map(formatTrack);
  },

  getSettings() {
    const rows = db.prepare(`SELECT key, value FROM user_settings`).all() as unknown as { key: string; value: string }[];
    const map: Record<string, any> = {};
    for (const r of rows) {
      try {
        map[r.key] = JSON.parse(r.value);
      } catch {
        map[r.key] = r.value;
      }
    }
    return {
      volume: map.volume !== undefined ? map.volume : 0.8,
      repeatMode: map.repeatMode || 'off',
      isShuffled: Boolean(map.isShuffled),
      lastPlayedTrackId: map.lastPlayedTrackId || null,
      lastPosition: Number(map.lastPosition) || 0
    };
  },

  saveSettings(settings: Record<string, any>) {
    const stmt = db.prepare(`INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)`);
    db.exec('BEGIN TRANSACTION;');
    try {
      for (const [key, val] of Object.entries(settings)) {
        stmt.run(key, JSON.stringify(val));
      }
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }
};
