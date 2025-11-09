import { MOCK_CLIENT_DATA } from '../data/mockData';
import type { GalleryContentItem } from '../types/index';

export const getMediaForUser = async (userId: string): Promise<{ gallery: GalleryContentItem[] }> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const clientData = MOCK_CLIENT_DATA.find((client) => client.user.id === userId);
      if (clientData) {
        resolve({ gallery: clientData.gallery });
      } else {
        reject(new Error('Could not find media for this user.'));
      }
    }, 1500); // Simulate network delay
  });
};