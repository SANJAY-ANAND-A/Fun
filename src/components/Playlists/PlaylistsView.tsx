import React from 'react';
import { Playlist, Track } from '../../types/music';
import { Folder, Play, Plus, Trash2, Clock, Music } from 'lucide-react';
import './PlaylistsView.css';

interface PlaylistsViewProps {
  playlists: Playlist[];
  onSelectPlaylist: (id: string) => void;
  onCreatePlaylist: () => void;
  onDeletePlaylist: (id: string) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  onSelectPlaylist,
  onCreatePlaylist,
  onDeletePlaylist,
  onPlayPlaylist
}) => {
  const formatTotalTime = (totalSecs: number) => {
    if (!totalSecs) return '0 min';
    const mins = Math.round(totalSecs / 60);
    return `${mins} min`;
  };

  return (
    <div className="playlists-view-container">
      <div className="playlists-view-header">
        <div>
          <h2 className="view-title">Playlists</h2>
          <p className="view-subtitle">Organize and curate your audio collections</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onCreatePlaylist}
        >
          <Plus size={16} />
          <span>New Playlist</span>
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="playlists-empty-state">
          <Folder size={40} className="empty-icon" />
          <h3>No playlists yet</h3>
          <p>Create your first custom playlist to group your tracks.</p>
          <button type="button" className="btn btn-primary" onClick={onCreatePlaylist}>
            Create Playlist
          </button>
        </div>
      ) : (
        <div className="playlists-grid">
          {playlists.map(pl => (
            <div
              key={pl.id}
              className="playlist-card"
              onClick={() => onSelectPlaylist(pl.id)}
            >
              <div className="playlist-card-cover">
                {pl.coverPath ? (
                  <img src={pl.coverPath} alt={pl.name} />
                ) : (
                  <div className="playlist-cover-placeholder">
                    <Folder size={32} />
                  </div>
                )}
                {pl.trackCount > 0 && (
                  <button
                    type="button"
                    className="playlist-play-overlay"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayPlaylist(pl);
                    }}
                    title="Play Playlist"
                    aria-label={`Play ${pl.name}`}
                  >
                    <Play size={18} />
                  </button>
                )}
              </div>

              <div className="playlist-card-body">
                <span className="playlist-card-name" title={pl.name}>{pl.name}</span>
                {pl.description && (
                  <p className="playlist-card-desc" title={pl.description}>{pl.description}</p>
                )}
                <div className="playlist-card-meta">
                  <span>{pl.trackCount} {pl.trackCount === 1 ? 'track' : 'tracks'}</span>
                  <span>•</span>
                  <span>{formatTotalTime(pl.totalDuration)}</span>
                </div>
              </div>

              <div className="playlist-card-footer" onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon-sm btn-delete-pl"
                  onClick={() => {
                    if (window.confirm(`Delete playlist "${pl.name}"? (Songs in your library will NOT be deleted)`)) {
                      onDeletePlaylist(pl.id);
                    }
                  }}
                  title="Delete Playlist"
                  aria-label={`Delete ${pl.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
