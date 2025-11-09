
import React from 'react';

export interface FolderInfo {
  name: string;
  folderCount: number;
  photoCount: number;  
  videoCount: number;
  totalCount: number;
  dateRange: string | null;
  totalSize: string;
  likedCount: number;
  commentCount: number;
}

interface FolderInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderDetails: { info: FolderInfo; path: string; } | null;
}

export const FolderInfoModal: React.FC<FolderInfoModalProps> = ({ isOpen, onClose, folderDetails }) => {
  if (!isOpen || !folderDetails) return null;

  const { info: folderInfo, path } = folderDetails;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="folder-info-title"
    >
      <div 
        className="relative bg-[var(--color-bg-secondary)] w-full max-w-sm rounded-lg shadow-2xl flex flex-col overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 id="folder-info-title" className="text-xl font-bold text-[var(--color-text-primary)] mb-6 truncate">
            Folder Details
          </h2>
          
          <div className="space-y-3 text-sm">
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="font-semibold text-[var(--color-text-primary)]">Folder Name</span> <span className="text-right text-[var(--color-text-secondary)] truncate ml-4" title={folderInfo.name}>{folderInfo.name}</span></div>
              <div className="flex justify-between items-start"><span className="font-semibold text-[var(--color-text-primary)] flex-shrink-0 mr-4">Path</span> <span className="text-right text-[var(--color-text-secondary)]" title={path}>{path}</span></div>
            </div>

            <div className="pt-3 border-t border-[var(--color-border)]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                        <span>Sub-folders</span>
                    </div>
                    <span>{folderInfo.folderCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span>Photos</span>
                    </div>
                    <span>{folderInfo.photoCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        <span>Videos</span>
                    </div>
                    <span>{folderInfo.videoCount}</span>
                </div>

                 <div className="border-t border-[var(--color-border)] my-2"></div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                        <span>Liked Items</span>
                    </div>
                    <span>{folderInfo.likedCount}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        <span>Items with Comments</span>
                    </div>
                    <span>{folderInfo.commentCount}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--color-border)]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                        <span>Total Size</span>
                    </div>
                    <span>{folderInfo.totalSize}</span>
                </div>

                {folderInfo.dateRange && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span>Date Range</span>
                        </div>
                        <span className="text-right ml-2">{folderInfo.dateRange}</span>
                    </div>
                )}
                 <div className="flex justify-between items-center border-t border-[var(--color-border)] pt-3 mt-1">
                    <span className="font-semibold text-[var(--color-text-primary)]">Total Items</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">{folderInfo.totalCount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-md font-semibold"
            >
                Close
            </button>
          </div>
        </div>
         <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-[var(--color-text-muted)] bg-transparent rounded-full p-1 hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
