
import React, { useState, useRef, useEffect } from 'react';
import type { MediaItem } from '../types/index';
import { MediaType } from '../types/index';

const SmallSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const QUICK_COMMENTS = {
  'General': [
    'Love this one!',
    'This is a favorite.',
    'Perfect!',
    'Can we get this in black and white?',
  ],
  "Groom's Family": [
    'Please send this to my parents.',
    'My mom will love this shot.',
    'A great photo of the family.',
  ],
  "Bride's Family": [
    'My parents need a copy of this.',
    'Such a beautiful family photo.',
    'My dad looks so happy here.',
  ],
  'Edits & Requests': [
      'Could you touch up the lighting here?',
      'Is it possible to crop this differently?',
      'Please add this to the final album.',
  ]
};

interface CommentModalProps {
  mediaItem: MediaItem;
  onClose: () => void;
  onSetComment: (mediaId: string, comment: string) => Promise<void>;
}

export const CommentModal: React.FC<CommentModalProps> = ({ mediaItem, onClose, onSetComment }) => {
  const [commentText, setCommentText] = useState(mediaItem.comment || '');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isQuickCommentOpen, setIsQuickCommentOpen] = useState(false);
  const quickCommentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-focus and select text when modal opens
    setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
    }, 100);
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickCommentRef.current && !quickCommentRef.current.contains(event.target as Node)) {
        setIsQuickCommentOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSetComment(mediaItem.id, commentText);
      onClose();
    } catch (error) {
      console.error("Failed to save comment:", error);
      // Parent component will show a toast. We keep the modal open.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 fade-in" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="comment-modal-title"
    >
      <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start gap-4 mb-4">
            <div className="flex items-start gap-4 min-w-0">
                {mediaItem.type === MediaType.PHOTO ? (
                    <img src={mediaItem.url} alt={mediaItem.title} className="w-20 h-20 object-cover rounded-md flex-shrink-0 bg-[var(--color-bg-tertiary)]" />
                ) : (
                    <video src={`${mediaItem.url}#t=0.1`} preload="metadata" className="w-20 h-20 object-cover rounded-md flex-shrink-0 bg-[var(--color-bg-tertiary)]" />
                )}
                <div className="min-w-0">
                    <h3 id="comment-modal-title" className="text-lg font-bold text-[var(--color-text-primary)] truncate" title={mediaItem.title}>{mediaItem.title}</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">Add or edit your comment below.</p>
                </div>
            </div>
            <div ref={quickCommentRef} className="relative flex-shrink-0">
                <button
                    type="button"
                    onClick={() => setIsQuickCommentOpen(prev => !prev)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    aria-haspopup="true"
                    aria-expanded={isQuickCommentOpen}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span>Quick Comments</span>
                </button>
                {isQuickCommentOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--color-bg-primary)] rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 py-1 overflow-y-auto max-h-60">
                        {Object.entries(QUICK_COMMENTS).map(([category, comments], index) => (
                            <React.Fragment key={category}>
                                {index > 0 && <div className="border-t border-[var(--color-border)] my-1"></div>}
                                <h4 className="px-3 pt-2 pb-1 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">{category}</h4>
                                {comments.map(comment => (
                                    <button
                                        key={comment}
                                        type="button"
                                        onClick={() => {
                                            setCommentText(prev => prev ? `${prev}\n${comment}` : comment);
                                            setIsQuickCommentOpen(false);
                                            textareaRef.current?.focus();
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
                                    >
                                        {comment}
                                    </button>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>
        </div>
        
        <form onSubmit={handleSave}>
            <textarea
                ref={textareaRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={5}
                className="w-full p-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:ring-2 focus:ring-[var(--color-accent)] outline-none resize-none"
                placeholder="Add a comment for your photographer..."
                aria-label="Comment input"
            />
            <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-semibold rounded-md hover:bg-[var(--color-bg-tertiary)] disabled:opacity-50">
                    Cancel
                </button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 w-24 text-sm font-semibold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 flex items-center justify-center">
                    {isSaving ? <SmallSpinner /> : 'Save'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
