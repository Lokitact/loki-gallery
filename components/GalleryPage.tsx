import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getMediaForUser } from '../services/mediaService';
import type { User, GalleryContentItem, MediaItem, Folder, TextAlign } from '../types/index';
import { MediaType, SelectionType } from '../types/index';
import { PhotoItem } from './PhotoItem';
import { VideoItem } from './VideoItem';
import { FolderItem } from './FolderItem';
import { MediaDetailModal } from '../MediaDetailModal';
import { FeedbackModal } from './FeedbackModal';
import { CommentModal } from './CommentModal';
import { AboutModal } from './AboutModal';
import { TutorialsModal } from './TutorialsModal';
import { EmptyState } from './EmptyState';
import { FolderInfoModal, type FolderInfo } from './FolderInfoModal';
import { Toast } from './Toast';
import { BatchCommentModal } from './BatchCommentModal';
import { EditProfileModal } from './EditProfileModal';
import { DownloadOptionsModal } from './DownloadOptionsModal';
import { MoveToFolderModal } from './MoveToFolderModal';

type Theme = 'dark' | 'light' | 'twilight' | 'midnight' | 'ocean' | 'system';
const themes: { name: Theme; label: string }[] = [
  { name: 'system', label: 'System' },
  { name: 'dark', label: 'Dark' },
  { name: 'light', label: 'Light' },
  { name: 'twilight', label: 'Twilight' },
  { name: 'midnight', label: 'Midnight' },
  { name: 'ocean', label: 'Ocean' },
];

type ViewMode = 'grid' | 'list';
type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc';
type FilterOption = 'all' | 'photos' | 'videos' | 'folders' | 'liked' | 'commented';
type SpecialView = 'none' | 'liked' | 'commented' | 'deleted';

const accentColors: Record<string, { accent: string; hover: string; glow: string; }> = {
    emerald: { accent: '#10B981', hover: '#059669', glow: 'rgba(16, 185, 129, 0.3)' },
    cyan: { accent: '#06B6D4', hover: '#0891B2', glow: 'rgba(6, 182, 212, 0.4)' },
    pink: { accent: '#EC4899', hover: '#DB2777', glow: 'rgba(236, 72, 153, 0.3)' },
    violet: { accent: '#8B5CF6', hover: '#7C3AED', glow: 'rgba(139, 92, 246, 0.3)' },
    orange: { accent: '#F97316', hover: '#EA580C', glow: 'rgba(249, 115, 22, 0.3)' },
};

// Helper to find and update a media item recursively
const findAndMutateMediaItem = (items: GalleryContentItem[], mediaId: string, mutation: (item: MediaItem) => MediaItem): GalleryContentItem[] => {
  return items.map(item => {
    if (item.type === MediaType.FOLDER) {
      return { ...item, children: findAndMutateMediaItem(item.children, mediaId, mutation) };
    }
    if (item.id === mediaId) {
      return mutation(item as MediaItem);
    }
    return item;
  });
};

// Helper to get items for the current path
const getItemsForPath = (rootItems: GalleryContentItem[], path: string[]): { items: GalleryContentItem[], breadcrumbs: { id: string, name: string }[], currentFolder?: Folder } => {
  if (!rootItems) return { items: [], breadcrumbs: [], currentFolder: undefined };

  let currentItems: GalleryContentItem[] = rootItems;
  const breadcrumbs: { id: string, name: string }[] = [{ id: 'root', name: 'Home' }];
  
  let currentFolder: Folder | undefined;
  for (const folderId of path) {
    currentFolder = currentItems.find(item => item.id === folderId && item.type === MediaType.FOLDER) as Folder;
    if (currentFolder) {
      currentItems = currentFolder.children;
      breadcrumbs.push({ id: currentFolder.id, name: currentFolder.name });
    } else {
      // Path is invalid, return root
      return { items: rootItems.filter(item => !item.isDeleted), breadcrumbs: [{ id: 'root', name: 'Home' }], currentFolder: undefined };
    }
  }

  return { items: currentItems.filter(item => !item.isDeleted), breadcrumbs, currentFolder };
};


