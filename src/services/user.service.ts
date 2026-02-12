
import apiClient from '../lib/api';
import { User } from '../types/auth';

export const UserService = {
  getUsers: async (): Promise<User[]> => {
    const res = await apiClient.get('/users');
    return res.data;
  },

  createUser: async (user: Partial<User>): Promise<User> => {
    const res = await apiClient.post('/users', user);
    return res.data;
  },

  updateUser: async (userId: string, updates: Partial<User>): Promise<User> => {
    const res = await apiClient.put(`/users/${userId}`, updates);
    return res.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}`);
  },
};
