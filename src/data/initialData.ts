import {
  Category,
  Product,
  ToppingOption,
  TableItem,
  User,
  StoreSettings,
  ShiftRecord,
  PayrollRecord,
  ExpenseRecord,
  Zone,
} from '../types/pos';

export const INITIAL_ZONES: Zone[] = [
  { id: 'zone-1', name: 'Tầng 1', description: 'Sảnh chính & quầy pha chế' },
  { id: 'zone-2', name: 'Tầng 2', description: 'Phòng máy lạnh & Bàn nhóm' },
  { id: 'zone-3', name: 'Sân Vườn', description: 'Khu ngoài trời thoáng mát' },
  { id: 'zone-4', name: 'Mang Về', description: 'Khu vực đóng gói & Takeaway' },
];

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'KAME - Ốc, Ăn Vặt & Trà Sữa',
  slogan: 'Vị trà đậm đà chuẩn gu - One sip away from a better day',
  address: '74 Lê Lợi / 02 Chế Lan Viên - Khe Sanh, Quảng Trị',
  phone: '0981.417.246 - 0362.141.686 - 0334.080.648',
  ownerName: 'TRẦN THẾ KIỆM',
  bankName: 'Sacombank',
  bankAccount: 'SCMM9R7GUFDQJ3FFPB',
  accountHolder: 'TRẦN THẾ KIỆM',
  qrTemplate: 'compact2',
  receiptFooter: 'Cảm ơn Quý Khách & Hẹn Gặp Lại! KAME chúc bạn một ngày tốt lành!',
  taxPercent: 0,
  printerPaperSize: '80mm',
  soundEnabled: true,
  useSacombankQR: true,
  defaultShippingFee: 10000,
};

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-01',
    name: 'Rin Trần (Chủ quán)',
    phone: '0334080648',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    salaryType: 'MONTHLY',
    baseSalary: 15000000,
    hourlyRate: 0,
    status: 'ACTIVE',
    joinedDate: '2023-01-01',
  },
  {
    id: 'USR-02',
    name: 'Thùy Trâm (Quản lý & Thu ngân)',
    phone: '0981417246',
    role: 'CASHIER',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    salaryType: 'COMBINED',
    baseSalary: 4000000, // Lương cứng 4 triệu
    hourlyRate: 30000, // Cộng thêm 30k / giờ làm
    status: 'ACTIVE',
    joinedDate: '2023-03-15',
  },
  {
    id: 'USR-03',
    name: 'Nguyễn Văn Minh (Bếp trưởng Ốc & Nướng)',
    phone: '0905123456',
    role: 'KITCHEN',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    salaryType: 'COMBINED',
    baseSalary: 3000000, // Lương cứng 3 triệu
    hourlyRate: 35000, // Cộng thêm 35k / giờ làm
    status: 'ACTIVE',
    joinedDate: '2023-05-10',
  },
  {
    id: 'USR-04',
    name: 'Lê Thị Thu Thảo (Barista Pha chế)',
    phone: '0912345678',
    role: 'KITCHEN',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    salaryType: 'HOURLY',
    baseSalary: 0,
    hourlyRate: 30000,
    status: 'ACTIVE',
    joinedDate: '2023-06-01',
  },
  {
    id: 'USR-05',
    name: 'Trần Quốc Bảo (Phục vụ ca tối)',
    phone: '0933888999',
    role: 'SERVER',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    salaryType: 'HOURLY',
    baseSalary: 0,
    hourlyRate: 25000,
    status: 'ACTIVE',
    joinedDate: '2023-08-20',
  },
  {
    id: 'USR-06',
    name: 'Hoàng Ánh Tuyết (Phục vụ ca ngày)',
    phone: '0977112233',
    role: 'SERVER',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    salaryType: 'HOURLY',
    baseSalary: 0,
    hourlyRate: 25000,
    status: 'ACTIVE',
    joinedDate: '2023-09-01',
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  // BAR Station Categories
  { id: 'cat-tra-sua', name: 'Trà Sữa Đặc Biệt', icon: 'Milk', station: 'BAR', description: 'Trà sữa thơm béo, chuẩn vị KAME' },
  { id: 'cat-tra-trai-cay', name: 'Trà Trái Cây', icon: 'Citrus', station: 'BAR', description: 'Trái cây tươi mát, thanh nhiệt' },
  { id: 'cat-khoai-mon', name: 'Khoai Môn Sữa Dừa', icon: 'Sparkles', station: 'BAR', description: 'Bùi béo, thơm ngậy ngọt ngào' },
  { id: 'cat-sua-tuoi', name: 'Sữa Tươi Trân Châu', icon: 'GlassWater', station: 'BAR', description: 'Sữa tươi kem béo chuẩn gu' },
  { id: 'cat-matcha', name: 'Matcha Nhật Bản', icon: 'Leaf', station: 'BAR', description: 'Đậm vị matcha thơm mát' },
  { id: 'cat-yakult-suachua', name: 'Yakult & Sữa Chua', icon: 'CupSoda', station: 'BAR', description: 'Tốt cho tiêu hóa, mát lạnh' },
  
  // KITCHEN Station Categories
  { id: 'cat-oc-hai-san', name: 'Ốc & Hải Sản', icon: 'UtensilsCrossed', station: 'KITCHEN', description: 'Ốc tươi sống, chế biến sốt đặc trưng' },
  { id: 'cat-nuong', name: 'Món Nướng Bếp Than', icon: 'Flame', station: 'KITCHEN', description: 'Hàu, Sò điệp nướng mỡ hành / phô mai' },
  { id: 'cat-lau-oc', name: 'Lẩu Ốc KAME', icon: 'Soup', station: 'KITCHEN', description: 'Nước lẩu chua cay đậm đà' },
  { id: 'cat-com-my', name: 'Cơm Chiên & Mỳ Xào', icon: 'Utensils', station: 'KITCHEN', description: 'No căng bụng, thơm ngon nóng hổi' },
  { id: 'cat-chan-canh-ga', name: 'Chân Gà & Cánh Gà', icon: 'Drumstick', station: 'KITCHEN', description: 'Chân gà sả tắc, sốt Thái, chiên mắm' },
  { id: 'cat-an-vat', name: 'Ăn Vặt & Mì Cay', icon: 'Cookie', station: 'KITCHEN', description: 'Nem chua rán, phô mai que, khoai chiên...' },
];

