import { MOCK_CLIENT_DATA } from '../data/mockData';
import type { User } from '../types/index';

export const login = async (username: string, password: string): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const clientData = MOCK_CLIENT_DATA.find(
        (client) => client.user.username === username && client.user.password === password
      );
      if (clientData) {
        resolve(clientData.user);
      } else {
        reject(new Error('Invalid username or password.'));
      }
    }, 1000); // Simulate network delay
  });
};
