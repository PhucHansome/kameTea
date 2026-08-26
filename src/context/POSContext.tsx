import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  UserRole,
  Category,
  Product,
  ToppingOption,
  TableItem,
  Zone,
  Order,
  OrderItem,
  OrderItemStatus,
  VoidLog,
  ShiftRecord,
  PayrollRecord,
  ExpenseRecord,
  StoreSettings,
  LayoutMode,
  StationType,
  CookingMethod,
  SelectedTopping,
  TabType,
  OrderType,
  PaymentMethodType,
  DailySalesSummary,
} from '../types/pos';
import {
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_TOPPINGS,
  INITIAL_TABLES,
  INITIAL_ZONES,
  INITIAL_SETTINGS,
  INITIAL_SHIFTS,
  INITIAL_EXPENSES,
} from '../data/initialData';
import { playBellSound, playSuccessSound } from '../utils/audio';
import {
  pushAllDataToSupabase,
  pullAllDataFromSupabase,
  dbUpsert,
  dbUpdate,
  dbDelete,
  compressSalesData,
  SyncResult,
} from '../lib/supabase';

export interface QrNotification {
  tableId: string;
  tableName: string;
  itemCount: number;
  totalAmount: number;
  timestamp: string;
}

export interface ToastNotification {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface POSContextType {
  // Auth & Roles
  users: User[];
  activeUser: User;
  setActiveUser: (user: User) => void;
  setUserRole: (role: UserRole) => void;
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;

  // Zones & Tables
  zones: Zone[];
  addZone: (zone: Zone) => void;
  updateZone: (zone: Zone) => void;
  deleteZone: (zoneId: string) => void;

  tables: TableItem[];
  addTable: (table: Omit<TableItem, 'id' | 'status'>) => void;
  updateTable: (table: TableItem) => void;
  deleteTable: (tableId: string) => void;

  selectedTableId: string | null;
  setSelectedTableId: (id: string | null) => void;
  selectedTable: TableItem | undefined;
  activeTable: TableItem | null;
  setActiveTable: (table: TableItem | null) => void;
  activeOrder: Order | undefined;

  // Catalog
  categories: Category[];
  products: Product[];
  toppings: ToppingOption[];
  toggleProductAvailability: (productId: string) => Promise<void>;
  saveProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  saveCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;

  // Cart / In-progress ordering
  cartItems: OrderItem[];
  addToCart: (
    product: Product,
    customization?: {
      cookingMethod?: CookingMethod;
      size?: { name: string; price: number };
      toppings?: SelectedTopping[];
      sugarLevel?: string;
      iceLevel?: string;
      note?: string;
      quantity?: number;
    }
  ) => void;
  updateCartItemQuantity: (itemId: string, delta: number) => void;
  removeCartItem: (itemId: string) => void;
  clearCart: () => void;
  cartTotal: number;

  // Order Lifecycle
  sendCartToKitchen: (
    guestCount?: number,
    options?: {
      orderType?: OrderType;
      shippingFee?: number;
      deliveryAddress?: string;
      deliveryPhone?: string;
      customerNote?: string;
    }
  ) => Promise<Order>;
  orders: Order[];
  updateOrderItemStatus: (orderId: string, itemId: string, status: OrderItemStatus) => Promise<void>;
  cancelOrderItem: (orderId: string, itemId: string, reason: string) => Promise<void>;
  requestPayment: (orderId: string) => Promise<void>;
  updateOrderDetails: (orderId: string, updates: Partial<Order>) => Promise<void>;
  completePayment: (
    orderId: string,
    paymentMethod: PaymentMethodType,
    discountPercent: number,
    taxPercent: number,
    paymentDetails?: { cashAmount?: number; transferAmount?: number; shippingFee?: number }
  ) => Promise<void>;
  splitTable: (sourceTableId: string, targetTableId: string, itemIds: string[]) => Promise<void>;
  mergeTables: (sourceTableId: string, targetTableId: string) => Promise<void>;

  // QR Self-Order & Notification
  submitCustomerSelfOrder: (
    tableId: string,
    items: OrderItem[],
    guestName?: string,
    customerNote?: string
  ) => Promise<{ order: Order; isNew: boolean }>;
  qrNotification: QrNotification | null;
  clearQrNotification: () => void;

  // Logs & HRM
  voidLogs: VoidLog[];
  shifts: ShiftRecord[];
  addOrUpdateShift: (shift: ShiftRecord) => Promise<void>;
  deleteShift: (shiftId: string) => Promise<void>;
  expenses: ExpenseRecord[];
  addExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;
  deleteExpense: (id: string) => void;
  payrolls: PayrollRecord[];
  generateMonthlyPayroll: (monthStr: string) => Promise<void>;
  updatePayrollStatus: (payrollId: string, status: 'DRAFT' | 'PAID') => Promise<void>;
  updatePayrollRecord: (payrollId: string, updates: Partial<PayrollRecord>) => Promise<void>;

  // Settings & Layout & Navigation
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  hideSupabaseOnSidebar: boolean;
  setHideSupabaseOnSidebar: (hide: boolean) => void;

  // Revenue Compression Strategy
  dailySalesSummaries: DailySalesSummary[];
  compressOldSalesData: (options: { cutoffMonths?: number; specificMonth?: string }) => Promise<{
    success: boolean;
    message: string;
    compressedOrdersCount?: number;
    daysSummarized?: number;
    totalRevenuePreserved?: number;
  }>;

  // Sound and notifications
  notifyKitchenUpdate: () => void;
  resetAllToDefault: () => void;

  // Supabase Cloud Sync & Real-time Persistence
  syncToSupabase: () => Promise<SyncResult>;
  syncFromSupabase: () => Promise<{ success: boolean; message: string }>;
  isSyncingToCloud: boolean;
  lastCloudSyncTime: string | null;

