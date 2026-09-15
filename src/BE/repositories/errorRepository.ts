import { ERROR_CATALOG, ErrorCode, ErrorCatalogItem } from '../../shared/errorCatalog';
import { getServerSupabaseClient } from '../config/supabase';

export class ErrorRepository {
  private static catalogCache: Record<ErrorCode, ErrorCatalogItem> = { ...ERROR_CATALOG };

  public static async getAllErrorCodes(): Promise<Record<ErrorCode, ErrorCatalogItem>> {
    try {
      const supabase = getServerSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from('pos_error_catalog' as any).select('*');
        if (!error && data && data.length > 0) {
          data.forEach((item: any) => {
            if (item.code) {
              this.catalogCache[item.code as ErrorCode] = {
                code: item.code,
                template: item.template || ERROR_CATALOG[item.code as ErrorCode]?.template || '',
                defaultStatus: Number(item.status) || ERROR_CATALOG[item.code as ErrorCode]?.defaultStatus || 400,
                description: item.description || '',
              };
            }
          });
        }
      }
    } catch {
      // Fallback cache
    }
    return this.catalogCache;
  }

  public static getByCode(code: ErrorCode): ErrorCatalogItem | undefined {
    return this.catalogCache[code] || ERROR_CATALOG[code];
  }
}
