import { clientFetch } from './clientApi';
import { User } from '../../shared/types';

export interface LoginResponse {
  success: boolean;
  source: 'SUPABASE' | 'DEFAULT';
  user: User;
  message?: string;
}

export const authApi = {
  login: async (username: string, password?: string): Promise<LoginResponse> => {
    return clientFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
};
