
import React from 'react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div
        className="relative bg-[var(--color-bg-secondary)] w-full max-w-sm rounded-lg shadow-2xl flex flex-col items-center overflow-hidden text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
            <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
          <h2 id="about-modal-title" className="text-2xl font-bold text-[var(--color-text-primary)]">
            Loki Gallery
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Version 1.0.0</p>
          
          <p className="text-base text-[var(--color-text-secondary)] mt-6">
            Loki Gallery is a secure and elegant platform for photographers to share their work with clients. View, comment on, and download your memories with ease.
          </p>

          <div className="mt-8">
            <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-md font-semibold"
            >
                Close
            </button>
          </div>
        </div>
        <div className="bg-[var(--color-bg-tertiary)] w-full py-2 px-4 text-center">
            <p className="text-xs text-[var(--color-text-muted)]">Crafted with care for Lokesh</p>
        </div>
      </div>
    </div>
  );
};
