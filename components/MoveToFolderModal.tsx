import React, { useState, useMemo } from 'react';
import type { GalleryContentItem, Folder } from '../types/index';
import { MediaType } from '../types/index';

// This is a recursive component to render the folder tree
const FolderTreeItem: React.FC<{
  item: Folder;
  level: number;
  selectedDestination: string | null;
  onSelect: (id: string) => void;
  disabledIds: Set<string>;
}> = ({ item, level, selectedDestination, onSelect, disabledIds }) => {
  const isDisabled = disabledIds.has(item.id);
  const isSelected = selectedDestination === item.id;

  return (
    <>
      <button
        onClick={() => onSelect(item.id)}
        disabled={isDisabled}
        className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-md text-sm transition-colors ${
          isSelected ? 'bg-[var(--color-accent)] text-white font-semibold' : 'hover:bg-[var(--color-bg-tertiary)]'
        } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        style={{ paddingLeft: `${0.75 + level * 1.5}rem` }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span className="truncate">{item.name}</span>
      </button>
      {item.children.filter(child => child.type === MediaType.FOLDER).map(childFolder => (
        <FolderTreeItem
          key={childFolder.id}
          item={childFolder as Folder}
          level={level + 1}
          selectedDestination={selectedDestination}
          onSelect={onSelect}
          disabledIds={disabledIds}
        />
      ))}
    </>
  );
};


const SmallSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface MoveToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmMove: (destinationFolderId: string | 'root' | null) => void;
  galleryContent: GalleryContentItem[];
  movingItemIds: Set<string>;
  itemCount: number;
}

export const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({ isOpen, onClose, onConfirmMove, galleryContent, movingItemIds, itemCount }) => {
    const [selectedDestination, setSelectedDestination] = useState<string | 'root' | null>(null);
    const [isMoving, setIsMoving] = useState(false);

    // Memoize the calculation of disabled folder IDs
    const disabledFolderIds = useMemo(() => {
        const allItemsMap = new Map<string, GalleryContentItem>();
        const buildMap = (items: GalleryContentItem[]) => {
            items.forEach(item => {
                allItemsMap.set(item.id, item);
                if (item.type === MediaType.FOLDER) {
                    buildMap(item.children);
                }
            });
        };
        buildMap(galleryContent);

        const disabledIds = new Set<string>();
        const getDescendantIds = (folderId: string) => {
            const folder = allItemsMap.get(folderId);
            if (folder?.type !== MediaType.FOLDER) return;
            
            disabledIds.add(folder.id);
            folder.children.forEach(child => {
                if (child.type === MediaType.FOLDER) {
                    getDescendantIds(child.id);
                }
            });
        };

        movingItemIds.forEach(id => {
            const item = allItemsMap.get(id);
            if (item?.type === MediaType.FOLDER) {
                getDescendantIds(id);
            }
        });
        
        return disabledIds;
    }, [galleryContent, movingItemIds]);


    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (selectedDestination === null) return;
        setIsMoving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        onConfirmMove(selectedDestination);
        // Parent will close modal on success
        setIsMoving(false);
    };
    
    const rootFolders = galleryContent.filter(item => item.type === MediaType.FOLDER) as Folder[];

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 fade-in"
            onClick={!isMoving ? onClose : undefined}
        >
            <div 
                className="relative bg-[var(--color-bg-secondary)] w-full max-w-md rounded-lg shadow-2xl flex flex-col overflow-hidden max-h-[90vh]" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-[var(--color-border)]">
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Move {itemCount} Item{itemCount !== 1 && 's'}</h2>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">Select a destination folder.</p>
                </div>

                <div className="p-4 overflow-y-auto">
                    <div className="space-y-1">
                         <button
                            onClick={() => setSelectedDestination('root')}
                            className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                selectedDestination === 'root' ? 'bg-[var(--color-accent)] text-white font-semibold' : 'hover:bg-[var(--color-bg-tertiary)]'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            <span className="truncate">Home (Root)</span>
                        </button>
                        {rootFolders.map(folder => (
                            <FolderTreeItem
                                key={folder.id}
                                item={folder}
                                level={0}
                                selectedDestination={selectedDestination}
                                onSelect={setSelectedDestination}
                                disabledIds={disabledFolderIds}
                            />
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-[var(--color-bg-tertiary)] border-t border-[var(--color-border)] flex justify-end gap-4">
                    <button 
                        type="button"
                        onClick={onClose}
                        disabled={isMoving}
                        className="px-4 py-2 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] rounded-md font-semibold disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button 
                        type="button"
                        onClick={handleConfirm}
                        disabled={selectedDestination === null || isMoving}
                        className="px-4 py-2 w-28 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-md font-semibold disabled:opacity-50 flex items-center justify-center"
                    >
                        {isMoving ? <SmallSpinner /> : 'Move'}
                    </button>
                </div>
            </div>
        </div>
    );
};