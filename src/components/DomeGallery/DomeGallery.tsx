import React, { useRef, useState, useEffect } from 'react';
import { useDrag } from '@use-gesture/react';
import { Track } from '../../types/music';
import { Play, ListPlus, Music2, Eye } from 'lucide-react';
import './DomeGallery.css';

export interface DomeGalleryProps {
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onOpenDetails: (track: Track) => void;
  currentTrackId?: string;
  radius?: number;
  className?: string;
}

export const DomeGallery: React.FC<DomeGalleryProps> = ({
  tracks,
  onPlayTrack,
  onAddToQueue,
  onOpenDetails,
  currentTrackId,
  radius = 380,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ yaw: 0, pitch: -10 });
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
  }, []);

  // Gesture handling with @use-gesture/react
  const bind = useDrag(
    ({ offset: [x, y], down, velocity: [vx, vy] }) => {
      if (reducedMotion) return;
      // Convert drag delta to spherical rotation
      setRotation({
        yaw: x * 0.45,
        pitch: Math.max(-45, Math.min(30, -10 + y * 0.35))
      });
    },
    {
      pointer: { touch: true },
      from: () => [rotation.yaw / 0.45, (rotation.pitch + 10) / 0.35]
    }
  );

  // Keyboard navigation for dome rotation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setRotation(r => ({ ...r, yaw: r.yaw - 15 }));
    } else if (e.key === 'ArrowRight') {
      setRotation(r => ({ ...r, yaw: r.yaw + 15 }));
    } else if (e.key === 'ArrowUp') {
      setRotation(r => ({ ...r, pitch: Math.max(-45, r.pitch - 10) }));
    } else if (e.key === 'ArrowDown') {
      setRotation(r => ({ ...r, pitch: Math.min(30, r.pitch + 10) }));
    }
  };

  if (tracks.length === 0) {
    return (
      <div className="dome-empty-state">
        <Music2 size={32} className="dome-empty-icon" />
        <p className="dome-empty-text">Your library is empty. Upload audio files to explore the 3D gallery.</p>
      </div>
    );
  }

  // Distribute items onto a dome/hemisphere
  const count = tracks.length;
  const itemsWithCoords = tracks.map((track, i) => {
    // Fibonacci sphere distribution or ring distribution
    const phi = Math.acos(1 - (2 * (i + 0.5)) / Math.max(count, 12));
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;

    // Restrict phi to hemisphere (0 to ~1.4 rad)
    const clampedPhi = Math.min(phi, 1.4);

    const x = radius * Math.sin(clampedPhi) * Math.cos(theta);
    const y = radius * Math.cos(clampedPhi) * 0.65;
    const z = radius * Math.sin(clampedPhi) * Math.sin(theta);

    return {
      track,
      coords: { x, y, z }
    };
  });

  return (
    <div
      ref={containerRef}
      className={`dome-gallery-viewport ${className}`}
      {...bind()}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="3D Spherical artwork gallery. Drag with mouse or use arrow keys to rotate."
    >
      <div className="dome-instructions">
        <span>Drag or swipe to rotate dome. Use arrow keys for keyboard navigation.</span>
      </div>

      <div
        className="dome-scene"
        style={{
          transform: `translateZ(-${radius * 0.8}px) rotateX(${rotation.pitch}deg) rotateY(${rotation.yaw}deg)`
        }}
      >
        {itemsWithCoords.map(({ track, coords }, index) => {
          const isPlaying = track.id === currentTrackId;
          const isSelected = selectedTrack?.id === track.id;

          return (
            <div
              key={track.id}
              className={`dome-item ${isPlaying ? 'is-playing' : ''} ${isSelected ? 'is-selected' : ''}`}
              style={{
                transform: `translate3d(${coords.x}px, ${coords.y}px, ${coords.z}px) rotateY(${-rotation.yaw}deg) rotateX(${-rotation.pitch}deg)`
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTrack(track);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedTrack(track);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Select ${track.title} by ${track.artist}`}
            >
              <div className="dome-card">
                <div className="dome-card-artwork">
                  {track.coverPath ? (
                    <img
                      src={track.coverPath}
                      alt={track.title}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="dome-fallback-art">
                      <Music2 size={24} />
                    </div>
                  )}
                  {isPlaying && (
                    <div className="dome-playing-indicator">
                      <span>PLAYING</span>
                    </div>
                  )}
                </div>
                <div className="dome-card-info">
                  <div className="dome-card-title">{track.title}</div>
                  <div className="dome-card-artist">{track.artist}</div>
                </div>

                {/* Quick action buttons on card */}
                <div className="dome-card-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrack(track);
                    }}
                    title="Play Now"
                    aria-label={`Play ${track.title}`}
                  >
                    <Play size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToQueue(track);
                    }}
                    title="Add to Queue"
                    aria-label={`Add ${track.title} to queue`}
                  >
                    <ListPlus size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetails(track);
                    }}
                    title="Edit Details"
                    aria-label={`Edit ${track.title} details`}
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
