/**
 * ERROR CATALOG - BẢNG MÃ LỖI CHUẨN HÓA TOÀN HỆ THỐNG KAME POS
 * Tuân thủ quy chuẩn: Mã lỗi ME00001 -> ME00020+
 * Hỗ trợ placeholder động: %1, %2, %3...
 * Dual-layer validation: Frontend (Form/API) & Backend (Service Layer)
 */

export type ErrorCode =
  | 'ME00001'
  | 'ME00002'
  | 'ME00003'
  | 'ME00004'
  | 'ME00005'
  | 'ME00006'
  | 'ME00007'
  | 'ME00008'
  | 'ME00009'
  | 'ME00010'
  | 'ME00011'
  | 'ME00012'
  | 'ME00013'
  | 'ME00014'
  | 'ME00015'
  | 'ME00016'
  | 'ME00017'
  | 'ME00018'
  | 'ME00019'
  | 'ME00020';

export interface ErrorCatalogItem {
  code: ErrorCode;
  template: string;
  defaultStatus: number;
  description: string;
}

export const ERROR_CATALOG: Record<ErrorCode, ErrorCatalogItem> = {
  ME00001: {
    code: 'ME00001',
    template: '%1 không tồn tại',
    defaultStatus: 404,
    description: 'Đối tượng không tồn tại trong hệ thống',
  },
  ME00002: {
    code: 'ME00002',
    template: '%1 không được để trống',
    defaultStatus: 400,
    description: 'Dữ liệu bắt buộc không được để trống',
  },
  ME00003: {
    code: 'ME00003',
    template: '%1 đã tồn tại trong hệ thống',
    defaultStatus: 409,
    description: 'Bản ghi bị trùng lặp',
  },
  ME00004: {
    code: 'ME00004',
    template: '%1 phải là số hợp lệ',
    defaultStatus: 400,
    description: 'Giá trị phải là số và không được là NaN/âm khi không cho phép',
  },
  ME00005: {
    code: 'ME00005',
    template: '%1 phải lớn hơn hoặc bằng %2',
    defaultStatus: 400,
    description: 'Giá trị nhỏ hơn ngưỡng quy định',
  },
  ME00006: {
    code: 'ME00006',
    template: '%1 không hợp lệ',
    defaultStatus: 400,
    description: 'Dữ liệu sai định dạng chung',
  },
  ME00007: {
    code: 'ME00007',
    template: 'Số điện thoại %1 không đúng định dạng',
    defaultStatus: 400,
    description: 'Số điện thoại không đủ 10 chữ số hoặc đầu số không hợp lệ',
  },
  ME00008: {
    code: 'ME00008',
    template: 'Không thể xóa %1 vì đang có ràng buộc liên kết trong %2',
    defaultStatus: 409,
    description: 'Ràng buộc khóa ngoại hoặc liên kết phụ thuộc',
  },
  ME00009: {
    code: 'ME00009',
    template: 'Mật khẩu phải có ít nhất %1 ký tự',
    defaultStatus: 400,
    description: 'Độ dài mật khẩu không đủ an toàn',
  },
  ME00010: {
    code: 'ME00010',
    template: 'Tài khoản hoặc mật khẩu không chính xác',
    defaultStatus: 401,
    description: 'Xác thực đăng nhập thất bại',
  },
  ME00011: {
    code: 'ME00011',
    template: '%1 không thể vượt quá %2',
    defaultStatus: 400,
    description: 'Vượt quá giới hạn cho phép',
  },
  ME00012: {
    code: 'ME00012',
    template: 'Biển số xe %1 không đúng định dạng',
    defaultStatus: 400,
    description: 'Biển số phương tiện không hợp lệ',
  },
  ME00013: {
    code: 'ME00013',
    template: 'Trạng thái %1 không hợp lệ cho thao tác này',
    defaultStatus: 400,
    description: 'Không thể chuyển tiếp hoặc thực thi với trạng thái hiện tại',
  },
  ME00014: {
    code: 'ME00014',
    template: 'Chưa cấu hình kết nối Supabase (%1)',
    defaultStatus: 503,
    description: 'Thiếu cấu hình Supabase URL hoặc API Key',
  },
  ME00015: {
    code: 'ME00015',
    template: 'Đơn hàng %1 chưa có món ăn hợp lệ để xử lý',
    defaultStatus: 400,
    description: 'Đơn hàng rỗng hoặc tất cả món đã bị hủy',
  },
  ME00016: {
    code: 'ME00016',
    template: 'Số tiền thanh toán (%1đ) không đủ để thanh toán hóa đơn (%2đ)',
    defaultStatus: 400,
    description: 'Số tiền khách trả nhỏ hơn số tiền cần thu',
  },
  ME00017: {
    code: 'ME00017',
    template: 'Bàn %1 đang trống, không có hóa đơn hoạt động để thực hiện thao tác',
    defaultStatus: 404,
    description: 'Không tìm thấy đơn hàng trên bàn',
  },
  ME00018: {
    code: 'ME00018',
    template: 'Không thể tách hoặc gộp bàn %1 vì %2',
    defaultStatus: 400,
    description: 'Thao tác phân tách/gộp bàn không thỏa mãn điều kiện',
  },
  ME00019: {
    code: 'ME00019',
    template: 'Giao dịch ngân hàng %1 không khớp với đơn hàng %2',
    defaultStatus: 400,
    description: 'Nội dung hoặc số tiền chuyển khoản không hợp lệ',
  },
  ME00020: {
    code: 'ME00020',
    template: 'Lỗi hệ thống máy chủ: %1',
    defaultStatus: 500,
    description: 'Lỗi phát sinh không mong muốn',
  },
};

/**
 * Format message với placeholder %1, %2, %3...
 */
export function formatErrorMessage(code: ErrorCode, ...params: (string | number)[]): string {
  const item = ERROR_CATALOG[code];
  if (!item) return `[${code}] Lỗi không xác định`;

  let formatted = item.template;
  params.forEach((val, idx) => {
    const placeholder = new RegExp(`%${idx + 1}`, 'g');
    formatted = formatted.replace(placeholder, String(val));
  });

  return `[${code}] ${formatted}`;
}

/**
 * Custom Exception cho Dual-layer validation
 */
export class AppValidationError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly params: (string | number)[];
  public readonly details?: any;

  constructor(code: ErrorCode, params: (string | number)[] = [], details?: any) {
    const message = formatErrorMessage(code, ...params);
    super(message);
    this.name = 'AppValidationError';
    this.code = code;
    this.statusCode = ERROR_CATALOG[code]?.defaultStatus || 400;
    this.params = params;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppValidationError);
    }
  }

  public toJSON() {
    return {
      error: true,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      params: this.params,
      details: this.details,
    };
  }
}
