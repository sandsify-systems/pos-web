
import apiClient from '../lib/api';
import { AuthResponse, User, Business } from '../types/auth';

export const AuthService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },

  register: async (data: any): Promise<AuthResponse> => {
    const res = await apiClient.post('/onboarding/register', data);
    return res.data;
  },

  verifyOtp: async (email: string, code: string): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/verify-otp', { email, code });
    return res.data;
  },

  resendOtp: async (email: string): Promise<any> => {
    const res = await apiClient.post('/auth/resend-otp', { email });
    return res.data;
  },

  requestPasswordReset: async (email: string): Promise<any> => {
    const res = await apiClient.post('/auth/password-reset-request', { email });
    return res.data;
  },

  resetPassword: async (data: any): Promise<any> => {
    const res = await apiClient.post('/auth/password-reset', data);
    return res.data;
  },

  getProfile: async (): Promise<AuthResponse> => {
    const res = await apiClient.get('/auth/profile');
    return res.data;
  },

  updateBusiness: async (businessId: string, updates: Partial<Business>): Promise<Business> => {
    const res = await apiClient.put(`/businesses/${businessId}`, updates);
    return res.data;
  },

  purgeData: async (businessId: string): Promise<void> => {
    await apiClient.post(`/businesses/${businessId}/purge`);
  },

  getActiveSessions: async (): Promise<any[]> => {
    const res = await apiClient.get('/auth/sessions');
    return res.data.data;
  },

  logoutAllSessions: async (): Promise<void> => {
    await apiClient.delete('/auth/sessions/logout-all');
  },

  revokeSession: async (sessionId: number): Promise<void> => {
    await apiClient.delete(`/auth/sessions/${sessionId}`);
  },

  updateProfile: async (userId: number, updates: any): Promise<User> => {
    const res = await apiClient.put(`/users/${userId}`, updates);
    return res.data;
  }
};
