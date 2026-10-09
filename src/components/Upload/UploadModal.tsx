import React, { useState, useRef } from 'react';
import { Upload, X, FileAudio, Folder, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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

const SUPPORTED_EXTS = [
  '.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a',
  '.webm', '.opus', '.wma', '.aiff', '.aif', '.alac',
  '.ape', '.mid', '.midi', '.mp4', '.mpeg', '.mpg',
  '.mpga', '.mka', '.oga', '.weba'
];

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    const newQueue: QueuedFile[] = [];
    let skippedCount = 0;

    const fileList = Array.from(files);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // Skip common non-audio system or image files without spamming error
      const lowerName = file.name.toLowerCase();
      if (
        lowerName === 'thumbs.db' ||
        lowerName === 'desktop.ini' ||
        lowerName === '.ds_store' ||
        lowerName.endsWith('.jpg') ||
        lowerName.endsWith('.jpeg') ||
        lowerName.endsWith('.png') ||
        lowerName.endsWith('.webp') ||
        lowerName.endsWith('.svg') ||
        lowerName.endsWith('.txt') ||
        lowerName.endsWith('.nfo') ||
        lowerName.endsWith('.lrc')
      ) {
        skippedCount++;
        continue;
      }

      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isAudio =
        SUPPORTED_EXTS.includes(ext) ||
        file.type.startsWith('audio/') ||
        file.type.includes('mpeg') ||
        file.type.includes('ogg') ||
        file.type.includes('flac') ||
        file.type.includes('wav') ||
        file.type.includes('mp4') ||
        file.type === 'application/octet-stream';

      if (isAudio) {
        newQueue.push({
          file,
          id: `${file.name}-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          status: 'pending'
        });
      } else {
        skippedCount++;
      }
    }

    if (newQueue.length > 0) {
      setQueuedFiles(prev => [...prev, ...newQueue]);
    }

    if (newQueue.length === 0 && skippedCount > 0) {
      setUploadError('No supported audio files found. Supported formats include MP3, MPEG, WAV, FLAC, M4A, AAC, OGG, WMA, ALAC, AIFF.');
    }
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    // Support dropping folders and files via webkitGetAsEntry
    const items = e.dataTransfer.items;
    if (items && items.length > 0 && typeof items[0].webkitGetAsEntry === 'function') {
      const files: File[] = [];
      const traverseEntry = async (entry: any): Promise<void> => {
        if (!entry) return;
        if (entry.isFile) {
          return new Promise<void>((resolve) => {
            entry.file((f: File) => {
              files.push(f);
              resolve();
            }, () => resolve());
          });
        } else if (entry.isDirectory) {
          const reader = entry.createReader();
          return new Promise<void>((resolve) => {
            const readEntries = () => {
              reader.readEntries(async (entries: any[]) => {
                if (entries.length === 0) {
                  resolve();
                } else {
                  for (const subEntry of entries) {
                    await traverseEntry(subEntry);
                  }
                  readEntries();
                }
              }, () => resolve());
            };
            readEntries();
          });
        }
      };

      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry();
        if (entry) {
          await traverseEntry(entry);
        }
      }

      if (files.length > 0) {
        handleFiles(files);
        return;
      }
    }

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

      let data: any;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        const cleanMessage = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        throw new Error(cleanMessage || `Server error (${response.status})`);
      }

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
          {/* Hidden inputs without restrictive accept to prevent Windows Explorer file hiding */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            {...({ webkitdirectory: '', directory: '' } as any)}
            style={{ display: 'none' }}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />

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
            <div className="dropzone-icon">
              <Upload size={28} />
            </div>
            <div className="dropzone-text">
              <p className="dropzone-main">Choose audio files or drag and drop here</p>
              <p className="dropzone-sub">MP3, MPEG, WAV, FLAC, M4A, AAC, OGG, WMA, ALAC up to 100MB each</p>
            </div>

            <div className="dropzone-buttons" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileAudio size={14} />
                <span>Browse Files</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => folderInputRef.current?.click()}
                title="Select an entire folder of music"
              >
                <Folder size={14} />
                <span>Select Folder</span>
              </button>
            </div>

            <p className="dropzone-tip">
              💡 Tip: All files are visible in the file dialog. You can also drag files directly from Windows Explorer into this window!
            </p>
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
