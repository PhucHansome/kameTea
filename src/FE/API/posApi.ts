import { clientFetch } from './clientApi';
import { ApiResponse } from '../../shared/types';

export const posApi = {
  testConnection: async (config?: { url?: string; key?: string }): Promise<ApiResponse> => {
    return clientFetch<ApiResponse>('/api/supabase/test', {
      headers: config?.url && config?.key ? {
        'x-supabase-url': config.url,
        'x-supabase-key': config.key,
      } : undefined,
    });
  },

  getStats: async (): Promise<ApiResponse> => {
    return clientFetch<ApiResponse>('/api/supabase/stats');
  },

  pullAllData: async (config?: { url?: string; key?: string }): Promise<ApiResponse> => {
    return clientFetch<ApiResponse>('/api/supabase/data', {
      headers: config?.url && config?.key ? {
        'x-supabase-url': config.url,
        'x-supabase-key': config.key,
      } : undefined,
    });
  },

  syncAllData: async (payload: any, config?: { url?: string; key?: string }): Promise<ApiResponse> => {
    return clientFetch<ApiResponse>('/api/supabase/sync', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: config?.url && config?.key ? {
        'x-supabase-url': config.url,
        'x-supabase-key': config.key,
      } : undefined,
    });
  },

  upsert: async (table: string, rows: any[], conflict?: string): Promise<ApiResponse> => {
    return clientFetch<ApiResponse>('/api/supabase/upsert', {
      method: 'POST',
      body: JSON.stringify({ table, rows, conflict }),
    });
  },

  update: async (table: string, values: any, id: any, column: string = 'id'): Promise<ApiResponse> => {
    return clientFetch<ApiResponse>('/api/supabase/update', {
      method: 'POST',
      body: JSON.stringify({ table, values, id, column }),
    });
  },

  delete: async (table: string, id: any, column: string = 'id'): Promise<ApiResponse> => {
    return clientFetch<ApiResponse>('/api/supabase/delete', {
      method: 'POST',
      body: JSON.stringify({ table, id, column }),
    });
  },

  compressSales: async (cutoffMonths: number = 12, specificMonth?: string): Promise<ApiResponse> => {
    return clientFetch<ApiResponse>('/api/supabase/compress-sales', {
      method: 'POST',
      body: JSON.stringify({ cutoffMonths, specificMonth }),
    });
  },
};
