import React, { useState } from 'react';

interface FeedbackModalProps {
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

const StarIcon: React.FC<{ filled: boolean; onClick: () => void; onMouseEnter: () => void; }> = ({ filled, onClick, onMouseEnter }) => (
    <svg 
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        className={`h-8 w-8 cursor-pointer transition-colors ${filled ? 'text-yellow-400' : 'text-[var(--color-text-muted)] hover:text-yellow-300'}`}
        fill="currentColor" 
        viewBox="0 0 20 20"
    >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            onSubmit(rating, comment);
            setIsSubmitting(false);
        }, 1000);
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
            onClick={onClose}
        >
            <div 
                className="relative bg-[var(--color-bg-secondary)] w-full max-w-md rounded-lg shadow-2xl flex flex-col overflow-hidden" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">Share Your Feedback</h2>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                        We value your opinion! Please take a moment to rate your experience and leave us a comment.
                    </p>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-md font-medium text-[var(--color-text-primary)] mb-3 text-center">Overall Experience</label>
                            <div className="flex justify-center items-center gap-2" onMouseLeave={() => setHoverRating(0)}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <StarIcon
                                        key={star}
                                        filled={(hoverRating || rating) >= star}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                             <label htmlFor="feedback-comment" className="block text-md font-medium text-[var(--color-text-primary)] mb-2">Your Comments</label>
                             <textarea
                                id="feedback-comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Tell us what you loved or what we can improve..."
                                rows={4}
                                className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-4">
                            <button 
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)] rounded-md font-semibold"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={rating === 0 || isSubmitting}
                                className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
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
