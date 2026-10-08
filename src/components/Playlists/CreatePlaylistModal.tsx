import React, { useState } from 'react';
import { X } from 'lucide-react';
import './CreatePlaylistModal.css';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
  initialName?: string;
  initialDescription?: string;
  isEditMode?: boolean;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  initialName = '',
  initialDescription = '',
  isEditMode = false
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreate(name.trim(), description.trim());
      onClose();
      setName('');
      setDescription('');
    } catch (err: any) {
      alert(err.message || 'Error saving playlist');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="create-pl-title">
      <div className="modal-content create-playlist-modal">
        <div className="modal-header">
          <h3 id="create-pl-title">{isEditMode ? 'Edit Playlist' : 'New Playlist'}</h3>
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Playlist Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Late Night Focus, Workout Mix"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea
                className="input"
                rows={3}
                placeholder="A collection of favorite tracks..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!name.trim() || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
