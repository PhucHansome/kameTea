import {
  User,
  TableItem,
  Order,
  Product,
  Category,
  StoreSettings,
  ShiftRecord,
  PayrollRecord,
  ExpenseRecord,
  DailySalesSummary,
  TabType,
} from '../shared/types';

export * from '../shared/types';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export interface POSState {
  tables: TableItem[];
  orders: Order[];
  products: Product[];
  categories: Category[];
  users: User[];
  shifts: ShiftRecord[];
  payrolls: PayrollRecord[];
  expenses: ExpenseRecord[];
  dailySalesSummaries: DailySalesSummary[];
  settings: StoreSettings;
  activeTable: TableItem | null;
  activeOrder: Order | null;
  currentTab: TabType;
  currentUser: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}
