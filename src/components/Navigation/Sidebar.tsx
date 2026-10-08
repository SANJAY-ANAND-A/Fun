import React from 'react';
import {
  Music,
  Globe2,
  Folder,
  Heart,
  History,
  Upload,
  Plus,
  Radio
} from 'lucide-react';
import { Playlist } from '../../types/music';
import './Sidebar.css';

export type ActiveView = 'library' | 'dome' | 'playlists' | 'playlist-detail' | 'favorites' | 'history';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  onSelectPlaylist: (playlistId: string) => void;
  onOpenUpload: () => void;
  onCreatePlaylist: () => void;
  trackCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  playlists,
  selectedPlaylistId,
  onSelectPlaylist,
  onOpenUpload,
  onCreatePlaylist,
  trackCount
}) => {
  return (
    <nav className="sidebar-container" aria-label="Main Navigation">
      {/* Brand logo & title */}
      <div className="sidebar-brand">
        <div className="brand-icon-box">
          <Radio size={20} className="brand-icon" />
        </div>
        <div className="brand-text">
          <h1 className="brand-title">SoundHaven</h1>
          <span className="brand-sub">Audio Platform</span>
        </div>
      </div>

      {/* Main navigation links */}
      <div className="sidebar-section">
        <span className="sidebar-label">DISCOVER</span>
        <button
          type="button"
          className={`sidebar-nav-item ${activeView === 'library' ? 'active' : ''}`}
          onClick={() => setActiveView('library')}
        >
          <Music size={16} />
          <span>Library</span>
          <span className="nav-badge">{trackCount}</span>
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${activeView === 'dome' ? 'active' : ''}`}
          onClick={() => setActiveView('dome')}
        >
          <Globe2 size={16} />
          <span>3D Dome Gallery</span>
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${activeView === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveView('favorites')}
        >
          <Heart size={16} />
          <span>Favorites</span>
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${activeView === 'history' ? 'active' : ''}`}
          onClick={() => setActiveView('history')}
        >
          <History size={16} />
          <span>Recently Played</span>
        </button>
      </div>

      {/* Playlists section */}
      <div className="sidebar-section playlists-section">
        <div className="sidebar-section-header">
          <span className="sidebar-label">PLAYLISTS</span>
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onCreatePlaylist}
            title="Create playlist"
            aria-label="Create playlist"
          >
            <Plus size={14} />
          </button>
        </div>

        <button
          type="button"
          className={`sidebar-nav-item ${activeView === 'playlists' && !selectedPlaylistId ? 'active' : ''}`}
          onClick={() => setActiveView('playlists')}
        >
          <Folder size={16} />
          <span>All Playlists</span>
          <span className="nav-badge">{playlists.length}</span>
        </button>

        <div className="sidebar-playlist-list">
          {playlists.map(pl => (
            <button
              key={pl.id}
              type="button"
              className={`sidebar-playlist-item ${selectedPlaylistId === pl.id && activeView === 'playlist-detail' ? 'active' : ''}`}
              onClick={() => onSelectPlaylist(pl.id)}
            >
              <span className="pl-item-name" title={pl.name}>{pl.name}</span>
              <span className="pl-item-count">{pl.trackCount}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Upload action */}
      <div className="sidebar-footer">
        <button
          type="button"
          className="btn btn-primary btn-upload-full"
          onClick={onOpenUpload}
        >
          <Upload size={16} />
          <span>Upload Audio</span>
        </button>
      </div>
    </nav>
  );
};
