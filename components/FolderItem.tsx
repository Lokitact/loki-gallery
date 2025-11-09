
import React, { useRef, useEffect, useState } from 'react';
import type { Folder, TextAlign } from '../types/index';

interface FolderItemProps {
  folder: Folder;
  isSelectMode: boolean;
  isSelected: boolean;
  onFolderClick: (folderId: string) => void;
  onDetails: (folder: Folder) => void;
  onDelete: (folderId: string) => void;
  onInitiateSelectMode: (id: string) => void;
  onMove: (id: string) => void;
  style?: React.CSSProperties;
  textAlign: TextAlign;
}

export const FolderItem = React.forwardRef<HTMLDivElement, FolderItemProps>(({ folder, isSelectMode, isSelected, onFolderClick, onDetails, onDelete, onInitiateSelectMode, onMove, style, textAlign }, ref) => {
  const longPressTriggered = useRef(false);
  const pressTimer = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  // Close menu on outside click
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
      onInitiateSelectMode(folder.id);
    }, 500);
  };

  const handleClick = () => {
    if (longPressTriggered.current) {
        longPressTriggered.current = false; // Reset for next interaction
        return;
    }
    onFolderClick(folder.id);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMenuOpen && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 180; // Estimated height for folder menu

      if (spaceBelow < menuHeight && rect.top > spaceBelow) {
        setMenuPositionClass('bottom-full mb-2'); // Not enough space below, open up
      } else {
        setMenuPositionClass('top-full mt-2'); // Default to down
      }
    }
    setIsMenuOpen(prev => !prev);
  };
  
  const handleMenuAction = (action: () => void) => {
      action();
      setIsMenuOpen(false);
  };

  return (
    <div 
      ref={rootRef}
      style={style}
      className={`group mb-3 break-inside-avoid aspect-[4/3] rounded-lg flex flex-col justify-between p-4 cursor-pointer transition-all duration-200 bg-[var(--color-bg-secondary)] ${isMenuOpen ? 'relative z-30 overflow-visible' : ''} ${isSelectMode ? '' : 'hover:bg-[var(--color-bg-tertiary)]'} ${isSelected ? 'ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-bg-primary)]' : ''}`}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={cleanupPointer}
      onPointerLeave={cleanupPointer}
    >
      <div className={`flex-grow flex justify-center items-center transition-transform duration-200 min-w-0 ${isSelected ? 'scale-95' : 'scale-100'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </div>

      <div className={`transition-transform duration-200 min-w-0 ${isSelected ? 'scale-95' : 'scale-100'}`}>
        <p className={`text-[var(--color-text-primary)] text-sm font-medium truncate w-full text-${textAlign}`} title={folder.name}>{folder.name}</p>
      </div>

       {!isSelectMode && (
        <div ref={menuRef} className="absolute top-2 right-2">
            <button
              onClick={handleMenuToggle}
              className="p-1.5 rounded-full bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-all"
              title="More options"
              aria-label="More options for this folder"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>

            {isMenuOpen && (
                <div 
                    className={`absolute right-0 w-40 bg-[var(--color-bg-secondary)] rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 fade-in py-1 ${menuPositionClass}`}
                    onClick={e => e.stopPropagation()}
                >
                    <button onClick={() => handleMenuAction(() => onInitiateSelectMode(folder.id))} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" /></svg>
                        Select
                    </button>
                    <button onClick={() => handleMenuAction(() => onDetails(folder))} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Details
                    </button>
                    <button onClick={() => handleMenuAction(() => onMove(folder.id))} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6" /></svg>
                        Move
                    </button>
                    <div className="my-1 border-t border-[var(--color-border)]"></div>
                    <button onClick={() => handleMenuAction(() => onDelete(folder.id))} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-[var(--color-danger)] opacity-80 hover:opacity-100 hover:bg-red-500/10 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                    </button>
                </div>
            )}
        </div>
      )}

       {isSelectMode && (
         <div className={`absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 pointer-events-none ${isSelected ? 'bg-[var(--color-accent)] border-2 border-transparent' : 'bg-white/30 backdrop-blur-sm border-2 border-white'}`}>
            {isSelected && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
      )}
    </div>
  );
});
FolderItem.displayName = "FolderItem";
