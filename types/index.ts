export enum MediaType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  FOLDER = 'FOLDER',
}

export type TextAlign = 'center' | 'left' | 'right';

export enum SelectionType {
  NONE = 'NONE',
  OFF_SHEET = 'OFF_SHEET',
  FRAME = 'FRAME',
  FAMILY = 'FAMILY',
  GROOM_FAMILY = 'GROOM_FAMILY',
  BRIDE_FAMILY = 'BRIDE_FAMILY',
}

export interface MediaItem {
  id: string;
  type: MediaType.PHOTO | MediaType.VIDEO;
  url: string;
  title: string;
  width: number;
  height: number;
  description?: string;
  likedBy: string[];
  comment: string | null;
  date: string;
  fileSize: string;
  isDeleted?: boolean;
  selection?: SelectionType;
}

export interface Folder {
    id: string;
    type: MediaType.FOLDER;
    name: string;
    children: GalleryContentItem[];
    isDeleted?: boolean;
}

export type GalleryContentItem = MediaItem | Folder;

export interface User {
  id:string;
  username: string;
  password: string;
  name: string;
  profileImageUrl?: string;
}

export interface ClientData {
  user: User;
  gallery: GalleryContentItem[];
}