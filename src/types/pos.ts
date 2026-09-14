export type UserRole = 'ADMIN' | 'CASHIER' | 'SERVER' | 'KITCHEN';

export type SalaryCalculationType = 'HOURLY' | 'MONTHLY' | 'COMBINED';

export interface User {
  id: string;
  username?: string; // Tên đăng nhập
  password?: string; // Mật khẩu
  name: string;
  phone: string;
  role: UserRole;
  salaryType: SalaryCalculationType;
  baseSalary: number; // Lương cứng cố định (VNĐ/tháng) hoặc đơn giá giờ nếu HOURLY
  hourlyRate?: number; // Đơn giá theo giờ (VNĐ/giờ) khi tính lương kết hợp
  status: 'ACTIVE' | 'OFF' | 'RESIGNED';
  joinedDate: string;
  avatar?: string;
}

export type StationType = 'BAR' | 'KITCHEN' | 'ALL';

export interface Category {
  id: string;
  name: string;
  icon: string;
  station: StationType; // BAR (Trà sữa, Đồ uống) or KITCHEN (Ốc, Ăn vặt, Nướng)
  description?: string;
}

export interface CookingMethod {
  id: string;
  name: string;
  priceDelta: number; // e.g. +10,000 for sốt bơ tỏi + mỳ
}

export interface ToppingOption {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  basePrice: number;
  unit: string; // 'phần', 'ly', 'con', 'dĩa', 'nồi'
  station: StationType;
  image?: string;
  isAvailable: boolean;
  isPopular?: boolean;
  cookingMethods?: CookingMethod[]; // For Ốc, Ngao, Sò
  allowedToppings?: boolean; // For Trà sữa, Sữa chua, Khoai môn
  sizes?: { name: string; price: number }[]; // For Lẩu ốc (Size nhỏ, Size lớn)
  description?: string;
}

export interface Zone {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export type TableStatus = 'EMPTY' | 'OCCUPIED' | 'WAITING_PAYMENT';

export interface TableItem {
  id: string;
  code: string; // e.g. 'B01', 'B02', 'VIP-1', 'MV-01'
  name: string;
  zone: string; // Dynamic zone e.g. 'Tầng 1', 'Tầng 2', 'Sân Vườn', 'Mang Về', etc.
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  openedAt?: string;
  guestCount?: number;
  qrCodeUrl?: string;
}

export type OrderItemStatus = 'PENDING' | 'COOKING' | 'DONE' | 'SERVED' | 'CANCELLED';

export interface SelectedTopping {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  station: StationType;
  unitPrice: number;
  quantity: number;
  selectedCookingMethod?: CookingMethod;
  selectedSize?: { name: string; price: number };
  selectedToppings: SelectedTopping[];
  note?: string;
  sugarLevel?: string; // 100%, 70%, 50%, 30%, 0%
  iceLevel?: string; // 100%, 70%, 50%, 0%, Nóng
  status: OrderItemStatus;
  createdAt: string;
  completedAt?: string;
  cancelReason?: string;
  cancelledBy?: string;
}

export type OrderStatus = 'ACTIVE' | 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED';

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export type PaymentMethodType = 'CASH' | 'VIETQR' | 'SACOMBANK_QR' | 'CARD' | 'TRANSFER' | 'MIXED';

export interface Order {
  id: string;
  orderCode: string; // e.g. #KAME-240801
  tableId: string;
  tableName: string;
  zone: string;
  orderType: OrderType; // 'DINE_IN' (Ăn tại chỗ) | 'TAKEAWAY' (Mang về) | 'DELIVERY' (Giao hàng / Ship)
  shippingFee: number; // Phí ship: 0đ, 5.000đ, 10.000đ, 15.000đ hoặc tùy chỉnh
  deliveryAddress?: string;
  deliveryPhone?: string;
  deliveryRecipientName?: string;
  deliveryShipperName?: string;
  deliveryStatus?: DeliveryStatus;
  serverName: string;
  serverId: string;
  guestCount: number;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  finalTotal?: number;
  paymentMethod?: PaymentMethodType;
  cashAmountPaid?: number; // Cho trường hợp Mix tiền mặt
  transferAmountPaid?: number; // Cho trường hợp Mix chuyển khoản
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  customerPhone?: string;
  customerNote?: string;
}

export interface VoidLog {
  id: string;
  orderId: string;
  orderCode: string;
  tableName: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  reason: string;
  staffName: string;
  role: UserRole;
  timestamp: string;
}

export interface ShiftRecord {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  userRole?: UserRole;
  date: string; // YYYY-MM-DD
  shiftType: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'FULL';
  hoursWorked: number;
  checkIn: string;
  checkOut: string;
  status: 'ATTENDED' | 'ABSENT' | 'LATE' | 'LEAVE';
  note?: string;
}

export interface PayrollRecord {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  userRole?: UserRole;
  salaryType?: SalaryCalculationType;
  month: string; // YYYY-MM
  totalHours: number;
  totalShifts: number;
  baseSalary: number; // Tiền lương cứng (VNĐ)
  hourlyRate?: number; // Đơn giá theo giờ (VNĐ/h)
  hourlyPay?: number; // Tiền công theo giờ = totalHours * hourlyRate (VNĐ)
  bonus: number; // Tiền thưởng (VNĐ)
  bonusReason?: string; // Lý do thưởng (VD: Thưởng chuyên cần, Thưởng lễ, Doanh số)
  deduction: number; // Khấu trừ/phạt (VNĐ)
  deductionReason?: string; // Lý do phạt/khấu trừ
  netSalary: number; // Tổng thực lĩnh = Lương cứng + Tiền giờ + Thưởng - Phạt
  status: 'DRAFT' | 'PAID';
  paidDate?: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: 'NGUYEN_LIEU' | 'MAT_BANG' | 'DIEN_NUOC' | 'MARKETING' | 'KHAC';
  description: string;
  amount: number;
  createdBy: string;
}

export interface DailySalesSummary {
  id: string; // date YYYY-MM-DD
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  totalRevenue: number;
  totalCost: number;
  totalDiscount: number;
  totalOrders: number;
  cashRevenue: number;
  transferRevenue: number;
  shippingRevenue: number;
  createdAt?: string;
  updatedAt?: string;
}

export type DeliveryStatus = 'PENDING' | 'PREPARING' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';

export interface StoreSettings {
  storeName: string;
  slogan: string;
  address: string;
  phone: string;
  ownerName: string;
  bankCode?: string; // VietQR Bank Code e.g. STB, VCB, MB, TCB, ACB, etc.
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  qrTemplate: string;
  receiptFooter: string;
  taxPercent: number;
  printerPaperSize: '80mm' | '58mm';
  soundEnabled: boolean;
  useSacombankQR?: boolean;
  qrImageUrl?: string;
  defaultShippingFee?: number;
  hideSupabaseOnSidebar?: boolean;
  autoPrintOnPayment?: boolean;
  bankApiKey?: string;
  enableAutoBankConfirmation?: boolean;
}

export type TabType = 'pos' | 'delivery' | 'kds' | 'hrm' | 'menu' | 'reports' | 'users' | 'archive';

export type LayoutMode = 'SIDEBAR_DASHBOARD' | 'TOPBAR_KIOSK';
