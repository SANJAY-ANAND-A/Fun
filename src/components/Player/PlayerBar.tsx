import React, { useState } from 'react';
import { useAudio } from '../../context/AudioContext';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Sparkles,
  ListMusic,
  Heart,
  Keyboard,
  Gauge
} from 'lucide-react';
import './PlayerBar.css';

interface PlayerBarProps {
  onToggleQueue: () => void;
  isQueueOpen: boolean;
  onToggleShortcuts: () => void;
  onToggleFavorite: (trackId: string) => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  onToggleQueue,
  isQueueOpen,
  onToggleShortcuts,
  onToggleFavorite
}) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    repeatMode,
    isShuffled,
    isLoading,
    error,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleRepeat,
    toggleShuffle,
    openVisual
  } = useAudio();

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  };

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <footer className="player-bar-container" role="region" aria-label="Persistent Audio Player">
      {/* Left: Track summary & HoloCard trigger */}
      <div className="player-left">
        {currentTrack ? (
          <>
            <div
              className="player-thumb-wrapper"
              onClick={openVisual}
              role="button"
              tabIndex={0}
              aria-label="Open expanded holographic artwork visual"
              title="Open Holographic Visual"
            >
              {currentTrack.coverPath ? (
                <img src={currentTrack.coverPath} alt={currentTrack.title} className="player-thumb-img" />
              ) : (
                <div className="player-thumb-placeholder" />
              )}
              <div className="player-thumb-hover">
                <Sparkles size={16} />
              </div>
            </div>

            <div className="player-info">
              <span className="player-title" title={currentTrack.title}>
                {currentTrack.title}
              </span>
              <span className="player-artist" title={currentTrack.artist}>
                {currentTrack.artist}
              </span>
            </div>

            <button
              type="button"
              className={`btn btn-ghost btn-icon-sm ${currentTrack.isFavorite ? 'favorited' : ''}`}
              onClick={() => onToggleFavorite(currentTrack.id)}
              aria-label={currentTrack.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              title="Favorite"
            >
              <Heart size={16} fill={currentTrack.isFavorite ? '#ef4444' : 'none'} color={currentTrack.isFavorite ? '#ef4444' : 'currentColor'} />
            </button>
          </>
        ) : (
          <div className="player-idle">
            <span className="player-idle-text">Select a track to start playback</span>
          </div>
        )}
      </div>

      {/* Center: Controls and Seek scrubber */}
      <div className="player-center">
        <div className="player-controls-row">
          <button
            type="button"
            className={`btn btn-ghost btn-icon-sm ${isShuffled ? 'active-opt' : ''}`}
            onClick={toggleShuffle}
            disabled={!currentTrack}
            aria-label={isShuffled ? 'Shuffle enabled' : 'Shuffle disabled'}
            title="Shuffle (S)"
          >
            <Shuffle size={16} />
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={prevTrack}
            disabled={!currentTrack}
            aria-label="Previous track"
            title="Previous (P)"
          >
            <SkipBack size={18} />
          </button>

          <button
            type="button"
            className="btn btn-primary btn-icon btn-play"
            onClick={togglePlayPause}
            disabled={!currentTrack}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title="Play/Pause (Space)"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={nextTrack}
            disabled={!currentTrack}
            aria-label="Next track"
            title="Next (N)"
          >
            <SkipForward size={18} />
          </button>

          <button
            type="button"
            className={`btn btn-ghost btn-icon-sm ${repeatMode !== 'off' ? 'active-opt' : ''}`}
            onClick={toggleRepeat}
            disabled={!currentTrack}
            aria-label={`Repeat mode: ${repeatMode}`}
            title={`Repeat: ${repeatMode} (R)`}
          >
            <Repeat size={16} />
            {repeatMode === 'one' && <span className="repeat-one-indicator">1</span>}
          </button>
        </div>

        <div className="player-scrubber-row">
          <span className="time-display">{formatTime(currentTime)}</span>
          <div className="scrubber-bar-wrapper">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              disabled={!currentTrack}
              className="player-scrubber-input"
              aria-label="Track progress slider"
            />
          </div>
          <span className="time-display">{formatTime(duration)}</span>
        </div>

        {error && <div className="player-error-text">{error}</div>}
        {isLoading && <div className="player-loading-text">Buffering audio...</div>}
      </div>

      {/* Right: Volume, Speed, Queue & Shortcuts */}
      <div className="player-right">
        {/* Playback speed toggle */}
        <div className="speed-menu-container">
          <button
            type="button"
            className="btn btn-ghost btn-speed"
            onClick={() => setShowSpeedMenu(prev => !prev)}
            aria-label="Playback speed"
            title="Speed"
          >
            <Gauge size={15} />
            <span>{playbackRate}x</span>
          </button>
          {showSpeedMenu && (
            <div className="speed-dropdown" role="menu">
              {speedOptions.map(rate => (
                <button
                  key={rate}
                  type="button"
                  className={`speed-option ${playbackRate === rate ? 'active' : ''}`}
                  onClick={() => {
                    setPlaybackRate(rate);
                    setShowSpeedMenu(false);
                  }}
                  role="menuitem"
                >
                  {rate}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Volume controls */}
        <div className="volume-control-group">
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            title="Mute (M)"
          >
            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="volume-slider-input"
            aria-label="Volume slider"
          />
        </div>

        {/* Queue panel toggle */}
        <button
          type="button"
          className={`btn btn-ghost btn-icon-sm ${isQueueOpen ? 'active-opt' : ''}`}
          onClick={onToggleQueue}
          aria-label={isQueueOpen ? 'Hide queue' : 'Show queue'}
          title="Playback Queue"
        >
          <ListMusic size={18} />
        </button>

        {/* Keyboard Shortcuts Dialog toggle */}
        <button
          type="button"
          className="btn btn-ghost btn-icon-sm"
          onClick={onToggleShortcuts}
          aria-label="Keyboard shortcuts"
          title="Shortcuts (?)"
        >
          <Keyboard size={18} />
        </button>
      </div>
    </footer>
  );
};
