import React from 'react';
import { X, Keyboard } from 'lucide-react';
import './KeyboardShortcutsModal.css';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause active track' },
    { key: '← / →', desc: 'Seek 5 seconds backward / forward' },
    { key: '↑ / ↓', desc: 'Increase / decrease volume by 5%' },
    { key: 'N', desc: 'Next track in queue' },
    { key: 'P', desc: 'Previous track in queue' },
    { key: 'M', desc: 'Mute / unmute audio' },
    { key: 'S', desc: 'Toggle shuffle (non-destructive)' },
    { key: 'R', desc: 'Cycle repeat mode (Off → All → One)' },
    { key: 'Esc', desc: 'Close dialog or minimized holographic view' }
  ];

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
      <div className="modal-content shortcuts-modal">
        <div className="modal-header">
          <div className="shortcuts-modal-title">
            <Keyboard size={18} />
            <h3 id="shortcuts-title">Keyboard Shortcuts</h3>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onClose}
            aria-label="Close shortcuts modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body shortcuts-body">
          <div className="shortcuts-grid">
            {shortcuts.map(s => (
              <div key={s.key} className="shortcut-row">
                <kbd className="shortcut-key">{s.key}</kbd>
                <span className="shortcut-desc">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
