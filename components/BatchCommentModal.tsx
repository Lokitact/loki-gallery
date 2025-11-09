

import React, { useState } from 'react';

interface BatchCommentModalProps {
  itemCount: number;
  onClose: () => void;
  onSubmit: (comment: string) => Promise<void>;
}

const SmallSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const BatchCommentModal: React.FC<BatchCommentModalProps> = ({ itemCount, onClose, onSubmit }) => {
    const [comment, setComment] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSubmit(comment);
            // On successful submission, parent will close the modal
        } catch (error) {
            // Error toast is handled by parent, keep modal open
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 fade-in"
            onClick={onClose}
        >
            <div 
                className="relative bg-[var(--color-bg-secondary)] w-full max-w-md rounded-lg shadow-2xl flex flex-col overflow-hidden" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">Add a Comment</h2>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                        This comment will be added to all <strong>{itemCount} selected items</strong>. Existing comments will be overwritten.
                    </p>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                             <label htmlFor="batch-comment" className="sr-only">Your Comment</label>
                             <textarea
                                id="batch-comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add a comment for your photographer..."
                                rows={4}
                                className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-4">
                            <button 
                                type="button"
                                onClick={onClose}
                                disabled={isSaving}
                                className="px-4 py-2 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)] rounded-md font-semibold disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={isSaving}
                                className="px-4 py-2 w-32 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-md font-semibold disabled:opacity-50 flex items-center justify-center"
                            >
                                {isSaving ? <SmallSpinner /> : 'Save Comment'}
                            </button>
                        </div>
                    </form>
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