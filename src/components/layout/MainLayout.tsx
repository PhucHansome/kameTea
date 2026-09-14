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
  ShieldAlert,
  ShieldCheck,
  Truck,
  PanelLeftClose,
  PanelLeftOpen,
  Eye,
  EyeOff,
  LogOut,
  KeyRound,
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
    currentUser,
    logout,
    isAdmin,
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

  const allNavItems: {
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    adminOnly?: boolean;
  }[] = [
    {
      id: 'pos',
      label: 'Sơ đồ bàn & Bán hàng',
      icon: Utensils,
      badge: occupiedTablesCount,
    },
    {
      id: 'menu',
      label: 'Thực đơn & Món',
      icon: BookOpen,
      adminOnly: true,
    },
    {
      id: 'hrm',
      label: isAdmin ? 'Quản lý Nhân sự' : 'Chấm công & Nhân sự',
      icon: Users,
    },
    {
      id: 'reports',
      label: isAdmin ? 'Báo cáo Doanh thu' : 'Doanh thu hôm nay',
      icon: TrendingUp,
      adminOnly: false,
    },
    {
      id: 'users',
      label: 'Quản lý User & Phân quyền',
      icon: KeyRound,
      adminOnly: true,
    },
  ];

  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

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
    <div className="flex h-screen w-full bg-[#FAF7F2] dark:bg-[#1A120C] font-sans text-[#3D2B1F] dark:text-[#EFE4D6] overflow-hidden select-none selection:bg-[#8D5B4C] selection:text-white">
      {/* ========================================================================= */}
      {/* 1. BENTO SIDEBAR (Desktop / Tablet) */}
      {/* ========================================================================= */}
      {layoutMode === 'SIDEBAR_DASHBOARD' && (
        <aside
          className={`hidden md:flex flex-col ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          } bg-[#241812] border-r border-[#3D2B1F] justify-between py-5 px-3 shrink-0 transition-all duration-300 z-30 shadow-2xl`}
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
                className="p-1.5 rounded-xl bg-[#35251C] hover:bg-[#473225] text-[#D5C2AF] hover:text-white transition cursor-pointer"
                title={isSidebarCollapsed ? 'Mở rộng Sidebar' : 'Thu gọn Sidebar'}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-[#DDB892]" />
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
                    className={`group flex items-center justify-between p-2.5 rounded-2xl transition-all relative cursor-pointer ${
                      isActive
                        ? 'bg-[#8D5B4C] text-white font-bold shadow-lg shadow-[#8D5B4C]/25'
                        : 'text-[#CDB49E] hover:text-white hover:bg-[#35251C] font-medium'
                    }`}
                  >
                    <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                      <Icon
                        className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-white' : 'text-[#D5C2AF] group-hover:text-white'
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
                                ? 'bg-[#FAF7F2] text-[#582F0E] shadow-xs'
                                : 'bg-[#35251C] text-[#E8C5A5] border border-[#473225]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : (
                          <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#C48B5E] ring-2 ring-[#241812]" />
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Controls & User Profile */}
          <div className="space-y-3 pt-3 border-t border-[#3D2B1F]">
            {/* Quick Actions (Theme & Kiosk Mode) */}
            <div className="flex items-center justify-around px-1">
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl text-[#D5C2AF] hover:text-white hover:bg-[#35251C] transition cursor-pointer"
                title={isDarkMode ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-[#E8C5A5]" /> : <Moon className="w-4 h-4 text-[#D5C2AF]" />}
              </button>

              {!isSidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => setLayoutMode('TOPBAR_KIOSK')}
                  title="Chuyển sang chế độ Kiosk Bán hàng nhanh"
                  className="p-2 rounded-xl text-[#D5C2AF] hover:text-white hover:bg-[#35251C] flex items-center gap-1 text-[11px] font-bold transition cursor-pointer"
                >
                  <Laptop className="w-4 h-4 text-[#DDB892]" />
                  <span>Kiosk</span>
                </button>
              )}
            </div>

            {/* Active User Card & Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="w-full flex items-center gap-2.5 p-2 rounded-2xl bg-[#35251C] hover:bg-[#473225] border border-[#473225] transition group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8D5B4C] to-[#C48B5E] text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                  {activeUser.name.charAt(0)}
                </div>
                {!isSidebarCollapsed && (
                  <div className="flex flex-col text-left truncate flex-1">
                    <p className="text-xs font-bold text-[#FDFBF7] leading-tight truncate">{activeUser.name}</p>
                    <p className="text-[10px] text-[#DDB892] font-semibold truncate">{activeUser.role}</p>
                  </div>
                )}
              </button>

              {/* User Dropdown */}
              {showUserDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-64 rounded-2xl bg-[#241812] border border-[#3D2B1F] shadow-2xl p-2 z-50 animate-in fade-in">
                  <div className="p-2.5 mb-1 bg-[#35251C] rounded-xl border border-[#473225]">
                    <p className="text-[10px] font-bold text-[#CDB49E] uppercase tracking-wider">
                      Đang đăng nhập:
                    </p>
                    <p className="text-xs font-black text-[#FDFBF7]">{currentUser?.name || activeUser.name}</p>
                    <p className="text-[10px] text-[#DDB892] font-mono">@{currentUser?.username || 'user'} • {activeUser.role}</p>
                  </div>

                  <p className="px-3 py-1 text-[10px] font-bold text-[#A89080] uppercase tracking-wider">
                    Đổi người trực / nhân viên:
                  </p>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setActiveUser(u);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl flex items-center justify-between text-xs transition cursor-pointer ${
                        activeUser.id === u.id
                          ? 'bg-[#8D5B4C]/30 text-[#E8C5A5] font-bold border border-[#8D5B4C]/50'
                          : 'text-[#EFE4D6] hover:bg-[#35251C]'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="font-bold text-white text-xs truncate">{u.name}</p>
                        <p className="text-[10px] text-[#CDB49E]">{getRoleLabel(u.role)}</p>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1C140F] text-[#D5C2AF] shrink-0">
                        {u.role}
                      </span>
                    </button>
                  ))}

                  <div className="mt-2 pt-2 border-t border-[#3D2B1F]">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        logout();
                      }}
                      className="w-full p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>ĐĂNG XUẤT</span>
                    </button>
                  </div>
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
          <header className="bg-[#241812] border-b border-[#3D2B1F] px-4 py-2.5 flex items-center justify-between text-white shadow-md z-40">
            <div className="flex items-center gap-3">
              <Logo size="sm" showSubtitle={false} />
            </div>

            {/* Nav pills */}
            <nav className="flex items-center gap-1 bg-[#35251C] p-1 rounded-xl border border-[#473225]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-[#8D5B4C] text-white shadow-sm'
                        : 'text-[#D5C2AF] hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-[#1C140F] text-[#DDB892]">
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
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 rounded-lg text-[#D5C2AF] hover:text-white cursor-pointer"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-[#E8C5A5]" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setLayoutMode('SIDEBAR_DASHBOARD')}
                className="p-1.5 rounded-lg text-[#D5C2AF] hover:text-white cursor-pointer"
                title="Chuyển sang Sidebar Dashboard"
              >
                <LayoutDashboard className="w-4 h-4 text-[#DDB892]" />
              </button>

              {/* User badge */}
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#35251C] text-xs font-bold cursor-pointer"
              >
                <span className="w-5 h-5 rounded-md bg-[#8D5B4C] text-white flex items-center justify-center text-[10px]">
                  {activeUser.name.charAt(0)}
                </span>
                <span className="hidden sm:inline text-xs text-[#FDFBF7]">{activeUser.name}</span>
              </button>
            </div>
          </header>
        )}

        {/* Mobile Header (For screens < md) */}
        <div className="md:hidden bg-[#241812] border-b border-[#3D2B1F] p-3.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" showSubtitle={false} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl text-[#D5C2AF] hover:text-white"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-[#E8C5A5]" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[#35251C] text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#241812] border-b border-[#3D2B1F] p-4 space-y-2 z-40 animate-in slide-in-from-top-2">
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
                    isActive ? 'bg-[#8D5B4C] text-white' : 'text-[#D5C2AF] hover:bg-[#35251C]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1C140F] text-[#DDB892] font-bold">
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
        <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-7 gap-5 overflow-y-auto bg-[#FAF7F2] dark:bg-[#1A120C]">
          {/* Bento Header */}
          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#3D2B1F] dark:text-[#FDFBF7] tracking-tight uppercase">
                KAME-TEA — POS SYSTEM
              </h1>
              <p className="text-xs sm:text-sm text-[#7A604D] dark:text-[#CDB49E] mt-0.5">
                {getGreeting()}, <span className="font-bold text-[#4A3222] dark:text-[#EFE4D6]">{activeUser.name}</span> ({getRoleLabel(activeUser.role)}) • <span className="text-[#8D5B4C] dark:text-[#DDB892] font-medium">74 Lê Lợi / 02 Chế Lan Viên</span>
              </p>
            </div>

            {/* Right Status Bento Indicators */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              {/* Role Indicator Badge */}
              <div className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl shadow-xs border ${
                isAdmin
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-300'
                  : 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200'
              }`}>
                {isAdmin ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      👑 ADMIN (Toàn quyền)
                    </span>
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 text-stone-600 dark:text-stone-400 shrink-0" />
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      👤 Nhân Viên ({activeUser.role})
                    </span>
                  </>
                )}
              </div>

              {/* Quick Logout Button */}
              <button
                type="button"
                onClick={() => logout()}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-xs font-bold transition cursor-pointer shadow-2xs"
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>

              {/* Dynamic Clock Pill */}
              <div className="text-right px-3.5 py-1.5 bg-white dark:bg-[#241812] rounded-2xl shadow-xs border border-slate-200 dark:border-[#3D2B1F]">
                <p className="text-xs font-black text-slate-900 dark:text-[#FFFDF9] font-mono leading-tight">
                  {timeString || '14:45'}
                </p>
                <p className="text-[9px] text-slate-400 dark:text-[#A89080] font-bold uppercase tracking-tight">
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

