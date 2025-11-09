

import React, { useState } from 'react';

interface Tutorial {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const TUTORIALS: Tutorial[] = [
  {
    id: 'getting-started',
    title: "Getting Started",
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    content: (
      <div className="space-y-3">
        <p>Welcome to your gallery! This is a private space to view, download, and provide feedback on your photos and videos.</p>
        <p>Most key actions like selecting items, changing the theme, or getting help can be found in the <strong>profile dropdown menu</strong> in the top-right corner.</p>
      </div>
    ),
  },
  {
    id: 'navigation',
    title: "Navigating Your Gallery",
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
    content: (
       <ul className="space-y-3 list-disc list-outside pl-5">
        <li>Use the <strong>breadcrumbs</strong> (e.g., <code className="text-xs">Home / Folder Name</code>) below the header to see your current location and quickly navigate back to parent folders.</li>
        <li>Click the <strong>adjustments icon</strong> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block -mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg> to switch between a visual <strong>Grid View</strong> and a compact <strong>List View</strong>, and to sort or filter your files.</li>
      </ul>
    ),
  },
  {
    id: 'selection',
    title: "Selecting & Downloading Files",
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4" /></svg>,
    content: (
      <ul className="space-y-3 list-disc list-outside pl-5">
        <li>To select multiple items, click <strong>"Select Items"</strong> in the profile dropdown. A blue selection bar will appear.</li>
        <li>Click on photos, videos, or folders to add them to your selection. Use the top bar to <strong>Download</strong> or <strong>Delete</strong> your selection.</li>
        <li>To download a single file, open the detail view (by clicking it) and find the <strong>download icon</strong> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block -mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>.</li>
         <li>You can also use <strong>"Download All"</strong> in the profile menu to download everything in the current folder.</li>
      </ul>
    ),
  },
  {
    id: 'feedback',
    title: "Leaving Feedback & Comments",
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
    content: (
       <ul className="space-y-3 list-disc list-outside pl-5">
        <li>You can "like" a photo or video by clicking the <strong>heart icon</strong> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block -mt-1 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>. This helps your photographer know your favorites!</li>
        <li>To leave a specific comment, click the <strong>speech bubble icon</strong> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block -mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>. This will open the detail view where you can type and save your comments.</li>
      </ul>
    ),
  },
  {
    id: 'customization',
    title: "Changing Themes & Colors",
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4Zm0 0h12.5M16 21h-3.25m-4-15h2.5" /></svg>,
    content: (
       <ul className="space-y-3 list-disc list-outside pl-5">
        <li>Customize your viewing experience by opening the profile dropdown and clicking on <strong>"Theme"</strong>.</li>
        <li>You can choose between Light, Dark, and Twilight modes, or have it sync with your System's setting.</li>
        <li>You can also pick a personal <strong>Accent Color</strong> that will be used for buttons and highlights throughout the app.</li>
      </ul>
    ),
  },
];

const TutorialItem: React.FC<{ tutorial: Tutorial; isOpen: boolean; onClick: () => void; }> = ({ tutorial, isOpen, onClick }) => {
    return (
        <div className="border-b border-[var(--color-border)] last:border-b-0">
            <button
                onClick={onClick}
                className="w-full flex justify-between items-center text-left p-4 hover:bg-[var(--color-bg-tertiary)]"
                aria-expanded={isOpen}
                aria-controls={`tutorial-content-${tutorial.id}`}
            >
                <div className="flex items-center gap-4">
                    {tutorial.icon}
                    <span className="font-semibold text-[var(--color-text-primary)]">{tutorial.title}</span>
                </div>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div
                id={`tutorial-content-${tutorial.id}`}
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="p-4 pt-0 text-[var(--color-text-secondary)] text-base">
                        {tutorial.content}
                    </div>
                </div>
            </div>
        </div>
    );
};


interface TutorialsModalProps {
  onClose: () => void;
}

export const TutorialsModal: React.FC<TutorialsModalProps> = ({ onClose }) => {
  const [openTutorialId, setOpenTutorialId] = useState<string | null>('getting-started');

  const handleToggle = (id: string) => {
    setOpenTutorialId(prev => (prev === id ? null : id));
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorials-modal-title"
    >
      <div
        className="relative bg-[var(--color-bg-secondary)] w-full max-w-2xl rounded-lg shadow-2xl flex flex-col overflow-hidden max-h-[90vh] md:max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-[var(--color-border)] flex justify-between items-center flex-shrink-0">
          <h2 id="tutorials-modal-title" className="text-xl font-bold text-[var(--color-text-primary)]">
            How to Use Your Gallery
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[var(--color-bg-tertiary)]"
            aria-label="Close tutorials"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="overflow-y-auto">
            <p className="p-4 text-sm text-[var(--color-text-muted)] bg-[var(--color-bg-primary)]">
                Here are some quick guides to help you get the most out of your client gallery. Click any topic to learn more.
            </p>
            {TUTORIALS.map(tutorial => (
                <TutorialItem 
                    key={tutorial.id}
                    tutorial={tutorial}
                    isOpen={openTutorialId === tutorial.id}
                    onClick={() => handleToggle(tutorial.id)}
                />
            ))}
        </main>
         <footer className="p-4 border-t border-[var(--color-border)] flex-shrink-0">
             <div className="flex justify-end">
                <button
                    onClick={onClose}
                    className="px-5 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-md font-semibold"
                >
                    Got it!
                </button>
            </div>
        </footer>
      </div>
    </div>
  );
};