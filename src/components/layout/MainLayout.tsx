import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import { Logo } from '../common/Logo';
import { TabType, UserRole } from '../../types/pos';
import {
  LayoutDashboard,
  Utensils,
  ChefHat,
  Users,
  BookOpen,
  TrendingUp,
  Database,
  Moon,
  Sun,
  Laptop,
  Menu,
  X,
  Volume2,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  Shield,
  Truck,
  PanelLeftClose,
  PanelLeftOpen,
  Eye,
  EyeOff,
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  onOpenSupabaseDocs: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, onOpenSupabaseDocs }) => {
  const {
    currentTab,
    setCurrentTab,
    layoutMode,
    setLayoutMode,
    isDarkMode,
    setIsDarkMode,
    activeUser,
    setActiveUser,
    users,
    orders,
    tables,
    settings,
    notifyKitchenUpdate,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    hideSupabaseOnSidebar,
    setHideSupabaseOnSidebar,
  } = usePOS();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [timeString, setTimeString] = useState<string>('');
  const [dateString, setDateString] = useState<string>('');

  // Live Clock formatting in Vietnamese
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );

      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = days[now.getDay()];
      const day = now.getDate();
      const month = now.getMonth() + 1;
      setDateString(`${dayName}, ${day} Tháng ${month}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Active counts for badges
  const activeOrdersCount = orders.filter(
    (o) => o.status === 'ACTIVE' || o.status === 'PENDING_PAYMENT'
  ).length;

  const occupiedTablesCount = tables.filter(
    (t) => t.status === 'OCCUPIED' || t.status === 'WAITING_PAYMENT'
  ).length;

  const activeDeliveryOrdersCount = orders.filter(
    (o) =>
      (o.orderType === 'DELIVERY' || o.deliveryAddress) &&
      (o.status === 'ACTIVE' || o.deliveryStatus === 'PENDING' || o.deliveryStatus === 'SHIPPING')
  ).length;

  const kitchenPendingCount = orders.reduce((sum, o) => {
    if (o.status === 'ACTIVE' || o.status === 'PENDING_PAYMENT') {
      return sum + o.items.filter((i) => i.status === 'PENDING' || i.status === 'COOKING').length;
    }
    return sum;
  }, 0);

  const navItems: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    {
      id: 'pos',
      label: 'Sơ đồ bàn & Bán hàng',
      icon: Utensils,
      badge: occupiedTablesCount,
    },
    {
      id: 'delivery',
      label: 'Đơn Ship & Giao hàng',
      icon: Truck,
      badge: activeDeliveryOrdersCount,
    },
    {
      id: 'kds',
      label: 'Màn hình Bếp (KDS)',
      icon: ChefHat,
      badge: kitchenPendingCount,
    },
    {
      id: 'menu',
      label: 'Thực đơn & Món',
      icon: BookOpen,
    },
    {
      id: 'hrm',
      label: 'Quản lý Nhân sự',
      icon: Users,
    },
    {
      id: 'reports',
      label: 'Báo cáo Doanh thu',
      icon: TrendingUp,
    },
  ];

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị viên (Chủ quán)';
      case 'CASHIER':
        return 'Thu ngân';
      case 'SERVER':
        return 'Nhân viên Phục vụ';
      case 'KITCHEN':
        return 'Bếp & Pha chế';
    }
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Chào buổi sáng';
    if (hours < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <div className="flex h-screen w-full bg-[#f3f4f6] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden select-none selection:bg-orange-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. BENTO SIDEBAR (Desktop / Tablet) */}
      {/* ========================================================================= */}
      {layoutMode === 'SIDEBAR_DASHBOARD' && (
        <aside
          className={`hidden md:flex flex-col ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          } bg-slate-900 border-r border-slate-800 justify-between py-5 px-3 shrink-0 transition-all duration-300 z-30 shadow-xl`}
        >
          {/* Top Brand Logo & Collapse Trigger */}
          <div className="space-y-5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <Logo size="md" showSubtitle={false} className={isSidebarCollapsed ? 'block' : 'hidden'} variant="iconOnly" />
                <div className={isSidebarCollapsed ? 'hidden' : 'block'}>
                  <Logo size="md" showSubtitle={true} />
                </div>
              </div>

              {/* Sidebar toggle button */}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                title={isSidebarCollapsed ? 'Mở rộng Sidebar' : 'Thu gọn Sidebar'}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-orange-400" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Navigation Menu */}
            <nav className="flex flex-col space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    title={item.label}
                    className={`group flex items-center justify-between p-2.5 rounded-2xl transition-all relative ${
                      isActive
                        ? 'bg-white/10 text-orange-400 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80 font-medium'
                    }`}
                  >
                    <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                      <Icon
                        className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-orange-400' : 'text-slate-400 group-hover:text-white'
                        }`}
                      />
                      {!isSidebarCollapsed && <span className="text-xs truncate">{item.label}</span>}
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <>
                        {!isSidebarCollapsed ? (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                              isActive
                                ? 'bg-orange-500 text-slate-950 shadow-xs'
                                : 'bg-slate-800 text-orange-400 border border-slate-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : (
                          <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-slate-900" />
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Controls & User Profile */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            {/* Supabase Schema Trigger with Eye Hide/Show Button */}
            {!hideSupabaseOnSidebar && (
              <div className="relative group/supa">
                <button
                  type="button"
                  onClick={onOpenSupabaseDocs}
                  className={`w-full p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center ${
                    isSidebarCollapsed ? 'justify-center' : 'justify-between'
                  } transition group`}
                  title="Supabase Schema & SQL"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Database className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                    {!isSidebarCollapsed && <span className="text-[11px] truncate">Supabase DB</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      SQL
                    </span>
                  )}
                </button>

                {/* Quick Hide Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHideSupabaseOnSidebar(true);
                  }}
                  title="Ẩn nút Supabase trên Sidebar"
                  className="absolute right-1.5 top-1.5 p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-amber-400 opacity-0 group-hover/supa:opacity-100 transition shadow-xs cursor-pointer"
                >
                  <EyeOff className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Quick Actions (Theme & Kiosk Mode & Show Supabase if hidden) */}
            <div className="flex items-center justify-around px-1">
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title={isDarkMode ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={notifyKitchenUpdate}
                title="Thử chuông KDS Bếp"
                className="p-2 rounded-xl text-slate-400 hover:text-orange-400 hover:bg-slate-800 transition"
              >
                <Volume2 className="w-4 h-4 text-orange-400" />
              </button>

              {hideSupabaseOnSidebar && (
                <button
                  type="button"
                  onClick={() => setHideSupabaseOnSidebar(false)}
                  title="Hiện lại nút Supabase DB trên sidebar"
                  className="p-2 rounded-xl text-emerald-400 hover:bg-slate-800 transition"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}

              {!isSidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => setLayoutMode('TOPBAR_KIOSK')}
                  title="Chuyển sang chế độ Kiosk Bán hàng nhanh"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1 text-[11px] font-bold transition"
                >
                  <Laptop className="w-4 h-4 text-orange-400" />
                  <span>Kiosk</span>
                </button>
              )}
            </div>

            {/* Active User Card & Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="w-full flex items-center gap-2.5 p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                  {activeUser.name.charAt(0)}
                </div>
                {!isSidebarCollapsed && (
                  <div className="flex flex-col text-left truncate flex-1">
                    <p className="text-xs font-bold text-white leading-tight truncate">{activeUser.name}</p>
                    <p className="text-[10px] text-orange-400 font-semibold truncate">{activeUser.role}</p>
                  </div>
                )}
              </button>

              {/* User Dropdown */}
              {showUserDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-60 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in">
                  <p className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Đổi nhân viên / vai trò:
                  </p>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setActiveUser(u);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between text-xs transition ${
                        activeUser.id === u.id
                          ? 'bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-white">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{getRoleLabel(u.role)}</p>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 2. TOPBAR KIOSK MODE (When layoutMode === 'TOPBAR_KIOSK') */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {layoutMode === 'TOPBAR_KIOSK' && (
          <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-white shadow-md z-40">
            <div className="flex items-center gap-3">
              <Logo size="sm" showSubtitle={false} />
            </div>

            {/* Nav pills */}
            <nav className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-slate-950 text-orange-400">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenSupabaseDocs}
                className="px-2.5 py-1 rounded-lg text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold flex items-center gap-1"
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">DB</span>
              </button>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setLayoutMode('SIDEBAR_DASHBOARD')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                title="Chuyển sang Sidebar Dashboard"
              >
                <LayoutDashboard className="w-4 h-4 text-orange-400" />
              </button>

              {/* User badge */}
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-bold"
              >
                <span className="w-5 h-5 rounded-md bg-orange-500 text-white flex items-center justify-center text-[10px]">
                  {activeUser.name.charAt(0)}
                </span>
                <span className="hidden sm:inline text-xs">{activeUser.name}</span>
              </button>
            </div>
          </header>
        )}

        {/* Mobile Header (For screens < md) */}
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-3.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" showSubtitle={false} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl text-slate-400 hover:text-white"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-800 text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-2 z-40 animate-in slide-in-from-top-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold ${
                    isActive ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-orange-400 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. BENTO MAIN WORKSPACE */}
        {/* ========================================================================= */}
        <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-7 gap-5 overflow-y-auto">
          {/* Bento Header */}
          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                KAME — POS SYSTEM
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {getGreeting()}, <span className="font-bold text-slate-700 dark:text-slate-200">{activeUser.name}</span> ({getRoleLabel(activeUser.role)}) • <span className="text-orange-600 dark:text-orange-400 font-medium">74 Lê Lợi / 02 Chế Lan Viên</span>
              </p>
            </div>

            {/* Right Status Bento Indicators */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              {/* Kitchen Live Status Badge */}
              <div className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Bếp: Trực tuyến
                </span>
              </div>

              {/* Dynamic Clock Pill */}
              <div className="text-right px-3.5 py-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-black text-slate-900 dark:text-white font-mono leading-tight">
                  {timeString || '14:45'}
                </p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">
                  {dateString || 'Hôm nay'}
                </p>
              </div>
            </div>
          </header>

          {/* Children Views (TableGrid / OrderPOS / KDS / HRM / Menu / Reports) */}
          <div className="flex-1 overflow-visible">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