const parseFileSize = (sizeStr: string): number => {
  if (!sizeStr) return 0;
  const parts = sizeStr.split(' ');
  if (parts.length < 2) return parseFloat(sizeStr) || 0;
  
  const value = parseFloat(parts[0]);
  const unit = parts[1].toUpperCase();

  if (isNaN(value)) return 0;

  switch (unit) {
    case 'KB': return value * 1024;
    case 'MB': return value * 1024 * 1024;
    case 'GB': return value * 1024 * 1024 * 1024;
    case 'TB': return value * 1024 * 1024 * 1024 * 1024;
    case 'B':
    default: return value;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Helper function for downloads
const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.setAttribute('target', '_blank'); // Fallback for some browsers
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

interface MediaInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItem: MediaItem | null;
  path: string;
  user: User | null;
}

const MediaInfoModal: React.FC<MediaInfoModalProps> = ({ isOpen, onClose, mediaItem, path, user }) => {
  if (!isOpen || !mediaItem || !user) return null;

  const isLiked = mediaItem.likedBy.includes(user.id);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-info-title"
    >
      <div
        className="relative bg-[var(--color-bg-secondary)] w-full max-w-sm rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 id="media-info-title" className="text-xl font-bold text-[var(--color-text-primary)] mb-6 truncate">
            File Details
          </h2>

          <div className="space-y-3 text-sm">
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="font-semibold text-[var(--color-text-primary)]">Filename</span> <span className="text-right text-[var(--color-text-secondary)] truncate ml-4" title={mediaItem.title}>{mediaItem.title}</span></div>
              <div className="flex justify-between items-start"><span className="font-semibold text-[var(--color-text-primary)] flex-shrink-0 mr-4">Path</span> <span className="text-right text-[var(--color-text-secondary)]" title={path}>{path}</span></div>
              <div className="flex justify-between items-center"><span className="font-semibold text-[var(--color-text-primary)]">Dimensions</span> <span className="text-[var(--color-text-secondary)]">{mediaItem.width} x {mediaItem.height}</span></div>
              <div className="flex justify-between items-center"><span className="font-semibold text-[var(--color-text-primary)]">Date Taken</span> <span className="text-[var(--color-text-secondary)]">{new Date(mediaItem.date).toLocaleString()}</span></div>
              <div className="flex justify-between items-center"><span className="font-semibold text-[var(--color-text-primary)]">File Size</span> <span className="text-[var(--color-text-secondary)]">{mediaItem.fileSize}</span></div>
              {mediaItem.description && (
                <div className="pt-2">
                  <p className="font-semibold mb-1 text-[var(--color-text-primary)]">Description</p>
                  <p className="text-[var(--color-text-secondary)] whitespace-pre-wrap break-words">{mediaItem.description}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[var(--color-border)]">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[var(--color-text-primary)]">Liked by you</span>
                  {isLiked ? (
                    <span className="flex items-center gap-1.5 text-red-400 font-medium">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                      Yes
                    </span>
                  ) : (
                    <span className="text-[var(--color-text-secondary)]">No</span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[var(--color-text-primary)]">Comment added</span>
                  {mediaItem.comment ? (
                    <span className="flex items-center gap-1.5 text-[var(--color-accent)] font-medium">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h14a1 1 0 011 1v10a1 1 0 01-1 1H9l-4 4v-4H3a1 1 0 01-1-1V3z" /></svg>
                      Yes
                    </span>
                  ) : (
                    <span className="text-[var(--color-text-secondary)]">No</span>
                  )}
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

interface ThemePreviewProps {
    themeName: Theme;
    accentColor: string;
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ themeName, accentColor }) => {
    const themeColors = {
        light: { bg: '#F9FAFB', secondary: '#FFFFFF', tertiary: '#F3F4F6', border: '#E5E7EB' },
        dark: { bg: '#111827', secondary: '#1F2937', tertiary: '#374151', border: '#4B5563' },
        twilight: { bg: '#1E293B', secondary: '#334155', tertiary: '#475569', border: '#64748B' },
        midnight: { bg: '#0F172A', secondary: '#020617', tertiary: '#1E293B', border: '#334155' },
        ocean: { bg: '#F0F9FF', secondary: '#FFFFFF', tertiary: '#E0F2FE', border: '#BAE6FD' },
    };

    if (themeName === 'system') {
        return (
            <div className="h-full w-full rounded-md border border-[var(--color-border)] overflow-hidden relative">
                <div className="absolute top-0 left-0 h-full w-1/2 p-1" style={{ backgroundColor: themeColors.light.bg }}>
                    <div className="w-1/3 h-1.5 rounded-full" style={{ backgroundColor: accentColor }}></div>
                    <div className="w-full h-4 mt-1 rounded-sm" style={{ backgroundColor: themeColors.light.secondary }}></div>
                </div>
                <div className="absolute top-0 right-0 h-full w-1/2 p-1" style={{ backgroundColor: themeColors.dark.bg }}>
                     <div className="w-1/3 h-1.5 rounded-full" style={{ backgroundColor: accentColor }}></div>
                     <div className="w-full h-4 mt-1 rounded-sm" style={{ backgroundColor: themeColors.dark.secondary }}></div>
                </div>
            </div>
        );
    }

    const colors = themeColors[themeName];
    return (
        <div className="h-full w-full rounded-md border p-1" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
            <div className="flex h-full gap-1">
                <div className="w-1/3 h-full rounded-sm" style={{ backgroundColor: colors.secondary }}>
                    <div className="p-1 space-y-0.5">
                         <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: accentColor }}></div>
                         <div className="h-1 w-full rounded-full" style={{ backgroundColor: colors.tertiary }}></div>
                         <div className="h-1 w-3/4 rounded-full" style={{ backgroundColor: colors.tertiary }}></div>
                    </div>
                </div>
                <div className="w-2/3 h-full rounded-sm p-1" style={{ backgroundColor: colors.secondary }}>
                     <div className="h-full w-full rounded-sm" style={{ backgroundColor: colors.tertiary }}></div>
                </div>
            </div>
        </div>
    );
};


interface GalleryPageProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  accent: string;
  setAccent: React.Dispatch<React.SetStateAction<string>>;
  gridColumns: number;
  setGridColumns: React.Dispatch<React.SetStateAction<number>>;
  columnConfig: { min: number, max: number };
  textAlign: TextAlign;
  setTextAlign: React.Dispatch<React.SetStateAction<TextAlign>>;
}

const Spinner: React.FC = () => (
  <svg className="animate-spin h-10 w-10 text-[var(--color-accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const SmallSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

const filterIcons: Record<FilterOption, React.ReactElement> = {
    all: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
    photos: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    videos: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
    folders: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
    liked: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>,
    commented: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
};

const findPathStringForMediaItem = (items: GalleryContentItem[], mediaId: string, currentPath: string[] = ['Home']): string | null => {
    for (const item of items) {
        if (item.id === mediaId) {
            return currentPath.join(' / ');
        }
        if (item.type === MediaType.FOLDER) {
            const foundPath = findPathStringForMediaItem(item.children, mediaId, [...currentPath, item.name]);
            if (foundPath) {
                return foundPath;
            }
        }
    }
    return null;
};

export const GalleryPage: React.FC<GalleryPageProps> = ({ user, onLogout, onUpdateUser, theme, setTheme, accent, setAccent, gridColumns, setGridColumns, columnConfig, textAlign, setTextAlign }) => {
  const [galleryContent, setGalleryContent] = useState<GalleryContentItem[] | null>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [specialView, setSpecialView] = useState<SpecialView>('none');
  
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [profileDropdownView, setProfileDropdownView] = useState<'main' | 'themes'>('main');

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [commentingMediaItem, setCommentingMediaItem] = useState<MediaItem | null>(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isTutorialsModalOpen, setIsTutorialsModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isBatchCommentModalOpen, setIsBatchCommentModalOpen] = useState(false);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [displayedFolderInfo, setDisplayedFolderInfo] = useState<{ info: FolderInfo, path: string } | null>(null);
  const [displayedMediaInfo, setDisplayedMediaInfo] = useState<{ item: MediaItem, path: string } | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isBackToTopVisible, setIsBackToTopVisible] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isAdjustmentsOpen, setIsAdjustmentsOpen] = useState(false);
  const adjustmentsDropdownRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  const itemRefs = useRef(new Map<string, HTMLDivElement | null>());
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, width: number, height: number, startX: number, startY: number } | null>(null);

  const [isBreadcrumbMenuOpen, setIsBreadcrumbMenuOpen] = useState(false);
  const breadcrumbMenuRef = useRef<HTMLDivElement>(null);

  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');


  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const handleSearchBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // If the related target (where focus is going) is inside the adjustments dropdown container,
    // don't close the search bar. This prevents closing when clicking the adjustments button.
    if (adjustmentsDropdownRef.current && adjustmentsDropdownRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    if (!searchQuery) {
      setIsSearchExpanded(false);
    }
  };

  useEffect(() => {
    if (isSearchExpanded && window.innerWidth < 640) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchExpanded]);


  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsBackToTopVisible(true);
      } else {
        setIsBackToTopVisible(false);
      }
    };
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const element = headerRef.current;
    if (!element) return;
    const updateHeaderHeight = () => { 
        const height = element.offsetHeight;
        setHeaderHeight(height); 
        document.documentElement.style.setProperty('--header-height', `${height}px`);
    };
    updateHeaderHeight();
    const resizeObserver = new ResizeObserver(updateHeaderHeight);
    resizeObserver.observe(element);
    // Rerunning on isSelectMode ensures the height is recalculated when the selection bar appears/disappears
    return () => { 
        resizeObserver.unobserve(element); 
        document.documentElement.style.removeProperty('--header-height');
    };
  }, [isSelectMode, specialView]);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { gallery } = await getMediaForUser(user.id);
        setGalleryContent(gallery);
      } catch (err) {
        if (err instanceof Error) { setError(err.message); } 
        else { setError('An unknown error occurred while fetching media.'); }
      } finally {
        setIsLoading(false);
      }
    };
    fetchMedia();
  }, [user.id]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
        setTimeout(() => setProfileDropdownView('main'), 300);
      }
      if (adjustmentsDropdownRef.current && !adjustmentsDropdownRef.current.contains(event.target as Node)) {
        setIsAdjustmentsOpen(false);
      }
      if (breadcrumbMenuRef.current && !breadcrumbMenuRef.current.contains(event.target as Node)) {
        setIsBreadcrumbMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleSelectMode = () => {
    setIsSelectMode(prev => !prev);
    setSelectedIds(new Set());
    setIsProfileDropdownOpen(false);
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) { newSet.delete(id); } else { newSet.add(id); }
      return newSet;
    });
  };

  const handleDownloadSelected = () => {
    const itemsToDownload = processedItems.filter(item => selectedIds.has(item.id) && item.type !== MediaType.FOLDER) as MediaItem[];
    if (itemsToDownload.length === 0) {
        setToast({ message: "No files selected to download.", type: 'info' });
        return;
    }

    setToast({ message: `Starting download for ${itemsToDownload.length} item(s). Please allow multiple downloads.`, type: 'info' });

    itemsToDownload.forEach((item, index) => {
        setTimeout(() => {
            downloadFile(item.url, item.title);
        }, index * 300); // Stagger downloads slightly
    });
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleLike = async (mediaId: string) => {
    if (!galleryContent) return;
    const originalContent = JSON.parse(JSON.stringify(galleryContent));

    // Optimistic update
    const newContent = findAndMutateMediaItem(galleryContent, mediaId, (item) => {
      const isLiked = item.likedBy.includes(user.id);
      const newLikedBy = isLiked ? item.likedBy.filter(id => id !== user.id) : [...item.likedBy, user.id];
      return { ...item, likedBy: newLikedBy };
    });
    setGalleryContent(newContent);

    try {
      await new Promise((resolve, reject) => setTimeout(() => {
        if (mediaId === 'p2') { // Simulate a failure case for demonstration
          reject(new Error('Network error. Could not save like.'));
        } else {
          resolve(true);
        }
      }, 500));
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to update like.', type: 'error' });
      setGalleryContent(originalContent);
    }
  };

  const handleSetComment = async (mediaId: string, commentText: string): Promise<void> => {
    if (!galleryContent) return Promise.reject(new Error("Gallery content not loaded."));;
    
    const originalContent = JSON.parse(JSON.stringify(galleryContent));
    const newText = commentText.trim();
    const finalComment = newText.length > 0 ? newText : null;
    
    const newContent = findAndMutateMediaItem(galleryContent, mediaId, (item) => ({ ...item, comment: finalComment }));
    setGalleryContent(newContent);

    try {
        await new Promise((resolve, reject) => setTimeout(() => {
            // Simulate a failure case for demonstration
            if (commentText.toLowerCase().includes('fail')) {
                reject(new Error("Failed to save comment due to server policy."));
            }
            resolve(true);
        }, 800));
        setToast({ message: 'Comment saved successfully!', type: 'success' });
    } catch (err) {
        setGalleryContent(originalContent);
        const error = err instanceof Error ? err : new Error('An unknown error occurred.');
        setToast({ message: error.message, type: 'error' });
        throw error; // Propagate error to modal to handle UI state
    }
  };
  
  const handleFolderClick = (folderId: string) => {
    if (isSelectMode) { handleToggleSelectItem(folderId); } 
    else { setCurrentPath(prevPath => [...prevPath, folderId]); }
  };
  
  const handleBreadcrumbClick = (pathIndex: number) => {
    setCurrentPath(prevPath => prevPath.slice(0, pathIndex));
  }

  const { items: currentItems, breadcrumbs, currentFolder } = galleryContent ? getItemsForPath(galleryContent, currentPath) : { items: [], breadcrumbs: [], currentFolder: undefined };

  const calculateFolderInfo = useMemo(() => {
    const getFolderStats = (items: GalleryContentItem[], userId: string): {
        folderCount: number; photoCount: number; videoCount: number;
        totalSizeInBytes: number; likedCount: number; commentCount: number;
        dates: number[];
    } => {
        let stats = { folderCount: 0, photoCount: 0, videoCount: 0, totalSizeInBytes: 0, likedCount: 0, commentCount: 0, dates: [] as number[] };
        for (const item of items) {
            if (item.isDeleted) continue;
            if (item.type === MediaType.FOLDER) {
                stats.folderCount++;
                const subFolderStats = getFolderStats(item.children, userId);
                stats = { ...stats, folderCount: stats.folderCount + subFolderStats.folderCount, photoCount: stats.photoCount + subFolderStats.photoCount, videoCount: stats.videoCount + subFolderStats.videoCount, totalSizeInBytes: stats.totalSizeInBytes + subFolderStats.totalSizeInBytes, likedCount: stats.likedCount + subFolderStats.likedCount, commentCount: stats.commentCount + subFolderStats.commentCount };
                stats.dates.push(...subFolderStats.dates);
            } else {
                if (item.type === MediaType.PHOTO) stats.photoCount++;
                if (item.type === MediaType.VIDEO) stats.videoCount++;
                stats.totalSizeInBytes += parseFileSize(item.fileSize);
                if (item.likedBy.includes(userId)) stats.likedCount++;
                if (item.comment?.trim()) stats.commentCount++;
                stats.dates.push(new Date(item.date).getTime());
            }
        }
        return stats;
    };
    return (folder: Folder | { name: string; children: GalleryContentItem[] }, currentUser: User): FolderInfo => {
        const stats = getFolderStats(folder.children, currentUser.id);
        let dateRange: string | null = null;
        if (stats.dates.length > 0) {
            const minDate = new Date(Math.min(...stats.dates));
            const maxDate = new Date(Math.max(...stats.dates));
            const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
            dateRange = minDate.toDateString() === maxDate.toDateString() ? minDate.toLocaleDateString(undefined, options) : `${minDate.toLocaleDateString(undefined, options)} - ${maxDate.toLocaleDateString(undefined, options)}`;
        }
        return { name: folder.name, folderCount: stats.folderCount, photoCount: stats.photoCount, videoCount: stats.videoCount, totalCount: stats.folderCount + stats.photoCount + stats.videoCount, dateRange, totalSize: formatFileSize(stats.totalSizeInBytes), likedCount: stats.likedCount, commentCount: stats.commentCount };
    };
  }, []);

  const handleFolderInfoClick = (folder: Folder) => {
    if (!galleryContent) return;
    const info = calculateFolderInfo(folder, user);
    const path = findPathStringForMediaItem(galleryContent, folder.id) || 'Home';
    setDisplayedFolderInfo({ info, path });
  };

  const handleMediaInfoClick = (mediaItem: MediaItem) => {
    if (!galleryContent) return;
    const path = findPathStringForMediaItem(galleryContent, mediaItem.id) || 'Home';
    setDisplayedMediaInfo({ item: mediaItem, path });
  };
  
  const allMediaItems = useMemo(() => {
    if (!galleryContent) return [];
    const flatten = (items: GalleryContentItem[]): GalleryContentItem[] => {
        let all: GalleryContentItem[] = [];
        for (const item of items) {
            all.push(item);
            if (item.type === MediaType.FOLDER) {
                all = all.concat(flatten(item.children));
            }
        }
        return all;
    };
    return flatten(galleryContent);
  }, [galleryContent]);

    const handleSetSelection = async (mediaId: string, selection: SelectionType) => {
        if (!galleryContent) return;
        const originalContent = JSON.parse(JSON.stringify(galleryContent));
    
        const newContent = findAndMutateMediaItem(galleryContent, mediaId, (item) => {
            return { ...item, selection };
        });
        setGalleryContent(newContent);
    
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          setToast({ message: `Selection updated.`, type: 'success' });
        } catch (err) {
          setToast({ message: 'Failed to update selection.', type: 'error' });
          setGalleryContent(originalContent);
        }
    };

  const processedItems = useMemo(() => {
    let sourceItems: GalleryContentItem[];

    if (specialView === 'liked') {
        sourceItems = allMediaItems.filter(item => item.type !== MediaType.FOLDER && item.likedBy.includes(user.id) && !item.isDeleted) as MediaItem[];
    } else if (specialView === 'commented') {
        sourceItems = allMediaItems.filter(item => item.type !== MediaType.FOLDER && !!item.comment?.trim() && !item.isDeleted) as MediaItem[];
    } else if (specialView === 'deleted') {
        sourceItems = allMediaItems.filter(item => item.isDeleted);
    } else {
        sourceItems = currentItems;
    }

    let filteredItems = sourceItems.filter(item => {
        const isFolderSort = sortOption.startsWith('date');
        const isSpecialFilter = !['all', 'folders'].includes(filterOption);
        
        if (isFolderSort && item.type === MediaType.FOLDER) {
            return false;
        }

        if (isSpecialFilter && item.type === MediaType.FOLDER) {
            return false;
        }
        
        switch (filterOption) {
            case 'all':
                return true;
            case 'photos':
                return item.type === MediaType.PHOTO;
            case 'videos':
                return item.type === MediaType.VIDEO;
            case 'folders':
                return item.type === MediaType.FOLDER;
            case 'liked':
                if (item.type === MediaType.FOLDER) return false;
                return item.likedBy.includes(user.id);
            case 'commented':
                if (item.type === MediaType.FOLDER) return false;
                return !!item.comment?.trim();
            default:
                return true;
        }
    });

    let searchedItems = filteredItems;
    if (searchQuery.trim() !== '') {
        const lowercasedQuery = searchQuery.toLowerCase();
        searchedItems = filteredItems.filter(item => {
            if (item.type === MediaType.FOLDER) {
                // Folders don't appear in 'commented' views, but this check is robust.
                return item.name.toLowerCase().includes(lowercasedQuery);
            }
            // item is MediaItem
            const isCommentFiltered = specialView === 'commented' || filterOption === 'commented';

            const titleMatch = item.title.toLowerCase().includes(lowercasedQuery);
            if (isCommentFiltered) {
                // If filtering by comments, search within the comment text OR the title.
                const commentMatch = item.comment?.toLowerCase().includes(lowercasedQuery);
                return titleMatch || !!commentMatch;
            }
            
            // Otherwise, search by title only.
            return titleMatch;
        });
    }

    // Sort items: folders always come first, then files sorted by the selected option.
    switch (sortOption) {
      case 'name-asc':
        return [...searchedItems].sort((a, b) => {
          if (a.type === MediaType.FOLDER && b.type !== MediaType.FOLDER) return -1;
          if (a.type !== MediaType.FOLDER && b.type === MediaType.FOLDER) return 1;
          const nameA = a.type === MediaType.FOLDER ? (a as Folder).name : (a as MediaItem).title;
          const nameB = b.type === MediaType.FOLDER ? (b as Folder).name : (b as MediaItem).title;
          return nameA.localeCompare(nameB);
        });
      case 'name-desc':
        return [...searchedItems].sort((a, b) => {
          if (a.type === MediaType.FOLDER && b.type !== MediaType.FOLDER) return -1;
          if (a.type !== MediaType.FOLDER && b.type === MediaType.FOLDER) return 1;
          const nameA = a.type === MediaType.FOLDER ? (a as Folder).name : (a as MediaItem).title;
          const nameB = b.type === MediaType.FOLDER ? (b as Folder).name : (b as MediaItem).title;
          return nameB.localeCompare(nameA);
        });
      case 'date-asc':
        return [...searchedItems].sort((a, b) => {
          if (a.type === MediaType.FOLDER && b.type !== MediaType.FOLDER) return -1;
          if (a.type !== MediaType.FOLDER && b.type === MediaType.FOLDER) return 1;
          if (a.type === MediaType.FOLDER) { // Both are folders, sort by name
            return a.name.localeCompare((b as Folder).name);
          }
          // Both are media items, sort by date
          return new Date((a as MediaItem).date).getTime() - new Date((b as MediaItem).date).getTime();
        });
      case 'size-desc':
        return [...searchedItems].sort((a, b) => {
          if (a.type === MediaType.FOLDER && b.type !== MediaType.FOLDER) return -1;
          if (a.type !== MediaType.FOLDER && b.type === MediaType.FOLDER) return 1;
          if (a.type === MediaType.FOLDER) { // Both are folders, sort by name
            return a.name.localeCompare((b as Folder).name);
          }
          // Both are media items, sort by size
          return parseFileSize((b as MediaItem).fileSize) - parseFileSize((a as MediaItem).fileSize);
        });
      case 'size-asc':
        return [...searchedItems].sort((a, b) => {
          if (a.type === MediaType.FOLDER && b.type !== MediaType.FOLDER) return -1;
          if (a.type !== MediaType.FOLDER && b.type === MediaType.FOLDER) return 1;
          if (a.type === MediaType.FOLDER) { // Both are folders, sort by name
            return a.name.localeCompare((b as Folder).name);
          }
          // Both are media items, sort by size
          return parseFileSize((a as MediaItem).fileSize) - parseFileSize((b as MediaItem).fileSize);
        });
      case 'date-desc':
      default:
        return [...searchedItems].sort((a, b) => {
          if (a.type === MediaType.FOLDER && b.type !== MediaType.FOLDER) return -1;
          if (a.type !== MediaType.FOLDER && b.type === MediaType.FOLDER) return 1;
          if (a.type === MediaType.FOLDER) { // Both are folders, sort by name
            return a.name.localeCompare((b as Folder).name);
          }
          // Both are media items, sort by date
          return new Date((b as MediaItem).date).getTime() - new Date((a as MediaItem).date).getTime();
        });
    }
  }, [currentItems, allMediaItems, specialView, searchQuery, filterOption, sortOption, user.id]);

  const displayableMedia = useMemo(() => {
    return processedItems.filter(item => item.type === MediaType.PHOTO || item.type === MediaType.VIDEO) as MediaItem[];
  }, [processedItems]);

  const areAllSelected = useMemo(() => {
    if (processedItems.length === 0) return false;
    return processedItems.every(item => selectedIds.has(item.id));
  }, [processedItems, selectedIds]);

  const selectedMediaItems = useMemo(() => {
    return processedItems.filter(item => selectedIds.has(item.id) && item.type !== MediaType.FOLDER) as MediaItem[];
  }, [processedItems, selectedIds]);

  const areAllSelectedLiked = useMemo(() => {
    if (selectedMediaItems.length === 0) return false;
    return selectedMediaItems.every(item => item.likedBy.includes(user.id));
  }, [selectedMediaItems, user.id]);

  const handleToggleSelectAll = () => {
    if (areAllSelected) { setSelectedIds(new Set()); } 
    else { setSelectedIds(new Set(processedItems.map(item => item.id))); }
  };
  
  const handleOpenDetails = (mediaItem: MediaItem) => {
    const index = displayableMedia.findIndex(item => item.id === mediaItem.id);
    if (index !== -1) {
        setSelectedMediaIndex(index);
    }
  };

  const handleMediaClick = (mediaItem: MediaItem) => {
      if (isSelectMode) { handleToggleSelectItem(mediaItem.id); } 
      else {
          handleOpenDetails(mediaItem);
      }
  }

  const handleCommentIconClick = (mediaItem: MediaItem) => {
      if (isSelectMode) {
          handleToggleSelectItem(mediaItem.id);
      } else {
          setCommentingMediaItem(mediaItem);
      }
  };

  const handleNavigation = (direction: 'next' | 'previous') => {
    if (selectedMediaIndex === null) return;
    const newIndex = direction === 'next' ? selectedMediaIndex + 1 : selectedMediaIndex - 1;
    if (newIndex >= 0 && newIndex < displayableMedia.length) { setSelectedMediaIndex(newIndex); }
  };
  
  const downloadFiles = (filesToDownload: MediaItem[], startMessage: string, emptyMessage: string) => {
    if (filesToDownload.length === 0) {
        setToast({ message: emptyMessage, type: 'info' });
        return;
    }
    setToast({ message: startMessage, type: 'info' });
    filesToDownload.forEach((item, index) => {
        setTimeout(() => {
            downloadFile(item.url, item.title);
        }, index * 300); // Stagger downloads
    });
  };

  const handleDownloadAction = (type: 'current' | 'recursive' | 'all' | 'liked' | 'commented') => {
    let filesToDownload: MediaItem[] = [];
    let startMessage = '';
    let emptyMessage = '';

    switch (type) {
        case 'current':
            filesToDownload = currentItems.filter(item => item.type !== MediaType.FOLDER) as MediaItem[];
            startMessage = `Downloading ${filesToDownload.length} file(s) from this folder...`;
            emptyMessage = "There are no files in the current folder to download.";
            break;

        case 'recursive': {
            let items: GalleryContentItem[] = [];
            if (currentPath.length > 0) {
                let currentFolder: Folder | undefined;
                let currentLevel = galleryContent || [];
                for (const folderId of currentPath) {
                    currentFolder = currentLevel.find(item => item.id === folderId) as Folder;
                    if (currentFolder) currentLevel = currentFolder.children;
                    else { currentFolder = undefined; break; }
                }
                if (currentFolder) items = [currentFolder];
            } else {
                items = galleryContent || [];
            }
            const collectFiles = (galleryItems: GalleryContentItem[]): MediaItem[] => {
                let allFiles: MediaItem[] = [];
                for (const item of galleryItems) {
                    if (item.type === MediaType.FOLDER && !item.isDeleted) {
                        allFiles = allFiles.concat(collectFiles(item.children));
                    } else if (item.type !== MediaType.FOLDER && !item.isDeleted) {
                        allFiles.push(item);
                    }
                }
                return allFiles;
            };
            filesToDownload = collectFiles(items);
            startMessage = `Downloading ${filesToDownload.length} file(s) from this folder and its subfolders...`;
            emptyMessage = "There are no files in this folder or its subfolders to download.";
            break;
        }

        case 'all': {
            const allFiles = allMediaItems.filter(item => item.type !== MediaType.FOLDER && !item.isDeleted) as MediaItem[];
            filesToDownload = allFiles;
            startMessage = `Downloading all ${filesToDownload.length} file(s) from the gallery...`;
            emptyMessage = "There are no files in the gallery to download.";
            break;
        }

        case 'liked':
            filesToDownload = allMediaItems.filter(item => item.type !== MediaType.FOLDER && item.likedBy.includes(user.id) && !item.isDeleted) as MediaItem[];
            startMessage = `Downloading ${filesToDownload.length} liked file(s)...`;
            emptyMessage = "You haven't liked any files to download.";
            break;

        case 'commented':
            filesToDownload = allMediaItems.filter(item => item.type !== MediaType.FOLDER && !!item.comment?.trim() && !item.isDeleted) as MediaItem[];
            startMessage = `Downloading ${filesToDownload.length} commented file(s)...`;
            emptyMessage = "There are no files with comments to download.";
            break;
    }

    downloadFiles(filesToDownload, startMessage, emptyMessage);
  };


  const handleSubmitClick = () => {
      setIsProfileDropdownOpen(false);
      setIsSubmitModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
      setIsSubmittingApproval(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setToast({ message: "Gallery submitted for approval. Thank you!", type: 'success' });
      setIsSubmitModalOpen(false);
      setIsSubmittingApproval(false);
  };

  const handleInitiateSelectMode = (itemId: string) => {
    if (isSelectMode) return;
    setIsSelectMode(true);
    setSelectedIds(new Set([itemId]));
  };
  
  const handleLikeSelected = async () => {
    if (!galleryContent || selectedMediaItems.length === 0) return;
    const originalContent = JSON.parse(JSON.stringify(galleryContent));
    const mediaIdsToUpdate = new Set(selectedMediaItems.map(item => item.id));
    const shouldLike = !areAllSelectedLiked;

    const findAndMutate = (items: GalleryContentItem[]): GalleryContentItem[] => {
        return items.map(item => {
            if (item.type === MediaType.FOLDER) {
                return { ...item, children: findAndMutate(item.children) };
            }
            if (mediaIdsToUpdate.has(item.id)) {
                const mediaItem = item as MediaItem;
                const isLiked = mediaItem.likedBy.includes(user.id);
                if (shouldLike && !isLiked) {
                    return { ...mediaItem, likedBy: [...mediaItem.likedBy, user.id] };
                }
                if (!shouldLike && isLiked) {
                    return { ...mediaItem, likedBy: mediaItem.likedBy.filter(id => id !== user.id) };
                }
            }
            return item;
        });
    };
    setGalleryContent(findAndMutate(galleryContent));

    try {
        await new Promise(resolve => setTimeout(resolve, 800));
        setToast({ message: `${shouldLike ? 'Liked' : 'Unliked'} ${selectedMediaItems.length} item(s).`, type: 'success' });
    } catch (err) {
        setGalleryContent(originalContent);
        setToast({ message: 'Failed to update likes.', type: 'error' });
    }
  };

  const handleSetBatchComment = async (commentText: string): Promise<void> => {
    if (!galleryContent || selectedMediaItems.length === 0) return Promise.reject(new Error("No items to update."));
    
    const originalContent = JSON.parse(JSON.stringify(galleryContent));
    const mediaIdsToUpdate = new Set(selectedMediaItems.map(item => item.id));
    const newText = commentText.trim();
    const finalComment = newText.length > 0 ? newText : null;
    
    const findAndMutate = (items: GalleryContentItem[]): GalleryContentItem[] => {
        return items.map(item => {
            if (item.type === MediaType.FOLDER) {
                return { ...item, children: findAndMutate(item.children) };
            }
            if (mediaIdsToUpdate.has(item.id)) {
                return { ...(item as MediaItem), comment: finalComment };
            }
            return item;
        });
    };
    setGalleryContent(findAndMutate(galleryContent));
    setIsBatchCommentModalOpen(false);

    try {
        await new Promise(resolve => setTimeout(resolve, 800));
        setToast({ message: `Comment added to ${selectedMediaItems.length} item(s).`, type: 'success' });
    } catch (err) {
        setGalleryContent(originalContent);
        setToast({ message: 'Failed to save comment on items.', type: 'error' });
    }
  };

  const modifyItemsDeletedState = (isDeleted: boolean) => {
    if (!galleryContent) return;
    const idsToModify = selectedIds;
    const modifyRecursively = (items: GalleryContentItem[]): GalleryContentItem[] => {
        return items.map(item => {
            if (idsToModify.has(item.id)) {
                return { ...item, isDeleted };
            }
            if (item.type === MediaType.FOLDER) {
                return { ...item, children: modifyRecursively(item.children) };
            }
            return item;
        });
    };
    setGalleryContent(modifyRecursively(galleryContent));
    const message = isDeleted ? `Moved ${idsToModify.size} item(s) to Recycle Bin.` : `Restored ${idsToModify.size} item(s).`;
    setToast({ message, type: 'success' });
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  const handleSoftDeleteSelected = () => modifyItemsDeletedState(true);
  const handleRestoreSelected = () => modifyItemsDeletedState(false);
  
  const handleSoftDeleteItem = (itemId: string) => {
    if (!galleryContent) return;
    const modifyRecursively = (items: GalleryContentItem[]): GalleryContentItem[] => {
        return items.map(item => {
            if (item.id === itemId) {
                return { ...item, isDeleted: true };
            }
            if (item.type === MediaType.FOLDER) {
                return { ...item, children: modifyRecursively(item.children) };
            }
            return item;
        });
    };
    setGalleryContent(modifyRecursively(galleryContent));
    
    // Close modal if it was open for this item
    if (selectedMediaIndex !== null && displayableMedia[selectedMediaIndex]?.id === itemId) {
        setSelectedMediaIndex(null);
    }
    setToast({ message: "Moved item to Recycle Bin.", type: 'success' });
  };
  
  const handlePermanentDeleteSelected = async () => {
    if (!galleryContent) return;
    setIsProcessingDelete(true);
    
    const idsToDelete = selectedIds;
    const deleteRecursively = (items: GalleryContentItem[]): GalleryContentItem[] => {
      return items.filter(item => !idsToDelete.has(item.id))
        .map(item => {
          if (item.type === MediaType.FOLDER) {
            return { ...item, children: deleteRecursively(item.children) };
          }
          return item;
        });
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setGalleryContent(deleteRecursively(galleryContent));
    setToast({ message: `Permanently deleted ${idsToDelete.size} item(s).`, type: 'success' });
    setSelectedIds(new Set());
    setIsSelectMode(false);
    setIsConfirmDeleteModalOpen(false);
    setIsProcessingDelete(false);
  };

  const handleMoveItem = (itemId: string) => {
    setSelectedIds(new Set([itemId]));
    setIsMoveModalOpen(true);
  };


  // Drag-to-select handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      // Only start drag on the main container, not on items themselves
      if (e.target !== e.currentTarget) return;
      e.preventDefault();
      setIsDraggingSelection(true);
      if (!isSelectMode) {
          setIsSelectMode(true);
          setSelectedIds(new Set()); // Start with a fresh selection
      }
      setSelectionBox({
          x: e.clientX,
          y: e.clientY,
          width: 0,
          height: 0,
          startX: e.clientX,
          startY: e.clientY,
      });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDraggingSelection || !selectionBox) return;
      e.preventDefault();
      const currentX = e.clientX;
      const currentY = e.clientY;
      const newBox = {
          ...selectionBox,
          x: Math.min(currentX, selectionBox.startX),
          y: Math.min(currentY, selectionBox.startY),
          width: Math.abs(currentX - selectionBox.startX),
          height: Math.abs(currentY - selectionBox.startY),
      };
      setSelectionBox(newBox);
      
      const newSelectedIds = new Set<string>();
      processedItems.forEach(item => {
          const itemEl = itemRefs.current.get(item.id);
          if (itemEl) {
              const itemRect = itemEl.getBoundingClientRect();
              const boxRect = { left: newBox.x, top: newBox.y, right: newBox.x + newBox.width, bottom: newBox.y + newBox.height };
              // Intersection check
              if (itemRect.left < boxRect.right && itemRect.right > boxRect.left && itemRect.top < boxRect.bottom && itemRect.bottom > boxRect.top) {
                  newSelectedIds.add(item.id);
              }
          }
      });
      setSelectedIds(newSelectedIds);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDraggingSelection) return;
      setIsDraggingSelection(false);
      setSelectionBox(null);
  };

  const handleNewFolderClick = () => {
    setNewFolderName('');
    setIsNewFolderModalOpen(true);
    setIsBreadcrumbMenuOpen(false);
  };

  const handleConfirmNewFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !galleryContent) return;
    setIsCreatingFolder(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const newFolder: Folder = {
        id: `f-${Date.now()}-${Math.random()}`,
        type: MediaType.FOLDER,
        name: newFolderName.trim(),
        children: [],
    };
    
    const addFolderToPath = (items: GalleryContentItem[], path: string[]): GalleryContentItem[] => {
        if (path.length === 0) {
            return [...items, newFolder];
        }
        const [currentId, ...restPath] = path;
        return items.map(item => {
            if (item.id === currentId && item.type === MediaType.FOLDER) {
                return { ...item, children: addFolderToPath(item.children, restPath) };
            }
            return item;
        });
    };

    setGalleryContent(prevContent => {
        if (!prevContent) return [newFolder];
        return addFolderToPath(prevContent, currentPath);
    });
    
    setToast({ message: `Folder "${newFolder.name}" created.`, type: 'success' });
    setIsNewFolderModalOpen(false);
    setIsCreatingFolder(false);
  };

  const handleConfirmMove = (destinationFolderId: string | 'root' | null) => {
    if (!galleryContent || destinationFolderId === null) return;

    const idsToMove = selectedIds;
    let itemsToMove: GalleryContentItem[] = [];

    const findAndRemove = (items: GalleryContentItem[]): GalleryContentItem[] => {
        const keptItems: GalleryContentItem[] = [];
        for (const item of items) {
            if (idsToMove.has(item.id)) {
                itemsToMove.push(item);
            } else {
                if (item.type === MediaType.FOLDER) {
                    const newChildren = findAndRemove(item.children);
                    keptItems.push({ ...item, children: newChildren });
                } else {
                    keptItems.push(item);
                }
            }
        }
        return keptItems;
    };

    const contentAfterRemoval = findAndRemove(galleryContent);

    const findAndAdd = (items: GalleryContentItem[]): GalleryContentItem[] => {
        if (destinationFolderId === 'root') {
            return [...items, ...itemsToMove];
        }
        return items.map(item => {
            if (item.type === MediaType.FOLDER) {
                if (item.id === destinationFolderId) {
                    return { ...item, children: [...item.children, ...itemsToMove] };
                }
                return { ...item, children: findAndAdd(item.children) };
            }
            return item;
        });
    };

    const newGalleryContent = findAndAdd(contentAfterRemoval);

    setGalleryContent(newGalleryContent);

    setIsMoveModalOpen(false);
    setIsSelectMode(false);
    setSelectedIds(new Set());
    setToast({ message: `Moved ${itemsToMove.length} item(s) successfully.`, type: 'success' });
  };


  const currentFolderName = specialView === 'liked' ? 'Liked Files'
    : specialView === 'commented' ? 'Commented Files'
    : specialView === 'deleted' ? 'Recycle Bin'
    : breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 1].name : 'Loki Gallery';


  const renderContent = () => {
    if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner /></div>;
    if (error) return <EmptyState icon="error" title="Failed to Load Gallery" message={error} />;
    if (!processedItems || processedItems.length === 0) {
       if (specialView === 'liked') return <EmptyState icon="liked" title="No Liked Items" message="You haven't liked any photos or videos yet. Click the heart icon on any item to add it here!" />;
       if (specialView === 'commented') return <EmptyState icon="commented" title="No Comments Found" message="You haven't added any comments yet. Click the speech bubble on any item to add a comment." />;
       if (specialView === 'deleted') return <EmptyState icon="bin" title="Recycle Bin is Empty" message="Deleted items will appear here. You can restore them or delete them permanently." />;
       if (searchQuery.trim() !== '') return <EmptyState icon="search" title="No results found" message={`Your search for "${searchQuery}" did not return any results.`} />;
       return <EmptyState icon="empty" title="This folder is empty" message="There are no photos, videos, or folders here yet." />;
    }
    
    if (viewMode === 'list') {
        return (
            <div className="space-y-1 animated-grid">
                {/* Header for list view */}
                <div className="hidden md:grid grid-cols-[auto,1fr,150px,100px] gap-4 px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                    <div className="w-8"></div>
                    <div>Name</div>
                    <div>Date</div>
                    <div>Size</div>
                </div>
                {processedItems.map((item, index) => {
                    const isSelected = selectedIds.has(item.id);
                    const itemStyle = { '--i': index } as React.CSSProperties;
                    const name = item.type === MediaType.FOLDER ? item.name : item.title;
                    const date = item.type !== MediaType.FOLDER ? new Date(item.date).toLocaleDateString() : '—';
                    const size = item.type !== MediaType.FOLDER ? item.fileSize : '—';
                    const icon = {
                        [MediaType.FOLDER]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
                        [MediaType.PHOTO]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
                        [MediaType.VIDEO]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
                    };

                    return (
                        <div key={item.id} style={itemStyle} className={`grid grid-cols-[auto,1fr,auto] md:grid-cols-[auto,1fr,150px,100px] items-center gap-4 p-2 md:px-4 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-[var(--color-accent)] bg-opacity-20' : 'hover:bg-[var(--color-bg-tertiary)]'}`}
                            onClick={() => item.type === MediaType.FOLDER ? handleFolderClick(item.id) : handleMediaClick(item as MediaItem)}>
                            <div className="flex items-center space-x-4">
                                {isSelectMode && (
                                    <div onClick={(e) => { e.stopPropagation(); handleToggleSelectItem(item.id); }} className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`}>
                                        {isSelected && <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                )}
                                {icon[item.type]}
                            </div>
                            <span className="truncate font-medium text-[var(--color-text-primary)]" title={name}>{name}</span>
                            <span className="hidden md:block text-sm text-[var(--color-text-secondary)]">{date}</span>
                            <span className="hidden md:block text-sm text-[var(--color-text-secondary)]">{size}</span>
                             <div className="md:hidden text-right text-xs text-[var(--color-text-muted)]">
                                {item.type !== MediaType.FOLDER ? `${date} · ${size}` : 'Folder'}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
      <div 
        className="animated-grid"
        style={{ 
            columnCount: gridColumns,
            columnGap: '0.75rem' // Corresponds to gap-3 in Tailwind
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {processedItems.map((item, index) => {
          const isSelected = selectedIds.has(item.id);
          const itemStyle = { '--i': index } as React.CSSProperties;
          const setRef = (el: HTMLDivElement | null) => { itemRefs.current.set(item.id, el); };

          switch (item.type) {
            case MediaType.FOLDER:
              return <FolderItem ref={setRef} style={itemStyle} key={item.id} folder={item} isSelectMode={isSelectMode} isSelected={isSelected} onFolderClick={handleFolderClick} onDetails={handleFolderInfoClick} onDelete={handleSoftDeleteItem} onInitiateSelectMode={handleInitiateSelectMode} onMove={handleMoveItem} textAlign={textAlign} />;
            case MediaType.PHOTO:
              return <PhotoItem ref={setRef} style={itemStyle} key={item.id} photo={item} user={user} isSelectMode={isSelectMode} isSelected={isSelected} onMediaClick={handleMediaClick} onCommentClick={handleCommentIconClick} onDetails={handleMediaInfoClick} onLike={handleLike} onDelete={handleSoftDeleteItem} onInitiateSelectMode={handleInitiateSelectMode} onMove={handleMoveItem} textAlign={textAlign} onSetSelection={handleSetSelection} />;
            case MediaType.VIDEO:
              return <VideoItem ref={setRef} style={itemStyle} key={item.id} video={item} user={user} isSelectMode={isSelectMode} isSelected={isSelected} onMediaClick={handleMediaClick} onCommentClick={handleCommentIconClick} onDetails={handleMediaInfoClick} onLike={handleLike} onDelete={handleSoftDeleteItem} onInitiateSelectMode={handleInitiateSelectMode} onMove={handleMoveItem} textAlign={textAlign} onSetSelection={handleSetSelection} />;
            default: return null;
          }
        })}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
        <header ref={headerRef} className="sticky top-0 z-30 bg-[var(--color-bg-primary)] bg-opacity-80 backdrop-blur-md shadow-sm transition-all duration-300">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className={`flex items-center gap-4 ${isSearchExpanded ? 'hidden sm:flex' : 'flex'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        <h1 className="text-xl font-bold truncate min-w-0" title={currentFolderName}>{currentFolderName}</h1>
                    </div>
                    
                    <div className="flex items-center justify-end flex-1 gap-2">
                        {isSearchExpanded && <button onClick={() => setIsSearchExpanded(false)} className="p-2 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-full sm:hidden" aria-label="Close search"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>}
                        <div className={`relative flex items-center ${isSearchExpanded ? 'flex-1' : 'hidden sm:flex'}`}>
                            <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onBlur={handleSearchBlur} placeholder="Search..." className="transition-all duration-300 ease-in-out bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-transparent focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)] rounded-full h-10 pl-10 pr-10 w-full sm:w-48 focus:sm:w-64" />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                            {searchQuery && <button onClick={handleClearSearch} onMouseDown={(e) => e.preventDefault()} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]" aria-label="Clear search"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>}
                        </div>
                        
                        {!isSearchExpanded && <button onClick={() => setIsSearchExpanded(true)} className="p-2 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-full sm:hidden" aria-label="Open search"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>}
                        
                        <div ref={adjustmentsDropdownRef} className="relative">
                            <button onClick={() => setIsAdjustmentsOpen(p => !p)} className="relative flex items-center p-2 rounded-full hover:bg-[var(--color-bg-tertiary)] transition-colors" aria-label="Adjustments">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                                </svg>
                                {filterOption !== 'all' && (
                                    <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-[var(--color-accent)] ring-1 ring-[var(--color-bg-primary)]" />
                                )}
                            </button>
                             {isAdjustmentsOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-[var(--color-bg-secondary)] rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-40 fade-in">
                                    <div className="p-2 space-y-2">
                                        <div className="px-2 py-1">
                                            <label className="text-xs font-semibold text-[var(--color-text-muted)]">VIEW</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <button onClick={() => setViewMode('grid')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${viewMode === 'grid' ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-[var(--color-bg-tertiary)]'}`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                                    Grid
                                                </button>
                                                <button onClick={() => setViewMode('list')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${viewMode === 'list' ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-[var(--color-bg-tertiary)]'}`}>
                                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                                                    List
                                                </button>
                                            </div>
                                            {viewMode === 'grid' && (
                                                <>
                                                    <div className="mt-3">
                                                        <label htmlFor="grid-columns-slider" className="text-xs font-semibold text-[var(--color-text-muted)] flex justify-between items-center">
                                                            COLUMNS
                                                            <span className="font-normal text-sm text-[var(--color-text-secondary)]">{gridColumns}</span>
                                                        </label>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <input
                                                                id="grid-columns-slider"
                                                                type="range"
                                                                min={columnConfig.min}
                                                                max={columnConfig.max}
                                                                value={gridColumns}
                                                                onChange={(e) => setGridColumns(parseInt(e.target.value, 10))}
                                                                className="w-full h-2 bg-[var(--color-bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="mt-3">
                                                        <label className="text-xs font-semibold text-[var(--color-text-muted)]">TITLE ALIGNMENT</label>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <button title="Align left" onClick={() => setTextAlign('left')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${textAlign === 'left' ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-[var(--color-bg-tertiary)]'}`}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
                                                            </button>
                                                            <button title="Align center" onClick={() => setTextAlign('center')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${textAlign === 'center' ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-[var(--color-bg-tertiary)]'}`}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5m-16.5 4.5h16.5m-12.75 4.5h9" /></svg>
                                                            </button>
                                                            <button title="Align right" onClick={() => setTextAlign('right')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${textAlign === 'right' ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-[var(--color-bg-tertiary)]'}`}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-4.5 5.25h-9" /></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className="border-t border-[var(--color-border)]"></div>
                                        <div className="px-2 py-1">
                                            <label className="text-xs font-semibold text-[var(--color-text-muted)]">SORT BY</label>
                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                {(['name-asc', 'name-desc', 'size-desc', 'size-asc', 'date-desc', 'date-asc'] as SortOption[]).map(option => (
                                                    <button key={option} onClick={() => setSortOption(option)} className={`px-3 py-1.5 rounded-md text-sm text-left transition-colors ${sortOption === option ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-[var(--color-bg-tertiary)]'}`}>
                                                        { { 'date-desc': 'Date (Newest)', 'date-asc': 'Date (Oldest)', 'name-asc': 'Name (A-Z)', 'name-desc': 'Name (Z-A)', 'size-desc': 'Size (Largest)', 'size-asc': 'Size (Smallest)' }[option] }
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="border-t border-[var(--color-border)]"></div>
                                        <div className="px-2 py-1">
                                            <label className="text-xs font-semibold text-[var(--color-text-muted)]">FILTER</label>
                                            <div className="flex flex-col gap-1 mt-1">
                                                {(['all', 'photos', 'videos', 'folders', 'liked', 'commented'] as FilterOption[]).map(option => (
                                                    <button key={option} onClick={() => setFilterOption(option)} className={`flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-left transition-colors ${filterOption === option ? 'bg-[var(--color-accent)] text-white font-semibold' : 'hover:bg-[var(--color-bg-tertiary)]'}`}>
                                                        {filterIcons[option]}
                                                        <span>
                                                            { { 'all': 'All Items', 'photos': 'Photos Only', 'videos': 'Videos Only', 'folders': 'Folders Only', 'liked': 'Liked Only', 'commented': 'With Comments Only' }[option] }
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div ref={profileDropdownRef} className={`relative ${isSearchExpanded ? 'hidden sm:block' : 'block'}`}>
                            <button onClick={() => {
                                if (isProfileDropdownOpen && profileDropdownView !== 'main') {
                                    // If opening and not on main, do nothing, let it close
                                } else if (isProfileDropdownOpen) {
                                     // If closing, reset view after animation
                                    setTimeout(() => setProfileDropdownView('main'), 300);
                                }
                                setIsProfileDropdownOpen(p => !p)
                            }} className="flex items-center rounded-full hover:ring-2 hover:ring-offset-2 hover:ring-[var(--color-accent)] hover:ring-offset-[var(--color-bg-primary)] transition-all">
                                {user.profileImageUrl ? (
                                    <img src={user.profileImageUrl} alt="Profile" className="h-9 w-9 rounded-full object-cover" />
                                ) : (
                                    <div className="h-9 w-9 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-bold">{user.name.charAt(0)}</div>
                                )}
                            </button>
                            {isProfileDropdownOpen && (
                                <div
                                    className="absolute right-0 top-full mt-2 w-72 bg-[var(--color-bg-secondary)] rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-40 fade-in"
                                >
                                {profileDropdownView === 'themes' ? (
                                    <div className="fade-in">
                                        <div className="flex items-center p-2 border-b border-[var(--color-border)]">
                                            <button onClick={() => setProfileDropdownView('main')} className="p-2 rounded-full hover:bg-[var(--color-bg-tertiary)] transition-colors" aria-label="Back to main menu">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                                </svg>
                                            </button>
                                            <h4 className="font-semibold text-[var(--color-text-primary)] text-center flex-1 pr-9">Appearance</h4>
                                        </div>
                                        <div className="p-4 space-y-5">
                                            <div>
                                                <div className="text-xs font-bold tracking-wider text-[var(--color-text-muted)] uppercase mb-3">Theme</div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {themes.map(t => {
                                                        const isSelected = theme === t.name;
                                                        return (
                                                            <button 
                                                                key={t.name}
                                                                onClick={() => { setTheme(t.name); }}
                                                                className={`flex flex-col items-center p-1 rounded-lg transition-all duration-200 group ${isSelected ? '' : 'hover:bg-[var(--color-bg-tertiary)]'}`}
                                                            >
                                                                <div className={`w-full h-16 rounded-md transition-all duration-200 ${isSelected ? 'ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-bg-secondary)]' : 'ring-1 ring-inset ring-transparent group-hover:ring-[var(--color-accent)]'}`}>
                                                                    <ThemePreview themeName={t.name} accentColor={accentColors[accent].accent} />
                                                                </div>
                                                                <span className={`mt-2 text-sm font-medium transition-colors ${isSelected ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                                                                    {t.label}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold tracking-wider text-[var(--color-text-muted)] uppercase mb-3">Accent Color</div>
                                                <div className="flex justify-around items-center">
                                                    {Object.entries(accentColors).map(([name, { accent: color }]) => (
                                                        <button 
                                                            key={name}
                                                            title={name.charAt(0).toUpperCase() + name.slice(1)}
                                                            onClick={() => setAccent(name)}
                                                            className={`h-8 w-8 rounded-full transition-all duration-200 transform hover:scale-125 focus:outline-none ${accent === name ? 'scale-110 ring-4 ring-offset-2 ring-[var(--color-accent)] ring-offset-[var(--color-bg-secondary)]' : 'ring-1 ring-inset ring-white/20'}`}
                                                            style={{ backgroundColor: color }}
                                                        >
                                                            {accent === name && (
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white m-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden">
                                        <div className="pb-2">
                                            <button
                                                onClick={() => { setIsEditProfileModalOpen(true); setIsProfileDropdownOpen(false); }}
                                                className="w-full flex items-center justify-between gap-4 text-left p-4 h-[85px] border-b border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    {user.profileImageUrl ? (
                                                        <img src={user.profileImageUrl} alt="Profile" className="h-14 w-14 rounded-full object-cover flex-shrink-0" />
                                                    ) : (
                                                        <div className="h-14 w-14 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">{user.name.charAt(0)}</div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-lg text-[var(--color-text-primary)] truncate capitalize">{user.name}</p>

                                                        <p className="text-sm text-[var(--color-text-muted)]">@{user.username}</p>
                                                    </div>
                                                </div>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--color-text-muted)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                            
                                            <div>
                                                <div className="px-3 pt-3 pb-1 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Gallery Actions</div>
                                                <div className="px-2">
                                                    <button onClick={() => { setSpecialView('liked'); setIsProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 text-left p-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                                                        <span>Liked Files</span>
                                                    </button>
                                                    <button onClick={() => { setSpecialView('commented'); setIsProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 text-left p-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                                        <span>Commented Files</span>
                                                    </button>
                                                    <button onClick={() => { setSpecialView('deleted'); setIsProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 text-left p-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        <span>Recycle Bin</span>
                                                    </button>
                                                    <button onClick={() => { setIsDownloadModalOpen(true); setIsProfileDropdownOpen(false); }} disabled={specialView === 'deleted'} className="w-full flex items-center gap-3 text-left p-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                                        </svg>
                                                        <span>Download All...</span>
                                                    </button>
                                                    <button onClick={handleSubmitClick} className="w-full flex items-center gap-3 text-left p-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span>Submit for Approval</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="my-2 border-t border-[var(--color-border)]"></div>
                                            
                                            <div>
                                                <div className="px-3 pt-1 pb-1 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Application</div>
                                                <div className="px-2">
                                                    <button 
                                                        onClick={() => setProfileDropdownView('themes')}
                                                        className="w-full flex items-center justify-between gap-3 text-left p-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4Zm0 0h12.5M16 21h-3.25m-4-15h2.5" />
                                                            </svg>
                                                            <span>Themes & Appearance</span>
                                                        </div>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                                    </button>
                                                    <button onClick={() => { setIsTutorialsModalOpen(true); setIsProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 text-left p-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        <span>User Guide</span>
                                                    </button>
                                                    <button onClick={() => { setIsFeedbackModalOpen(true); setIsProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 text-left p-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" /></svg>
                                                        <span>Send Feedback</span>
                                                    </button>
                                                    <button onClick={() => { setIsAboutModalOpen(true); setIsProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 text-left p-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        <span>About</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-[var(--color-border)] mt-2">
                                                <div className="px-2">
                                                    <button onClick={onLogout} className="w-full flex items-center gap-3 text-left p-2 rounded-md text-sm text-[var(--color-danger)] opacity-80 hover:opacity-100 hover:bg-[var(--color-danger)] hover:text-white transition-all">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" /></svg>
                                                        <span>Logout</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {!isSelectMode && (
                        <div className="flex items-center justify-between gap-4 py-2 border-t border-[var(--color-border)]">
                            {specialView !== 'none' ? (
                                <button onClick={() => setSpecialView('none')} className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                    <span>Back to Gallery</span>
                                </button>
                            ) : (
                                <div className="flex items-center text-sm font-medium overflow-x-auto whitespace-nowrap scrollbar-hide min-w-0">
                                    {breadcrumbs.map((crumb, index) => (<React.Fragment key={crumb.id}>{index > 0 && <span className="mx-2 text-[var(--color-text-muted)]">/</span>}<button onClick={() => handleBreadcrumbClick(index)} className={`truncate ${index === breadcrumbs.length - 1 ? 'text-[var(--color-text-primary)] font-semibold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`} disabled={index === breadcrumbs.length - 1} title={crumb.name}>{crumb.name}</button></React.Fragment>))}
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                {!isLoading && processedItems.length > 0 && (
                                    <div className="text-sm text-[var(--color-text-muted)] flex-shrink-0">
                                    {(searchQuery.trim() !== '' || filterOption !== 'all' || specialView !== 'none') 
                                        ? `Found ${processedItems.length} result${processedItems.length !== 1 ? 's' : ''}`
                                        : `${processedItems.length} item${processedItems.length !== 1 ? 's' : ''}`
                                    }
                                    </div>
                                )}

                                <div ref={breadcrumbMenuRef} className="relative">
                                    <button 
                                        onClick={() => setIsBreadcrumbMenuOpen(p => !p)}
                                        className="p-1 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
                                        aria-label="More options"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>
                                    {isBreadcrumbMenuOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--color-bg-secondary)] rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-40 fade-in py-1">
                                            <button onClick={handleNewFolderClick} disabled={specialView !== 'none'} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2-2H5a2 2 0 01-2-2z" />
                                                </svg>
                                                <span>New Folder</span>
                                            </button>
                                            <button onClick={() => { handleToggleSelectMode(); setIsBreadcrumbMenuOpen(false); }} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4" />
                                                </svg>
                                                <span>Select Items</span>
                                            </button>
                                            <div className="my-1 border-t border-[var(--color-border)]"></div>
                                            <button onClick={() => { setIsDownloadModalOpen(true); setIsBreadcrumbMenuOpen(false); }} disabled={specialView === 'deleted'} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                                </svg>
                                                <span>Download...</span>
                                            </button>
                                            {currentFolder && (
                                                <button onClick={() => { handleFolderInfoClick(currentFolder); setIsBreadcrumbMenuOpen(false); }} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    <span>Folder Info</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {isSelectMode && (
                <div className="bg-[var(--color-accent)] text-white shadow-md fade-in">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={handleToggleSelectAll} className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10 transition-colors">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${areAllSelected ? 'bg-white border-white' : 'border-white'}`}>
                                    {areAllSelected && <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <span className="font-medium">{selectedIds.size} selected</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                            {specialView === 'deleted' ? (
                                <>
                                    <button onClick={handleRestoreSelected} disabled={selectedIds.size === 0} className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Restore">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.5 9.5A8.5 8.5 0 0112 4a8.5 8.5 0 018.5 8.5 8.5 8.5 0 01-4.32 7.42" /></svg>
                                        <span className="hidden sm:inline">Restore</span>
                                    </button>
                                    <button onClick={() => setIsConfirmDeleteModalOpen(true)} disabled={selectedIds.size === 0} className="flex items-center gap-2 p-2 rounded-md bg-red-500/50 hover:bg-red-500/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Delete Permanently">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        <span className="hidden sm:inline">Delete Forever</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={handleLikeSelected} disabled={selectedMediaItems.length === 0} className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title={areAllSelectedLiked ? 'Unlike' : 'Like'}>
                                        {areAllSelectedLiked ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                        )}
                                        <span className="hidden sm:inline">{areAllSelectedLiked ? 'Unlike' : 'Like'}</span>
                                    </button>
                                    <button onClick={() => setIsBatchCommentModalOpen(true)} disabled={selectedMediaItems.length === 0} className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Add Comment">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                        <span className="hidden sm:inline">Add Comment</span>
                                    </button>
                                    <button onClick={() => setIsMoveModalOpen(true)} disabled={selectedIds.size === 0} className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Move to folder">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6" /></svg>
                                        <span className="hidden sm:inline">Move</span>
                                    </button>
                                    <button onClick={handleDownloadSelected} disabled={selectedIds.size === 0} className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Download">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        <span className="hidden sm:inline">Download</span>
                                    </button>
                                    <button onClick={handleSoftDeleteSelected} disabled={selectedIds.size === 0} className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Delete">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        <span className="hidden sm:inline">Delete</span>
                                    </button>
                                </>
                            )}

                            <div className="border-l border-white/30 h-6"></div>
                            <button onClick={handleToggleSelectMode} className="p-2 rounded-md hover:bg-white/10 transition-colors" aria-label="Cancel selection">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {renderContent()}
        </main>

        {selectionBox && (
            <div
                className="selection-box"
                style={{
                    left: selectionBox.x,
                    top: selectionBox.y,
                    width: selectionBox.width,
                    height: selectionBox.height,
                }}
            />
        )}
        
        {selectedMediaIndex !== null && displayableMedia[selectedMediaIndex] && (
          <MediaDetailModal
            mediaItem={displayableMedia[selectedMediaIndex]}
            path={findPathStringForMediaItem(galleryContent || [], displayableMedia[selectedMediaIndex].id) || 'Home'}
            user={user}
            onClose={() => setSelectedMediaIndex(null)}
            onLike={handleLike}
            onSetComment={handleSetComment}
            onNavigate={handleNavigation}
            onDelete={handleSoftDeleteItem}
            onSetSelection={handleSetSelection}
            hasNext={selectedMediaIndex < displayableMedia.length - 1}
            hasPrevious={selectedMediaIndex > 0}
            displayableMedia={displayableMedia}
            selectedMediaIndex={selectedMediaIndex}
          />
        )}
        
        {isFeedbackModalOpen && (
            <FeedbackModal
                onClose={() => setIsFeedbackModalOpen(false)}
                onSubmit={(rating, comment) => {
                    console.log('Feedback submitted:', { rating, comment });
                    setToast({ message: "Thank you for your feedback!", type: 'success' });
                    setIsFeedbackModalOpen(false);
                }}
            />
        )}

        {commentingMediaItem && (
            <CommentModal
                mediaItem={commentingMediaItem}
                onClose={() => setCommentingMediaItem(null)}
                onSetComment={handleSetComment}
            />
        )}
        
        {isAboutModalOpen && (
            <AboutModal onClose={() => setIsAboutModalOpen(false)} />
        )}

        {isTutorialsModalOpen && (
            <TutorialsModal onClose={() => setIsTutorialsModalOpen(false)} />
        )}

        {isEditProfileModalOpen && (
            <EditProfileModal
                user={user}
                onClose={() => setIsEditProfileModalOpen(false)}
                onSave={(updatedUser) => {
                    onUpdateUser(updatedUser);
                    setIsEditProfileModalOpen(false);
                    setToast({ message: "Profile updated successfully!", type: 'success' });
                }}
            />
        )}

        {isBatchCommentModalOpen && (
            <BatchCommentModal
                itemCount={selectedMediaItems.length}
                onClose={() => setIsBatchCommentModalOpen(false)}
                onSubmit={handleSetBatchComment}
            />
        )}

        {isConfirmDeleteModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 fade-in" onClick={() => setIsConfirmDeleteModalOpen(false)}>
                <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-[var(--color-danger)]">Delete Permanently?</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                        You are about to permanently delete {selectedIds.size} item(s). This action cannot be undone.
                    </p>
                    <div className="mt-6 flex justify-end gap-4">
                        <button onClick={() => setIsConfirmDeleteModalOpen(false)} disabled={isProcessingDelete} className="px-4 py-2 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)] rounded-md font-semibold disabled:opacity-50">
                            Cancel
                        </button>
                        <button onClick={handlePermanentDeleteSelected} disabled={isProcessingDelete} className="px-4 py-2 w-32 bg-[var(--color-danger)] hover:bg-[var(--color-danger-hover)] text-white rounded-md font-semibold flex items-center justify-center disabled:opacity-50">
                            {isProcessingDelete ? <SmallSpinner /> : 'Delete Forever'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {isSubmitModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 fade-in" onClick={() => setIsSubmitModalOpen(false)}>
                <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold">Confirm Submission</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                        Are you sure you want to submit this gallery for final approval? This action cannot be undone.
                    </p>
                    <div className="mt-6 flex justify-end gap-4">
                        <button onClick={() => setIsSubmitModalOpen(false)} disabled={isSubmittingApproval} className="px-4 py-2 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)] rounded-md font-semibold disabled:opacity-50">
                            Cancel
                        </button>
                        <button onClick={handleConfirmSubmit} disabled={isSubmittingApproval} className="px-4 py-2 w-24 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-md font-semibold flex items-center justify-center disabled:opacity-50">
                            {isSubmittingApproval ? <SmallSpinner /> : 'Submit'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {isDownloadModalOpen && (
            <DownloadOptionsModal
                isOpen={isDownloadModalOpen}
                onClose={() => setIsDownloadModalOpen(false)}
                onDownload={handleDownloadAction}
                specialView={specialView}
                currentFolderName={currentFolderName}
                isInSubfolder={currentPath.length > 0}
            />
        )}

        {isNewFolderModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 fade-in" onClick={() => !isCreatingFolder && setIsNewFolderModalOpen(false)}>
                <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold">Create New Folder</h3>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">Enter a name for the new folder in "{breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'Home'}".</p>
                    <form onSubmit={handleConfirmNewFolder}>
                        <div className="mt-4">
                            <label htmlFor="folder-name-input" className="sr-only">Folder Name</label>
                            <input
                                id="folder-name-input"
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="e.g., Candid Shots"
                                className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                                autoFocus
                            />
                        </div>
                        <div className="mt-6 flex justify-end gap-4">
                            <button type="button" onClick={() => setIsNewFolderModalOpen(false)} disabled={isCreatingFolder} className="px-4 py-2 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)] rounded-md font-semibold disabled:opacity-50">
                                Cancel
                            </button>
                            <button type="submit" disabled={!newFolderName.trim() || isCreatingFolder} className="px-4 py-2 w-28 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-md font-semibold disabled:opacity-50 flex items-center justify-center">
                                {isCreatingFolder ? <SmallSpinner /> : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {displayedFolderInfo && (
            <FolderInfoModal 
                isOpen={!!displayedFolderInfo}
                onClose={() => setDisplayedFolderInfo(null)}
                folderDetails={displayedFolderInfo}
            />
        )}
        
        {displayedMediaInfo && (
            <MediaInfoModal
                isOpen={!!displayedMediaInfo}
                onClose={() => setDisplayedMediaInfo(null)}
                mediaItem={displayedMediaInfo.item}
                path={displayedMediaInfo.path}
                user={user}
            />
        )}

        {isMoveModalOpen && galleryContent && (
            <MoveToFolderModal
                isOpen={isMoveModalOpen}
                onClose={() => setIsMoveModalOpen(false)}
                onConfirmMove={handleConfirmMove}
                galleryContent={galleryContent}
                movingItemIds={selectedIds}
                itemCount={selectedIds.size}
            />
        )}

        {isBackToTopVisible && selectedMediaIndex === null && (
            <button
                onClick={scrollToTop}
                className="fixed bottom-6 right-6 bg-[var(--color-accent)] text-white rounded-full p-3 shadow-lg hover:bg-[var(--color-accent-hover)] transition-transform transform hover:scale-110 z-40"
                aria-label="Back to top"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
            </button>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};