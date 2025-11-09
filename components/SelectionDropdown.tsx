import React, { useState, useRef, useEffect } from 'react';
import type { MediaItem } from '../types/index';
import { SelectionType } from '../types/index';

interface SelectionDropdownProps {
  mediaItem: MediaItem;
  onSetSelection: (mediaId: string, selection: SelectionType) => void;
  disabled: boolean;
  onVisibilityChange: (isVisible: boolean) => void;
  variant?: 'card' | 'modal';
}

const SELECTION_OPTIONS: { value: SelectionType; label: string }[] = [
    { value: SelectionType.NONE, label: 'None' },
    { value: SelectionType.OFF_SHEET, label: 'Off Sheet' },
    { value: SelectionType.FRAME, label: 'Frame' },
    { value: SelectionType.FAMILY, label: 'Family' },
    { value: SelectionType.GROOM_FAMILY, label: 'Groom Family' },
    { value: SelectionType.BRIDE_FAMILY, label: 'Bride Family' },
];

export const SelectionDropdown: React.FC<SelectionDropdownProps> = ({ mediaItem, onSetSelection, disabled, onVisibilityChange, variant = 'card' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [menuPositionClass, setMenuPositionClass] = useState('top-full mt-2');

  useEffect(() => {
    onVisibilityChange(isOpen);
  }, [isOpen, onVisibilityChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;

    if (!isOpen && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const menuHeight = 250; // estimate

        if (spaceBelow < menuHeight && rect.top > spaceBelow) {
            setMenuPositionClass('bottom-full mb-2'); // Not enough space below, open UP
        } else {
            setMenuPositionClass('top-full mt-2'); // Default DOWN
        }
    }
    setIsOpen(p => !p);
  };

  const handleSelect = (selection: SelectionType) => {
    onSetSelection(mediaItem.id, selection);
    setIsOpen(false);
  };
  
  const currentSelection = mediaItem.selection || SelectionType.NONE;
  const hasSelection = currentSelection !== SelectionType.NONE;

  const buttonClasses = variant === 'card'
    ? `p-1 flex items-center transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
        hasSelection
          ? 'text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]'
          : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-accent)]'
      }`
    : `p-2 rounded-full transition-colors bg-black/20 hover:bg-black/40 disabled:opacity-50 disabled:cursor-not-allowed ${
        hasSelection ? 'text-[var(--color-accent)]' : ''
      }`;
  
  const iconClasses = variant === 'card' ? 'h-5 w-5' : 'h-6 w-6';

  return (
    <div ref={dropdownRef} className="relative">
      <button 
        onClick={handleToggleOpen} 
        disabled={disabled}
        className={buttonClasses}
        title="Set selection"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </button>

      {isOpen && (
        <div 
          onClick={e => e.stopPropagation()}
          className={`absolute right-0 w-56 bg-[var(--color-bg-secondary)] rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 fade-in p-2 ${menuPositionClass}`}
        >
          <div className="text-sm font-semibold px-2 pb-2 border-b border-[var(--color-border)]">Set Selection</div>
          <div className="py-1 max-h-48 overflow-y-auto">
            {SELECTION_OPTIONS.map(option => (
                <label key={option.value} className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-[var(--color-bg-tertiary)] cursor-pointer">
                <input
                    type="radio"
                    name={`selection-${mediaItem.id}`}
                    value={option.value}
                    checked={currentSelection === option.value}
                    onChange={() => handleSelect(option.value)}
                    className="h-4 w-4 bg-[var(--color-bg-tertiary)] border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                />
                <span className="text-sm truncate">{option.label}</span>
                </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};