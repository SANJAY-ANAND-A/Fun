import React, { useState } from 'react';
import { HoloCard, HoloPreset } from './HoloCard';
import { Track } from '../../types/music';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Minimize2, X, Sparkles, Repeat, Shuffle } from 'lucide-react';
import './NowPlayingVisual.css';

interface NowPlayingVisualProps {
  track: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: 'off' | 'one' | 'all';
  isShuffled: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (val: number) => void;
  onToggleMute: () => void;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
  onMinimize: () => void;
  onClose: () => void;
  isMinimized: boolean;
}

export const NowPlayingVisual: React.FC<NowPlayingVisualProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  repeatMode,
  isShuffled,
  onPlayPause,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleRepeat,
  onToggleShuffle,
  onMinimize,
  onClose,
  isMinimized
}) => {
  const [preset, setPreset] = useState<HoloPreset>('shards');
  const [intensity, setIntensity] = useState<number>(0.55);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(Number(e.target.value));
  };

  if (isMinimized) {
    return (
      <div className="now-playing-minimized" role="region" aria-label="Compact current track player">
        <div className="np-min-left">
          <div className="np-min-thumb">
            {track.coverPath ? (
              <img src={track.coverPath} alt={track.title} />
            ) : (
              <div className="np-min-placeholder" />
            )}
          </div>
          <div className="np-min-info">
            <span className="np-min-title">{track.title}</span>
            <span className="np-min-artist">{track.artist}</span>
          </div>
        </div>

        <div className="np-min-controls">
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onPrev}
            aria-label="Previous track"
          >
            <SkipBack size={16} />
          </button>
          <button
            type="button"
            className="btn btn-primary btn-icon-sm"
            onClick={onPlayPause}
            aria-label={isPlaying ? 'Pause track' : 'Play track'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onNext}
            aria-label="Next track"
          >
            <SkipForward size={16} />
          </button>
        </div>

        <div className="np-min-actions">
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onMinimize}
            aria-label="Expand artwork visual"
            title="Expand"
          >
            <Sparkles size={16} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onClose}
            aria-label="Dismiss compact visual"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="now-playing-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Expanded current track view"
    >
      <div className="now-playing-card">
        {/* Top Control Bar: minimize & close controls strictly OUTSIDE the interactive card surface */}
        <div className="np-topbar">
          <div className="np-topbar-left">
            <span className="np-badge">NOW PLAYING</span>
            <span className="np-preset-label">Foil:</span>
            {(['shards', 'bursts', 'stars'] as HoloPreset[]).map(p => (
              <button
                key={p}
                type="button"
                className={`btn btn-ghost btn-preset-pill ${preset === p ? 'active' : ''}`}
                onClick={() => setPreset(p)}
                aria-label={`Set holographic preset to ${p}`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="np-topbar-actions">
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={onMinimize}
              aria-label="Minimize artwork view"
              title="Minimize"
            >
              <Minimize2 size={18} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={onClose}
              aria-label="Close expanded view"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Centerpiece: React Bits HoloCard */}
        <div className="np-artwork-stage">
          <HoloCard
            image={track.coverPath}
            alt={`${track.title} cover artwork`}
            preset={preset}
            intensity={intensity}
            radius={10}
            className="np-holocard-instance"
          />
        </div>

        {/* Track Metadata outside the holographic visual */}
        <div className="np-metadata">
          <h2 className="np-title">{track.title}</h2>
          <p className="np-artist">{track.artist}</p>
          {track.album && <p className="np-album">{track.album}</p>}
        </div>

        {/* Seek Bar */}
        <div className="np-progress-section">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeekChange}
            className="np-progress-slider"
            aria-label="Seek position"
          />
          <div className="np-time-row">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls outside the interactive card */}
        <div className="np-controls-row">
          <button
            type="button"
            className={`btn btn-ghost btn-icon ${isShuffled ? 'active-toggle' : ''}`}
            onClick={onToggleShuffle}
            aria-label={isShuffled ? 'Shuffle on' : 'Shuffle off'}
            title="Shuffle"
          >
            <Shuffle size={18} />
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onPrev}
            aria-label="Previous track"
            title="Previous"
          >
            <SkipBack size={22} />
          </button>

          <button
            type="button"
            className="btn btn-primary btn-play-large"
            onClick={onPlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onNext}
            aria-label="Next track"
            title="Next"
          >
            <SkipForward size={22} />
          </button>

          <button
            type="button"
            className={`btn btn-ghost btn-icon ${repeatMode !== 'off' ? 'active-toggle' : ''}`}
            onClick={onToggleRepeat}
            aria-label={`Repeat mode: ${repeatMode}`}
            title={`Repeat: ${repeatMode}`}
          >
            <Repeat size={18} />
          </button>
        </div>

        {/* Volume & Intensity Footers */}
        <div className="np-footer-row">
          <div className="np-volume-group">
            <button
              type="button"
              className="btn btn-ghost btn-icon-sm"
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="np-volume-slider"
              aria-label="Volume slider"
            />
          </div>

          <div className="np-intensity-group">
            <span className="np-intensity-label">Foil Glow:</span>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="np-intensity-slider"
              aria-label="Holographic foil intensity"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
