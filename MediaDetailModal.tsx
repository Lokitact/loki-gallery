
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MediaItem, MediaType, User, SelectionType } from './types/index';
import { SelectionDropdown } from './components/SelectionDropdown';

const PreloadImages: React.FC<{ urls: string[] }> = React.memo(({ urls }) => (
  <div style={{ display: 'none' }}>
    {urls.map(url => <img key={url} src={url} alt="" />)}
  </div>
));
PreloadImages.displayName = "PreloadImages";


interface MediaDetailModalProps {
  mediaItem: MediaItem;
  path: string;
  user: User;
  onClose: () => void;
  onLike: (mediaId: string) => Promise<void>;
  onSetComment: (mediaId: string, comment: string) => Promise<void>;
  onNavigate: (direction: 'next' | 'previous') => void;
  onDelete: (mediaId: string) => void;
  onSetSelection: (mediaId: string, selection: SelectionType) => void;
  hasNext: boolean;
  hasPrevious: boolean;
  displayableMedia: MediaItem[];
  selectedMediaIndex: number;
}

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

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({ mediaItem, path, user, onClose, onLike, onSetComment, onNavigate, onDelete, onSetSelection, hasNext, hasPrevious, displayableMedia, selectedMediaIndex }) => {
  const [commentText, setCommentText] = useState(mediaItem.comment || '');
  const [isCommentFooterVisible, setIsCommentFooterVisible] = useState(false);
  const [isInfoPanelVisible, setIsInfoPanelVisible] = useState(false);
  const [isSavingComment, setIsSavingComment] = useState(false);
  
  // Swipe navigation state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchCurrentY, setTouchCurrentY] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  
  const lastVideoTapTime = useRef(0);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isQuickCommentOpen, setIsQuickCommentOpen] = useState(false);
  const quickCommentRef = useRef<HTMLDivElement>(null);

  // Zoom and Pan state
  const [zoom, setZoom] = useState({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const [pinchDist, setPinchDist] = useState<number | null>(null);


  useEffect(() => {
    // Prevent body scrolling when the modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      // Restore body scrolling when the modal is closed
      document.body.style.overflow = '';
    };
  }, []); // Empty dependency array ensures this runs only once on mount and unmount


  const isLiked = mediaItem.likedBy.includes(user.id);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  
  const TooltipWrapper: React.FC<{ tooltipText: string; children: React.ReactNode; position?: 'top' | 'bottom' }> = ({ tooltipText, children, position: defaultPosition = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const timerRef = useRef<number | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<'top' | 'bottom'>(defaultPosition);

    useEffect(() => {
        if (isVisible && wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            if (rect.top < 60) {
                setPosition('bottom');
            } else {
                setPosition(defaultPosition);
            }
        }
    }, [isVisible, defaultPosition]);

    const show = () => setIsVisible(true);
    const hide = () => setIsVisible(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length > 1) return;
        timerRef.current = window.setTimeout(show, 500);
    };

    const handleTouchEnd = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        hide();
    };

    return (
        <div
            ref={wrapperRef}
            className="relative flex items-center justify-center"
            onMouseEnter={show}
            onMouseLeave={hide}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onTouchMove={handleTouchEnd}
        >
            {children}
            {isVisible && (
                <div
                    className={`absolute left-1/2 -translate-x-1/2 z-50 w-max px-2 py-1.5 bg-gray-900/80 backdrop-blur-sm text-white text-xs font-medium rounded-md pointer-events-none transition-opacity fade-in ${
                        position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
                    }`}
                    role="tooltip"
                >
                    {tooltipText}
                </div>
            )}
        </div>
    );
  };
  
  useEffect(() => {
    // Cleanup function runs when component unmounts (modal closes)
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (quickCommentRef.current && !quickCommentRef.current.contains(event.target as Node)) {
        setIsQuickCommentOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setCommentText(mediaItem.comment || '');
    setIsCommentFooterVisible(false);
    setIsInfoPanelVisible(false);
    setZoom({ scale: 1, x: 0, y: 0 }); // Reset zoom on media change
    // Reset swipe state when media item changes
    setTouchStartX(null);
    setTouchCurrentX(null);
    setTouchStartY(null);
    setTouchCurrentY(null);
    setPinchDist(null);
  }, [mediaItem]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === commentInputRef.current) return;
      
      if (isInfoPanelVisible && e.key === 'Escape') {
          setIsInfoPanelVisible(false);
          return;
      }
      
      if (isCommentFooterVisible && e.key === 'Escape') {
          handleCancelComment();
          return;
      }

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key.toLowerCase() === 'i') {
        setIsInfoPanelVisible(prev => !prev);
      } else if (e.key === 'ArrowRight') {
        if(hasNext) onNavigate('next');
      } else if (e.key === 'ArrowLeft') {
        if(hasPrevious) onNavigate('previous');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isInfoPanelVisible, isCommentFooterVisible, mediaItem.type, hasNext, hasPrevious, onNavigate]);
  
  useEffect(() => {
    if (isCommentFooterVisible && commentInputRef.current) {
        setTimeout(() => {
          commentInputRef.current?.focus();
          commentInputRef.current?.select();
        }, 100);
    }
  }, [isCommentFooterVisible]);
  
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommentText(e.target.value);
  };

  const handleSaveComment = async () => {
    setIsSavingComment(true);
    try {
      await onSetComment(mediaItem.id, commentText);
      setIsCommentFooterVisible(false); // Close footer only on success
    } catch (error) {
      console.error('Failed to save comment:', error);
      // The parent component shows a toast. The comment input remains open for the user to retry.
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleCancelComment = () => {
    setCommentText(mediaItem.comment || '');
    setIsCommentFooterVisible(false);
  };
  
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(mediaItem.id);
  };

  const isSwiping = touchStartX !== null && touchCurrentX !== null;
  
  const handleCloseClick = (e: React.MouseEvent) => {
    // Only close if clicking on the backdrop itself
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const urlsToPreload = useMemo(() => {
    const urls: string[] = [];
    if (hasNext) {
        const nextItem = displayableMedia[selectedMediaIndex + 1];
        if (nextItem.type === MediaType.PHOTO) urls.push(nextItem.url);
    }
    if (hasPrevious) {
        const prevItem = displayableMedia[selectedMediaIndex - 1];
        if (prevItem.type === MediaType.PHOTO) urls.push(prevItem.url);
    }
    return urls;
  }, [selectedMediaIndex, displayableMedia, hasNext, hasPrevious]);

  const handleVideoOverlayClick = (e: React.MouseEvent) => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // ms

    if (now - lastVideoTapTime.current < DOUBLE_TAP_DELAY) {
        // Double tap
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const tapX = e.clientX - rect.left;
        if (tapX < rect.width / 2) {
            videoEl.currentTime = Math.max(0, videoEl.currentTime - 10);
        } else {
            videoEl.currentTime = Math.min(videoEl.duration, videoEl.currentTime + 10);
        }
    } else {
        // Single tap
        videoEl.paused ? videoEl.play() : videoEl.pause();
    }
    
    lastVideoTapTime.current = now;
  };

  const handleMenuAction = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  // Zoom & Pan Logic
  const clampCoordinates = (scale: number, x: number, y: number) => {
      if (!imageRef.current || scale <= 1) return { x: 0, y: 0 };
  
      const img = imageRef.current;
      const containerWidth = img.clientWidth;
      const containerHeight = img.clientHeight;
  
      const extraWidth = containerWidth * (scale - 1);
      const extraHeight = containerHeight * (scale - 1);
  
      const maxX = extraWidth / 2;
      const maxY = extraHeight / 2;
  
      const clampedX = Math.max(-maxX, Math.min(maxX, x));
      const clampedY = Math.max(-maxY, Math.min(maxY, y));
  
      return { x: clampedX, y: clampedY };
  };

  const handleZoom = (delta: number, clientX?: number, clientY?: number) => {
    if (!imageRef.current) return;

    const newScale = Math.max(1, Math.min(zoom.scale + delta, 5));
    if (newScale === zoom.scale) return;

    let newX = zoom.x;
    let newY = zoom.y;

    if (clientX !== undefined && clientY !== undefined) {
      const rect = imageRef.current.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;
      
      const newZoomPointX = (mouseX - zoom.x) / zoom.scale;
      const newZoomPointY = (mouseY - zoom.y) / zoom.scale;

      newX = -(newZoomPointX * newScale - mouseX);
      newY = -(newZoomPointY * newScale - mouseY);
    } else {
      newX = zoom.x * (newScale / zoom.scale);
      newY = zoom.y * (newScale / zoom.scale);
    }
    
    if (newScale === 1) {
        newX = 0;
        newY = 0;
    }

    const clampedCoords = clampCoordinates(newScale, newX, newY);
    setZoom({ scale: newScale, ...clampedCoords });
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    if (mediaItem.type !== MediaType.PHOTO) return;
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    handleZoom(delta, e.clientX, e.clientY);
  };

  const handlePanStart = (e: React.MouseEvent | React.TouchEvent) => {
      if (zoom.scale <= 1 || (e.nativeEvent as TouchEvent).touches?.length > 1) return;
      e.preventDefault();
      e.stopPropagation();
      const point = 'touches' in e ? e.touches[0] : e;
      setIsDragging(true);
      setDragStart({
          x: point.clientX - zoom.x,
          y: point.clientY - zoom.y,
      });
  };

  const handlePanMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const point = 'touches' in e ? e.touches[0] : e;
      
      const newX = point.clientX - dragStart.x;
      const newY = point.clientY - dragStart.y;
      
      const clampedCoords = clampCoordinates(zoom.scale, newX, newY);
      setZoom(prev => ({ ...prev, ...clampedCoords }));
  };

  const handlePanEnd = () => {
      setIsDragging(false);
  };
  
  // Touch Controls
  const getPinchDist = (e: React.TouchEvent) => {
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    return Math.sqrt(Math.pow(t1.clientX - t2.clientX, 2) + Math.pow(t1.clientY - t2.clientY, 2));
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (isInfoPanelVisible || target.closest('button, a, input, textarea, video')) {
      return;
    }
  
    // Two fingers for pinch-to-zoom on photos
    if (e.touches.length === 2 && mediaItem.type === MediaType.PHOTO) {
      e.preventDefault();
      setPinchDist(getPinchDist(e));
      // Cancel swipe gesture
      setTouchStartX(null);
      setTouchCurrentX(null);
      setTouchStartY(null);
      setTouchCurrentY(null);
      return;
    }
  
    // If one finger, and we are not already panning/pinching
    if (e.touches.length === 1 && pinchDist === null) {
      // If not zoomed in, we handle swipe.
      // If zoomed in, the onTouchStart on the image will handle panning.
      if (zoom.scale <= 1) {
        setTouchStartX(e.touches[0].clientX);
        setTouchCurrentX(e.touches[0].clientX);
        setTouchStartY(e.touches[0].clientY);
        setTouchCurrentY(e.touches[0].clientY);
      }
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    // Handle pinch-to-zoom
    if (e.touches.length === 2 && mediaItem.type === MediaType.PHOTO && pinchDist !== null) {
      e.preventDefault();
      const newPinchDist = getPinchDist(e);
      const delta = (newPinchDist - pinchDist) / 200; // Zoom sensitivity
      
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
  
      handleZoom(delta, midX, midY);
      setPinchDist(newPinchDist);
      return;
    }
    
    // Panning is handled by the global listener set up by `handlePanStart`.
    // We only need to handle swipe here.
    if (touchStartX !== null && e.touches.length === 1) {
      setTouchCurrentX(e.touches[0].clientX);
      setTouchCurrentY(e.touches[0].clientY);
    }
  };
  
  const handleTouchEnd = () => {
    // Reset pinch state
    if (pinchDist !== null) {
        setPinchDist(null);
    }
    
    // Swipe logic
    if (touchStartX === null || touchCurrentX === null || touchStartY === null || touchCurrentY === null) {
      return;
    }
  
    const diffX = touchCurrentX - touchStartX;
    const diffY = touchCurrentY - touchStartY;
    const swipeThreshold = 50; 
    
    if (Math.abs(diffX) > swipeThreshold && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX > 0 && hasPrevious) {
        onNavigate('previous');
      } else if (diffX < 0 && hasNext) {
        onNavigate('next');
      }
    }
    
    // Reset swipe state
    setTouchStartX(null);
    setTouchCurrentX(null);
    setTouchStartY(null);
    setTouchCurrentY(null);
  };
  
  useEffect(() => {
      if (isDragging) {
          window.addEventListener('mousemove', handlePanMove);
          window.addEventListener('mouseup', handlePanEnd);
          window.addEventListener('touchmove', handlePanMove);
          window.addEventListener('touchend', handlePanEnd);
      }
      return () => {
          window.removeEventListener('mousemove', handlePanMove);
          window.removeEventListener('mouseup', handlePanEnd);
          window.removeEventListener('touchmove', handlePanMove);
          window.removeEventListener('touchend', handlePanEnd);
      };
  }, [isDragging, dragStart, zoom]);

  const swipeTranslateX = isSwiping && touchCurrentX !== null ? touchCurrentX - touchStartX : 0;
  const mediaOpacity = isSwiping ? 1 - Math.abs(swipeTranslateX) / (window.innerWidth * 1.5) : 1;

  return (
    <div
      className="fixed inset-0 bg-[var(--color-bg-primary)] bg-opacity-80 backdrop-blur-sm flex flex-col z-40 text-[var(--color-text-primary)] overscroll-y-contain"
      onClick={handleCloseClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-title"
    >
        <PreloadImages urls={urlsToPreload} />
        {/* Header */}
        <header className={`absolute top-0 left-0 right-0 z-10 p-4 transition-opacity duration-300 ${isInfoPanelVisible ? 'opacity-0' : 'opacity-100'}`}>
            <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    <TooltipWrapper tooltipText="Close (Esc)">
                        <button onClick={onClose} className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                    </TooltipWrapper>
                    <h2 id="media-title" className="font-semibold text-lg truncate text-white drop-shadow-md" title={mediaItem.title}>
                        {mediaItem.title}
                    </h2>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <TooltipWrapper tooltipText={isLiked ? 'Unlike' : 'Like'}>
                        <button onClick={handleLikeClick} className={`p-2 rounded-full transition-colors ${isLiked ? 'bg-red-500/20 text-red-400' : 'bg-black/20 hover:bg-black/40'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                        </button>
                    </TooltipWrapper>
                    <TooltipWrapper tooltipText={mediaItem.comment ? 'Edit Comment' : 'Add Comment'}>
                        <button onClick={() => setIsCommentFooterVisible(true)} className={`p-2 rounded-full transition-colors ${mediaItem.comment ? 'bg-black/20 text-[var(--color-accent)]' : 'bg-black/20 hover:bg-black/40'}`}>
                           {mediaItem.comment ? (
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h14a1 1 0 011 1v10a1 1 0 01-1 1H9l-4 4v-4H3a1 1 0 01-1-1V3z" /></svg>
                           ) : (
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                           )}
                        </button>
                    </TooltipWrapper>
                    <TooltipWrapper tooltipText="Set selection">
                        <SelectionDropdown
                            mediaItem={mediaItem}
                            onSetSelection={onSetSelection}
                            disabled={false}
                            variant="modal"
                            onVisibilityChange={() => {}}
                        />
                    </TooltipWrapper>
                    <div ref={menuRef} className="relative">
                        <TooltipWrapper tooltipText="More actions">
                            <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                            </button>
                        </TooltipWrapper>
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-[var(--color-bg-secondary)] rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 fade-in py-1">
                                <a
                                    href={mediaItem.url}
                                    download={mediaItem.title}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download
                                </a>
                                <button
                                    onClick={() => handleMenuAction(() => setIsInfoPanelVisible(true))}
                                    className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Details
                                </button>
                                <div className="my-1 border-t border-[var(--color-border)]"></div>
                                <button
                                    onClick={() => handleMenuAction(() => onDelete(mediaItem.id))}
                                    className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-[var(--color-danger)] opacity-80 hover:opacity-100 hover:bg-red-500/10 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>

        {/* Media Content */}
        <div
          className={`relative flex-1 flex items-center justify-center overflow-hidden transition-transform duration-300 p-4`}
          style={{ transform: `translateX(${swipeTranslateX}px)`, touchAction: 'none' }}
          onWheel={handleWheel}
        >
            {mediaItem.type === MediaType.PHOTO && (
                <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                        transform: `scale(${zoom.scale}) translate(${zoom.x}px, ${zoom.y}px)`,
                        cursor: zoom.scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        willChange: 'transform',
                    }}
                    onMouseDown={handlePanStart}
                    onTouchStart={handlePanStart}
                >
                    <img
                        ref={imageRef}
                        key={mediaItem.id}
                        src={mediaItem.url}
                        alt={mediaItem.title}
                        className="max-w-full max-h-full fade-in-detail"
                        style={{
                            opacity: mediaOpacity,
                        }}
                        draggable={false}
                    />
                </div>
            )}
            {mediaItem.type === MediaType.VIDEO && (
                <div className="relative w-full h-full">
                    <video
                        key={mediaItem.id}
                        ref={videoRef}
                        src={mediaItem.url}
                        controls
                        className="w-full h-full object-contain fade-in-detail"
                        style={{ opacity: mediaOpacity }}
                        onClick={(e) => e.preventDefault()} // Prevent default click from interfering with overlay
                    />
                    <div 
                        className="absolute inset-0 z-10"
                        onClick={handleVideoOverlayClick}
                    />
                </div>
            )}
        </div>
        
        {/* Navigation Arrows */}
        {hasPrevious && (
            <button onClick={() => onNavigate('previous')} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors hidden md:block" aria-label="Previous image">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
        )}
        {hasNext && (
            <button onClick={() => onNavigate('next')} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors hidden md:block" aria-label="Next image">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        )}

         {/* Zoom Controls */}
        {mediaItem.type === MediaType.PHOTO && (
            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 p-1.5 bg-black/30 backdrop-blur-sm rounded-full flex items-center gap-1 transition-opacity duration-300 ${isInfoPanelVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <TooltipWrapper tooltipText="Zoom Out" position="top">
                    <button onClick={() => handleZoom(-0.2)} disabled={zoom.scale <= 1} className="p-2 text-white rounded-full hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                    </button>
                </TooltipWrapper>
                <button 
                    onClick={() => setZoom({ scale: 1, x: 0, y: 0 })}
                    className="text-white text-sm font-mono w-14 text-center select-none cursor-pointer rounded-md hover:bg-white/20"
                >
                    {Math.round(zoom.scale * 100)}%
                </button>
                <TooltipWrapper tooltipText="Zoom In" position="top">
                    <button onClick={() => handleZoom(0.2)} disabled={zoom.scale >= 5} className="p-2 text-white rounded-full hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                    </button>
                </TooltipWrapper>
                 <TooltipWrapper tooltipText="Reset Zoom" position="top">
                    <button onClick={() => setZoom({ scale: 1, x: 0, y: 0 })} disabled={zoom.scale <= 1} className="p-2 text-white rounded-full hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 1v-4m0 0h-4m4 0l-5 5" /></svg>
                    </button>
                </TooltipWrapper>
            </div>
        )}

        {/* Info Panel */}
        <div className={`absolute top-0 right-0 bottom-0 w-full max-w-sm bg-[var(--color-bg-secondary)] shadow-lg p-6 transform transition-transform duration-300 ease-in-out z-20 overflow-y-auto ${isInfoPanelVisible ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Details</h3>
                <button onClick={() => setIsInfoPanelVisible(false)} className="p-2 rounded-full hover:bg-[var(--color-bg-tertiary)] -mr-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
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
        </div>

        {/* Comment Input Modal */}
        {isCommentFooterVisible && (
            <div
                className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-30 fade-in"
                onClick={handleCancelComment}
            >
                <div 
                    className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl p-6 w-full max-w-lg" 
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Your Comment</h3>
                        <div ref={quickCommentRef} className="relative">
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
                                                        commentInputRef.current?.focus();
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
                    <textarea 
                        ref={commentInputRef} 
                        id="comment-input" 
                        value={commentText} 
                        onChange={handleCommentChange} 
                        rows={5}
                        className="w-full p-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:ring-2 focus:ring-[var(--color-accent)] outline-none resize-none" 
                        placeholder="Add a comment for your photographer..."
                    />
                    <div className="flex justify-end gap-3 mt-4">
                        <button 
                            onClick={handleCancelComment} 
                            className="px-4 py-2 text-sm font-semibold rounded-md hover:bg-[var(--color-bg-tertiary)]"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveComment} 
                            disabled={isSavingComment} 
                            className="px-4 py-2 w-24 text-sm font-semibold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 flex items-center justify-center"
                        >
                            {isSavingComment ? <SmallSpinner /> : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        
    </div>
  );
};
