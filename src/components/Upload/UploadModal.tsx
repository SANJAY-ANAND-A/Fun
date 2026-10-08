import React, { useState, useRef } from 'react';
import { Upload, X, FileAudio, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Track } from '../../types/music';
import './UploadModal.css';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newTracks: Track[]) => void;
}

interface QueuedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setUploadError(null);
    const validExts = ['.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a', '.webm', '.opus'];
    const newQueue: QueuedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (validExts.includes(ext) || file.type.startsWith('audio/')) {
        newQueue.push({
          file,
          id: `${file.name}-${Date.now()}-${i}`,
          status: 'pending'
        });
      } else {
        setUploadError(`File "${file.name}" was skipped: unsupported audio format.`);
      }
    }

    setQueuedFiles(prev => [...prev, ...newQueue]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setQueuedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleStartUpload = async () => {
    if (queuedFiles.length === 0 || isUploading) return;
    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    queuedFiles.forEach(q => {
      formData.append('files', q.file);
    });

    try {
      setQueuedFiles(prev => prev.map(f => ({ ...f, status: 'uploading' })));

      const response = await fetch('/api/tracks/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setQueuedFiles(prev => prev.map(f => ({ ...f, status: 'success' })));
      onUploadSuccess(data.tracks);

      setTimeout(() => {
        setIsUploading(false);
        setQueuedFiles([]);
        onClose();
      }, 700);
    } catch (err: any) {
      setIsUploading(false);
      setUploadError(err.message || 'An error occurred during upload.');
      setQueuedFiles(prev => prev.map(f => ({ ...f, status: 'error', errorMessage: err.message })));
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="upload-modal-title">
      <div className="modal-content upload-modal">
        <div className="modal-header">
          <h3 id="upload-modal-title">Upload Music</h3>
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onClose}
            disabled={isUploading}
            aria-label="Close upload modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Dropzone */}
          <div
            className={`upload-dropzone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*,.mp3,.wav,.flac,.ogg,.aac,.m4a,.webm,.opus"
              style={{ display: 'none' }}
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="dropzone-icon">
              <Upload size={28} />
            </div>
            <div className="dropzone-text">
              <p className="dropzone-main">Choose audio files or drag and drop here</p>
              <p className="dropzone-sub">MP3, WAV, FLAC, AAC, OGG up to 100MB each</p>
            </div>
          </div>

          {uploadError && (
            <div className="upload-alert error">
              <AlertCircle size={16} />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Queued files list */}
          {queuedFiles.length > 0 && (
            <div className="upload-file-list">
              <div className="file-list-header">
                <span>Selected Tracks ({queuedFiles.length})</span>
                {!isUploading && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-text-sm"
                    onClick={() => setQueuedFiles([])}
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="file-items-scroll">
                {queuedFiles.map(q => (
                  <div key={q.id} className="upload-file-row">
                    <FileAudio size={18} className="file-icon" />
                    <div className="upload-file-info">
                      <span className="file-name" title={q.file.name}>{q.file.name}</span>
                      <span className="file-size">{formatFileSize(q.file.size)}</span>
                    </div>

                    <div className="upload-file-status">
                      {q.status === 'uploading' && <Loader2 size={16} className="spin" />}
                      {q.status === 'success' && <CheckCircle2 size={16} className="success-icon" />}
                      {q.status === 'error' && <AlertCircle size={16} className="error-icon" />}
                      {q.status === 'pending' && !isUploading && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon-sm"
                          onClick={() => removeFile(q.id)}
                          aria-label={`Remove ${q.file.name}`}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStartUpload}
            disabled={queuedFiles.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <span>Upload {queuedFiles.length > 0 ? `(${queuedFiles.length})` : ''}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
