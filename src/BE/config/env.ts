/**
 * BACKEND ENVIRONMENT CONFIGURATION
 */
export const SERVER_CONFIG = {
  PORT: 3000,
  DEFAULT_SUPABASE_URL: process.env.SUPABASE_URL || 'https://juottdlmnzbkydlgnoqs.supabase.co',
  DEFAULT_SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || '',
  BANK_WEBHOOK_KEY: process.env.BANK_WEBHOOK_KEY || '',
  BANK_API_KEY: process.env.BANK_API_KEY || '',
};
