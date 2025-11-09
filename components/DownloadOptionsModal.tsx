
import React, { useState } from 'react';

type DownloadType = 'current' | 'recursive' | 'all' | 'liked' | 'commented';
type SpecialView = 'none' | 'liked' | 'commented' | 'deleted';

interface DownloadOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (type: DownloadType) => void;
  specialView: SpecialView;
  currentFolderName: string;
  isInSubfolder: boolean;
}

const DownloadSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const DownloadOptionButton: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    isDownloading: boolean;
}> = ({ icon, title, description, onClick, isDownloading }) => (
    <button
        onClick={onClick}
        disabled={isDownloading}
        className="w-full flex items-center gap-4 text-left p-4 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors disabled:opacity-60 disabled:cursor-wait"
    >
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-accent)]">
            {isDownloading ? <DownloadSpinner /> : icon}
        </div>
        <div className="min-w-0">
            <p className="font-semibold text-base text-[var(--color-text-primary)]">{title}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
        </div>
        {!isDownloading && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--color-text-muted)] ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        )}
    </button>
);


export const DownloadOptionsModal: React.FC<DownloadOptionsModalProps> = ({ isOpen, onClose, onDownload, specialView, currentFolderName, isInSubfolder }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    if (!isOpen) return null;

    const handleDownloadClick = async (type: DownloadType) => {
        setIsDownloading(true);
        // Simulate preparation delay
        await new Promise(resolve => setTimeout(resolve, 500));
        onDownload(type);
        onClose();
        // Reset state after a delay to allow the modal to close gracefully
        setTimeout(() => setIsDownloading(false), 500);
    };
    
    const renderOptions = () => {
        const commonOptions = [
            {
                type: 'liked' as DownloadType,
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
                title: 'Download All Liked Files',
                description: 'Get a copy of every file you have liked.',
            }
        ];

        if (specialView === 'liked') {
            return commonOptions;
        }
        if (specialView === 'commented') {
            return [
                {
                    type: 'commented' as DownloadType,
                    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
                    title: 'Download All Commented Files',
                    description: 'Get files that have comments on them.',
                },
                ...commonOptions
            ];
        }

        // Default folder/root view
        if (isInSubfolder) {
            return [
                {
                    type: 'current' as DownloadType,
                    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
                    title: `Download Files in "${currentFolderName}"`,
                    description: 'Downloads only the files inside this folder.',
                },
                {
                    type: 'recursive' as DownloadType,
                    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
                    title: `Download Folder "${currentFolderName}"`,
                    description: 'Includes all files and subfolders within.',
                },
                ...commonOptions,
            ];
        } else {
            // At root
            return [
                {
                    type: 'all' as DownloadType,
                    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
                    title: `Download All Files`,
                    description: 'Downloads everything from the entire gallery.',
                },
                ...commonOptions,
            ];
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 fade-in"
            onClick={!isDownloading ? onClose : undefined}
        >
            <div 
                className="relative bg-[var(--color-bg-secondary)] w-full max-w-lg rounded-lg shadow-2xl flex flex-col overflow-hidden" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Download Options</h2>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                        Choose what you would like to download from your gallery.
                    </p>
                    
                    <div className="space-y-2">
                        {renderOptions().map(option => (
                            <DownloadOptionButton 
                                key={option.type}
                                icon={option.icon}
                                title={option.title}
                                description={option.description}
                                onClick={() => handleDownloadClick(option.type)}
                                isDownloading={isDownloading}
                            />
                        ))}
                    </div>
                </div>
                 <div className="p-4 bg-[var(--color-bg-tertiary)] border-t border-[var(--color-border)] flex justify-end">
                    <button 
                        type="button"
                        onClick={onClose}
                        disabled={isDownloading}
                        className="px-4 py-2 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] rounded-md font-semibold disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
