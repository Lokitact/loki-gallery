import React, { useState, useRef } from 'react';
import type { User } from '../types/index';

const SmallSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
  const [name, setName] = useState(user.name);
  const [imagePreview, setImagePreview] = useState<string | null>(user.profileImageUrl || null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedUser: User = {
        ...user,
        name: name.trim(),
        profileImageUrl: imagePreview || undefined,
    };

    onSave(updatedUser);
    setIsSaving(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
    >
      <div
        className="relative bg-[var(--color-bg-secondary)] w-full max-w-md rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 id="edit-profile-title" className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">Edit Profile</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Profile Preview" className="h-24 w-24 rounded-full object-cover ring-2 ring-offset-2 ring-offset-[var(--color-bg-secondary)] ring-[var(--color-accent)]" />
                    ) : (
                        <div className="h-24 w-24 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-4xl ring-2 ring-offset-2 ring-offset-[var(--color-bg-secondary)] ring-[var(--color-accent)]">{user.name.charAt(0)}</div>
                    )}
                    <button type="button" onClick={triggerFileSelect} className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Change profile picture">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
                </div>
            </div>

            <div className="mb-6">
                 <label htmlFor="profile-name" className="block text-md font-medium text-[var(--color-text-primary)] mb-2">Full Name</label>
                 <input
                    id="profile-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    required
                />
            </div>

            <div className="flex justify-end gap-4">
              <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)] rounded-md font-semibold disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={isSaving || !name.trim()} className="px-4 py-2 w-24 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-md font-semibold disabled:opacity-50 flex items-center justify-center">
                {isSaving ? <SmallSpinner /> : 'Save'}
              </button>
            </div>
          </form>
        </div>
         <button onClick={onClose} className="absolute top-3 right-3 text-[var(--color-text-muted)] bg-transparent rounded-full p-1 hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
};
