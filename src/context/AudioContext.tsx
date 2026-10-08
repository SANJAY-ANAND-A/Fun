import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Track, RepeatMode } from '../types/music';

interface AudioContextType {
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
  queueIndex: number;
  isLoading: boolean;
  error: string | null;
  visualExpanded: boolean;
  visualMinimized: boolean;
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  addToQueue: (track: Track) => void;
  playNextInQueue: (track: Track) => void;
  reorderQueue: (newQueue: Track[]) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  openVisual: () => void;
  closeVisual: () => void;
  minimizeVisual: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem('soundhaven_volume');
    return saved !== null ? Number(saved) : 0.8;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRateState] = useState<number>(1.0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(() => {
    return (localStorage.getItem('soundhaven_repeat') as RepeatMode) || 'off';
  });
  const [isShuffled, setIsShuffled] = useState<boolean>(() => {
    return localStorage.getItem('soundhaven_shuffle') === 'true';
  });

  const [queue, setQueue] = useState<Track[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [visualExpanded, setVisualExpanded] = useState<boolean>(false);
  const [visualMinimized, setVisualMinimized] = useState<boolean>(false);

  // Initialize singleton audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onDurationChange = () => {
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onWaiting = () => {
      setIsLoading(true);
    };

    const onCanPlay = () => {
      setIsLoading(false);
    };

    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setError('Error loading audio stream. Please verify file availability.');
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Save volume
  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    localStorage.setItem('soundhaven_volume', String(clamped));
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.muted = next;
      }
      return next;
    });
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      const next = prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off';
      localStorage.setItem('soundhaven_repeat', next);
      return next;
    });
  }, []);

  // Play track logic
  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    setError(null);
    setCurrentTrack(track);

    let activeQueue = queue;
    if (newQueue) {
      activeQueue = newQueue;
      setQueue(newQueue);
      setOriginalQueue(newQueue);
    } else if (!activeQueue.some(t => t.id === track.id)) {
      activeQueue = [...activeQueue, track];
      setQueue(activeQueue);
      setOriginalQueue(activeQueue);
    }

    const idx = activeQueue.findIndex(t => t.id === track.id);
    setQueueIndex(idx >= 0 ? idx : 0);

    const streamUrl = `/api/tracks/${track.id}/stream`;
    audio.src = streamUrl;
    audio.playbackRate = playbackRate;
    audio.muted = isMuted;

    audio.play().then(() => {
      setIsPlaying(true);
      // Record playback history
      fetch(`/api/history/${track.id}`, { method: 'POST' }).catch(() => {});
    }).catch(err => {
      console.warn('Playback deferred or autoplay blocked:', err);
      setIsPlaying(false);
    });
  }, [queue, playbackRate, isMuted]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Playback play failed:', err);
      });
    }
  }, [isPlaying, currentTrack]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  // Next track logic
  const nextTrack = useCallback(() => {
    if (queue.length === 0 || queueIndex < 0) return;

    if (queueIndex < queue.length - 1) {
      const nextIdx = queueIndex + 1;
      playTrack(queue[nextIdx]);
    } else if (repeatMode === 'all') {
      playTrack(queue[0]);
    } else {
      setIsPlaying(false);
    }
  }, [queue, queueIndex, repeatMode, playTrack]);

  // Previous track logic
  const prevTrack = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      // If played more than 3 seconds, restart current track
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (queue.length === 0 || queueIndex < 0) return;
    if (queueIndex > 0) {
      playTrack(queue[queueIndex - 1]);
    } else {
      playTrack(queue[queue.length - 1]);
    }
  }, [queue, queueIndex, playTrack]);

  // Handle track ended event with repeat modes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        nextTrack();
      }
    };

    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('ended', onEnded);
    };
  }, [repeatMode, nextTrack]);

  // Shuffle toggle logic
  const toggleShuffle = useCallback(() => {
    setIsShuffled(prev => {
      const next = !prev;
      localStorage.setItem('soundhaven_shuffle', String(next));

      if (next) {
        // Shuffle queue while keeping current track at current index
        if (!currentTrack || queue.length <= 1) return next;
        const remaining = queue.filter(t => t.id !== currentTrack.id);
        const shuffledRemaining = [...remaining].sort(() => Math.random() - 0.5);
        const newQueue = [currentTrack, ...shuffledRemaining];
        setQueue(newQueue);
        setQueueIndex(0);
      } else {
        // Restore original queue order
        if (originalQueue.length > 0) {
          setQueue(originalQueue);
          if (currentTrack) {
            const idx = originalQueue.findIndex(t => t.id === currentTrack.id);
            setQueueIndex(idx >= 0 ? idx : 0);
          }
        }
      }
      return next;
    });
  }, [queue, currentTrack, originalQueue]);

  // Queue methods
  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => {
      if (prev.some(t => t.id === track.id)) return prev;
      const next = [...prev, track];
      setOriginalQueue(next);
      return next;
    });
  }, []);

  const playNextInQueue = useCallback((track: Track) => {
    setQueue(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      const insertAt = queueIndex >= 0 ? queueIndex + 1 : 0;
      filtered.splice(insertAt, 0, track);
      setOriginalQueue(filtered);
      return filtered;
    });
  }, [queueIndex]);

  const reorderQueue = useCallback((newQueue: Track[]) => {
    setQueue(newQueue);
    setOriginalQueue(newQueue);
    if (currentTrack) {
      const idx = newQueue.findIndex(t => t.id === currentTrack.id);
      setQueueIndex(idx >= 0 ? idx : 0);
    }
  }, [currentTrack]);

  const removeFromQueue = useCallback((trackId: string) => {
    setQueue(prev => {
      const next = prev.filter(t => t.id !== trackId);
      setOriginalQueue(next);
      if (currentTrack && currentTrack.id === trackId) {
        // If current track removed from queue, it continues playing until end
      }
      return next;
    });
  }, [currentTrack]);

  const clearQueue = useCallback(() => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setOriginalQueue([currentTrack]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setOriginalQueue([]);
      setQueueIndex(-1);
    }
  }, [currentTrack]);

  // Visual modal controls
  const openVisual = useCallback(() => {
    setVisualExpanded(true);
    setVisualMinimized(false);
  }, []);

  const closeVisual = useCallback(() => {
    setVisualExpanded(false);
    setVisualMinimized(false);
  }, []);

  const minimizeVisual = useCallback(() => {
    setVisualExpanded(true);
    setVisualMinimized(prev => !prev);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (audioRef.current) {
            seek(Math.max(0, audioRef.current.currentTime - 5));
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (audioRef.current) {
            seek(Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 5));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(volume + 0.05);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(volume - 0.05);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyN':
          e.preventDefault();
          nextTrack();
          break;
        case 'KeyP':
          e.preventDefault();
          prevTrack();
          break;
        case 'KeyS':
          e.preventDefault();
          toggleShuffle();
          break;
        case 'KeyR':
          e.preventDefault();
          toggleRepeat();
          break;
        case 'Escape':
          if (visualExpanded) {
            closeVisual();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, seek, setVolume, volume, toggleMute, nextTrack, prevTrack, toggleShuffle, toggleRepeat, visualExpanded, closeVisual]);

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        playbackRate,
        repeatMode,
        isShuffled,
        queue,
        queueIndex,
        isLoading,
        error,
        visualExpanded,
        visualMinimized,
        playTrack,
        togglePlayPause,
        nextTrack,
        prevTrack,
        seek,
        setVolume,
        toggleMute,
        setPlaybackRate,
        toggleRepeat,
        toggleShuffle,
        addToQueue,
        playNextInQueue,
        reorderQueue,
        removeFromQueue,
        clearQueue,
        openVisual,
        closeVisual,
        minimizeVisual
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within an AudioProvider');
  return ctx;
};
