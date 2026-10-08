import React, { useState, useRef } from 'react';
import { Track } from '../../types/music';
import { X, ImagePlus, Trash2, Check, Music2 } from 'lucide-react';
import './EditTrackModal.css';

interface EditTrackModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onTrackUpdated: (updated: Track) => void;
  onTrackDeleted: (deletedId: string) => void;
}

export const EditTrackModal: React.FC<EditTrackModalProps> = ({
  track,
  isOpen,
  onClose,
  onTrackUpdated,
  onTrackDeleted
}) => {
  if (!isOpen || !track) return null;

  const [title, setTitle] = useState(track.title);
  const [artist, setArtist] = useState(track.artist);
  const [album, setAlbum] = useState(track.album || '');
  const [genre, setGenre] = useState(track.genre || '');
  const [year, setYear] = useState<string>(track.year ? String(track.year) : '');
  const [tagsInput, setTagsInput] = useState<string>(track.tags ? track.tags.join(', ') : '');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(track.coverPath || null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. If new cover image selected, upload it first
      let newCoverPath = track.coverPath;
      if (coverFile) {
        const coverData = new FormData();
        coverData.append('cover', coverFile);
        const coverRes = await fetch(`/api/tracks/${track.id}/cover`, {
          method: 'POST',
          body: coverData
        });
        const coverJson = await coverRes.json();
        if (coverJson.success && coverJson.track) {
          newCoverPath = coverJson.track.coverPath;
        }
      }

      // 2. Update track metadata
      const parsedTags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch(`/api/tracks/${track.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          artist: artist.trim(),
          album: album.trim(),
          genre: genre.trim(),
          year: year ? parseInt(year, 10) : null,
          tags: parsedTags,
          coverPath: newCoverPath
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update track');
      }

      onTrackUpdated(data.track);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error updating metadata');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/tracks/${track.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete track');
      }
      onTrackDeleted(track.id);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error deleting track');
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-track-title">
      <div className="modal-content edit-track-modal">
        <div className="modal-header">
          <h3 id="edit-track-title">Edit Track Details</h3>
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onClose}
            aria-label="Close edit modal"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body edit-track-body">
            {/* Cover image editor */}
            <div className="cover-edit-section">
              <div
                className="cover-edit-box"
                onClick={() => coverInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Change track cover artwork"
                title="Change Cover Artwork"
              >
                {coverPreview ? (
                  <img src={coverPreview} alt="Track artwork" className="cover-preview-img" />
                ) : (
                  <div className="cover-preview-empty">
                    <Music2 size={32} />
                  </div>
                )}
                <div className="cover-edit-overlay">
                  <ImagePlus size={20} />
                  <span>Replace Cover</span>
                </div>
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleCoverSelect}
              />
              <div className="cover-edit-info">
                <span className="file-format-badge">{track.format.toUpperCase()}</span>
                <span className="file-size-badge">{(track.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
            </div>

            {/* Inputs */}
            <div className="form-group">
              <label className="form-label">Track Title</label>
              <input
                type="text"
                className="input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Artist</label>
                <input
                  type="text"
                  className="input"
                  value={artist}
                  onChange={e => setArtist(e.target.value)}
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label className="form-label">Album</label>
                <input
                  type="text"
                  className="input"
                  value={album}
                  onChange={e => setAlbum(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Genre</label>
                <input
                  type="text"
                  className="input"
                  value={genre}
                  onChange={e => setGenre(e.target.value)}
                  placeholder="e.g. Ambient, Jazz, Electronic"
                />
              </div>

              <div className="form-group w-32">
                <label className="form-label">Year</label>
                <input
                  type="number"
                  className="input"
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  placeholder="2026"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Custom Tags (comma separated)</label>
              <input
                type="text"
                className="input"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="chill, focus, instrumental"
              />
            </div>
          </div>

          <div className="modal-footer edit-track-footer">
            {!confirmDelete ? (
              <button
                type="button"
                className="btn btn-danger btn-delete-start"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={14} />
                <span>Delete Track</span>
              </button>
            ) : (
              <div className="delete-confirm-box">
                <span className="delete-confirm-text">Permanently delete?</span>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="modal-footer-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