  // Async States & Feedback
  isSubmitting: boolean;
  isLoadingData: boolean;
  refetchAllFromSupabase: () => Promise<void>;
  toastNotification: ToastNotification | null;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  clearToastNotification: () => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Primary States
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('kame_pos_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [activeUser, setActiveUser] = useState<User>(() => users[0] || INITIAL_USERS[0]);

  const [zones, setZones] = useState<Zone[]>(() => {
    const saved = localStorage.getItem('kame_pos_zones');
    return saved ? JSON.parse(saved) : INITIAL_ZONES;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('kame_pos_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('kame_pos_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [toppings, setToppings] = useState<ToppingOption[]>(() => {
    const saved = localStorage.getItem('kame_pos_toppings');
    return saved ? JSON.parse(saved) : INITIAL_TOPPINGS;
  });

  const [tables, setTables] = useState<TableItem[]>(() => {
    const saved = localStorage.getItem('kame_pos_tables');
    return saved ? JSON.parse(saved) : INITIAL_TABLES;
  });

  const [qrNotification, setQrNotification] = useState<QrNotification | null>(null);

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('kame_pos_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [voidLogs, setVoidLogs] = useState<VoidLog[]>(() => {
    const saved = localStorage.getItem('kame_pos_void_logs');
    if (!saved) return [];
    try {
      const parsed: VoidLog[] = JSON.parse(saved);
      const seen = new Set<string>();
      return parsed.map((item, idx) => {
        if (!item.id || seen.has(item.id)) {
          const uniqueId = `void-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
          seen.add(uniqueId);
          return { ...item, id: uniqueId };
        }
        seen.add(item.id);
        return item;
      });
    } catch {
      return [];
    }
  });

  const [shifts, setShifts] = useState<ShiftRecord[]>(() => {
    const saved = localStorage.getItem('kame_pos_shifts');
    return saved ? JSON.parse(saved) : INITIAL_SHIFTS;
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem('kame_pos_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [payrolls, setPayrolls] = useState<PayrollRecord[]>(() => {
    const saved = localStorage.getItem('kame_pos_payrolls');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('kame_pos_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [dailySalesSummaries, setDailySalesSummaries] = useState<DailySalesSummary[]>(() => {
    const saved = localStorage.getItem('kame_pos_daily_sales_summaries');
    return saved ? JSON.parse(saved) : [];
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('kame_pos_sidebar_collapsed') === 'true';
  });

  const [hideSupabaseOnSidebar, setHideSupabaseOnSidebarState] = useState<boolean>(() => {
    return localStorage.getItem('kame_pos_hide_supabase_btn') === 'true' || Boolean(settings.hideSupabaseOnSidebar);
  });

  const setHideSupabaseOnSidebar = useCallback((hide: boolean) => {
    setHideSupabaseOnSidebarState(hide);
    localStorage.setItem('kame_pos_hide_supabase_btn', hide.toString());
  }, []);

  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const saved = localStorage.getItem('kame_pos_layout_mode');
    return (saved as LayoutMode) || 'SIDEBAR_DASHBOARD';
  });

  const [activeTab, setActiveTab] = useState<string>('pos');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('kame_pos_dark') === 'true';
  });

  // Async & Toast states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [toastNotification, setToastNotification] = useState<ToastNotification | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastNotification({ type, title, message });
    toastTimeoutRef.current = setTimeout(() => {
      setToastNotification(null);
    }, 4500);
  }, []);

  const clearToastNotification = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastNotification(null);
  }, []);

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('kame_pos_dark', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Local storage persistence caching
  useEffect(() => {
    localStorage.setItem('kame_pos_users', JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem('kame_pos_zones', JSON.stringify(zones));
  }, [zones]);
  useEffect(() => {
    localStorage.setItem('kame_pos_categories', JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem('kame_pos_products', JSON.stringify(products));
  }, [products]);
  useEffect(() => {
    localStorage.setItem('kame_pos_toppings', JSON.stringify(toppings));
  }, [toppings]);
  useEffect(() => {
    localStorage.setItem('kame_pos_tables', JSON.stringify(tables));
  }, [tables]);
  useEffect(() => {
    localStorage.setItem('kame_pos_orders', JSON.stringify(orders));
  }, [orders]);
  useEffect(() => {
    localStorage.setItem('kame_pos_void_logs', JSON.stringify(voidLogs));
  }, [voidLogs]);
  useEffect(() => {
    localStorage.setItem('kame_pos_shifts', JSON.stringify(shifts));
  }, [shifts]);
  useEffect(() => {
    localStorage.setItem('kame_pos_expenses', JSON.stringify(expenses));
  }, [expenses]);
  useEffect(() => {
    localStorage.setItem('kame_pos_payrolls', JSON.stringify(payrolls));
  }, [payrolls]);
  useEffect(() => {
    localStorage.setItem('kame_pos_settings', JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem('kame_pos_daily_sales_summaries', JSON.stringify(dailySalesSummaries));
  }, [dailySalesSummaries]);
  useEffect(() => {
    localStorage.setItem('kame_pos_sidebar_collapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);
  useEffect(() => {
    localStorage.setItem('kame_pos_layout_mode', layoutMode);
  }, [layoutMode]);

  // Compress Old Sales Data to Daily Sales Summary
  const compressOldSalesData = useCallback(
    async (options: { cutoffMonths?: number; specificMonth?: string }) => {
      setIsSubmitting(true);
      try {
        // 1. Try server-side compression
        const res = await compressSalesData(options);
        if (res.success && res.summaries && res.summaries.length > 0) {
          // Merge summaries into state
          setDailySalesSummaries(prev => {
            const map = new Map<string, DailySalesSummary>();
            prev.forEach(s => map.set(s.id || s.date, s));
            res.summaries!.forEach(s => {
              map.set(s.id || s.date, {
                id: s.id || s.date,
                date: s.date,
                month: s.month || (s.date ? s.date.substring(0, 7) : ''),
                totalRevenue: Number(s.total_revenue || s.totalRevenue) || 0,
                totalCost: Number(s.total_cost || s.totalCost) || 0,
                totalDiscount: Number(s.total_discount || s.totalDiscount) || 0,
                totalOrders: Number(s.total_orders || s.totalOrders) || 0,
                cashRevenue: Number(s.cash_revenue || s.cashRevenue) || 0,
                transferRevenue: Number(s.transfer_revenue || s.transferRevenue) || 0,
                shippingRevenue: Number(s.shipping_revenue || s.shippingRevenue) || 0,
              });
            });
            return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
          });

          // Calculate cutoff date to filter local orders state
          let targetCutoffIso: string;
          if (options.specificMonth) {
            const [y, m] = options.specificMonth.split('-');
            targetCutoffIso = new Date(Number(y), Number(m), 1).toISOString();
          } else {
            const d = new Date();
            d.setMonth(d.getMonth() - (options.cutoffMonths || 12));
            targetCutoffIso = d.toISOString();
          }

          setOrders(prev => prev.filter(o => {
            if (o.status !== 'PAID' && o.status !== 'CANCELLED') return true;
            return (o.createdAt || '') > targetCutoffIso;
          }));

          playSuccessSound();
          showToast('success', 'Nén dữ liệu thành công', res.message);
          return res;
        }

        // 2. Local Fallback compression (if backend not reachable)
        const cutoffMonths = options.cutoffMonths || 12;
        let targetCutoffIso: string;
        if (options.specificMonth) {
          const [y, m] = options.specificMonth.split('-');
          targetCutoffIso = new Date(Number(y), Number(m), 1).toISOString();
        } else {
          const d = new Date();
          d.setMonth(d.getMonth() - cutoffMonths);
          targetCutoffIso = d.toISOString();
        }

        const eligibleOrders = orders.filter(o => (o.status === 'PAID') && (o.createdAt || '') <= targetCutoffIso);
        if (eligibleOrders.length === 0) {
          showToast('info', 'Không có đơn cũ', 'Không tìm thấy hóa đơn đã thanh toán nào trong giai đoạn này cần nén.');
          return {
            success: true,
            message: 'Không tìm thấy hóa đơn cần nén.',
            compressedOrdersCount: 0,
            daysSummarized: 0,
            totalRevenuePreserved: 0,
          };
        }

        const dailyMap = new Map<string, DailySalesSummary>();
        eligibleOrders.forEach(o => {
          const dateStr = (o.createdAt || '').substring(0, 10) || new Date().toISOString().substring(0, 10);
          const monthStr = dateStr.substring(0, 7);
          const existing = dailyMap.get(dateStr) || {
            id: dateStr,
            date: dateStr,
            month: monthStr,
            totalRevenue: 0,
            totalCost: 0,
            totalDiscount: 0,
            totalOrders: 0,
            cashRevenue: 0,
            transferRevenue: 0,
            shippingRevenue: 0,
          };

          const finalTotal = o.finalTotal || o.totalAmount || 0;
          existing.totalRevenue += finalTotal;
          existing.totalDiscount += o.discountAmount || 0;
          existing.shippingRevenue += o.shippingFee || 0;
          if (o.paymentMethod === 'CASH') {
            existing.cashRevenue += finalTotal;
          } else {
            existing.transferRevenue += finalTotal;
          }
          existing.totalOrders += 1;
          dailyMap.set(dateStr, existing);
        });

        const newSummaries = Array.from(dailyMap.values());
        setDailySalesSummaries(prev => {
          const map = new Map<string, DailySalesSummary>();
          prev.forEach(s => map.set(s.id, s));
          newSummaries.forEach(s => map.set(s.id, s));
          return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
        });

        // Prune raw orders
        const compressedIds = new Set(eligibleOrders.map(o => o.id));
        setOrders(prev => prev.filter(o => !compressedIds.has(o.id)));

        const totalPreserved = newSummaries.reduce((sum, s) => sum + s.totalRevenue, 0);
        const msg = `Đã nén ${eligibleOrders.length} hóa đơn thành ${newSummaries.length} bản ghi ngày. Doanh thu ${totalPreserved.toLocaleString('vi-VN')} đ được bảo toàn 100%.`;
        playSuccessSound();
        showToast('success', 'Nén dữ liệu thành công', msg);

        return {
          success: true,
          message: msg,
          compressedOrdersCount: eligibleOrders.length,
          daysSummarized: newSummaries.length,
          totalRevenuePreserved: totalPreserved,
        };
      } catch (err: any) {
        showToast('error', 'Lỗi nén dữ liệu', err?.message || 'Có lỗi xảy ra');
        return { success: false, message: err?.message || 'Lỗi nén dữ liệu' };
      } finally {
        setIsSubmitting(false);
      }
    },
    [orders, showToast]
  );

  // Refetch all data from Supabase
  const refetchAllFromSupabase = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const res = await pullAllDataFromSupabase();
      if (res.success && res.data) {
        const {
          categories: fetchedCats,
          products: fetchedProds,
          users: fetchedUsers,
          shifts: fetchedShifts,
          payrolls: fetchedPayrolls,
          orders: fetchedOrders,
          settings: fetchedSettings,
        } = res.data;

        // If database is completely unpopulated, auto-seed default baseline to Supabase
        if (
          (!fetchedCats || fetchedCats.length === 0) &&
          (!fetchedProds || fetchedProds.length === 0) &&
          (!fetchedUsers || fetchedUsers.length === 0)
        ) {
          await pushAllDataToSupabase({
            categories: INITIAL_CATEGORIES,
            products: INITIAL_PRODUCTS,
            users: INITIAL_USERS,
            shifts: INITIAL_SHIFTS,
            payrolls: [],
            orders: [],
            settings: INITIAL_SETTINGS,
            zones: INITIAL_ZONES,
            tables: INITIAL_TABLES,
            expenses: INITIAL_EXPENSES,
          });
          return;
        }

        if (fetchedCats && fetchedCats.length > 0) setCategories(fetchedCats);
        if (fetchedProds && fetchedProds.length > 0) setProducts(fetchedProds);
        if (fetchedUsers && fetchedUsers.length > 0) setUsers(fetchedUsers);
        if (fetchedShifts) setShifts(fetchedShifts);
        if (fetchedPayrolls) setPayrolls(fetchedPayrolls);
        if (fetchedOrders) setOrders(fetchedOrders);
        if (fetchedSettings) setSettings(fetchedSettings);
      }
    } catch (err: any) {
      console.warn('Lỗi tải dữ liệu Supabase ban đầu:', err?.message);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Fetch Supabase data on mount
  useEffect(() => {
    refetchAllFromSupabase();
  }, [refetchAllFromSupabase]);

  // User Management
  const addUser = async (user: User) => {
    setIsSubmitting(true);
    setUsers((prev) => [...prev, user]);
    try {
      const res = await dbUpsert('pos_users', {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        salary_type: user.salaryType || 'COMBINED',
        base_salary: user.baseSalary || 0,
        hourly_rate: user.hourlyRate || 0,
        status: user.status || 'ACTIVE',
        joined_date: user.joinedDate || new Date().toISOString().split('T')[0],
      });
      if (res.success) {
        showToast('success', 'Đã thêm nhân viên', `Nhân viên ${user.name} đã được lưu lên Supabase.`);
      } else if (res.error) {
        showToast('error', 'Lỗi lưu nhân viên', res.error);
      }
    } catch (err: any) {
      showToast('error', 'Lỗi kết nối', err?.message || 'Không thể ghi dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateUser = async (user: User) => {
    setIsSubmitting(true);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
    try {
      const res = await dbUpdate(
        'pos_users',
        {
          name: user.name,
          phone: user.phone,
          role: user.role,
          salary_type: user.salaryType || 'COMBINED',
          base_salary: user.baseSalary || 0,
          hourly_rate: user.hourlyRate || 0,
          status: user.status || 'ACTIVE',
          joined_date: user.joinedDate,
        },
        'id',
        user.id
      );
      if (res.success) {
        showToast('success', 'Thành công', `Đã cập nhật thông tin nhân viên ${user.name}.`);
      } else if (res.error) {
        showToast('error', 'Lỗi cập nhật nhân viên', res.error);
      }
    } catch (err: any) {
      showToast('error', 'Lỗi kết nối', err?.message || 'Không thể cập nhật dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteUser = async (userId: string) => {
    setIsSubmitting(true);
    const userToDel = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    try {
      const res = await dbDelete('pos_users', userId);
      if (res.success) {
        showToast('success', 'Đã xóa', `Đã xóa nhân viên ${userToDel?.name || userId} khỏi Supabase.`);
      } else if (res.error) {
        showToast('error', 'Lỗi xóa nhân viên', res.error);
      }
    } catch (err: any) {
      showToast('error', 'Lỗi kết nối', err?.message || 'Không thể xóa dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Zone & Table Management
  const addZone = (zone: Zone) => {
    setZones((prev) => [...prev, zone]);
  };
  const updateZone = (zone: Zone) => {
    setZones((prev) => prev.map((z) => (z.id === zone.id ? zone : z)));
  };
  const deleteZone = (zoneId: string) => {
    setZones((prev) => prev.filter((z) => z.id !== zoneId));
  };

  const addTable = (tableData: Omit<TableItem, 'id' | 'status'>) => {
    const newTable: TableItem = {
      ...tableData,
      id: 'T-' + Date.now(),
      status: 'EMPTY',
    };
    setTables((prev) => [...prev, newTable]);
  };
  const updateTable = (table: TableItem) => {
    setTables((prev) => prev.map((t) => (t.id === table.id ? table : t)));
  };
  const deleteTable = (tableId: string) => {
    setTables((prev) => prev.filter((t) => t.id !== tableId));
  };

  // Catalog CRUD
  const toggleProductAvailability = async (productId: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    const nextAvailability = !target.isAvailable;

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isAvailable: nextAvailability } : p))
    );

    try {
      await dbUpdate('pos_products', { is_available: nextAvailability }, 'id', productId);
    } catch (err: any) {
      console.error(err);
    }
  };

  const saveProduct = async (product: Product) => {
    setIsSubmitting(true);
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = product;
        return next;
      }
      return [product, ...prev];
    });

    try {
      const row = {
        id: product.id,
        category_id: product.categoryId,
        name: product.name,
        price: product.basePrice,
        station: product.station || 'BAR',
        unit: product.unit || 'phần',
        is_available: product.isAvailable !== false,
        is_popular: Boolean(product.isPopular),
        allowed_toppings: Boolean(product.allowedToppings),
        sizes: product.sizes ? JSON.stringify(product.sizes) : null,
        cooking_methods: product.cookingMethods ? JSON.stringify(product.cookingMethods) : null,
      };
      const res = await dbUpsert('pos_products', row, 'id');
      if (res.success) {
        showToast('success', 'Đã lưu món', `Món "${product.name}" đã được đồng bộ lên cơ sở dữ liệu.`);
      } else if (res.error) {
        showToast('error', 'Lỗi lưu món ăn', res.error);
      }
    } catch (err: any) {
      showToast('error', 'Lỗi kết nối', err?.message || 'Không thể lưu món ăn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    setIsSubmitting(true);
    const prod = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));

    try {
      const res = await dbDelete('pos_products', productId);
      if (res.success) {
        showToast('success', 'Đã xóa', `Đã xóa món ${prod?.name || productId} khỏi Supabase.`);
      } else if (res.error) {
        showToast('error', 'Lỗi xóa món', res.error);
      }
    } catch (err: any) {
      showToast('error', 'Lỗi kết nối', err?.message || 'Không thể xóa món.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveCategory = async (category: Category) => {
    setIsSubmitting(true);
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === category.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = category;
        return next;
      }
      return [...prev, category];
    });

    try {
      const row = {
        id: category.id,
        name: category.name,
        station: category.station || 'BAR',
        icon: category.icon || 'Coffee',
        sort_order: 0,
      };
      const res = await dbUpsert('pos_categories', row, 'id');
      if (res.success) {
        showToast('success', 'Đã lưu danh mục', `Danh mục "${category.name}" đã được lưu lên Supabase.`);
      } else if (res.error) {
        showToast('error', 'Lỗi lưu danh mục', res.error);
      }
    } catch (err: any) {
      showToast('error', 'Lỗi kết nối', err?.message || 'Không thể lưu danh mục.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    setIsSubmitting(true);
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    try {
      const res = await dbDelete('pos_categories', categoryId);
      if (res.success) {
        showToast('success', 'Đã xóa danh mục', 'Danh mục đã được xóa trên Supabase.');
      } else if (res.error) {
        showToast('error', 'Lỗi xóa danh mục', res.error);
      }
    } catch (err: any) {
      showToast('error', 'Lỗi kết nối', err?.message || 'Không thể xóa danh mục.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cart operations
  const addToCart = (
    product: Product,
    customization?: {
      cookingMethod?: CookingMethod;
      size?: { name: string; price: number };
      toppings?: SelectedTopping[];
      sugarLevel?: string;
      iceLevel?: string;
      note?: string;
      quantity?: number;
    }
  ) => {
    const qty = customization?.quantity || 1;
    let unitPrice = product.basePrice;

    if (customization?.size) {
      unitPrice = customization.size.price;
    }
    if (customization?.cookingMethod) {
      unitPrice += customization.cookingMethod.priceDelta;
    }
    if (customization?.toppings) {
      const toppingSum = customization.toppings.reduce(
        (acc, t) => acc + t.price * t.quantity,
        0
      );
      unitPrice += toppingSum;
    }

    const newItem: OrderItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      productId: product.id,
      productName: product.name,
      station: product.station,
      unitPrice,
      quantity: qty,
      selectedCookingMethod: customization?.cookingMethod,
      selectedSize: customization?.size,
      selectedToppings: customization?.toppings || [],
      sugarLevel: customization?.sugarLevel,
      iceLevel: customization?.iceLevel,
      note: customization?.note,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    setCartItems((prev) => [...prev, newItem]);
  };

  const updateCartItemQuantity = (itemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const removeCartItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // Derived active table and order
  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const activeOrder = orders.find(
    (o) => o.tableId === selectedTableId && (o.status === 'ACTIVE' || o.status === 'PENDING_PAYMENT')
  );

  const setUserRole = (role: UserRole) => {
    const found = users.find((u) => u.role === role);
    if (found) {
      setActiveUser(found);
    } else {
      setActiveUser({
        ...activeUser,
        role,
      });
    }
  };

  // Order Lifecycle
  const updateOrderDetails = async (orderId: string, updates: Partial<Order>) => {
    let updatedOrder: Order | null = null;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated = { ...o, ...updates, updatedAt: new Date().toISOString() };
          const shippingFee = updated.shippingFee ?? (o.shippingFee || 0);
          const discountPercent = updated.discountPercent ?? (o.discountPercent || 0);
          const subtotal = updated.subtotal ?? o.subtotal;
          const discountAmount = (subtotal * discountPercent) / 100;
          const taxAmount = ((subtotal - discountAmount) * (settings.taxPercent || 0)) / 100;
          const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount + shippingFee);
          updatedOrder = {
            ...updated,
            shippingFee,
            discountAmount,
            taxAmount,
            totalAmount,
            finalTotal: totalAmount,
          };
          return updatedOrder;
        }
        return o;
      })
    );

    if (updatedOrder) {
      try {
        await dbUpdate(
          'pos_orders',
          {
            total_amount: (updatedOrder as Order).totalAmount,
            final_total: (updatedOrder as Order).finalTotal,
            discount_percent: (updatedOrder as Order).discountPercent,
            shipping_fee: (updatedOrder as Order).shippingFee,
            customer_name: (updatedOrder as Order).customerNote,
            customer_phone: (updatedOrder as Order).customerPhone,
            delivery_address: (updatedOrder as Order).deliveryAddress,
          },
          'id',
          orderId
        );
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  const sendCartToKitchen = async (
    guestCount = 2,
    options?: {
      orderType?: OrderType;
      shippingFee?: number;
      deliveryAddress?: string;
      deliveryPhone?: string;
      customerNote?: string;
    }
  ): Promise<Order> => {
    if (!selectedTableId) throw new Error('Chưa chọn bàn');
    if (cartItems.length === 0 && !activeOrder) throw new Error('Giỏ hàng trống');

    setIsSubmitting(true);
    if (settings.soundEnabled) {
      playBellSound();
    }

    const now = new Date().toISOString();
    let targetOrder: Order;

    if (activeOrder) {
      const combinedItems = [...activeOrder.items, ...cartItems];
      const newSubtotal = combinedItems.reduce(
        (sum, it) => (it.status !== 'CANCELLED' ? sum + it.unitPrice * it.quantity : sum),
        0
      );
      const discountAmount = (newSubtotal * activeOrder.discountPercent) / 100;
      const taxAmount = ((newSubtotal - discountAmount) * (settings.taxPercent || 0)) / 100;
      const orderType =
        options?.orderType ||
        activeOrder.orderType ||
        (activeOrder.zone === 'Mang Về' ? 'TAKEAWAY' : 'DINE_IN');
      const shippingFee =
        options?.shippingFee !== undefined
          ? options.shippingFee
          : activeOrder.shippingFee || 0;
      const totalAmount = Math.max(0, newSubtotal - discountAmount + taxAmount + shippingFee);

      targetOrder = {
        ...activeOrder,
        orderType,
        shippingFee,
        deliveryAddress:
          options?.deliveryAddress !== undefined
            ? options.deliveryAddress
            : activeOrder.deliveryAddress,
        deliveryPhone:
          options?.deliveryPhone !== undefined
            ? options.deliveryPhone
            : activeOrder.deliveryPhone,
        customerNote:
          options?.customerNote !== undefined
            ? options.customerNote
            : activeOrder.customerNote,
        items: combinedItems,
        subtotal: newSubtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        finalTotal: totalAmount,
        updatedAt: now,
      };

      setOrders((prev) => prev.map((o) => (o.id === targetOrder.id ? targetOrder : o)));
    } else {
      const orderSubtotal = cartItems.reduce(
        (sum, it) => sum + it.unitPrice * it.quantity,
        0
      );
      const table = tables.find((t) => t.id === selectedTableId)!;
      const orderCode = `#KAME-${Date.now().toString().slice(-4)}`;
      const orderType = options?.orderType || (table.zone === 'Mang Về' ? 'TAKEAWAY' : 'DINE_IN');
      const shippingFee =
        options?.shippingFee !== undefined ? options.shippingFee : orderType === 'TAKEAWAY' ? 0 : 0;
      const taxAmount = (orderSubtotal * (settings.taxPercent || 0)) / 100;
      const totalAmount = Math.max(0, orderSubtotal + taxAmount + shippingFee);

      targetOrder = {
        id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        orderCode,
        tableId: table.id,
        tableName: table.name,
        zone: table.zone,
        orderType,
        shippingFee,
        deliveryAddress: options?.deliveryAddress || '',
        deliveryPhone: options?.deliveryPhone || '',
        customerNote: options?.customerNote || '',
        serverId: activeUser.id,
        serverName: activeUser.name,
        guestCount: guestCount || table.capacity,
        status: 'ACTIVE',
        items: cartItems,
        subtotal: orderSubtotal,
        discountPercent: 0,
        discountAmount: 0,
        taxAmount,
        totalAmount,
        finalTotal: totalAmount,
        createdAt: now,
        updatedAt: now,
      };

      setOrders((prev) => [targetOrder, ...prev]);

      setTables((prev) =>
        prev.map((t) =>
          t.id === selectedTableId
            ? {
                ...t,
                status: 'OCCUPIED',
                currentOrderId: targetOrder.id,
                openedAt: now,
                guestCount: targetOrder.guestCount,
              }
            : t
        )
      );
    }

    setCartItems([]);

    // Persist to Supabase
    try {
      const row = {
        id: targetOrder.id,
        table_id: targetOrder.tableId,
        table_name: targetOrder.tableName,
        order_type: targetOrder.orderType,
        status: targetOrder.status,
        total_amount: targetOrder.totalAmount,
        final_total: targetOrder.finalTotal,
        discount_percent: targetOrder.discountPercent,
        shipping_fee: targetOrder.shippingFee,
        guest_count: targetOrder.guestCount,
        customer_name: targetOrder.customerNote,
        customer_phone: targetOrder.customerPhone,
        delivery_address: targetOrder.deliveryAddress,
        items: JSON.stringify(targetOrder.items),
        created_at: targetOrder.createdAt,
      };
      const res = await dbUpsert('pos_orders', row, 'id');
      if (res.success) {
        showToast('success', 'Đã chuyển Bếp/Bar', `Đơn ${targetOrder.tableName} đã được ghi nhận lên Supabase.`);
      } else if (res.error) {
        showToast('error', 'Lỗi lưu đơn hàng', res.error);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }

    return targetOrder;
  };

  const updateOrderItemStatus = async (
    orderId: string,
    itemId: string,
    newStatus: OrderItemStatus
  ) => {
    let updatedOrder: Order | null = null;
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const updatedItems = ord.items.map((it) => {
            if (it.id === itemId) {
              return {
                ...it,
                status: newStatus,
                completedAt: newStatus === 'DONE' ? new Date().toISOString() : it.completedAt,
              };
            }
            return it;
          });
          updatedOrder = {
            ...ord,
            items: updatedItems,
            updatedAt: new Date().toISOString(),
          };
          return updatedOrder;
        }
        return ord;
      })
    );

    if (updatedOrder) {
      try {
        await dbUpdate(
          'pos_orders',
          { items: JSON.stringify((updatedOrder as Order).items) },
          'id',
          orderId
        );
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  const cancelOrderItem = async (orderId: string, itemId: string, reason: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;
    const item = targetOrder.items.find((i) => i.id === itemId);
    if (!item) return;

    const newLog: VoidLog = {
      id: `void-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      orderId: targetOrder.id,
      orderCode: targetOrder.orderCode,
      tableName: targetOrder.tableName,
      itemName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      reason,
      staffName: activeUser.name,
      role: activeUser.role,
      timestamp: new Date().toISOString(),
    };
    setVoidLogs((vPrev) => [newLog, ...vPrev]);

    let updatedOrder: Order | null = null;
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const updatedItems = ord.items.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  status: 'CANCELLED' as OrderItemStatus,
                  cancelReason: reason,
                  cancelledBy: activeUser.name,
                }
              : i
          );

          const newSubtotal = updatedItems.reduce(
            (sum, it) => (it.status !== 'CANCELLED' ? sum + it.unitPrice * it.quantity : sum),
            0
          );
          const discountAmount = (newSubtotal * ord.discountPercent) / 100;
          const totalAmount = newSubtotal - discountAmount;

          updatedOrder = {
            ...ord,
            items: updatedItems,
            subtotal: newSubtotal,
            discountAmount,
            totalAmount,
            finalTotal: totalAmount,
            updatedAt: new Date().toISOString(),
          };
          return updatedOrder;
        }
        return ord;
      })
    );

    if (updatedOrder) {
      try {
        await dbUpdate(
          'pos_orders',
          {
            items: JSON.stringify((updatedOrder as Order).items),
            total_amount: (updatedOrder as Order).totalAmount,
            final_total: (updatedOrder as Order).finalTotal,
          },
          'id',
          orderId
        );
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  const requestPayment = async (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return;

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'PENDING_PAYMENT' } : o))
    );

    setTables((prev) =>
      prev.map((t) => (t.id === ord.tableId ? { ...t, status: 'WAITING_PAYMENT' } : t))
    );

    try {
      await dbUpdate('pos_orders', { status: 'PENDING_PAYMENT' }, 'id', orderId);
    } catch (err: any) {
      console.error(err);
    }
  };

  const completePayment = async (
    orderId: string,
    paymentMethod: PaymentMethodType,
    discountPercent: number,
    taxPercent: number,
    paymentDetails?: { cashAmount?: number; transferAmount?: number; shippingFee?: number }
  ) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return;

    setIsSubmitting(true);
    const shippingFee =
      paymentDetails?.shippingFee !== undefined
        ? paymentDetails.shippingFee
        : ord.shippingFee || 0;
    const discountAmount = (ord.subtotal * discountPercent) / 100;
    const taxAmount = ((ord.subtotal - discountAmount) * taxPercent) / 100;
    const totalAmount = Math.max(0, ord.subtotal - discountAmount + taxAmount + shippingFee);
    const paidAt = new Date().toISOString();

    let cashAmountPaid = 0;
    let transferAmountPaid = 0;

    if (paymentMethod === 'MIXED') {
      cashAmountPaid = paymentDetails?.cashAmount ?? 0;
      transferAmountPaid = paymentDetails?.transferAmount ?? totalAmount - cashAmountPaid;
    } else if (paymentMethod === 'CASH') {
      cashAmountPaid = totalAmount;
      transferAmountPaid = 0;
    } else if (
      paymentMethod === 'VIETQR' ||
      paymentMethod === 'SACOMBANK_QR' ||
      paymentMethod === 'TRANSFER'
    ) {
      cashAmountPaid = 0;
      transferAmountPaid = totalAmount;
    }

    const updatedOrd: Order = {
      ...ord,
      status: 'PAID',
      paymentMethod,
      discountPercent,
      discountAmount,
      taxAmount,
      shippingFee,
      totalAmount,
      finalTotal: totalAmount,
      cashAmountPaid,
      transferAmountPaid,
      paidAt,
      updatedAt: paidAt,
    };

    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrd : o)));

    // Free the table
    setTables((prev) =>
      prev.map((t) =>
        t.id === ord.tableId
          ? {
              ...t,
              status: 'EMPTY',
              currentOrderId: undefined,
              openedAt: undefined,
              guestCount: undefined,
            }
          : t
      )
    );

    if (settings.soundEnabled) {
      playSuccessSound();
    }

    try {
      const res = await dbUpdate(
        'pos_orders',
        {
          status: 'PAID',
          payment_method: paymentMethod,
          discount_percent: discountPercent,
          shipping_fee: shippingFee,
          total_amount: totalAmount,
          final_total: totalAmount,
          cash_amount_paid: cashAmountPaid,
          transfer_amount_paid: transferAmountPaid,
          paid_at: paidAt,
        },
        'id',
        orderId
      );
      if (res.success) {
        showToast('success', 'Thanh toán thành công', `Hóa đơn bàn ${ord.tableName} đã được thanh toán & lưu Supabase.`);
      } else if (res.error) {
        showToast('error', 'Lỗi cập nhật thanh toán', res.error);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const splitTable = async (
    sourceTableId: string,
    targetTableId: string,
    itemIdsToMove: string[]
  ) => {
    const sourceOrder = orders.find(
      (o) => o.tableId === sourceTableId && (o.status === 'ACTIVE' || o.status === 'PENDING_PAYMENT')
    );
    const targetTable = tables.find((t) => t.id === targetTableId);
    if (!sourceOrder || !targetTable) return;

    const itemsToMove = sourceOrder.items.filter((it) => itemIdsToMove.includes(it.id));
    const remainingItems = sourceOrder.items.filter((it) => !itemIdsToMove.includes(it.id));
    if (itemsToMove.length === 0) return;

    setIsSubmitting(true);
    const now = new Date().toISOString();
    const targetSubtotal = itemsToMove.reduce(
      (sum, it) => (it.status !== 'CANCELLED' ? sum + it.unitPrice * it.quantity : sum),
      0
    );
    const newTargetOrder: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orderCode: `#KAME-${Date.now().toString().slice(-4)}`,
      tableId: targetTable.id,
      tableName: targetTable.name,
      zone: targetTable.zone,
      orderType: sourceOrder.orderType || 'DINE_IN',
      shippingFee: 0,
      serverId: activeUser.id,
      serverName: activeUser.name,
      guestCount: Math.ceil((sourceOrder.guestCount || 2) / 2),
      status: 'ACTIVE',
      items: itemsToMove,
      subtotal: targetSubtotal,
      discountPercent: 0,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: targetSubtotal,
      finalTotal: targetSubtotal,
      createdAt: now,
      updatedAt: now,
    };

    const sourceSubtotal = remainingItems.reduce(
      (sum, it) => (it.status !== 'CANCELLED' ? sum + it.unitPrice * it.quantity : sum),
      0
    );
    const updatedSourceOrder: Order = {
      ...sourceOrder,
      items: remainingItems,
      subtotal: sourceSubtotal,
      discountAmount: (sourceSubtotal * sourceOrder.discountPercent) / 100,
      totalAmount: sourceSubtotal - (sourceSubtotal * sourceOrder.discountPercent) / 100,
      finalTotal: sourceSubtotal - (sourceSubtotal * sourceOrder.discountPercent) / 100,
      updatedAt: now,
    };

    setOrders((prev) => [
      newTargetOrder,
      ...prev.map((o) => (o.id === sourceOrder.id ? updatedSourceOrder : o)),
    ]);

    setTables((prev) =>
      prev.map((t) => {
        if (t.id === targetTableId) {
          return {
            ...t,
            status: 'OCCUPIED',
            currentOrderId: newTargetOrder.id,
            openedAt: now,
            guestCount: newTargetOrder.guestCount,
          };
        }
        return t;
      })
    );

    try {
      await Promise.all([
        dbUpsert('pos_orders', {
          id: newTargetOrder.id,
          table_id: newTargetOrder.tableId,
          table_name: newTargetOrder.tableName,
          order_type: newTargetOrder.orderType,
          status: 'ACTIVE',
          total_amount: newTargetOrder.totalAmount,
          final_total: newTargetOrder.finalTotal,
          items: JSON.stringify(newTargetOrder.items),
          created_at: newTargetOrder.createdAt,
        }, 'id'),
        dbUpdate('pos_orders', {
          items: JSON.stringify(updatedSourceOrder.items),
          total_amount: updatedSourceOrder.totalAmount,
          final_total: updatedSourceOrder.finalTotal,
        }, 'id', sourceOrder.id),
      ]);
      showToast('success', 'Tách bàn thành công', `Đã tách món sang ${targetTable.name}.`);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const mergeTables = async (sourceTableId: string, targetTableId: string) => {
    const sourceOrder = orders.find(
      (o) => o.tableId === sourceTableId && (o.status === 'ACTIVE' || o.status === 'PENDING_PAYMENT')
    );
    const targetOrder = orders.find(
      (o) => o.tableId === targetTableId && (o.status === 'ACTIVE' || o.status === 'PENDING_PAYMENT')
    );

    if (!sourceOrder || !targetOrder) return;
    setIsSubmitting(true);

    const mergedItems = [...targetOrder.items, ...sourceOrder.items];
    const newSubtotal = mergedItems.reduce(
      (sum, it) => (it.status !== 'CANCELLED' ? sum + it.unitPrice * it.quantity : sum),
      0
    );
    const discountAmount = (newSubtotal * targetOrder.discountPercent) / 100;
    const totalAmount = newSubtotal - discountAmount;
    const now = new Date().toISOString();

    const updatedTargetOrder: Order = {
      ...targetOrder,
      items: mergedItems,
      guestCount: (targetOrder.guestCount || 0) + (sourceOrder.guestCount || 0),
      subtotal: newSubtotal,
      discountAmount,
      totalAmount,
      finalTotal: totalAmount,
      updatedAt: now,
    };

    setOrders((prev) =>
      prev
        .filter((o) => o.id !== sourceOrder.id)
        .map((o) => (o.id === targetOrder.id ? updatedTargetOrder : o))
    );

    setTables((prev) =>
      prev.map((t) => {
        if (t.id === sourceTableId) {
          return {
            ...t,
            status: 'EMPTY',
            currentOrderId: undefined,
            openedAt: undefined,
            guestCount: undefined,
          };
        }
        if (t.id === targetTableId) {
          return {
            ...t,
            guestCount: updatedTargetOrder.guestCount,
          };
        }
        return t;
      })
    );

    try {
      await Promise.all([
        dbDelete('pos_orders', sourceOrder.id),
        dbUpdate('pos_orders', {
          items: JSON.stringify(updatedTargetOrder.items),
          total_amount: updatedTargetOrder.totalAmount,
          final_total: updatedTargetOrder.finalTotal,
          guest_count: updatedTargetOrder.guestCount,
        }, 'id', targetOrder.id),
      ]);
      showToast('success', 'Gộp bàn thành công', 'Đã gộp đơn hàng và lưu lên Supabase.');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Customer self-order via QR
  const submitCustomerSelfOrder = async (
    tableId: string,
    items: OrderItem[],
    guestName?: string,
    customerNote?: string
  ): Promise<{ order: Order; isNew: boolean }> => {
    const targetTable = tables.find((t) => t.id === tableId);
    if (!targetTable) throw new Error('Không tìm thấy bàn');

    const existingOrder = orders.find(
      (o) => o.tableId === tableId && (o.status === 'ACTIVE' || o.status === 'PENDING_PAYMENT')
    );

    const now = new Date().toISOString();
    let resultingOrder: Order;
    let isNew = false;

    if (existingOrder) {
      const combinedItems = [...existingOrder.items, ...items];
      const newSubtotal = combinedItems.reduce(
        (sum, it) => (it.status !== 'CANCELLED' ? sum + it.unitPrice * it.quantity : sum),
        0
      );
      const discountAmount = (newSubtotal * existingOrder.discountPercent) / 100;
      const taxAmount = ((newSubtotal - discountAmount) * (settings.taxPercent || 0)) / 100;
      const totalAmount = Math.max(
        0,
        newSubtotal - discountAmount + taxAmount + (existingOrder.shippingFee || 0)
      );

      resultingOrder = {
        ...existingOrder,
        customerNote: customerNote
          ? `${existingOrder.customerNote ? existingOrder.customerNote + ' | ' : ''}${customerNote}`
          : existingOrder.customerNote,
        items: combinedItems,
        subtotal: newSubtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        finalTotal: totalAmount,
        updatedAt: now,
      };

      setOrders((prev) => prev.map((o) => (o.id === resultingOrder.id ? resultingOrder : o)));
    } else {
      isNew = true;
      const orderSubtotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
      const orderCode = `#QR-${Date.now().toString().slice(-4)}`;
      const taxAmount = (orderSubtotal * (settings.taxPercent || 0)) / 100;
      const totalAmount = Math.max(0, orderSubtotal + taxAmount);

      resultingOrder = {
        id: `ord-qr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        orderCode,
        tableId: targetTable.id,
        tableName: targetTable.name,
        zone: targetTable.zone,
        orderType: 'DINE_IN',
        shippingFee: 0,
        serverName: guestName ? `Khách (${guestName})` : 'Khách tự quét QR',
        serverId: 'QR_SELF_ORDER',
        guestCount: targetTable.capacity || 2,
        status: 'ACTIVE',
        items,
        subtotal: orderSubtotal,
        discountPercent: 0,
        discountAmount: 0,
        taxAmount,
        totalAmount,
        finalTotal: totalAmount,
        customerNote: customerNote || '',
        createdAt: now,
        updatedAt: now,
      };

      setOrders((prev) => [resultingOrder, ...prev]);

      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? {
                ...t,
                status: 'OCCUPIED',
                currentOrderId: resultingOrder.id,
                openedAt: now,
                guestCount: resultingOrder.guestCount,
              }
            : t
        )
      );
    }

    if (settings.soundEnabled) {
      playBellSound();
    }

    const totalQty = items.reduce((s, i) => s + i.quantity, 0);
    const addedAmount = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

    setQrNotification({
      tableId: targetTable.id,
      tableName: targetTable.name,
      itemCount: totalQty,
      totalAmount: addedAmount,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    });

    try {
      await dbUpsert('pos_orders', {
        id: resultingOrder.id,
        table_id: resultingOrder.tableId,
        table_name: resultingOrder.tableName,
        order_type: resultingOrder.orderType,
        status: resultingOrder.status,
        total_amount: resultingOrder.totalAmount,
        final_total: resultingOrder.finalTotal,
        items: JSON.stringify(resultingOrder.items),
        created_at: resultingOrder.createdAt,
      }, 'id');
    } catch (err: any) {
      console.error(err);
    }

    return { order: resultingOrder, isNew };
  };

  const clearQrNotification = () => {
    setQrNotification(null);
  };

  // Shift and HRM methods
  const addOrUpdateShift = async (shift: ShiftRecord) => {
    setIsSubmitting(true);
    const staff = users.find((u) => u.id === shift.userId);
    const enrichedShift: ShiftRecord = {
      ...shift,
      userName: shift.userName || staff?.name,
      userPhone: shift.userPhone || staff?.phone,
      userRole: shift.userRole || staff?.role,
    };

    setShifts((prev) => {
      const idx = prev.findIndex((s) => s.id === enrichedShift.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = enrichedShift;
        return next;
      }
      return [enrichedShift, ...prev];
    });

    try {
      const row = {
        id: enrichedShift.id,
        user_id: enrichedShift.userId,
        user_name: enrichedShift.userName || null,
        user_phone: enrichedShift.userPhone || null,
        user_role: enrichedShift.userRole || null,
        date: enrichedShift.date,
        shift_type: enrichedShift.shiftType,
        hours_worked: enrichedShift.hoursWorked || 0,
        check_in: enrichedShift.checkIn || null,
        check_out: enrichedShift.checkOut || null,
        status: enrichedShift.status || 'ATTENDED',
      };
      const res = await dbUpsert('pos_shifts', row, 'id');
      if (res.success) {
        showToast('success', 'Đã lưu ca làm việc', `Ca ngày ${enrichedShift.date} đã được lưu lên Supabase.`);
      } else if (res.error) {
        showToast('error', 'Lỗi lưu ca làm', res.error);
      }
    } catch (err: any) {
      showToast('error', 'Lỗi kết nối', err?.message || 'Không thể lưu ca làm việc.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteShift = async (shiftId: string) => {
    setIsSubmitting(true);
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
    try {
      const res = await dbDelete('pos_shifts', shiftId);
      if (res.success) {
        showToast('success', 'Đã xóa ca', 'Đã xóa ca làm việc khỏi Supabase.');
      } else if (res.error) {
        showToast('error', 'Lỗi xóa ca làm việc', res.error);
      }
    } catch (err: any) {
      showToast('error', 'Lỗi kết nối', err?.message || 'Không thể xóa ca.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addExpense = (expense: Omit<ExpenseRecord, 'id'>) => {
    const newExp: ExpenseRecord = {
      ...expense,
      id: `EXP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setExpenses((prev) => [newExp, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const generateMonthlyPayroll = async (monthStr: string) => {
    setIsSubmitting(true);
    const relevantStaff = users.filter(
      (u) => u.status !== 'RESIGNED' || shifts.some((s) => s.userId === u.id && s.date.startsWith(monthStr))
    );

    const generatedList: PayrollRecord[] = relevantStaff.map((user) => {
      const existing = payrolls.find((p) => p.userId === user.id && p.month === monthStr);
      if (existing && existing.status === 'PAID') {
        return existing;
      }

      const userShifts = shifts.filter(
        (s) => s.userId === user.id && s.date.startsWith(monthStr) && s.status === 'ATTENDED'
      );
      const totalHours = userShifts.reduce((sum, s) => sum + s.hoursWorked, 0);
      const totalShifts = userShifts.length;

      let baseSalary = user.baseSalary || 0;
      let hourlyRate = user.hourlyRate || 0;
      let hourlyPay = 0;

      if (user.salaryType === 'COMBINED') {
        baseSalary = user.baseSalary || 0;
        hourlyRate = user.hourlyRate || 0;
        hourlyPay = totalHours * hourlyRate;
      } else if (user.salaryType === 'HOURLY') {
        baseSalary = 0;
        hourlyRate = user.hourlyRate || user.baseSalary || 0;
        hourlyPay = totalHours * hourlyRate;
      }

      const bonus = existing?.bonus !== undefined ? existing.bonus : 0;
      const bonusReason = existing?.bonusReason || '';
      const deduction = existing?.deduction !== undefined ? existing.deduction : 0;
      const deductionReason = existing?.deductionReason || '';
      const netSalary = Math.max(0, baseSalary + hourlyPay + bonus - deduction);

      return {
        id: existing?.id || `PR-${user.id}-${monthStr}`,
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        userRole: user.role,
        salaryType: user.salaryType,
        month: monthStr,
        totalHours,
        totalShifts,
        baseSalary,
        hourlyRate,
        hourlyPay,
        bonus,
        bonusReason,
        deduction,
        deductionReason,
        netSalary,
        status: existing?.status || 'DRAFT',
        paidDate: existing?.paidDate,
      };
    });

    setPayrolls((prev) => {
      const otherMonths = prev.filter((p) => p.month !== monthStr);
      const preservedDeletedUsersThisMonth = prev.filter(
        (p) => p.month === monthStr && !relevantStaff.some((u) => u.id === p.userId)
      );
      return [...otherMonths, ...preservedDeletedUsersThisMonth, ...generatedList];
    });

    try {
      if (generatedList.length > 0) {
        const rows = generatedList.map((pr) => ({
          id: pr.id,
          user_id: pr.userId,
          user_name: pr.userName || pr.userId,
          user_phone: pr.userPhone || null,
          user_role: pr.userRole || 'SERVER',
          salary_type: pr.salaryType || 'COMBINED',
          month: pr.month,
          total_hours: pr.totalHours || 0,
          total_shifts: pr.totalShifts || 0,
          base_salary: pr.baseSalary || 0,
          hourly_rate: pr.hourlyRate || 0,
          hourly_pay: pr.hourlyPay || 0,
          bonus: pr.bonus || 0,
          bonus_reason: pr.bonusReason || null,
          deduction: pr.deduction || 0,
          deduction_reason: pr.deductionReason || null,
          net_salary: pr.netSalary || 0,
          status: pr.status || 'DRAFT',
          paid_date: pr.paidDate || null,
        }));
        await Promise.all(rows.map((r) => dbUpsert('pos_payrolls', r, 'id')));
        showToast('success', 'Đã chốt bảng lương', `Đã tính và lưu ${rows.length} phiếu lương tháng ${monthStr} lên Supabase.`);
      }
    } catch (err: any) {
      showToast('error', 'Lỗi kết nối', err?.message || 'Không thể lưu bảng lương.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePayrollStatus = async (payrollId: string, status: 'DRAFT' | 'PAID') => {
    setIsSubmitting(true);
    const paidDate = status === 'PAID' ? new Date().toISOString() : undefined;
    setPayrolls((prev) =>
      prev.map((p) =>
        p.id === payrollId
          ? {
              ...p,
              status,
              paidDate,
            }
          : p
      )
    );

    try {
      const res = await dbUpdate('pos_payrolls', { status, paid_date: paidDate || null }, 'id', payrollId);
      if (res.success) {
        showToast('success', 'Thành công', `Đã cập nhật trạng thái phiếu lương thành ${status === 'PAID' ? 'ĐÃ CHI TRẢ' : 'BẢN NHÁP'}.`);
      } else if (res.error) {
        showToast('error', 'Lỗi cập nhật phiếu lương', res.error);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePayrollRecord = async (payrollId: string, updates: Partial<PayrollRecord>) => {
    setIsSubmitting(true);
    let updatedRecord: PayrollRecord | null = null;
    setPayrolls((prev) =>
      prev.map((p) => {
        if (p.id === payrollId) {
          const updated = { ...p, ...updates };
          const baseSalary = updated.baseSalary !== undefined ? updated.baseSalary : p.baseSalary || 0;
          const hourlyPay = updated.hourlyPay !== undefined ? updated.hourlyPay : p.hourlyPay || 0;
          const bonus = updated.bonus !== undefined ? updated.bonus : p.bonus || 0;
          const deduction = updated.deduction !== undefined ? updated.deduction : p.deduction || 0;
          const netSalary = Math.max(0, baseSalary + hourlyPay + bonus - deduction);
          updatedRecord = {
            ...updated,
            netSalary,
          };
          return updatedRecord;
        }
        return p;
      })
    );

    if (updatedRecord) {
      try {
        const res = await dbUpdate(
          'pos_payrolls',
          {
            bonus: (updatedRecord as PayrollRecord).bonus,
            bonus_reason: (updatedRecord as PayrollRecord).bonusReason || null,
            deduction: (updatedRecord as PayrollRecord).deduction,
            deduction_reason: (updatedRecord as PayrollRecord).deductionReason || null,
            net_salary: (updatedRecord as PayrollRecord).netSalary,
          },
          'id',
          payrollId
        );
        if (res.success) {
          showToast('success', 'Đã lưu điều chỉnh', 'Đã lưu tiền thưởng/phạt lên Supabase.');
        } else if (res.error) {
          showToast('error', 'Lỗi lưu thưởng/phạt', res.error);
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    setIsSubmitting(true);
    const merged = { ...settings, ...newSettings };
    setSettings(merged);

    try {
      const row = {
        id: 'current_store',
        store_name: merged.storeName || 'KAME TEA & FOOD',
        phone: merged.phone || '',
        address: merged.address || '',
        bank_name: merged.bankName || 'Sacombank',
        bank_account: merged.bankAccount || '',
        account_holder: merged.accountHolder || '',
        tax_percent: merged.taxPercent || 0,
        receipt_footer: merged.receiptFooter || '',
        updated_at: new Date().toISOString(),
      };
      const res = await dbUpsert('pos_settings', row, 'id');
      if (res.success) {
        showToast('success', 'Đã cập nhật', 'Cài đặt quán đã được lưu lên Supabase.');
      } else if (res.error) {
        showToast('error', 'Lỗi lưu cấu hình', res.error);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const notifyKitchenUpdate = () => {
    if (settings.soundEnabled) {
      playBellSound();
    }
  };

  const resetAllToDefault = () => {
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setCategories(INITIAL_CATEGORIES);
    setProducts(INITIAL_PRODUCTS);
    setToppings(INITIAL_TOPPINGS);
    setZones(INITIAL_ZONES);
    setTables(INITIAL_TABLES);
    setOrders([]);
    setVoidLogs([]);
    setShifts(INITIAL_SHIFTS);
    setExpenses(INITIAL_EXPENSES);
    setPayrolls([]);
    setSettings(INITIAL_SETTINGS);
    setLayoutMode('SIDEBAR_DASHBOARD');
    setSelectedTableId(null);
    setCartItems([]);
  };

  // Supabase Manual Sync
  const [isSyncingToCloud, setIsSyncingToCloud] = useState<boolean>(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('kame_pos_last_cloud_sync');
  });

  const syncToSupabase = async (): Promise<SyncResult> => {
    setIsSyncingToCloud(true);
    try {
      const res = await pushAllDataToSupabase({
        users,
        categories,
        products,
        shifts,
        payrolls,
        orders,
        settings,
        zones,
        tables,
        expenses,
      });

      if (res.success) {
        const nowStr =
          new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }) +
          ' ' +
          new Date().toLocaleDateString('vi-VN');
        setLastCloudSyncTime(nowStr);
        localStorage.setItem('kame_pos_last_cloud_sync', nowStr);
        playSuccessSound();
        showToast('success', 'Đồng bộ Supabase thành công', res.message);
      } else {
        showToast('error', 'Lỗi đồng bộ Supabase', res.message);
      }
      return res;
    } finally {
      setIsSyncingToCloud(false);
    }
  };

  const syncFromSupabase = async (): Promise<{ success: boolean; message: string }> => {
    setIsSyncingToCloud(true);
    try {
      const res = await pullAllDataFromSupabase();
      if (res.success && res.data) {
        if (res.data.categories && res.data.categories.length > 0) setCategories(res.data.categories);
        if (res.data.products && res.data.products.length > 0) setProducts(res.data.products);
        if (res.data.users && res.data.users.length > 0) setUsers(res.data.users);
        if (res.data.shifts) setShifts(res.data.shifts);
        if (res.data.payrolls) setPayrolls(res.data.payrolls);
        if (res.data.orders) setOrders(res.data.orders);
        if (res.data.settings) setSettings(res.data.settings);

        const nowStr =
          new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }) +
          ' ' +
          new Date().toLocaleDateString('vi-VN');
        setLastCloudSyncTime(nowStr);
        localStorage.setItem('kame_pos_last_cloud_sync', nowStr);
        playSuccessSound();
        showToast('success', 'Đã tải dữ liệu từ Cloud', res.message);
      } else {
        showToast('error', 'Lỗi tải dữ liệu', res.message);
      }
      return { success: res.success, message: res.message };
    } finally {
      setIsSyncingToCloud(false);
    }
  };

  return (
    <POSContext.Provider
      value={{
        users,
        activeUser,
        setActiveUser,
        setUserRole,
        addUser,
        updateUser,
        deleteUser,

        zones,
        addZone,
        updateZone,
        deleteZone,

        tables,
        addTable,
        updateTable,
        deleteTable,
        selectedTableId,
        setSelectedTableId,
        selectedTable,
        activeTable: selectedTable || null,
        setActiveTable: (tbl: TableItem | null) => setSelectedTableId(tbl ? tbl.id : null),
        activeOrder,

        categories,
        products,
        toppings,
        toggleProductAvailability,
        saveProduct,
        deleteProduct,
        saveCategory,
        deleteCategory,

        cartItems,
        addToCart,
        updateCartItemQuantity,
        removeCartItem,
        clearCart,
        cartTotal,

        sendCartToKitchen,
        orders,
        updateOrderItemStatus,
        cancelOrderItem,
        requestPayment,
        updateOrderDetails,
        completePayment,
        splitTable,
        mergeTables,

        submitCustomerSelfOrder,
        qrNotification,
        clearQrNotification,

        voidLogs,
        shifts,
        addOrUpdateShift,
        deleteShift,
        expenses,
        addExpense,
        deleteExpense,
        payrolls,
        generateMonthlyPayroll,
        updatePayrollStatus,
        updatePayrollRecord,

        settings,
        updateSettings,
        layoutMode,
        setLayoutMode,
        currentTab: (activeTab as TabType) || 'pos',
        setCurrentTab: (tab: TabType) => setActiveTab(tab),
        activeTab,
        setActiveTab,
        isDarkMode,
        setIsDarkMode,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        hideSupabaseOnSidebar,
        setHideSupabaseOnSidebar,

        dailySalesSummaries,
        compressOldSalesData,

        notifyKitchenUpdate,
        resetAllToDefault,

        syncToSupabase,
        syncFromSupabase,
        isSyncingToCloud,
        lastCloudSyncTime,

        isSubmitting,
        isLoadingData,
        refetchAllFromSupabase,
        toastNotification,
        showToast,
        clearToastNotification,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) throw new Error('usePOS must be used within a POSProvider');
  return context;
};
