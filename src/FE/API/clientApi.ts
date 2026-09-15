import { formatErrorMessage, ErrorCode } from '../../shared/errorCatalog';

export interface ApiClientOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function clientFetch<T = any>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options;

  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(headers || {}),
      },
      ...rest,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const code = (data?.code as ErrorCode) || 'ME00020';
      const msg = data?.message || formatErrorMessage(code, res.statusText || 'Lỗi kết nối máy chủ');
      const error: any = new Error(msg);
      error.status = res.status;
      error.code = code;
      error.data = data;
      throw error;
    }

    return data as T;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const networkErr: any = new Error(formatErrorMessage('ME00014', 'Không thể kết nối đến máy chủ API'));
      networkErr.code = 'ME00014';
      throw networkErr;
    }
    throw err;
  }
}
