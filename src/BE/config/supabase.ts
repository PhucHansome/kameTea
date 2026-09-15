import express from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SERVER_CONFIG } from './env';

export function getServerSupabaseClient(req?: express.Request): SupabaseClient | null {
  let url = (process.env.SUPABASE_URL || SERVER_CONFIG.DEFAULT_SUPABASE_URL).trim();
  let secretKey = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    SERVER_CONFIG.DEFAULT_SUPABASE_SECRET_KEY
  ).trim();

  if (req) {
    const hUrl = (req.headers['x-supabase-url'] as string) || (req.body?.supabaseConfig?.url as string);
    const hKey =
      (req.headers['x-supabase-key'] as string) ||
      (req.headers['x-supabase-anon-key'] as string) ||
      (req.body?.supabaseConfig?.key as string);
    if (hUrl && hUrl.trim() && hUrl.startsWith('http')) url = hUrl.trim();
    if (hKey && hKey.trim()) secretKey = hKey.trim();
  }

  if (!url || !secretKey || !url.startsWith('http')) {
    return null;
  }

  try {
    return createClient(url, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch {
    return null;
  }
}
