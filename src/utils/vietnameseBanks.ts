export interface VietnameseBank {
  code: string; // Mã viết tắt VietQR (STB, VCB, MB, TCB...)
  shortName: string; // Tên ngắn phổ biến (Sacombank, Vietcombank, MBBank...)
  name: string; // Tên đầy đủ
  bin: string; // Mã BIN ngân hàng theo chuẩn Napas
  color?: string; // Brand color highlight
}

export const POPULAR_VIETNAMESE_BANKS: VietnameseBank[] = [
  {
    code: 'STB',
    shortName: 'Sacombank',
    name: 'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)',
    bin: '970403',
    color: '#0284c7',
  },
  {
    code: 'VCB',
    shortName: 'Vietcombank',
    name: 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)',
    bin: '970436',
    color: '#15803d',
  },
  {
    code: 'MB',
    shortName: 'MBBank',
    name: 'Ngân hàng TMCP Quân Đội (MB Bank)',
    bin: '970422',
    color: '#1d4ed8',
  },
  {
    code: 'TCB',
    shortName: 'Techcombank',
    name: 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)',
    bin: '970407',
    color: '#dc2626',
  },
  {
    code: 'ACB',
    shortName: 'ACB',
    name: 'Ngân hàng TMCP Á Châu (ACB)',
    bin: '970416',
    color: '#0284c7',
  },
  {
    code: 'VPB',
    shortName: 'VPBank',
    name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)',
    bin: '970432',
    color: '#16a34a',
  },
  {
    code: 'TPB',
    shortName: 'TPBank',
    name: 'Ngân hàng TMCP Tiên Phong (TPBank)',
    bin: '970423',
    color: '#9333ea',
  },
  {
    code: 'BIDV',
    shortName: 'BIDV',
    name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)',
    bin: '970418',
    color: '#0d9488',
  },
  {
    code: 'CTG',
    shortName: 'VietinBank',
    name: 'Ngân hàng TMCP Công thương Việt Nam (VietinBank)',
    bin: '970415',
    color: '#0284c7',
  },
  {
    code: 'VBA',
    shortName: 'Agribank',
    name: 'Ngân hàng Nông nghiệp & Phát triển Nông thôn (Agribank)',
    bin: '970405',
    color: '#b91c1c',
  },
  {
    code: 'VIB',
    shortName: 'VIB',
    name: 'Ngân hàng TMCP Quốc Tế Việt Nam (VIB)',
    bin: '970441',
    color: '#ea580c',
  },
  {
    code: 'OCB',
    shortName: 'OCB',
    name: 'Ngân hàng TMCP Phương Đông (OCB)',
    bin: '970448',
    color: '#16a34a',
  },
  {
    code: 'HDB',
    shortName: 'HDBank',
    name: 'Ngân hàng TMCP Phát triển TP.HCM (HDBank)',
    bin: '970437',
    color: '#eab308',
  },
  {
    code: 'SHB',
    shortName: 'SHB',
    name: 'Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)',
    bin: '970443',
    color: '#ea580c',
  },
  {
    code: 'MSB',
    shortName: 'MSB',
    name: 'Ngân hàng TMCP Hàng Hải (MSB)',
    bin: '970426',
    color: '#ea580c',
  },
  {
    code: 'SEAB',
    shortName: 'SeABank',
    name: 'Ngân hàng TMCP Đông Nam Á (SeABank)',
    bin: '970440',
    color: '#dc2626',
  },
  {
    code: 'LPB',
    shortName: 'LPBank',
    name: 'Ngân hàng TMCP Lộc Phát Việt Nam (LPBank)',
    bin: '970449',
    color: '#ea580c',
  },
  {
    code: 'NAB',
    shortName: 'Nam A Bank',
    name: 'Ngân hàng TMCP Nam Á (Nam A Bank)',
    bin: '970428',
    color: '#eab308',
  },
];

/**
 * Tra cứu thông tin ngân hàng qua mã code hoặc tên
 */
export function findBank(codeOrName?: string): VietnameseBank | undefined {
  if (!codeOrName) return undefined;
  const query = codeOrName.trim().toLowerCase();
  return POPULAR_VIETNAMESE_BANKS.find(
    (b) =>
      b.code.toLowerCase() === query ||
      b.shortName.toLowerCase() === query ||
      b.name.toLowerCase().includes(query) ||
      b.bin === query
  );
}

/**
 * Sinh đường dẫn VietQR chuẩn Napas 24/7 theo bất kỳ ngân hàng nào
 */
export function buildVietQRUrl(params: {
  bankCodeOrBin?: string;
  bankAccount: string;
  amount?: number;
  memo?: string;
  accountHolder?: string;
  template?: string;
}): string {
  const bankId = (params.bankCodeOrBin || 'Sacombank').trim();
  const template = params.template || 'compact2';
  const cleanAccount = (params.bankAccount || '').replace(/\s+/g, '');
  const amountVal = params.amount && params.amount > 0 ? params.amount : 0;
  const memoText = params.memo ? encodeURIComponent(params.memo) : '';
  const holderText = params.accountHolder ? encodeURIComponent(params.accountHolder) : '';

  return `https://img.vietqr.io/image/${bankId}-${cleanAccount}-${template}.png?amount=${amountVal}&addInfo=${memoText}&accountName=${holderText}`;
}
