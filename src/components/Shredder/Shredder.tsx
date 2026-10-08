import React, { useState, useRef } from 'react';
import './Shredder.css';

export interface ShredderItem {
  id: string;
  [key: string]: any;
}

export interface ShredderProps<T extends ShredderItem> {
  items: T[];
  renderItem: (item: T, index: number, isShredding: boolean) => React.ReactNode;
  onReorder: (newItems: T[]) => void;
  onShred: (item: T) => void;
  stripCount?: number;
  bite?: number;
  fallHeight?: number;
  className?: string;
}

export function Shredder<T extends ShredderItem>({
  items,
  renderItem,
  onReorder,
  onShred,
  stripCount = 8,
  bite = 12,
  fallHeight = 60,
  className = ''
}: ShredderProps<T>) {
  const [shreddingId, setShreddingId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleStartShred = (item: T) => {
    if (shreddingId) return; // Prevent multiple concurrent shreds
    setShreddingId(item.id);

    // Trigger onShred after animation completes
    setTimeout(() => {
      onShred(item);
      setShreddingId(null);
    }, 600);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...items];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    onReorder(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Keyboard reordering fallback
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const reordered = [...items];
    const temp = reordered[index - 1];
    reordered[index - 1] = reordered[index];
    reordered[index] = temp;
    onReorder(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index >= items.length - 1) return;
    const reordered = [...items];
    const temp = reordered[index + 1];
    reordered[index + 1] = reordered[index];
    reordered[index] = temp;
    onReorder(reordered);
  };

  return (
    <div className={`shredder-container ${className}`} role="list" aria-label="Playback queue list">
      {items.map((item, index) => {
        const isShredding = shreddingId === item.id;
        const isDragging = draggedIndex === index;
        const isTarget = dragOverIndex === index;

        return (
          <div
            key={item.id}
            className={`shredder-row-wrapper ${isDragging ? 'is-dragging' : ''} ${isTarget ? 'is-target' : ''} ${isShredding ? 'is-shredding' : ''}`}
            draggable={!isShredding}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            role="listitem"
            aria-label={`Queue track ${index + 1}`}
          >
            {/* Normal content view */}
            {!isShredding ? (
              <div className="shredder-row-content">
                {renderItem(item, index, false)}
                <div className="shredder-row-actions">
                  <div className="shredder-reorder-buttons" aria-label="Reorder track">
                    <button
                      type="button"
                      className="btn btn-ghost btn-reorder"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      aria-label={`Move ${item.title || 'track'} up`}
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-reorder"
                      disabled={index === items.length - 1}
                      onClick={() => handleMoveDown(index)}
                      aria-label={`Move ${item.title || 'track'} down`}
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-shred"
                    onClick={() => handleStartShred(item)}
                    aria-label={`Remove ${item.title || 'track'} from queue`}
                    title="Remove from queue"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              /* Shredder cutting animation: item decomposes into vertical shredded strips with curl and drop */
              <div className="shredder-active-animation">
                <div className="shredder-teeth-bar" />
                <div className="shredder-strips-container">
                  {Array.from({ length: stripCount }).map((_, stripIdx) => {
                    const delay = (stripIdx * 0.04).toFixed(2);
                    const randomRotation = ((stripIdx % 2 === 0 ? 1 : -1) * (3 + (stripIdx % 4) * 2)).toFixed(1);
                    return (
                      <div
                        key={stripIdx}
                        className="shredder-strip"
                        style={{
                          width: `${100 / stripCount}%`,
                          animationDelay: `${delay}s`,
                          transform: `translateY(${fallHeight}px) rotate(${randomRotation}deg)`
                        }}
                      >
                        <div
                          className="shredder-strip-inner"
                          style={{
                            width: `${stripCount * 100}%`,
                            transform: `translateX(-${stripIdx * (100 / stripCount)}%)`
                          }}
                        >
                          {renderItem(item, index, true)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
