import React, { useState } from 'react';
import { Playlist, Track } from '../../types/music';
import { X, Plus, Check } from 'lucide-react';
import './AddToPlaylistModal.css';

interface AddToPlaylistModalProps {
  track: Track | null;
  playlists: Playlist[];
  isOpen: boolean;
  onClose: () => void;
  onAddToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  onCreateAndAdd: (name: string, trackId: string) => Promise<void>;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  track,
  playlists,
  isOpen,
  onClose,
  onAddToPlaylist,
  onCreateAndAdd
}) => {
  if (!isOpen || !track) return null;

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const handleSelect = async (playlistId: string) => {
    setIsSubmitting(true);
    try {
      await onAddToPlaylist(playlistId, track.id);
      setSuccessId(playlistId);
      setTimeout(() => {
        onClose();
        setSuccessId(null);
      }, 500);
    } catch (err: any) {
      alert(err.message || 'Error adding track to playlist');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreateAndAdd(newPlaylistName.trim(), track.id);
      onClose();
      setNewPlaylistName('');
    } catch (err: any) {
      alert(err.message || 'Error creating playlist');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-playlist-title">
      <div className="modal-content add-playlist-modal">
        <div className="modal-header">
          <h3 id="add-playlist-title">Add to Playlist</h3>
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="target-track-preview">
            <span className="ttp-label">Adding track:</span>
            <span className="ttp-title">{track.title}</span>
            <span className="ttp-artist">by {track.artist}</span>
          </div>

          <form onSubmit={handleCreateAndAdd} className="new-playlist-quick-form">
            <input
              type="text"
              className="input"
              placeholder="New playlist name..."
              value={newPlaylistName}
              onChange={e => setNewPlaylistName(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary btn-quick-create"
              disabled={!newPlaylistName.trim() || isSubmitting}
            >
              <Plus size={14} />
              <span>Create</span>
            </button>
          </form>

          <div className="existing-playlists-list">
            <span className="form-label">Existing Playlists</span>
            {playlists.length === 0 ? (
              <p className="no-playlists-note">No playlists yet. Create one above.</p>
            ) : (
              <div className="playlist-picker-scroll">
                {playlists.map(pl => (
                  <button
                    key={pl.id}
                    type="button"
                    className="playlist-picker-item"
                    onClick={() => handleSelect(pl.id)}
                    disabled={isSubmitting}
                  >
                    <div className="ppi-info">
                      <span className="ppi-name">{pl.name}</span>
                      <span className="ppi-count">{pl.trackCount} tracks</span>
                    </div>
                    {successId === pl.id ? (
                      <Check size={16} className="success-icon" />
                    ) : (
                      <Plus size={16} className="add-icon" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
