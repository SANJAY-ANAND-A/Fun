import React, { useState, useEffect, useCallback } from 'react';
import { Track, Playlist } from './types/music';
import { useAudio } from './context/AudioContext';
import { Sidebar, ActiveView } from './components/Navigation/Sidebar';
import { PlayerBar } from './components/Player/PlayerBar';
import { NowPlayingVisual } from './components/HoloCard/NowPlayingVisual';
import { QueuePanel } from './components/Queue/QueuePanel';
import { DomeGallery } from './components/DomeGallery/DomeGallery';
import { LibraryView } from './components/Library/LibraryView';
import { PlaylistsView } from './components/Playlists/PlaylistsView';
import { PlaylistDetailView } from './components/Playlists/PlaylistDetailView';
import { UploadModal } from './components/Upload/UploadModal';
import { EditTrackModal } from './components/Library/EditTrackModal';
import { AddToPlaylistModal } from './components/Playlists/AddToPlaylistModal';
import { CreatePlaylistModal } from './components/Playlists/CreatePlaylistModal';
import { KeyboardShortcutsModal } from './components/Navigation/KeyboardShortcutsModal';

export const App: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>('library');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedPlaylistData, setSelectedPlaylistData] = useState<(Playlist & { tracks?: Track[] }) | null>(null);

  // Modals state
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<Track | null>(null);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    visualExpanded,
    visualMinimized,
    playTrack,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    addToQueue,
    playNextInQueue,
    closeVisual,
    minimizeVisual
  } = useAudio();

  // Load tracks
  const loadTracks = useCallback(async () => {
    try {
      const res = await fetch('/api/tracks');
      const data = await res.json();
      if (data.success && data.tracks) {
        setTracks(data.tracks);
      }
    } catch (err) {
      console.error('Failed to load tracks:', err);
    }
  }, []);

  // Load playlists
  const loadPlaylists = useCallback(async () => {
    try {
      const res = await fetch('/api/playlists');
      const data = await res.json();
      if (data.success && data.playlists) {
        setPlaylists(data.playlists);
      }
    } catch (err) {
      console.error('Failed to load playlists:', err);
    }
  }, []);

  // Load single playlist detail
  const loadPlaylistDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/playlists/${id}`);
      const data = await res.json();
      if (data.success && data.playlist) {
        setSelectedPlaylistData(data.playlist);
      }
    } catch (err) {
      console.error('Failed to load playlist detail:', err);
    }
  }, []);

  useEffect(() => {
    loadTracks();
    loadPlaylists();
  }, [loadTracks, loadPlaylists]);

  // Handle switching to playlist detail
  const handleSelectPlaylist = (id: string) => {
    setSelectedPlaylistId(id);
    setActiveView('playlist-detail');
    loadPlaylistDetail(id);
  };

  // Toggle favorite
  const handleToggleFavorite = async (trackId: string) => {
    try {
      const res = await fetch(`/api/favorites/${trackId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTracks(prev =>
          prev.map(t => (t.id === trackId ? { ...t, isFavorite: data.isFavorite } : t))
        );
        if (selectedPlaylistData) {
          setSelectedPlaylistData(prev =>
            prev
              ? {
                  ...prev,
                  tracks: prev.tracks?.map(t =>
                    t.id === trackId ? { ...t, isFavorite: data.isFavorite } : t
                  )
                }
              : null
          );
        }
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // Upload callback
  const handleUploadSuccess = (newTracks: Track[]) => {
    loadTracks();
    loadPlaylists();
  };

  // Track metadata updated
  const handleTrackUpdated = (updated: Track) => {
    setTracks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    if (selectedPlaylistId) loadPlaylistDetail(selectedPlaylistId);
  };

  // Track deleted
  const handleTrackDeleted = (deletedId: string) => {
    setTracks(prev => prev.filter(t => t.id !== deletedId));
    if (selectedPlaylistId) loadPlaylistDetail(selectedPlaylistId);
  };

  // Add to playlist
  const handleAddToPlaylist = async (playlistId: string, trackId: string) => {
    const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to add track');
    loadPlaylists();
    if (selectedPlaylistId === playlistId) loadPlaylistDetail(playlistId);
  };

  // Create playlist and add track
  const handleCreateAndAdd = async (name: string, trackId: string) => {
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create playlist');
    await handleAddToPlaylist(data.playlist.id, trackId);
  };

  // Create or rename playlist
  const handleSavePlaylist = async (name: string, description: string) => {
    if (editingPlaylist) {
      const res = await fetch(`/api/playlists/${editingPlaylist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      loadPlaylists();
      if (selectedPlaylistId === editingPlaylist.id) loadPlaylistDetail(editingPlaylist.id);
      setEditingPlaylist(null);
    } else {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      loadPlaylists();
    }
  };

  // Delete playlist
  const handleDeletePlaylist = async (id: string) => {
    try {
      const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadPlaylists();
        if (selectedPlaylistId === id) {
          setSelectedPlaylistId(null);
          setActiveView('playlists');
        }
      }
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    }
  };

  // Remove track from playlist
  const handleRemoveTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/tracks/${trackId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        loadPlaylistDetail(playlistId);
        loadPlaylists();
      }
    } catch (err) {
      console.error('Failed to remove track from playlist:', err);
    }
  };

  // Reorder playlist tracks
  const handleReorderPlaylistTracks = async (playlistId: string, trackIds: string[]) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackIds })
      });
      const data = await res.json();
      if (data.success) {
        loadPlaylistDetail(playlistId);
      }
    } catch (err) {
      console.error('Failed to reorder playlist:', err);
    }
  };

  // Play entire playlist
  const handlePlayPlaylist = (pl: Playlist) => {
    fetch(`/api/playlists/${pl.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.playlist?.tracks?.length > 0) {
          playTrack(data.playlist.tracks[0], data.playlist.tracks);
        }
      });
  };

  // Shuffle play playlist
  const handleShufflePlaylist = (playlistTracks: Track[]) => {
    if (playlistTracks.length === 0) return;
    const shuffled = [...playlistTracks].sort(() => Math.random() - 0.5);
    playTrack(shuffled[0], shuffled);
  };

  return (
    <div className="app-container">
      {/* Adapted Aura Gradient Background (Restrained charcoal/slate tones, no purple) */}
      <div className="aura-background" aria-hidden="true">
        <div className="aura-layer aura-layer-1" />
        <div className="aura-layer aura-layer-2" />
        <div className="aura-layer aura-layer-3" />
      </div>

      {/* Main Sidebar */}
      <aside className="app-sidebar">
        <Sidebar
          activeView={activeView}
          setActiveView={view => {
            setActiveView(view);
            if (view !== 'playlist-detail') setSelectedPlaylistId(null);
          }}
          playlists={playlists}
          selectedPlaylistId={selectedPlaylistId}
          onSelectPlaylist={handleSelectPlaylist}
          onOpenUpload={() => setIsUploadOpen(true)}
          onCreatePlaylist={() => {
            setEditingPlaylist(null);
            setIsCreatePlaylistOpen(true);
          }}
          trackCount={tracks.length}
        />
      </aside>

      {/* Main Content Area */}
      <main className="app-main">
        <div className="app-content">
          {activeView === 'library' && (
            <LibraryView
              tracks={tracks}
              onPlayTrack={(track, queue) => playTrack(track, queue)}
              onAddToQueue={addToQueue}
              onPlayNext={playNextInQueue}
              onToggleFavorite={handleToggleFavorite}
              onOpenEdit={track => setEditingTrack(track)}
              onOpenAddToPlaylist={track => setAddToPlaylistTrack(track)}
              currentTrackId={currentTrack?.id}
              isPlaying={isPlaying}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {activeView === 'dome' && (
            <div className="dome-view-wrapper">
              <div className="dome-header-title">
                <h2>3D Spherical Cover Gallery</h2>
                <p>Browse your audio collection spatially by cover artwork</p>
              </div>
              <DomeGallery
                tracks={tracks}
                onPlayTrack={track => playTrack(track, tracks)}
                onAddToQueue={addToQueue}
                onOpenDetails={track => setEditingTrack(track)}
                currentTrackId={currentTrack?.id}
              />
            </div>
          )}

          {activeView === 'playlists' && (
            <PlaylistsView
              playlists={playlists}
              onSelectPlaylist={handleSelectPlaylist}
              onCreatePlaylist={() => {
                setEditingPlaylist(null);
                setIsCreatePlaylistOpen(true);
              }}
              onDeletePlaylist={handleDeletePlaylist}
              onPlayPlaylist={handlePlayPlaylist}
            />
          )}

          {activeView === 'playlist-detail' && selectedPlaylistData && (
            <PlaylistDetailView
              playlist={selectedPlaylistData}
              onPlayTrack={(track, q) => playTrack(track, q)}
              onPlayAll={t => t.length > 0 && playTrack(t[0], t)}
              onShufflePlay={handleShufflePlaylist}
              onEditPlaylist={pl => {
                setEditingPlaylist(pl);
                setIsCreatePlaylistOpen(true);
              }}
              onDeletePlaylist={handleDeletePlaylist}
              onRemoveTrack={handleRemoveTrackFromPlaylist}
              onReorderTracks={handleReorderPlaylistTracks}
              onAddToQueue={addToQueue}
              currentTrackId={currentTrack?.id}
              isPlaying={isPlaying}
            />
          )}

          {activeView === 'favorites' && (
            <div className="favorites-view-wrapper">
              <div className="view-page-header">
                <h2>Favorites</h2>
                <p>Songs you have marked with a heart</p>
              </div>
              <LibraryView
                tracks={tracks.filter(t => t.isFavorite)}
                onPlayTrack={(track, queue) => playTrack(track, queue)}
                onAddToQueue={addToQueue}
                onPlayNext={playNextInQueue}
                onToggleFavorite={handleToggleFavorite}
                onOpenEdit={track => setEditingTrack(track)}
                onOpenAddToPlaylist={track => setAddToPlaylistTrack(track)}
                currentTrackId={currentTrack?.id}
                isPlaying={isPlaying}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            </div>
          )}

          {activeView === 'history' && (
            <div className="history-view-wrapper">
              <div className="view-page-header">
                <h2>Recently Played</h2>
                <p>Your listening timeline</p>
              </div>
              <LibraryView
                tracks={tracks.filter(t => t.playCount > 0)}
                onPlayTrack={(track, queue) => playTrack(track, queue)}
                onAddToQueue={addToQueue}
                onPlayNext={playNextInQueue}
                onToggleFavorite={handleToggleFavorite}
                onOpenEdit={track => setEditingTrack(track)}
                onOpenAddToPlaylist={track => setAddToPlaylistTrack(track)}
                currentTrackId={currentTrack?.id}
                isPlaying={isPlaying}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            </div>
          )}
        </div>
      </main>

      {/* Persistent Bottom Audio Player Bar */}
      <PlayerBar
        onToggleQueue={() => setIsQueueOpen(prev => !prev)}
        isQueueOpen={isQueueOpen}
        onToggleShortcuts={() => setIsShortcutsOpen(true)}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* React Bits HoloCard Now Playing Visualizer */}
      {currentTrack && visualExpanded && (
        <NowPlayingVisual
          track={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          repeatMode={repeatMode}
          isShuffled={isShuffled}
          onPlayPause={togglePlayPause}
          onPrev={prevTrack}
          onNext={nextTrack}
          onSeek={seek}
          onVolumeChange={setVolume}
          onToggleMute={toggleMute}
          onToggleRepeat={toggleRepeat}
          onToggleShuffle={toggleShuffle}
          onMinimize={minimizeVisual}
          onClose={closeVisual}
          isMinimized={visualMinimized}
        />
      )}

      {/* React Bits Shredder Queue Drawer */}
      <QueuePanel
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
      />

      {/* Upload Music Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Edit Track Metadata & Artwork Modal */}
      <EditTrackModal
        track={editingTrack}
        isOpen={Boolean(editingTrack)}
        onClose={() => setEditingTrack(null)}
        onTrackUpdated={handleTrackUpdated}
        onTrackDeleted={handleTrackDeleted}
      />

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={addToPlaylistTrack}
        playlists={playlists}
        isOpen={Boolean(addToPlaylistTrack)}
        onClose={() => setAddToPlaylistTrack(null)}
        onAddToPlaylist={handleAddToPlaylist}
        onCreateAndAdd={handleCreateAndAdd}
      />

      {/* Create / Edit Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => {
          setIsCreatePlaylistOpen(false);
          setEditingPlaylist(null);
        }}
        onCreate={handleSavePlaylist}
        initialName={editingPlaylist?.name || ''}
        initialDescription={editingPlaylist?.description || ''}
        isEditMode={Boolean(editingPlaylist)}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};
