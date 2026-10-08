import React from 'react';
import { Playlist, Track } from '../../types/music';
import {
  Play,
  Shuffle,
  Pencil,
  Trash2,
  Clock,
  Music2,
  Folder,
  ChevronUp,
  ChevronDown,
  X,
  ListPlus
} from 'lucide-react';
import './PlaylistDetailView.css';

interface PlaylistDetailViewProps {
  playlist: Playlist & { tracks?: Track[] };
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onPlayAll: (tracks: Track[]) => void;
  onShufflePlay: (tracks: Track[]) => void;
  onEditPlaylist: (playlist: Playlist) => void;
  onDeletePlaylist: (id: string) => void;
  onRemoveTrack: (playlistId: string, trackId: string) => void;
  onReorderTracks: (playlistId: string, trackIds: string[]) => void;
  onAddToQueue: (track: Track) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
}

export const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({
  playlist,
  onPlayTrack,
  onPlayAll,
  onShufflePlay,
  onEditPlaylist,
  onDeletePlaylist,
  onRemoveTrack,
  onReorderTracks,
  onAddToQueue,
  currentTrackId,
  isPlaying
}) => {
  const tracks = playlist.tracks || [];

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatTotalTime = (totalSecs: number) => {
    if (!totalSecs) return '0 minutes';
    const mins = Math.round(totalSecs / 60);
    return `${mins} minutes`;
  };

  const handleMoveUp = (idx: number) => {
    if (idx <= 0) return;
    const reordered = [...tracks];
    const temp = reordered[idx - 1];
    reordered[idx - 1] = reordered[idx];
    reordered[idx] = temp;
    onReorderTracks(playlist.id, reordered.map(t => t.id));
  };

  const handleMoveDown = (idx: number) => {
    if (idx >= tracks.length - 1) return;
    const reordered = [...tracks];
    const temp = reordered[idx + 1];
    reordered[idx + 1] = reordered[idx];
    reordered[idx] = temp;
    onReorderTracks(playlist.id, reordered.map(t => t.id));
  };

  return (
    <div className="playlist-detail-container">
      {/* Header Banner */}
      <div className="playlist-detail-header">
        <div className="pd-cover-box">
          {playlist.coverPath ? (
            <img src={playlist.coverPath} alt={playlist.name} />
          ) : (
            <div className="pd-cover-placeholder">
              <Folder size={48} />
            </div>
          )}
        </div>

        <div className="pd-header-meta">
          <span className="pd-type-tag">PLAYLIST</span>
          <h1 className="pd-title">{playlist.name}</h1>
          {playlist.description && <p className="pd-desc">{playlist.description}</p>}

          <div className="pd-stats-row">
            <span>{tracks.length} tracks</span>
            <span>•</span>
            <span>{formatTotalTime(playlist.totalDuration)}</span>
          </div>

          <div className="pd-actions-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onPlayAll(tracks)}
              disabled={tracks.length === 0}
            >
              <Play size={16} />
              <span>Play All</span>
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onShufflePlay(tracks)}
              disabled={tracks.length === 0}
            >
              <Shuffle size={16} />
              <span>Shuffle</span>
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => onEditPlaylist(playlist)}
              title="Edit Playlist"
              aria-label="Edit playlist name and description"
            >
              <Pencil size={16} />
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-icon btn-del-danger"
              onClick={() => {
                if (window.confirm(`Delete playlist "${playlist.name}"? (Songs in your library will NOT be deleted)`)) {
                  onDeletePlaylist(playlist.id);
                }
              }}
              title="Delete Playlist"
              aria-label="Delete playlist"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Tracks Table */}
      {tracks.length === 0 ? (
        <div className="playlist-tracks-empty">
          <Music2 size={32} />
          <p>This playlist has no tracks yet.</p>
          <span>Browse your library and click "Add to Playlist" on any track.</span>
        </div>
      ) : (
        <div className="tracks-table-container">
          <table className="tracks-table">
            <thead>
              <tr>
                <th className="th-num">#</th>
                <th className="th-title">TITLE</th>
                <th className="th-artist">ARTIST</th>
                <th className="th-album">ALBUM</th>
                <th className="th-time">
                  <Clock size={14} />
                </th>
                <th className="th-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track, idx) => {
                const isCurrent = track.id === currentTrackId;

                return (
                  <tr
                    key={track.id}
                    className={`track-table-row ${isCurrent ? 'is-active-track' : ''}`}
                    onDoubleClick={() => onPlayTrack(track, tracks)}
                  >
                    <td className="td-num">
                      <span className="row-index">{idx + 1}</span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-row-play"
                        onClick={() => onPlayTrack(track, tracks)}
                        aria-label={`Play ${track.title}`}
                      >
                        <Play size={12} />
                      </button>
                    </td>

                    <td className="td-title">
                      <div className="track-title-cell">
                        <div className="table-thumb">
                          {track.coverPath ? (
                            <img src={track.coverPath} alt={track.title} />
                          ) : (
                            <div className="table-thumb-placeholder">
                              <Music2 size={14} />
                            </div>
                          )}
                        </div>
                        <span className="table-title-text" title={track.title}>{track.title}</span>
                      </div>
                    </td>

                    <td className="td-artist">
                      <span className="table-artist-text">{track.artist}</span>
                    </td>

                    <td className="td-album">
                      <span className="table-album-text">{track.album || '-'}</span>
                    </td>

                    <td className="td-time">
                      <span className="table-time-text">{formatDuration(track.duration)}</span>
                    </td>

                    <td className="td-actions">
                      <div className="table-actions-cell">
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon-sm"
                          disabled={idx === 0}
                          onClick={() => handleMoveUp(idx)}
                          title="Move Up"
                          aria-label="Move track up"
                        >
                          <ChevronUp size={14} />
                        </button>

                        <button
                          type="button"
                          className="btn btn-ghost btn-icon-sm"
                          disabled={idx === tracks.length - 1}
                          onClick={() => handleMoveDown(idx)}
                          title="Move Down"
                          aria-label="Move track down"
                        >
                          <ChevronDown size={14} />
                        </button>

                        <button
                          type="button"
                          className="btn btn-ghost btn-icon-sm"
                          onClick={() => onAddToQueue(track)}
                          title="Add to Queue"
                          aria-label="Add to queue"
                        >
                          <ListPlus size={14} />
                        </button>

                        <button
                          type="button"
                          className="btn btn-ghost btn-icon-sm"
                          onClick={() => onRemoveTrack(playlist.id, track.id)}
                          title="Remove from playlist (does not delete track)"
                          aria-label="Remove from playlist"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
