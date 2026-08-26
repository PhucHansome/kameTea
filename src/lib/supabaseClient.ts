/**
 * Supabase Client & Connection Manager
 * KAME POS - Ốc, Ăn Vặt & Trà Sữa
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastChecked?: string;
}

const STORAGE_KEY_CONFIG = 'kame_supabase_config';

export const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://juottdlmnzbkydlgnoqs.supabase.co';
export const DEFAULT_SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const DEFAULT_SUPABASE_SECRET_KEY = '';

export function sanitizeUrl(input?: string | null): string {
  if (!input || typeof input !== 'string') return DEFAULT_SUPABASE_URL;
  let trimmed = input.trim();
  if (!trimmed) return DEFAULT_SUPABASE_URL;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = 'https://' + trimmed;
  }
  return trimmed.replace(/\/+$/, '');
}

export function getSupabaseConfig(): SupabaseConfig {
  let savedUrl = '';
  let savedKey = '';
  const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.url && typeof parsed.url === 'string' && parsed.url.trim()) {
        savedUrl = parsed.url.trim();
      }
      if (parsed.anonKey && typeof parsed.anonKey === 'string' && parsed.anonKey.trim()) {
        savedKey = parsed.anonKey.trim();
      }
    } catch {
      // ignore
    }
  }

  // Fallback to import.meta.env if available, or default credentials
  const envUrl =
    savedUrl ||
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ||
    (import.meta as any).env?.SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;

  const envKey =
    savedKey ||
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    (import.meta as any).env?.SUPABASE_PUBLISHABLE_KEY ||
    DEFAULT_SUPABASE_PUBLISHABLE_KEY;

  const validUrl = sanitizeUrl(envUrl);
  const validKey = (envKey || DEFAULT_SUPABASE_PUBLISHABLE_KEY).trim();

  return {
    url: validUrl,
    anonKey: validKey,
    isConnected: !!(validUrl && validKey),
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_CONFIG);
}

/**
 * Tests connection to Supabase instance via REST ping or server endpoint
 */
export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  // Try server proxy test first
  try {
    const serverRes = await fetch('/api/supabase/test');
    if (serverRes.ok) {
      const serverJson = await serverRes.json();
      if (serverJson.success) {
        return serverJson;
      }
    }
  } catch {
    // fallback to direct ping
  }

  if (!url || !anonKey) {
    return {
      success: false,
      message: 'Vui lòng nhập đầy đủ Supabase Project URL và Anon Public Key.',
    };
  }

  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }
  formattedUrl = formattedUrl.replace(/\/+$/, '');

  const startTime = Date.now();
  try {
    const response = await fetch(`${formattedUrl}/rest/v1/?apikey=${encodeURIComponent(anonKey.trim())}`, {
      method: 'GET',
      headers: {
        apikey: anonKey.trim(),
        Authorization: `Bearer ${anonKey.trim()}`,
      },
    });

    const latency = Date.now() - startTime;

    if (response.ok || response.status === 200 || response.status === 404) {
      return {
        success: true,
        message: `Kết nối tới Supabase thành công! (Độ trễ: ${latency}ms)`,
        latencyMs: latency,
      };
    } else if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        message: 'Lỗi xác thực: Anon Key không chính xác hoặc đã hết hạn.',
      };
    } else {
      return {
        success: false,
        message: `Phản hồi từ Supabase: Mã lỗi ${response.status} (${response.statusText}).`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Không thể kết nối trực tiếp đến '${formattedUrl}'. Vui lòng kiểm tra lại mạng hoặc URL dự án.`,
    };
  }
}