export const INITIAL_TOPPINGS: ToppingOption[] = [
  { id: 'top-kem-cheese', name: 'Kem cheese', price: 8000 },
  { id: 'top-kem-trung', name: 'Kem trứng', price: 8000 },
  { id: 'top-kem-muoi', name: 'Kem muối', price: 8000 },
  { id: 'top-phomai-jerry', name: 'Phomai Jerry', price: 7000 },
  { id: 'top-cheese-ball', name: 'Cheese ball', price: 5000 },
  { id: 'top-chan-meo', name: 'Thạch chân mèo', price: 5000 },
  { id: 'top-khuc-bach', name: 'Khúc bạch', price: 5000 },
  { id: 'top-tran-chau-den', name: 'Trân châu đen', price: 5000 },
  { id: 'top-tran-chau-trang', name: 'Trân châu trắng', price: 7000 },
  { id: 'top-khoai-deo', name: 'Khoai dẻo', price: 5000 },
  { id: 'top-thach-cu-nang', name: 'Thạch củ năng', price: 5000 },
  { id: 'top-combo-topping', name: 'Combo Topping (3 loại)', price: 7000 },
];

export const INITIAL_PRODUCTS: Product[] = [
  // --- TRÀ TRÁI CÂY (Image 1) ---
  { id: 'P01', categoryId: 'cat-tra-trai-cay', name: 'Trà mãng cầu', basePrice: 28000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true, isPopular: true },
  { id: 'P02', categoryId: 'cat-tra-trai-cay', name: 'Olong Cam đào', basePrice: 28000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true, isPopular: true },
  { id: 'P03', categoryId: 'cat-tra-trai-cay', name: 'Cam đào dâu tây', basePrice: 30000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P04', categoryId: 'cat-tra-trai-cay', name: 'Trà vải', basePrice: 25000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P05', categoryId: 'cat-tra-trai-cay', name: 'Trà lựu đỏ', basePrice: 28000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P06', categoryId: 'cat-tra-trai-cay', name: 'Trà dâu Khe Sanh', basePrice: 30000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true, isPopular: true },

  // --- TRÀ SỮA (Image 1) ---
  { id: 'P07', categoryId: 'cat-tra-sua', name: 'TS hạt dẻ - Trân châu', basePrice: 28000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P08', categoryId: 'cat-tra-sua', name: 'TS sen vàng - Trân châu', basePrice: 28000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P09', categoryId: 'cat-tra-sua', name: 'TS Gạo rang Nhật - Trân châu', basePrice: 25000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P10', categoryId: 'cat-tra-sua', name: 'TS Olong KAME - Trân châu', basePrice: 25000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true, isPopular: true },
  { id: 'P11', categoryId: 'cat-tra-sua', name: 'TS Olong hạnh nhân - Trân châu', basePrice: 28000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P12', categoryId: 'cat-tra-sua', name: 'TS truyền thống đậm vị (Full Topping)', basePrice: 27000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true, isPopular: true },
  { id: 'P13', categoryId: 'cat-tra-sua', name: 'TS truyền thống ít vị trà (Full Topping)', basePrice: 27000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P14', categoryId: 'cat-tra-sua', name: 'TS Kem trứng dừa nướng', basePrice: 30000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true, isPopular: true },
  { id: 'P15', categoryId: 'cat-tra-sua', name: 'TS Kem Cheese', basePrice: 30000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P16', categoryId: 'cat-tra-sua', name: 'TS Kem muối', basePrice: 30000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },

  // --- KHOAI MÔN SỮA DỪA (Image 1) ---
  { id: 'P17', categoryId: 'cat-khoai-mon', name: 'KMSD trân châu', basePrice: 25000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P18', categoryId: 'cat-khoai-mon', name: 'KMSD kem trứng', basePrice: 32000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P19', categoryId: 'cat-khoai-mon', name: 'KMSD kem cheese', basePrice: 33000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P20', categoryId: 'cat-khoai-mon', name: 'KMSD kem muối', basePrice: 33000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P21', categoryId: 'cat-khoai-mon', name: 'KMSD full thạch', basePrice: 32000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true, isPopular: true },

  // --- SỮA TƯƠI (Image 1) ---
  { id: 'P22', categoryId: 'cat-sua-tuoi', name: 'ST trân châu đường đen', basePrice: 25000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true, isPopular: true },
  { id: 'P23', categoryId: 'cat-sua-tuoi', name: 'ST kem trứng', basePrice: 32000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P24', categoryId: 'cat-sua-tuoi', name: 'ST kem muối', basePrice: 33000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P25', categoryId: 'cat-sua-tuoi', name: 'ST kem cheese', basePrice: 33000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },

  // --- MATCHA (Image 1) ---
  { id: 'P26', categoryId: 'cat-matcha', name: 'Matcha latte', basePrice: 25000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P27', categoryId: 'cat-matcha', name: 'Matcha latte kem cheese', basePrice: 33000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P28', categoryId: 'cat-matcha', name: 'Matcha latte kem muối', basePrice: 33000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P29', categoryId: 'cat-matcha', name: 'Matcha latte kem trứng', basePrice: 33000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },

  // --- YAKULT & SỮA CHUA (Image 1) ---
  { id: 'P30', categoryId: 'cat-yakult-suachua', name: 'Yakult vải', basePrice: 25000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P31', categoryId: 'cat-yakult-suachua', name: 'Yakult mãng cầu', basePrice: 25000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P32', categoryId: 'cat-yakult-suachua', name: 'Yakult lựu', basePrice: 25000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P33', categoryId: 'cat-yakult-suachua', name: 'Sữa chua mãng cầu', basePrice: 30000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P34', categoryId: 'cat-yakult-suachua', name: 'Sữa chua vải', basePrice: 28000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P35', categoryId: 'cat-yakult-suachua', name: 'Sữa chua dâu', basePrice: 28000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },
  { id: 'P36', categoryId: 'cat-yakult-suachua', name: 'Sữa chua việt quất', basePrice: 30000, unit: 'ly', station: 'BAR', isAvailable: true, allowedToppings: true },

  // --- ỐC & HẢI SẢN (Image 2) ---
  {
    id: 'P37',
    categoryId: 'cat-oc-hai-san',
    name: 'Ốc Mít',
    basePrice: 59000,
    unit: 'phần',
    station: 'KITCHEN',
    isAvailable: true,
    isPopular: true,
    cookingMethods: [
      { id: 'm-hap-sa', name: 'Hấp sả', priceDelta: 0 },
      { id: 'm-luoc-mam', name: 'Luộc mắm', priceDelta: 0 },
      { id: 'm-xao-sa-ot', name: 'Xào sả ớt', priceDelta: 10000 },
    ]
  },
  {
    id: 'P38',
    categoryId: 'cat-oc-hai-san',
    name: 'Ốc Bươu Đen',
    basePrice: 59000,
    unit: 'phần',
    station: 'KITCHEN',
    isAvailable: true,
    cookingMethods: [
      { id: 'm-hap-sa', name: 'Hấp sả', priceDelta: 0 },
      { id: 'm-luoc-mam', name: 'Luộc mắm', priceDelta: 0 },
      { id: 'm-xao-sa-ot', name: 'Xào sả ớt', priceDelta: 10000 },
    ]
  },
  {
    id: 'P39',
    categoryId: 'cat-oc-hai-san',
    name: 'Ốc Đinh',
    basePrice: 49000,
    unit: 'phần',
    station: 'KITCHEN',
    isAvailable: true,
    cookingMethods: [
      { id: 'm-hap-sa', name: 'Hấp sả', priceDelta: 0 },
      { id: 'm-luoc-mam', name: 'Luộc mắm', priceDelta: 0 },
      { id: 'm-xao-sa-ot', name: 'Xào sả ớt', priceDelta: 10000 },
    ]
  },
  {
    id: 'P40',
    categoryId: 'cat-oc-hai-san',
    name: 'Càng Ghẹ',
    basePrice: 79000,
    unit: 'phần',
    station: 'KITCHEN',
    isAvailable: true,
    isPopular: true,
    cookingMethods: [
      { id: 'm-sot-me', name: 'Sốt me', priceDelta: 0 },
      { id: 'm-rang-muoi', name: 'Rang muối', priceDelta: 0 },
    ]
  },
  {
    id: 'P41',
    categoryId: 'cat-oc-hai-san',
    name: 'Ốc Móng Tay',
    basePrice: 59000,
    unit: 'phần',
    station: 'KITCHEN',
    isAvailable: true,
    isPopular: true,
    cookingMethods: [
      { id: 'm-xao-sa-ot', name: 'Xào sả ớt', priceDelta: 0 },
      { id: 'm-sot-me', name: 'Sốt me', priceDelta: 0 },
      { id: 'm-sot-bo-toi-my', name: 'Sốt bơ tỏi + mỳ', priceDelta: 10000 },
      { id: 'm-xao-rau-muong', name: 'Xào rau muống', priceDelta: 0 },
    ]
  },
  {
    id: 'P42',
    categoryId: 'cat-oc-hai-san',
    name: 'Ốc Cà Na',
    basePrice: 79000,
    unit: 'phần',
    station: 'KITCHEN',
    isAvailable: true,
    cookingMethods: [
      { id: 'm-hap-sa', name: 'Hấp sả', priceDelta: 0 },
      { id: 'm-xao-sa-ot', name: 'Xào sả ớt', priceDelta: 10000 },
      { id: 'm-sot-bo-toi-my', name: 'Sốt bơ tỏi + mỳ', priceDelta: 10000 },
    ]
  },
  {
    id: 'P43',
    categoryId: 'cat-oc-hai-san',
    name: 'Ngao',
    basePrice: 49000,
    unit: 'phần',
    station: 'KITCHEN',
    isAvailable: true,
    cookingMethods: [
      { id: 'm-hap-sa', name: 'Hấp sả', priceDelta: 0 },
      { id: 'm-hap-thai', name: 'Hấp Thái', priceDelta: 10000 },
      { id: 'm-xao-sa-ot', name: 'Xào sả ớt', priceDelta: 10000 },
      { id: 'm-sot-bo-cay-my', name: 'Sốt bơ cay + mỳ', priceDelta: 10000 },
      { id: 'm-sot-bo-toi-my', name: 'Sốt bơ tỏi + mỳ', priceDelta: 10000 },
      { id: 'm-sot-me-my', name: 'Sốt me + mỳ', priceDelta: 10000 },
    ]
  },
  {
    id: 'P44',
    categoryId: 'cat-oc-hai-san',
    name: 'Sò Lụa',
    basePrice: 59000,
    unit: 'phần',
    station: 'KITCHEN',
    isAvailable: true,
    cookingMethods: [
      { id: 'm-hap-sa', name: 'Hấp sả', priceDelta: 0 },
      { id: 'm-hap-thai', name: 'Hấp Thái', priceDelta: 10000 },
      { id: 'm-xao-sa-ot', name: 'Xào sả ớt', priceDelta: 10000 },
      { id: 'm-sot-bo-cay-my', name: 'Sốt bơ cay + mỳ', priceDelta: 10000 },
      { id: 'm-sot-bo-toi-my', name: 'Sốt bơ tỏi + mỳ', priceDelta: 10000 },
      { id: 'm-sot-me-my', name: 'Sốt me + mỳ', priceDelta: 10000 },
    ]
  },
  {
    id: 'P45',
    categoryId: 'cat-oc-hai-san',
    name: 'Ốc Hương',
    basePrice: 79000,
    unit: 'phần',
    station: 'KITCHEN',
    isAvailable: true,
    isPopular: true,
    cookingMethods: [
      { id: 'm-hap-sa', name: 'Hấp sả', priceDelta: 0 },
      { id: 'm-xao-sa-ot', name: 'Xào sả ớt', priceDelta: 10000 },
      { id: 'm-sot-bo-toi-my', name: 'Sốt bơ tỏi + mỳ', priceDelta: 10000 },
      { id: 'm-sot-trung-muoi', name: 'Sốt trứng muối', priceDelta: 10000 },
      { id: 'm-rang-muoi', name: 'Rang muối', priceDelta: 10000 },
    ]
  },

  // --- LẨU ỐC (Image 3) ---
  {
    id: 'P46',
    categoryId: 'cat-lau-oc',
    name: 'Lẩu Ốc KAME',
    basePrice: 149000,
    unit: 'nồi',
    station: 'KITCHEN',
    isAvailable: true,
    isPopular: true,
    sizes: [
      { name: 'Size Nhỏ (2-3 người)', price: 149000 },
      { name: 'Size Lớn (4-6 người)', price: 249000 },
    ]
  },
  { id: 'P47', categoryId: 'cat-lau-oc', name: 'Bún thêm (Lẩu)', basePrice: 5000, unit: 'dĩa', station: 'KITCHEN', isAvailable: true },
  { id: 'P48', categoryId: 'cat-lau-oc', name: 'Rau thêm (Lẩu)', basePrice: 10000, unit: 'dĩa', station: 'KITCHEN', isAvailable: true },

  // --- CƠM CHIÊN & MỲ (Image 3) ---
  { id: 'P49', categoryId: 'cat-com-my', name: 'Cơm chiên trứng', basePrice: 39000, unit: 'dĩa', station: 'KITCHEN', isAvailable: true },
  { id: 'P50', categoryId: 'cat-com-my', name: 'Cơm chiên hải sản', basePrice: 49000, unit: 'dĩa', station: 'KITCHEN', isAvailable: true, isPopular: true },
  { id: 'P51', categoryId: 'cat-com-my', name: 'Mỳ xào hải sản', basePrice: 49000, unit: 'dĩa', station: 'KITCHEN', isAvailable: true, isPopular: true },

  // --- CHÂN GÀ & CÁNH GÀ (Image 3) ---
  { id: 'P52', categoryId: 'cat-chan-canh-ga', name: 'Chân gà sả tắc', basePrice: 49000, unit: 'dĩa', station: 'KITCHEN', isAvailable: true, isPopular: true },
  { id: 'P53', categoryId: 'cat-chan-canh-ga', name: 'Chân gà sốt Thái', basePrice: 49000, unit: 'dĩa', station: 'KITCHEN', isAvailable: true, isPopular: true },
  { id: 'P54', categoryId: 'cat-chan-canh-ga', name: 'Chân gà chiên mắm', basePrice: 49000, unit: 'dĩa', station: 'KITCHEN', isAvailable: true },
  { id: 'P55', categoryId: 'cat-chan-canh-ga', name: 'Cánh gà chiên mắm', basePrice: 59000, unit: 'dĩa', station: 'KITCHEN', isAvailable: true },

  // --- NƯỚNG (Image 3) ---
  { id: 'P56', categoryId: 'cat-nuong', name: 'Ốc bươu nướng tiêu xanh', basePrice: 59000, unit: 'phần', station: 'KITCHEN', isAvailable: true, isPopular: true },
  { id: 'P57', categoryId: 'cat-nuong', name: 'Ốc Bulot nướng tiêu xanh', basePrice: 15000, unit: 'con', station: 'KITCHEN', isAvailable: true },
  { id: 'P58', categoryId: 'cat-nuong', name: 'Hàu nướng mỡ hành', basePrice: 10000, unit: 'con', station: 'KITCHEN', isAvailable: true, isPopular: true },
  { id: 'P59', categoryId: 'cat-nuong', name: 'Hàu nướng phô mai', basePrice: 12000, unit: 'con', station: 'KITCHEN', isAvailable: true, isPopular: true },
  { id: 'P60', categoryId: 'cat-nuong', name: 'Sò điệp nướng mỡ hành', basePrice: 10000, unit: 'con', station: 'KITCHEN', isAvailable: true },
  { id: 'P61', categoryId: 'cat-nuong', name: 'Sò điệp nướng phô mai', basePrice: 12000, unit: 'con', station: 'KITCHEN', isAvailable: true },

  // --- ĂN VẶT & MÌ CAY & CÚT LỘN (Image 3) ---
  {
    id: 'P62',
    categoryId: 'cat-an-vat',
    name: 'Cút lộn',
    basePrice: 39000,
    unit: 'phần',
    station: 'KITCHEN',
    isAvailable: true,
    cookingMethods: [
      { id: 'm-luoc', name: 'Luộc', priceDelta: 0 },
      { id: 'm-sot-me', name: 'Sốt me', priceDelta: 10000 },
    ]
  },
  { id: 'P63', categoryId: 'cat-an-vat', name: 'Mì cay KAME', basePrice: 49000, unit: 'tô', station: 'KITCHEN', isAvailable: true, isPopular: true },
  { id: 'P64', categoryId: 'cat-an-vat', name: 'Bánh mì nướng phomai', basePrice: 30000, unit: 'phần', station: 'KITCHEN', isAvailable: true },
  { id: 'P65', categoryId: 'cat-an-vat', name: 'Bánh mì ổ', basePrice: 5000, unit: 'ổ', station: 'KITCHEN', isAvailable: true },
  { id: 'P66', categoryId: 'cat-an-vat', name: 'Xúc xích chiên', basePrice: 12000, unit: 'cây', station: 'KITCHEN', isAvailable: true },
  { id: 'P67', categoryId: 'cat-an-vat', name: 'Phomai que', basePrice: 12000, unit: 'cây', station: 'KITCHEN', isAvailable: true, isPopular: true },
  { id: 'P68', categoryId: 'cat-an-vat', name: 'Nem chua rán', basePrice: 35000, unit: 'phần', station: 'KITCHEN', isAvailable: true, isPopular: true },
  { id: 'P69', categoryId: 'cat-an-vat', name: 'Khoai lang kén', basePrice: 30000, unit: 'dĩa', station: 'KITCHEN', isAvailable: true },
  { id: 'P70', categoryId: 'cat-an-vat', name: 'Khoai tây chiên', basePrice: 25000, unit: 'dĩa', station: 'KITCHEN', isAvailable: true },
  { id: 'P71', categoryId: 'cat-an-vat', name: 'Hồ lô chiên', basePrice: 12000, unit: 'xiên', station: 'KITCHEN', isAvailable: true },
  { id: 'P72', categoryId: 'cat-an-vat', name: 'Cá / Bò / Tôm viên chiên', basePrice: 12000, unit: 'xiên', station: 'KITCHEN', isAvailable: true },
  { id: 'P73', categoryId: 'cat-an-vat', name: 'Đùi / Cánh gà rán', basePrice: 32000, unit: 'cái', station: 'KITCHEN', isAvailable: true },
];

export const INITIAL_TABLES: TableItem[] = [
  // Tầng 1 (Sảnh chính)
  { id: 'T01', code: 'B01', name: 'Bàn 01', zone: 'Tầng 1', capacity: 4, status: 'EMPTY' },
  { id: 'T02', code: 'B02', name: 'Bàn 02', zone: 'Tầng 1', capacity: 4, status: 'EMPTY' },
  { id: 'T03', code: 'B03', name: 'Bàn 03', zone: 'Tầng 1', capacity: 4, status: 'EMPTY' },
  { id: 'T04', code: 'B04', name: 'Bàn 04', zone: 'Tầng 1', capacity: 6, status: 'EMPTY' },
  { id: 'T05', code: 'B05', name: 'Bàn 05', zone: 'Tầng 1', capacity: 6, status: 'EMPTY' },
  { id: 'T06', code: 'B06', name: 'Bàn 06', zone: 'Tầng 1', capacity: 8, status: 'EMPTY' },

  // Tầng 2 (Máy lạnh & Nhóm)
  { id: 'T07', code: 'B201', name: 'Bàn 201', zone: 'Tầng 2', capacity: 4, status: 'EMPTY' },
  { id: 'T08', code: 'B202', name: 'Bàn 202', zone: 'Tầng 2', capacity: 4, status: 'EMPTY' },
  { id: 'T09', code: 'B203', name: 'Bàn 203', zone: 'Tầng 2', capacity: 6, status: 'EMPTY' },
  { id: 'T10', code: 'B204', name: 'Bàn 204 (VIP)', zone: 'Tầng 2', capacity: 10, status: 'EMPTY' },

  // Sân Vườn (Thoáng mát ngoài trời)
  { id: 'T11', code: 'SV01', name: 'Sân Vườn 01', zone: 'Sân Vườn', capacity: 4, status: 'EMPTY' },
  { id: 'T12', code: 'SV02', name: 'Sân Vườn 02', zone: 'Sân Vườn', capacity: 4, status: 'EMPTY' },
  { id: 'T13', code: 'SV03', name: 'Sân Vườn 03', zone: 'Sân Vườn', capacity: 6, status: 'EMPTY' },
  { id: 'T14', code: 'SV04', name: 'Sân Vườn 04', zone: 'Sân Vườn', capacity: 8, status: 'EMPTY' },

  // Mang Về / Takeaway
  { id: 'T15', code: 'MV01', name: 'Mang Về #1', zone: 'Mang Về', capacity: 1, status: 'EMPTY' },
  { id: 'T16', code: 'MV02', name: 'Mang Về #2', zone: 'Mang Về', capacity: 1, status: 'EMPTY' },
];

export const INITIAL_SHIFTS: ShiftRecord[] = [
  { id: 'S01', userId: 'USR-03', userName: 'Nguyễn Văn Minh (Bếp trưởng Ốc & Nướng)', userPhone: '0905123456', userRole: 'KITCHEN', date: '2026-08-24', shiftType: 'MORNING', hoursWorked: 6, checkIn: '07:00', checkOut: '13:00', status: 'ATTENDED' },
  { id: 'S02', userId: 'USR-04', userName: 'Lê Thị Thu Thảo (Barista Pha chế)', userPhone: '0912345678', userRole: 'KITCHEN', date: '2026-08-24', shiftType: 'AFTERNOON', hoursWorked: 5, checkIn: '13:00', checkOut: '18:00', status: 'ATTENDED' },
  { id: 'S03', userId: 'USR-05', userName: 'Trần Quốc Bảo (Phục vụ ca tối)', userPhone: '0933888999', userRole: 'SERVER', date: '2026-08-24', shiftType: 'EVENING', hoursWorked: 5, checkIn: '18:00', checkOut: '23:00', status: 'ATTENDED' },
  { id: 'S04', userId: 'USR-06', userName: 'Hoàng Ánh Tuyết (Phục vụ ca ngày)', userPhone: '0977112233', userRole: 'SERVER', date: '2026-08-24', shiftType: 'MORNING', hoursWorked: 6, checkIn: '07:00', checkOut: '13:00', status: 'ATTENDED' },
  { id: 'S05', userId: 'USR-03', userName: 'Nguyễn Văn Minh (Bếp trưởng Ốc & Nướng)', userPhone: '0905123456', userRole: 'KITCHEN', date: '2026-08-23', shiftType: 'AFTERNOON', hoursWorked: 5, checkIn: '13:00', checkOut: '18:00', status: 'ATTENDED' },
  { id: 'S06', userId: 'USR-04', userName: 'Lê Thị Thu Thảo (Barista Pha chế)', userPhone: '0912345678', userRole: 'KITCHEN', date: '2026-08-23', shiftType: 'MORNING', hoursWorked: 6, checkIn: '07:00', checkOut: '13:00', status: 'ATTENDED' },
  { id: 'S07', userId: 'USR-05', userName: 'Trần Quốc Bảo (Phục vụ ca tối)', userPhone: '0933888999', userRole: 'SERVER', date: '2026-08-23', shiftType: 'EVENING', hoursWorked: 5, checkIn: '18:00', checkOut: '23:00', status: 'ATTENDED' },
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  { id: 'EXP-01', date: '2026-08-24', category: 'NGUYEN_LIEU', description: 'Nhập ốc hương & ốc móng tay tươi sống buổi sáng', amount: 1850000, createdBy: 'Rin Trần' },
  { id: 'EXP-02', date: '2026-08-24', category: 'NGUYEN_LIEU', description: 'Nhập sữa tươi, trà ô long, siro mãng cầu & trân châu', amount: 920000, createdBy: 'Thùy Trâm' },
  { id: 'EXP-03', date: '2026-08-23', category: 'DIEN_NUOC', description: 'Tiền điện sinh hoạt và máy lạnh tháng 8', amount: 2400000, createdBy: 'Rin Trần' },
  { id: 'EXP-04', date: '2026-08-20', category: 'MARKETING', description: 'In ấn menu & standee khuyến mãi khai trương', amount: 450000, createdBy: 'Thùy Trâm' },
];
