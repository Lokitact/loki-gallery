import React, { useRef, useEffect, useState } from 'react';
import type { MediaItem, User, TextAlign } from '../types/index';
import { SelectionType } from '../types/index';
import { SelectionDropdown } from './SelectionDropdown';

interface PhotoItemProps {
  photo: MediaItem;
  user: User;
  isSelectMode: boolean;
  isSelected: boolean;
  onMediaClick: (mediaItem: MediaItem) => void;
  onCommentClick: (mediaItem: MediaItem) => void;
  onDetails: (mediaItem: MediaItem) => void;
  onLike: (mediaId: string) => void;
  onInitiateSelectMode: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string) => void;
  style?: React.CSSProperties;
  textAlign: TextAlign;
  onSetSelection: (mediaId: string, selection: SelectionType) => void;
}

export const PhotoItem = React.forwardRef<HTMLDivElement, PhotoItemProps>(({ photo, user, isSelectMode, isSelected, onMediaClick, onCommentClick, onDetails, onLike, onInitiateSelectMode, onDelete, onMove, style, textAlign, onSetSelection }, ref) => {
  const isLiked = photo.likedBy.includes(user.id);
  const hasComment = photo.comment && photo.comment.trim() !== '';
  
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const longPressTriggered = useRef(false);
  const pressTimer = useRef<number | null>(null);
  
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSelectionMenuOpen, setIsSelectionMenuOpen] = useState(false);
  const [menuPositionClass, setMenuPositionClass] = useState('top-full mt-2');


  // Combine refs
  useEffect(() => {
    const currentRef = rootRef.current;
    if (typeof ref === 'function') {
      ref(currentRef);
    } else if (ref) {
      ref.current = currentRef;
    }
  }, [ref]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);


  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Start loading when 200px away from the viewport
    );
    const currentRef = rootRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  useEffect(() => {
    const preventContextMenu = (e: Event) => {
        if (longPressTriggered.current) {
            e.preventDefault();
        }
    };
    document.addEventListener('contextmenu', preventContextMenu, { capture: true });
    return () => {
        document.removeEventListener('contextmenu', preventContextMenu, { capture: true });
    };
  }, []);
  
  const cleanupPointer = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handlePointerDown = () => {
    if (isSelectMode) return;
    longPressTriggered.current = false;
    pressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      onInitiateSelectMode(photo.id);
    }, 500); // 500ms for long press
  };
  
  const handleClick = () => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false; // Reset for next interaction
      return;
    };
    onMediaClick(photo);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMenuOpen && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 210; // Estimated menu height in pixels

      // If there's not enough space below, and there's more space above, open UP.
      if (spaceBelow < menuHeight && rect.top > spaceBelow) {
        setMenuPositionClass('bottom-full mb-2');
      } else {
        // Otherwise, open DOWN.
        setMenuPositionClass('top-full mt-2');
      }
    }
    setIsMenuOpen(prev => !prev);
  };
  
  const handleMenuAction = (action: () => void) => {
      action();
      setIsMenuOpen(false);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelectMode) return;
    onLike(photo.id);
  };
  
  const handleCommentClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isSelectMode) return;
      onCommentClick(photo);
  }

  return (
    <div 
      ref={rootRef}
      style={style} 
      className={`mb-3 break-inside-avoid rounded-lg bg-[var(--color-bg-secondary)] shadow-sm flex flex-col transition-all duration-200 ${isMenuOpen || isSelectionMenuOpen ? 'relative z-30 overflow-visible' : 'overflow-hidden'} ${isSelected ? 'ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-bg-primary)]' : ''}`}
    >
      <div 
        style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
        className="relative w-full group cursor-pointer bg-[var(--color-bg-primary)]"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={cleanupPointer}
        onPointerLeave={cleanupPointer}
      >
        {isInView && (
            <img 
              src={photo.url} 
              alt={photo.title} 
              onLoad={() => setIsLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${isSelected ? 'scale-95' : !isSelectMode ? 'group-hover:scale-105' : ''}`}
            />
        )}
        
        {isSelectMode && (
          <>
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
            <div className={`absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 pointer-events-none ${isSelected ? 'bg-[var(--color-accent)] border-2 border-transparent' : 'bg-white/30 backdrop-blur-sm border-2 border-white'}`}>
              {isSelected && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </>
        )}
      </div>
      
      <div className="p-3 min-w-0 cursor-pointer" onClick={handleClick}>
          <p className={`text-[var(--color-text-primary)] text-sm font-medium truncate w-full text-${textAlign}`} title={photo.title}>{photo.title}</p>
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={handleLikeClick}
                disabled={isSelectMode}
                className={`p-1 flex items-center transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLiked
                    ? 'text-red-500'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                }`}
                aria-pressed={isLiked}
                title={isLiked ? 'Unlike' : 'Like'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </button>
              
              <SelectionDropdown
                mediaItem={photo}
                onSetSelection={onSetSelection}
                disabled={isSelectMode}
                onVisibilityChange={setIsSelectionMenuOpen}
              />

              <button
                onClick={handleCommentClick}
                disabled={isSelectMode}
                className="p-1 flex items-center text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-accent)] transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                title={hasComment ? 'View comment' : 'Add comment'}
              >
                {hasComment ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--color-accent)]" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h14a1 1 0 011 1v10a1 1 0 01-1 1H9l-4 4v-4H3a1 1 0 01-1-1V3z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                )}
              </button>
            </div>
            
              {!isSelectMode && (
      
            <div className="flex items-center">
              <div ref={menuRef} className="relative">
                <button
                  onClick={handleMenuToggle}
                  className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-all"
                  title="More options"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                </button>

                {isMenuOpen && (
                    <div 
                        className={`absolute right-0 w-40 bg-[var(--color-bg-secondary)] rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 fade-in py-1 ${menuPositionClass}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => handleMenuAction(() => onInitiateSelectMode(photo.id))} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" /></svg>
                            Select
                        </button>
                        <button onClick={() => handleMenuAction(() => onDetails(photo))} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Details
                        </button>
                        <a
                         href={photo.url}
                         download={photo.title}
                         target="_blank"
                         rel="noopener noreferrer"
                         onClick={(e) => {
                           e.stopPropagation();
                           setIsMenuOpen(false);
                         }}
                         className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                         Download
                       </a>
                        <button onClick={() => handleMenuAction(() => onMove(photo.id))} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6" /></svg>
                            Move
                        </button>
                        <div className="my-1 border-t border-[var(--color-border)]"></div>
                        <button onClick={() => handleMenuAction(() => onDelete(photo.id))} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-[var(--color-danger)] opacity-80 hover:opacity-100 hover:bg-red-500/10 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Delete
                        </button>
                    </div>
                )}
              </div>
            </div>
      )}
          </div>
        </div>
    </div>
  );
});
PhotoItem.displayName = "PhotoItem";