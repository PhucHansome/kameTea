export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- KAME - Ốc, Ăn Vặt & Trà Sữa (Khe Sanh, Quảng Trị)
-- Production Supabase PostgreSQL Schema & Security Rules
-- Hỗ trợ: Bảo toàn vĩnh viễn Doanh thu khi xoá món, Bảo toàn Lịch sử lương khi xoá nhân viên
-- ==============================================================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'CASHIER', 'SERVER', 'KITCHEN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Station Enum
DO $$ BEGIN
    CREATE TYPE station_type AS ENUM ('BAR', 'KITCHEN', 'ALL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table Status Enum
DO $$ BEGIN
    CREATE TYPE table_status AS ENUM ('EMPTY', 'OCCUPIED', 'WAITING_PAYMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Order Status Enum
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('ACTIVE', 'PENDING_PAYMENT', 'PAID', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Order Item Status Enum
DO $$ BEGIN
    CREATE TYPE item_status AS ENUM ('PENDING', 'COOKING', 'DONE', 'SERVED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Shift Type Enum
DO $$ BEGIN
    CREATE TYPE shift_type AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'FULL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLES DEFINITIONS

-- 2.1 ZONES (Quản lý khu vực quán: Tầng 1, Tầng 2, Sân Vườn, Mang Về)
CREATE TABLE IF NOT EXISTS public.zones (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 USERS & PROFILES (Nhân sự - Không bắt buộc avatar, hỗ trợ trạng thái làm việc/nghỉ việc)
CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'SERVER',
    salary_type VARCHAR(20) DEFAULT 'HOURLY', -- HOURLY or MONTHLY
    base_salary NUMERIC(12, 2) DEFAULT 25000,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, OFF, RESIGNED
    joined_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    station station_type NOT NULL DEFAULT 'BAR',
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 PRODUCTS (Menu món ăn, đồ uống, lẩu, nướng)
CREATE TABLE IF NOT EXISTS public.products (
    id VARCHAR(50) PRIMARY KEY,
    category_id VARCHAR(50) REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    base_price NUMERIC(12, 2) NOT NULL,
    unit VARCHAR(30) DEFAULT 'phần', -- ly, phần, dĩa, nồi, con, xiên
    station station_type NOT NULL DEFAULT 'BAR',
    is_available BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    cooking_methods JSONB DEFAULT '[]'::JSONB, -- Array of {id, name, priceDelta}
    allowed_toppings BOOLEAN DEFAULT FALSE,
    sizes JSONB DEFAULT '[]'::JSONB,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 TOPPINGS (Topping trà sữa)
CREATE TABLE IF NOT EXISTS public.toppings (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 5000,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 TABLES (Sơ đồ bàn quán)
CREATE TABLE IF NOT EXISTS public.tables (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    zone VARCHAR(50) NOT NULL, -- Tầng 1, Tầng 2, Sân Vườn, Mang Về
    capacity INT DEFAULT 4,
    status table_status NOT NULL DEFAULT 'EMPTY',
    current_order_id TEXT,
    opened_at TIMESTAMPTZ,
    guest_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 ORDERS (Đơn hàng & Doanh thu)
CREATE TABLE IF NOT EXISTS public.orders (
    id VARCHAR(50) PRIMARY KEY,
    order_code VARCHAR(30) NOT NULL,
    table_id VARCHAR(50),
    table_name VARCHAR(100),
    zone VARCHAR(50),
    order_type VARCHAR(20) DEFAULT 'DINE_IN', -- DINE_IN, TAKEAWAY
    server_id VARCHAR(50),
    server_name VARCHAR(100),
    guest_count INT DEFAULT 1,
    status order_status NOT NULL DEFAULT 'ACTIVE',
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    final_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    shipping_fee NUMERIC(12, 2) DEFAULT 0,
    payment_method VARCHAR(30), -- CASH, TRANSFER, MIXED
    cash_amount_paid NUMERIC(12, 2) DEFAULT 0,
    transfer_amount_paid NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.8 ORDER ITEMS (Bảo toàn snapshot giá & tên món: Xoá món trong menu KHÔNG làm đổi doanh thu lịch sử)
CREATE TABLE IF NOT EXISTS public.order_items (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id VARCHAR(50), -- Cho phép NULL nếu sản phẩm bị xóa khỏi menu sau này
    product_name VARCHAR(150) NOT NULL, -- Lưu snapshot tên món tại thời điểm đặt
    station station_type NOT NULL DEFAULT 'BAR',
    unit_price NUMERIC(12, 2) NOT NULL, -- Lưu snapshot đơn giá tại thời điểm đặt
    quantity INT NOT NULL DEFAULT 1,
    selected_cooking_method JSONB,
    selected_size JSONB,
    selected_toppings JSONB DEFAULT '[]'::JSONB,
    sugar_level VARCHAR(20),
    ice_level VARCHAR(20),
    note TEXT,
    status item_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    cancel_reason TEXT,
    cancelled_by VARCHAR(100)
);

-- 2.9 VOID LOGS (Lịch sử hủy/sửa món chống gian lận)
CREATE TABLE IF NOT EXISTS public.void_logs (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50),
    order_code VARCHAR(30),
    table_name VARCHAR(100),
    item_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    reason TEXT NOT NULL,
    staff_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.10 TIMEKEEPING (Chấm công - Lưu snapshot tên nhân viên để bảo toàn khi xoá nhân viên)
CREATE TABLE IF NOT EXISTS public.timekeeping (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50), -- ON DELETE SET NULL để không bị mất dòng chấm công khi nhân viên nghỉ/xóa
    user_name VARCHAR(100), -- Lưu snapshot họ tên
    user_phone VARCHAR(20),
    user_role user_role,
    work_date DATE NOT NULL DEFAULT CURRENT_DATE,
    shift_type shift_type NOT NULL DEFAULT 'MORNING',
    hours_worked NUMERIC(5, 2) NOT NULL DEFAULT 0,
    check_in_time VARCHAR(10),
    check_out_time VARCHAR(10),
    status VARCHAR(20) DEFAULT 'ATTENDED',
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.11 PAYROLLS (Bảng lương - Lưu snapshot trọn vẹn: Xoá nhân viên vẫn còn lịch sử và xuất Excel/In bình thường)
CREATE TABLE IF NOT EXISTS public.payrolls (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50), -- Giữ ID hoặc NULL
    user_name VARCHAR(100) NOT NULL, -- Snapshot họ và tên
    user_phone VARCHAR(20), -- Snapshot SĐT
    user_role user_role, -- Snapshot Chức vụ
    salary_type VARCHAR(20) DEFAULT 'HOURLY', -- Snapshot hình thức lương
    period_month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    total_hours NUMERIC(6, 2) DEFAULT 0,
    total_shifts INT DEFAULT 0,
    base_salary NUMERIC(12, 2) NOT NULL,
    bonus NUMERIC(12, 2) DEFAULT 0,
    deduction NUMERIC(12, 2) DEFAULT 0,
    net_salary NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, PAID
    paid_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.12 EXPENSES / CHI PHÍ (P&L)
CREATE TABLE IF NOT EXISTS public.expenses (
    id VARCHAR(50) PRIMARY KEY,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.13 STORE SETTINGS
CREATE TABLE IF NOT EXISTS public.store_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    store_name VARCHAR(150) NOT NULL,
    slogan TEXT,
    address TEXT,
    phone VARCHAR(100),
    owner_name VARCHAR(100),
    bank_name VARCHAR(100) DEFAULT 'Sacombank',
    bank_account VARCHAR(50),
    account_holder VARCHAR(100),
    receipt_footer TEXT,
    tax_percent NUMERIC(5, 2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.14 DAILY SALES SUMMARY (Bảng nén dữ liệu doanh thu cũ - Tiết kiệm 95% dung lượng 500MB sau 6-12 tháng)
CREATE TABLE IF NOT EXISTS public.pos_daily_sales_summary (
    id VARCHAR(20) PRIMARY KEY, -- Định dạng: YYYY-MM-DD
    date VARCHAR(20) NOT NULL UNIQUE,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    total_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_discount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_orders INT NOT NULL DEFAULT 0,
    cash_revenue NUMERIC(14, 2) DEFAULT 0,
    transfer_revenue NUMERIC(14, 2) DEFAULT 0,
    shipping_revenue NUMERIC(14, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_sales_summary (
    id VARCHAR(20) PRIMARY KEY, -- Định dạng: YYYY-MM-DD
    date VARCHAR(20) NOT NULL UNIQUE,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    total_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_discount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_orders INT NOT NULL DEFAULT 0,
    cash_revenue NUMERIC(14, 2) DEFAULT 0,
    transfer_revenue NUMERIC(14, 2) DEFAULT 0,
    shipping_revenue NUMERIC(14, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_timekeeping_user_date ON public.timekeeping(user_id, work_date);
CREATE INDEX IF NOT EXISTS idx_payrolls_period ON public.payrolls(period_month);
CREATE INDEX IF NOT EXISTS idx_pos_daily_sales_month ON public.pos_daily_sales_summary(month);
CREATE INDEX IF NOT EXISTS idx_daily_sales_month ON public.daily_sales_summary(month);

-- 4. REALTIME REPLICATION CONFIGURATION
-- Cho phép màn hình KDS, Quầy Thu ngân và Sơ đồ bàn tự động cập nhật Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timekeeping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.void_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_daily_sales_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sales_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to zones" ON public.zones FOR SELECT USING (true);
CREATE POLICY "Allow public read access to categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public read access to tables" ON public.tables FOR SELECT USING (true);
CREATE POLICY "Allow public read access to store_settings" ON public.store_settings FOR SELECT USING (true);

CREATE POLICY "Staff all access users" ON public.users FOR ALL USING (true);
CREATE POLICY "Staff all access orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Staff all access order_items" ON public.order_items FOR ALL USING (true);
CREATE POLICY "Staff all access tables" ON public.tables FOR ALL USING (true);
CREATE POLICY "Staff all access timekeeping" ON public.timekeeping FOR ALL USING (true);
CREATE POLICY "Staff all access payrolls" ON public.payrolls FOR ALL USING (true);
CREATE POLICY "Staff all access void_logs" ON public.void_logs FOR ALL USING (true);
CREATE POLICY "Staff all access expenses" ON public.expenses FOR ALL USING (true);
CREATE POLICY "Staff all access pos_daily_sales_summary" ON public.pos_daily_sales_summary FOR ALL USING (true);
CREATE POLICY "Staff all access daily_sales_summary" ON public.daily_sales_summary FOR ALL USING (true);
`;
