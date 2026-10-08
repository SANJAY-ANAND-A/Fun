import React, { useState, useMemo } from 'react';
import { Track } from '../../types/music';
import {
  Search,
  SlidersHorizontal,
  Play,
  ListPlus,
  MoreVertical,
  Heart,
  LayoutList,
  LayoutGrid,
  Music2,
  FolderPlus,
  Clock,
  Volume2
} from 'lucide-react';
import './LibraryView.css';

interface LibraryViewProps {
  tracks: Track[];
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onAddToQueue: (track: Track) => void;
  onPlayNext: (track: Track) => void;
  onToggleFavorite: (trackId: string) => void;
  onOpenEdit: (track: Track) => void;
  onOpenAddToPlaylist: (track: Track) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
  onOpenUpload: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  tracks,
  onPlayTrack,
  onAddToQueue,
  onPlayNext,
  onToggleFavorite,
  onOpenEdit,
  onOpenAddToPlaylist,
  currentTrackId,
  isPlaying,
  onOpenUpload
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [layoutMode, setLayoutMode] = useState<'list' | 'grid'>('list');
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);

  // Extract all available genres
  const genres = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach(t => {
      if (t.genre && t.genre.trim()) set.add(t.genre.trim());
    });
    return ['all', ...Array.from(set).sort()];
  }, [tracks]);

  // Filter and sort tracks
  const filteredTracks = useMemo(() => {
    let result = [...tracks];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }

    if (selectedGenre !== 'all') {
      result = result.filter(t => t.genre.toLowerCase() === selectedGenre.toLowerCase());
    }

    switch (sortBy) {
      case 'title_asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title_desc':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'artist':
        result.sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));
        break;
      case 'duration_desc':
        result.sort((a, b) => b.duration - a.duration);
        break;
      case 'duration_asc':
        result.sort((a, b) => a.duration - b.duration);
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'recent':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [tracks, searchQuery, selectedGenre, sortBy]);

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="library-view-container">
      {/* Header with Search and Controls */}
      <div className="library-header">
        <div className="library-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input search-input"
            placeholder="Search tracks, artists, albums, or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn btn-ghost btn-icon-sm"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="library-toolbar-actions">
          {/* Sort dropdown */}
          <div className="sort-select-wrapper">
            <select
              className="input select-input"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              aria-label="Sort library tracks"
            >
              <option value="recent">Recently Added</option>
              <option value="oldest">Oldest First</option>
              <option value="title_asc">Title (A-Z)</option>
              <option value="title_desc">Title (Z-A)</option>
              <option value="artist">Artist</option>
              <option value="duration_desc">Longest Duration</option>
              <option value="duration_asc">Shortest Duration</option>
            </select>
          </div>

          {/* Layout Toggle */}
          <div className="layout-toggle-group">
            <button
              type="button"
              className={`btn btn-ghost btn-icon-sm ${layoutMode === 'list' ? 'active' : ''}`}
              onClick={() => setLayoutMode('list')}
              aria-label="List view"
              title="List View"
            >
              <LayoutList size={16} />
            </button>
            <button
              type="button"
              className={`btn btn-ghost btn-icon-sm ${layoutMode === 'grid' ? 'active' : ''}`}
              onClick={() => setLayoutMode('grid')}
              aria-label="Grid view"
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onPlayTrack(filteredTracks[0], filteredTracks)}
            disabled={filteredTracks.length === 0}
          >
            <Play size={14} />
            <span>Play All</span>
          </button>
        </div>
      </div>

      {/* Genre Filter Chips */}
      {genres.length > 2 && (
        <div className="genre-chips-row">
          {genres.map(genre => (
            <button
              key={genre}
              type="button"
              className={`genre-chip ${selectedGenre === genre ? 'active' : ''}`}
              onClick={() => setSelectedGenre(genre)}
            >
              {genre === 'all' ? 'All Genres' : genre}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredTracks.length === 0 ? (
        <div className="library-empty-state">
          <Music2 size={36} className="empty-icon" />
          {tracks.length === 0 ? (
            <>
              <h3>Your music library is empty</h3>
              <p>Upload audio files to start listening and organizing your collection.</p>
              <button type="button" className="btn btn-primary" onClick={onOpenUpload}>
                Upload Tracks
              </button>
            </>
          ) : (
            <>
              <h3>No matching tracks found</h3>
              <p>Try searching with different keywords or clear the active filter.</p>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGenre('all');
                }}
              >
                Reset Filters
              </button>
            </>
          )}
        </div>
      ) : layoutMode === 'list' ? (
        /* Table / List Layout */
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
              {filteredTracks.map((track, idx) => {
                const isCurrent = track.id === currentTrackId;
                const isMenuOpen = activeMenuTrackId === track.id;

                return (
                  <tr
                    key={track.id}
                    className={`track-table-row ${isCurrent ? 'is-active-track' : ''}`}
                    onDoubleClick={() => onPlayTrack(track, filteredTracks)}
                  >
                    <td className="td-num">
                      <div className="track-num-cell">
                        {isCurrent && isPlaying ? (
                          <Volume2 size={14} className="playing-icon" />
                        ) : (
                          <span className="row-index">{idx + 1}</span>
                        )}
                        <button
                          type="button"
                          className="btn btn-ghost btn-row-play"
                          onClick={() => onPlayTrack(track, filteredTracks)}
                          aria-label={`Play ${track.title}`}
                        >
                          <Play size={12} />
                        </button>
                      </div>
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
                        <div className="table-title-meta">
                          <span className="table-title-text" title={track.title}>{track.title}</span>
                          {track.tags && track.tags.length > 0 && (
                            <div className="table-tag-pills">
                              {track.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="table-tag">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="td-artist">
                      <span className="table-artist-text" title={track.artist}>{track.artist}</span>
                    </td>

                    <td className="td-album">
                      <span className="table-album-text" title={track.album || '-'}>{track.album || '-'}</span>
                    </td>

                    <td className="td-time">
                      <span className="table-time-text">{formatDuration(track.duration)}</span>
                    </td>

                    <td className="td-actions">
                      <div className="table-actions-cell">
                        <button
                          type="button"
                          className={`btn btn-ghost btn-icon-sm ${track.isFavorite ? 'favorited' : ''}`}
                          onClick={() => onToggleFavorite(track.id)}
                          aria-label="Toggle favorite"
                          title="Favorite"
                        >
                          <Heart size={14} fill={track.isFavorite ? '#ef4444' : 'none'} color={track.isFavorite ? '#ef4444' : 'currentColor'} />
                        </button>

                        <button
                          type="button"
                          className="btn btn-ghost btn-icon-sm"
                          onClick={() => onAddToQueue(track)}
                          aria-label="Add to queue"
                          title="Add to Queue"
                        >
                          <ListPlus size={14} />
                        </button>

                        <div className="track-row-menu-wrapper">
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon-sm"
                            onClick={() => setActiveMenuTrackId(isMenuOpen ? null : track.id)}
                            aria-label="Track options"
                            title="More"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {isMenuOpen && (
                            <div className="track-dropdown-menu" role="menu">
                              <button
                                type="button"
                                className="dropdown-menu-item"
                                onClick={() => {
                                  onPlayNext(track);
                                  setActiveMenuTrackId(null);
                                }}
                              >
                                Play Next
                              </button>
                              <button
                                type="button"
                                className="dropdown-menu-item"
                                onClick={() => {
                                  onOpenAddToPlaylist(track);
                                  setActiveMenuTrackId(null);
                                }}
                              >
                                Add to Playlist...
                              </button>
                              <button
                                type="button"
                                className="dropdown-menu-item"
                                onClick={() => {
                                  onOpenEdit(track);
                                  setActiveMenuTrackId(null);
                                }}
                              >
                                Edit Metadata & Artwork
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid Layout */
        <div className="tracks-grid">
          {filteredTracks.map(track => {
            const isCurrent = track.id === currentTrackId;

            return (
              <div
                key={track.id}
                className={`grid-card ${isCurrent ? 'is-active' : ''}`}
                onClick={() => onPlayTrack(track, filteredTracks)}
              >
                <div className="grid-card-artwork">
                  {track.coverPath ? (
                    <img src={track.coverPath} alt={track.title} loading="lazy" />
                  ) : (
                    <div className="grid-card-placeholder">
                      <Music2 size={28} />
                    </div>
                  )}

                  <button
                    type="button"
                    className="grid-card-play-overlay"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrack(track, filteredTracks);
                    }}
                    aria-label={`Play ${track.title}`}
                  >
                    <Play size={18} />
                  </button>
                </div>

                <div className="grid-card-meta">
                  <span className="grid-card-title" title={track.title}>{track.title}</span>
                  <span className="grid-card-artist" title={track.artist}>{track.artist}</span>
                </div>

                <div className="grid-card-actions" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`btn btn-ghost btn-icon-sm ${track.isFavorite ? 'favorited' : ''}`}
                    onClick={() => onToggleFavorite(track.id)}
                    aria-label="Toggle favorite"
                  >
                    <Heart size={14} fill={track.isFavorite ? '#ef4444' : 'none'} color={track.isFavorite ? '#ef4444' : 'currentColor'} />
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost btn-icon-sm"
                    onClick={() => onOpenAddToPlaylist(track)}
                    title="Add to Playlist"
                  >
                    <FolderPlus size={14} />
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost btn-icon-sm"
                    onClick={() => onOpenEdit(track)}
                    title="Edit Metadata"
                  >
                    <SlidersHorizontal size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
