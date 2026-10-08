export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  format: string; // e.g. "mp3", "wav", "flac"
  filePath: string;
  coverPath: string;
  fileSize: number; // in bytes
  year?: number | null;
  genre: string;
  tags: string[];
  playCount: number;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverPath: string;
  trackCount: number;
  totalDuration: number;
  createdAt: string;
  updatedAt: string;
  tracks?: Track[];
}

export type RepeatMode = 'off' | 'one' | 'all';

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  queue: Track[];
  originalQueue: Track[]; // to restore when un-shuffling
  queueIndex: number;
  isLoading: boolean;
  error: string | null;
}

export interface UserSettings {
  volume: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  lastPlayedTrackId: string | null;
  lastPosition: number;
}
