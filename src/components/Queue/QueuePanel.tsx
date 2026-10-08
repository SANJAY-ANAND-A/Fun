import React from 'react';
import { useAudio } from '../../context/AudioContext';
import { Shredder } from '../Shredder/Shredder';
import { Track } from '../../types/music';
import { X, Trash2, Music2, Play, Volume2 } from 'lucide-react';
import './QueuePanel.css';

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueuePanel: React.FC<QueuePanelProps> = ({ isOpen, onClose }) => {
  const {
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    playTrack,
    reorderQueue,
    removeFromQueue,
    clearQueue
  } = useAudio();

  if (!isOpen) return null;

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Separate current track from upcoming tracks for the Shredder list
  const upcomingTracks = queue.filter((t, idx) => idx !== queueIndex);

  const handleShred = (track: Track) => {
    // Removes from queue only, safely preserving library file
    removeFromQueue(track.id);
  };

  const handleReorder = (newUpcoming: Track[]) => {
    if (!currentTrack) {
      reorderQueue(newUpcoming);
      return;
    }
    // Reconstruct full queue with current track in place
    const updatedQueue = [...queue];
    // Replace all items except current track with new order
    const beforeCurrent = queue.slice(0, queueIndex);
    const afterCurrent = queue.slice(queueIndex + 1);

    // If reordering the whole queue directly:
    reorderQueue([currentTrack, ...newUpcoming]);
  };

  return (
    <aside
      className="queue-panel-drawer"
      role="region"
      aria-label="Playback queue panel"
    >
      <div className="queue-header">
        <div className="queue-title-group">
          <h3>Queue</h3>
          <span className="queue-count-badge">{queue.length} tracks</span>
        </div>
        <div className="queue-header-actions">
          {queue.length > 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-clear-queue"
              onClick={clearQueue}
              title="Clear queue"
              aria-label="Clear upcoming queue"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onClose}
            aria-label="Close queue panel"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="queue-content">
        {/* Currently Playing Card */}
        {currentTrack && (
          <div className="queue-section">
            <span className="queue-section-label">NOW PLAYING</span>
            <div className="queue-now-playing-row">
              <div className="q-thumb">
                {currentTrack.coverPath ? (
                  <img src={currentTrack.coverPath} alt={currentTrack.title} />
                ) : (
                  <div className="q-thumb-placeholder">
                    <Music2 size={16} />
                  </div>
                )}
              </div>
              <div className="q-info">
                <span className="q-title">{currentTrack.title}</span>
                <span className="q-artist">{currentTrack.artist}</span>
              </div>
              <div className="q-status">
                {isPlaying ? (
                  <span className="q-playing-badge">
                    <Volume2 size={12} />
                    <span>PLAYING</span>
                  </span>
                ) : (
                  <span className="q-paused-badge">PAUSED</span>
                )}
                <span className="q-duration">{formatDuration(currentTrack.duration)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Section with React Bits Shredder */}
        <div className="queue-section">
          <span className="queue-section-label">UPCOMING</span>

          {upcomingTracks.length === 0 ? (
            <div className="queue-empty">
              <p>No upcoming tracks in queue.</p>
              <span className="queue-empty-sub">Add songs from the library or playlists to keep listening.</span>
            </div>
          ) : (
            <Shredder
              items={upcomingTracks}
              onReorder={handleReorder}
              onShred={handleShred}
              stripCount={8}
              bite={12}
              fallHeight={55}
              renderItem={(track: Track, _index: number, isShredding: boolean) => (
                <div className="queue-item-row" onClick={() => !isShredding && playTrack(track)}>
                  <div className="q-thumb">
                    {track.coverPath ? (
                      <img src={track.coverPath} alt={track.title} />
                    ) : (
                      <div className="q-thumb-placeholder">
                        <Music2 size={14} />
                      </div>
                    )}
                  </div>
                  <div className="q-info">
                    <span className="q-title" title={track.title}>{track.title}</span>
                    <span className="q-artist" title={track.artist}>{track.artist}</span>
                  </div>
                  <span className="q-duration">{formatDuration(track.duration)}</span>
                </div>
              )}
            />
          )}
        </div>
      </div>
    </aside>
  );
};
