import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import { User, ShiftRecord, PayrollRecord, UserRole, SalaryCalculationType } from '../../types/pos';
import { AttendanceCalendar } from './AttendanceCalendar';
import { PaySlipModal } from './PaySlipModal';
import { CurrencyInput } from '../common/CurrencyInput';
import { formatVND } from '../../utils/formatters';
import * as XLSX from 'xlsx';
import {
  Users,
  Calendar,
  Calculator,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Clock,
  DollarSign,
  Phone,
  FileCheck,
  Download,
  FileText,
  CheckCircle,
  Eye,
  UserX,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Search,
  Gift,
  Award,
  Sparkles,
  X,
} from 'lucide-react';

export const HRMView: React.FC = () => {
  const {
    users,
    addUser,
    updateUser,
    deleteUser,
    shifts,
    addOrUpdateShift,
    deleteShift,
    payrolls,
    generateMonthlyPayroll,
    updatePayrollStatus,
    updatePayrollRecord,
    settings,
    isSubmitting,
    isAdmin,
  } = usePOS();

  const [activeSubTab, setActiveSubTab] = useState<'STAFF' | 'TIMEKEEPING' | 'PAYROLL'>('STAFF');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-24');
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'OFF' | 'RESIGNED'>('ALL');

  // If staff/server attempts to open payroll tab, fallback to staff list
  useEffect(() => {
    if (!isAdmin && activeSubTab === 'PAYROLL') {
      setActiveSubTab('STAFF');
    }
  }, [isAdmin, activeSubTab]);

  // In HRM management, show all users including Admin so staff can see owner phone number
  const staffUsers = users;

  // Staff modal state
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Delete confirmation modal state
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Pay Slip Modal state
  const [activePaySlip, setActivePaySlip] = useState<{ payroll: PayrollRecord; employee?: User | null } | null>(null);

  // Payment & Bonus Adjustment Modal state
  const [editingBonusPayroll, setEditingBonusPayroll] = useState<PayrollRecord | null>(null);
  const [bonusAmount, setBonusAmount] = useState<number>(0);
  const [bonusReasonText, setBonusReasonText] = useState<string>('');
  const [deductionAmount, setDeductionAmount] = useState<number>(0);
  const [deductionReasonText, setDeductionReasonText] = useState<string>('');

  // Quick Shift Modal state
  const [showShiftModal, setShowShiftModal] = useState<boolean>(false);
  const [shiftUserId, setShiftUserId] = useState<string>(staffUsers[0]?.id || '');
  const [shiftType, setShiftType] = useState<ShiftRecord['shiftType']>('MORNING');
  const [shiftHours, setShiftHours] = useState<number>(6);
  const [shiftCheckIn, setShiftCheckIn] = useState<string>('07:00');
  const [shiftCheckOut, setShiftCheckOut] = useState<string>('13:00');

  // User form data (Avatar field completely removed)
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('SERVER');
  const [userSalaryType, setUserSalaryType] = useState<SalaryCalculationType>('COMBINED');
  const [userBaseSalary, setUserBaseSalary] = useState<number>(3000000);
  const [userHourlyRate, setUserHourlyRate] = useState<number>(25000);
  const [userStatus, setUserStatus] = useState<'ACTIVE' | 'OFF' | 'RESIGNED'>('ACTIVE');
  const [userJoinedDate, setUserJoinedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleShiftTypeChange = (type: ShiftRecord['shiftType']) => {
    setShiftType(type);
    switch (type) {
      case 'MORNING':
        setShiftCheckIn('07:00');
        setShiftCheckOut('13:00');
        setShiftHours(6);
        break;
      case 'AFTERNOON':
        setShiftCheckIn('13:00');
        setShiftCheckOut('18:00');
        setShiftHours(5);
        break;
      case 'EVENING':
        setShiftCheckIn('18:00');
        setShiftCheckOut('23:00');
        setShiftHours(5);
        break;
      case 'FULL':
        setShiftCheckIn('07:00');
        setShiftCheckOut('23:00');
        setShiftHours(16);
        break;
    }
  };

  const openNewUserModal = () => {
    setEditingUser(null);
    setUserName('');
    setUserPhone('');
    setUserRole('SERVER');
    setUserSalaryType('COMBINED');
    setUserBaseSalary(3000000);
    setUserHourlyRate(25000);
    setUserStatus('ACTIVE');
    setUserJoinedDate(new Date().toISOString().split('T')[0]);
    setShowUserModal(true);
  };

  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserPhone(user.phone);
    setUserRole(user.role);
    setUserSalaryType(user.salaryType || 'COMBINED');
    setUserBaseSalary(user.baseSalary || 0);
    setUserHourlyRate(user.hourlyRate || 25000);
    setUserStatus(user.status || 'ACTIVE');
    setUserJoinedDate(user.joinedDate || new Date().toISOString().split('T')[0]);
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userPhone.trim()) {
      alert('Vui lòng nhập họ tên và số điện thoại');
      return;
    }

    if (editingUser) {
      const updated: User = {
        ...editingUser,
        name: userName.trim(),
        phone: userPhone.trim(),
        role: userRole,
        salaryType: userSalaryType,
        baseSalary: Number(userBaseSalary),
        hourlyRate: Number(userHourlyRate),
        status: userStatus,
        joinedDate: userJoinedDate,
      };
      updateUser(updated);
    } else {
      const newUser: User = {
        id: 'USR-' + Date.now().toString().slice(-4),
        name: userName.trim(),
        phone: userPhone.trim(),
        role: userRole,
        salaryType: userSalaryType,
        baseSalary: Number(userBaseSalary),
        hourlyRate: Number(userHourlyRate),
        status: userStatus,
        joinedDate: userJoinedDate,
      };
      addUser(newUser);
    }

    setShowUserModal(false);
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;
    deleteUser(userToDelete.id);
    setUserToDelete(null);
  };

  const handleOpenAddShiftForDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    if (staffUsers.length > 0 && !shiftUserId) {
      setShiftUserId(staffUsers[0].id);
    }
    setShowShiftModal(true);
  };

  const handleAddShift = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = users.find((u) => u.id === shiftUserId);
    const newShift: ShiftRecord = {
      id: 'S-' + Date.now(),
      userId: shiftUserId,
      userName: staff?.name,
      userPhone: staff?.phone,
      userRole: staff?.role,
      date: selectedDate,
      shiftType,
      hoursWorked: Number(shiftHours),
      checkIn: shiftCheckIn,
      checkOut: shiftCheckOut,
      status: 'ATTENDED',
    };
    addOrUpdateShift(newShift);
    setShowShiftModal(false);
  };

  const handleGeneratePayroll = () => {
    generateMonthlyPayroll(selectedMonth);
  };

  // Open Bonus & Adjustment Modal
  const openBonusModal = (pr: PayrollRecord) => {
    setEditingBonusPayroll(pr);
    setBonusAmount(pr.bonus || 0);
    setBonusReasonText(pr.bonusReason || '');
    setDeductionAmount(pr.deduction || 0);
    setDeductionReasonText(pr.deductionReason || '');
  };

  const handleSaveBonusAndPayment = (markAsPaid: boolean = false) => {
    if (!editingBonusPayroll) return;
    updatePayrollRecord(editingBonusPayroll.id, {
      bonus: bonusAmount,
      bonusReason: bonusReasonText.trim(),
      deduction: deductionAmount,
      deductionReason: deductionReasonText.trim(),
      status: markAsPaid ? 'PAID' : editingBonusPayroll.status,
      paidDate: markAsPaid ? new Date().toISOString() : editingBonusPayroll.paidDate,
    });
    setEditingBonusPayroll(null);
  };

  // Export full payroll to Excel (.xlsx)
  const handleExportAllPayrollExcel = () => {
    if (payrolls.length === 0) {
      alert('Chưa có dữ liệu bảng lương tháng này. Vui lòng bấm "Tự động tính lương" trước!');
      return;
    }

    const rows = [
      ['BẢNG LƯƠNG NHÂN VIÊN - KAME POS'],
      [`Kỳ lương: Tháng ${selectedMonth}`],
      [`Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}`],
      [''],
      [
        'STT',
        'Mã NV',
        'Họ và tên',
        'Số điện thoại',
        'Vị trí',
        'Hình thức lương',
        'Lương cứng (VNĐ)',
        'Đơn giá giờ (VNĐ/h)',
        'Tổng số ca',
        'Tổng số giờ',
        'Tiền theo giờ (VNĐ)',
        'Thưởng (VNĐ)',
        'Lý do thưởng',
        'Khấu trừ (VNĐ)',
        'Lý do trừ',
        'Thực lĩnh (VNĐ)',
        'Trạng thái',
      ],
    ];

    payrolls.forEach((pr, idx) => {
      const staff = users.find((u) => u.id === pr.userId);
      const name = staff?.name || pr.userName || pr.userId;
      const phone = staff?.phone || pr.userPhone || '';
      const role = staff?.role || pr.userRole || 'SERVER';
      const salaryType = staff?.salaryType || pr.salaryType || 'COMBINED';
      const baseSalary = pr.baseSalary !== undefined ? pr.baseSalary : (staff?.baseSalary || 0);
      const hourlyRate = pr.hourlyRate !== undefined ? pr.hourlyRate : (staff?.hourlyRate || 0);
      const hourlyPay = pr.hourlyPay !== undefined ? pr.hourlyPay : (pr.totalHours * hourlyRate);

      rows.push([
        idx + 1,
        pr.userId,
        name,
        phone,
        getRoleLabel(role),
        salaryType === 'COMBINED' ? 'Lương cứng + Tiền giờ' : salaryType === 'HOURLY' ? 'Theo giờ' : 'Lương cố định tháng',
        baseSalary,
        hourlyRate,
        pr.totalShifts,
        pr.totalHours,
        hourlyPay,
        pr.bonus || 0,
        pr.bonusReason || '',
        pr.deduction || 0,
        pr.deductionReason || '',
        pr.netSalary,
        pr.status === 'PAID' ? 'Đã chi trả' : 'Bản nháp',
      ]);
    });

    const totalNet = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
    rows.push(['']);
    rows.push(['TỔNG CỘNG TIỀN LƯƠNG CẦN CHI TRẢ', '', '', '', '', '', '', '', '', '', '', '', '', '', '', totalNet, '']);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Luong_${selectedMonth}`);
    XLSX.writeFile(wb, `Bang_Luong_KAME_${selectedMonth}.xlsx`);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300';
      case 'CASHIER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300';
      case 'SERVER':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
      case 'KITCHEN':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị';
      case 'CASHIER':
        return 'Thu ngân';
      case 'SERVER':
        return 'Phục vụ bàn';
      case 'KITCHEN':
        return 'Bếp / Pha chế';
    }
  };

  const filteredStaff = staffUsers.filter((u) => {
    if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
    if (staffSearchQuery.trim()) {
      const q = staffSearchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.phone.includes(q) || u.id.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top HRM Sub-tab Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Quản Lý Nhân Sự & Chấm Công Lương
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Tính lương kết hợp (Lương cứng + Tiền giờ + Thưởng), Chấm công Lịch, In phiếu & Xuất Excel.
            </p>
          </div>
        </div>

        {/* 3 Sub-tabs Pills */}
        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('STAFF')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'STAFF'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>1. Danh Sách Nhân Viên</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('TIMEKEEPING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'TIMEKEEPING'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>2. Chấm Công Lịch</span>
          </button>

          {/* Admin only subtab */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveSubTab('PAYROLL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'PAYROLL'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>3. Bảng Tính Lương & Thưởng</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: STAFF LIST (RECORD-BY-RECORD ROW TABLE) */}
      {/* ========================================================================= */}
      {activeSubTab === 'STAFF' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#241812] p-3.5 rounded-2xl border border-slate-200 dark:border-[#3D2B1F] shadow-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#A89080]" />
                <input
                  type="text"
                  placeholder="Tìm theo tên nhân viên, chủ quán, số điện thoại..."
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-[#473225] bg-slate-50 dark:bg-[#35251C] text-xs text-slate-900 dark:text-[#FFFDF9] outline-hidden focus:ring-2 focus:ring-amber-500 placeholder-slate-400 dark:placeholder-[#A89080]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#473225] bg-slate-50 dark:bg-[#35251C] text-xs font-bold text-slate-700 dark:text-[#EFE4D6]"
              >
                <option value="ALL">Tất cả trạng thái ({staffUsers.length})</option>
                <option value="ACTIVE">Đang làm việc</option>
                <option value="OFF">Tạm nghỉ</option>
                <option value="RESIGNED">Đã nghỉ việc</option>
              </select>

              {isAdmin && (
                <button
                  type="button"
                  onClick={openNewUserModal}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm nhân viên mới</span>
                </button>
              )}
            </div>
          </div>

          {/* Record-by-Record Staff Table (Dạng bảng từng dòng một) */}
          <div className="bg-white dark:bg-[#241812] rounded-3xl border border-slate-200 dark:border-[#3D2B1F] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#35251C] text-slate-600 dark:text-[#E8C5A5] font-black border-b border-slate-200 dark:border-[#3D2B1F]">
                  <tr>
                    <th className="p-3.5">Họ và tên / Tài khoản</th>
                    <th className="p-3.5">Số điện thoại liên hệ</th>
                    <th className="p-3.5">Vị trí & Phân quyền</th>
                    <th className="p-3.5">Chế độ lương & Định mức</th>
                    <th className="p-3.5 text-center">Trạng thái</th>
                    <th className="p-3.5 text-center">Ngày vào làm</th>
                    <th className="p-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#3D2B1F]">
                  {filteredStaff.map((user) => {
                    const isOwnerAdmin = user.role === 'ADMIN';
                    const initials = user.name
                      .split(' ')
                      .filter(Boolean)
                      .slice(-2)
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase();

                    return (
                      <tr
                        key={user.id}
                        className={`transition hover:bg-amber-50/30 dark:hover:bg-[#35251C]/60 ${
                          isOwnerAdmin
                            ? 'bg-amber-500/5 dark:bg-amber-500/10'
                            : ''
                        }`}
                      >
                        {/* 1. Name & Initial Avatar */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs font-mono shrink-0 shadow-xs ${
                                isOwnerAdmin
                                  ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 ring-2 ring-amber-400/40'
                                  : 'bg-amber-500/15 dark:bg-[#35251C] text-amber-700 dark:text-[#DDB892] border border-amber-500/30 dark:border-[#473225]'
                              }`}
                            >
                              {initials || user.id.slice(-2)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900 dark:text-[#FFFDF9] text-xs">
                                  {user.name}
                                </p>
                                {isOwnerAdmin && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-xs">
                                    👑 CHỦ QUÁN
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-[#CDB49E] font-mono">
                                ID: {user.id} {user.username ? `• @${user.username}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Phone Number */}
                        <td className="p-3.5">
                          <span className="font-mono text-xs font-semibold text-slate-700 dark:text-[#EFE4D6]">
                            {user.phone || 'Chưa cập nhật'}
                          </span>
                        </td>

                        {/* 3. Role */}
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase inline-block ${getRoleBadge(
                              user.role
                            )}`}
                          >
                            {getRoleLabel(user.role)}
                          </span>
                        </td>

                        {/* 4. Salary Mode */}
                        <td className="p-3.5 font-mono">
                          {isOwnerAdmin ? (
                            <span className="text-slate-600 dark:text-[#E8C5A5] font-semibold text-[11px]">
                              Chủ cửa hàng (Toàn quyền)
                            </span>
                          ) : isAdmin ? (
                            <div>
                              {user.salaryType === 'COMBINED' ? (
                                <>
                                  <span className="font-bold text-amber-700 dark:text-[#E8C5A5] block">
                                    {formatVND(user.baseSalary || 0)} đ/tháng
                                  </span>
                                  <span className="text-[10px] text-slate-500 dark:text-[#CDB49E]">
                                    + {formatVND(user.hourlyRate || 0)} đ/h
                                  </span>
                                </>
                              ) : user.salaryType === 'HOURLY' ? (
                                <span className="font-bold text-amber-700 dark:text-[#E8C5A5]">
                                  {formatVND(user.hourlyRate || user.baseSalary || 0)} đ/giờ
                                </span>
                              ) : (
                                <span className="font-bold text-amber-700 dark:text-[#E8C5A5]">
                                  {formatVND(user.baseSalary || 0)} đ/tháng
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 dark:text-[#CDB49E] text-[11px]">
                              {user.salaryType === 'HOURLY'
                                ? 'Theo giờ'
                                : user.salaryType === 'COMBINED'
                                ? 'Cứng + Tiền giờ'
                                : 'Lương cố định'}
                            </span>
                          )}
                        </td>

                        {/* 5. Status */}
                        <td className="p-3.5 text-center">
                          {user.status === 'RESIGNED' ? (
                            <span className="text-[10px] px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
                              Đã nghỉ việc
                            </span>
                          ) : user.status === 'OFF' ? (
                            <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold">
                              Tạm nghỉ
                            </span>
                          ) : (
                            <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                              Đang làm việc
                            </span>
                          )}
                        </td>

                        {/* 6. Joined Date */}
                        <td className="p-3.5 text-center font-mono text-slate-500 dark:text-[#CDB49E] text-xs">
                          {user.joinedDate || '2023-01-01'}
                        </td>

                        {/* 7. Action buttons */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEditUserModal(user)}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#35251C] hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-[#EFE4D6] font-bold text-xs flex items-center gap-1 transition cursor-pointer border border-transparent dark:border-[#473225]"
                                  title="Chỉnh sửa thông tin"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>Sửa</span>
                                </button>

                                {!isOwnerAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => setUserToDelete(user)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                    title="Xóa nhân viên"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: TIMEKEEPING & ATTENDANCE CALENDAR (Full Interactive Calendar) */}
      {/* ========================================================================= */}
      {activeSubTab === 'TIMEKEEPING' && (
        <AttendanceCalendar
          shifts={shifts}
          users={staffUsers}
          onAddShiftForDate={handleOpenAddShiftForDate}
          onDeleteShift={deleteShift}
        />
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: PAYROLL & SALARY CALCULATOR */}
      {/* ========================================================================= */}
      {activeSubTab === 'PAYROLL' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tháng tính lương:
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleGeneratePayroll}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                <span>Tự động tính lương tháng {selectedMonth}</span>
              </button>

              <button
                type="button"
                onClick={handleExportAllPayrollExcel}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Xuất File Excel (XLSX)</span>
              </button>
            </div>
          </div>

          {/* Payroll List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Bảng Lương Tháng {selectedMonth} ({payrolls.length} phiếu lương)
              </h4>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                Tổng chi: {formatVND(payrolls.reduce((sum, p) => sum + p.netSalary, 0))} đ
              </span>
            </div>

            {payrolls.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 italic space-y-3">
                <p>Chưa có bảng lương cho tháng {selectedMonth}.</p>
                <button
                  type="button"
                  onClick={handleGeneratePayroll}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs cursor-pointer"
                >
                  Bấm vào đây để tự động tổng hợp số công & tính lương
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold">
                    <tr>
                      <th className="p-3.5">Nhân viên</th>
                      <th className="p-3.5">Hình thức</th>
                      <th className="p-3.5 text-center">Tổng ca / Giờ</th>
                      <th className="p-3.5 text-right">Lương cứng + Giờ công</th>
                      <th className="p-3.5 text-right">Thưởng / Phạt</th>
                      <th className="p-3.5 text-right">Thực nhận</th>
                      <th className="p-3.5 text-center">Trạng thái</th>
                      <th className="p-3.5 text-right">Thanh toán & In phiếu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {payrolls.map((pr) => {
                      const staff = users.find((u) => u.id === pr.userId);
                      const displayName = staff?.name || pr.userName || pr.userId;
                      const displayPhone = staff?.phone || pr.userPhone || '---';
                      const isDeletedStaff = !staff;
                      const salaryType = pr.salaryType || staff?.salaryType || 'COMBINED';
                      const baseSalary = pr.baseSalary !== undefined ? pr.baseSalary : (staff?.baseSalary || 0);
                      const hourlyRate = pr.hourlyRate !== undefined ? pr.hourlyRate : (staff?.hourlyRate || 0);
                      const hourlyPay = pr.hourlyPay !== undefined ? pr.hourlyPay : (pr.totalHours * hourlyRate);

                      return (
                        <tr key={pr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">
                                  {displayName}
                                </p>
                                <p className="text-[11px] text-slate-500">{displayPhone}</p>
                              </div>
                              {isDeletedStaff && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  Đã nghỉ việc
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-medium text-slate-600 dark:text-slate-400">
                              {salaryType === 'COMBINED'
                                ? 'Cứng + Giờ công'
                                : salaryType === 'HOURLY'
                                ? 'Theo giờ'
                                : 'Lương cứng'}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-mono font-bold">
                            {pr.totalShifts} ca ({pr.totalHours}h)
                          </td>
                          <td className="p-3.5 text-right font-medium font-mono text-xs">
                            {salaryType === 'COMBINED' ? (
                              <div>
                                <span className="text-slate-800 dark:text-slate-200 block font-bold">
                                  {formatVND(baseSalary + hourlyPay)} đ
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  ({formatVND(baseSalary)} + {formatVND(hourlyPay)})
                                </span>
                              </div>
                            ) : salaryType === 'HOURLY' ? (
                              <span className="text-slate-800 dark:text-slate-200 font-bold">
                                {formatVND(hourlyPay)} đ
                              </span>
                            ) : (
                              <span className="text-slate-800 dark:text-slate-200 font-bold">
                                {formatVND(baseSalary)} đ
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right font-mono text-xs">
                            <div className="space-y-0.5">
                              {pr.bonus ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold block" title={pr.bonusReason}>
                                  +{formatVND(pr.bonus)} đ
                                </span>
                              ) : null}
                              {pr.deduction ? (
                                <span className="text-rose-600 dark:text-rose-400 font-bold block" title={pr.deductionReason}>
                                  -{formatVND(pr.deduction)} đ
                                </span>
                              ) : null}
                              {!pr.bonus && !pr.deduction && (
                                <span className="text-slate-400 text-[11px]">0 đ</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-right font-black text-amber-600 dark:text-amber-400 text-sm font-mono">
                            {formatVND(pr.netSalary)} đ
                          </td>
                          <td className="p-3.5 text-center">
                            {pr.status === 'PAID' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                ✓ Đã chi trả
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Bản nháp
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openBonusModal(pr)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                                title="Thêm thưởng / khấu trừ & thanh toán"
                              >
                                <Gift className="w-3.5 h-3.5" />
                                <span>Thưởng / Trừ</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setActivePaySlip({ payroll: pr, employee: staff || null })}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-500 hover:text-slate-950 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                                title="Xem & in phiếu lương cá nhân"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>In Phiếu</span>
                              </button>

                              {pr.status === 'DRAFT' ? (
                                <button
                                  type="button"
                                  onClick={() => updatePayrollStatus(pr.id, 'PAID')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                                >
                                  Trả lương
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => updatePayrollStatus(pr.id, 'DRAFT')}
                                  className="text-[11px] text-slate-500 hover:underline px-1.5 cursor-pointer"
                                >
                                  Chỉnh sửa
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment & Bonus Modal */}
      {editingBonusPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    Thanh Toán, Thưởng & Khấu Trừ Lương
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nhân viên: <strong className="text-slate-900 dark:text-white">{editingBonusPayroll.userName}</strong> • Tháng {editingBonusPayroll.month}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingBonusPayroll(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Summary Breakdown */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Lương cứng cố định:</span>
                <span className="font-bold font-mono">{formatVND(editingBonusPayroll.baseSalary || 0)} đ</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Lương theo giờ ({editingBonusPayroll.totalHours}h):</span>
                <span className="font-bold font-mono">{formatVND(editingBonusPayroll.hourlyPay || 0)} đ</span>
              </div>
            </div>

            {/* Bonus Input */}
            <div className="space-y-2 p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl text-xs">
              <label className="block font-bold text-emerald-900 dark:text-emerald-300">
                Tiền thưởng / Phụ cấp thêm (VNĐ):
              </label>
              <CurrencyInput
                value={bonusAmount}
                onChange={(val) => setBonusAmount(val)}
                placeholder="VD: 500.000"
                className="p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-800 font-bold text-emerald-700 dark:text-emerald-400"
              />
              <input
                type="text"
                placeholder="Lý do thưởng (VD: Doanh số vượt chỉ tiêu, chuyên cần tốt...)"
                value={bonusReasonText}
                onChange={(e) => setBonusReasonText(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            {/* Deduction Input */}
            <div className="space-y-2 p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl text-xs">
              <label className="block font-bold text-rose-900 dark:text-rose-300">
                Tiền khấu trừ / Phạt (VNĐ):
              </label>
              <CurrencyInput
                value={deductionAmount}
                onChange={(val) => setDeductionAmount(val)}
                placeholder="VD: 100.000"
                className="p-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 font-bold text-rose-700 dark:text-rose-400"
              />
              <input
                type="text"
                placeholder="Lý do phạt / trừ (VD: Đi trễ 2 lần, làm vỡ đồ...)"
                value={deductionReasonText}
                onChange={(e) => setDeductionReasonText(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            {/* Live Net Salary Result */}
            {(() => {
              const liveNet = Math.max(
                0,
                (editingBonusPayroll.baseSalary || 0) +
                  (editingBonusPayroll.hourlyPay || 0) +
                  (bonusAmount || 0) -
                  (deductionAmount || 0)
              );
              return (
                <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-black text-amber-900 dark:text-amber-200 uppercase block">
                      Tổng Thực Lĩnh Sau Thưởng & Phạt
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (Lương cứng + Tiền giờ + Thưởng - Phạt)
                    </span>
                  </div>
                  <span className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">
                    {formatVND(liveNet)} đ
                  </span>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingBonusPayroll(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleSaveBonusAndPayment(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 font-bold text-xs cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
              <button
                type="button"
                onClick={() => handleSaveBonusAndPayment(true)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer"
              >
                Xác Nhận & Đánh Dấu Đã Trả Lương
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Chấm công ca làm việc ({selectedDate})
            </h3>

            <form onSubmit={handleAddShift} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chọn nhân viên:
                </label>
                <select
                  value={shiftUserId}
                  onChange={(e) => setShiftUserId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  {staffUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({getRoleLabel(u.role)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ca làm:
                  </label>
                  <select
                    value={shiftType}
                    onChange={(e) => handleShiftTypeChange(e.target.value as ShiftRecord['shiftType'])}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="MORNING">Ca Sáng (07:00 - 13:00 • 6h)</option>
                    <option value="AFTERNOON">Ca Chiều (13:00 - 18:00 • 5h)</option>
                    <option value="EVENING">Ca Tối (18:00 - 23:00 • 5h)</option>
                    <option value="FULL">Cả Ngày (07:00 - 23:00 • Full ca)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Số giờ công:
                  </label>
                  <input
                    type="number"
                    value={shiftHours}
                    onChange={(e) => setShiftHours(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Check-in:
                  </label>
                  <input
                    type="time"
                    value={shiftCheckIn}
                    onChange={(e) => setShiftCheckIn(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Check-out:
                  </label>
                  <input
                    type="time"
                    value={shiftCheckOut}
                    onChange={(e) => setShiftCheckOut(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 font-black text-slate-950 shadow-xs cursor-pointer disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Chấm Công'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Modal (Add / Edit) */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {editingUser ? 'Chỉnh sửa thông tin nhân viên' : 'Thêm nhân viên mới'}
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Thị Lan"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="VD: 0981xxxxxx"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vị trí làm việc:
                  </label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as UserRole)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="SERVER">Phục vụ (Server)</option>
                    <option value="CASHIER">Thu ngân (Cashier)</option>
                    <option value="KITCHEN">Bếp / Bar (Kitchen)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Trạng thái:
                  </label>
                  <select
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="ACTIVE">Đang làm việc</option>
                    <option value="OFF">Tạm nghỉ</option>
                    <option value="RESIGNED">Đã nghỉ việc</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hình thức tính lương:
                  </label>
                  <select
                    value={userSalaryType}
                    onChange={(e) => setUserSalaryType(e.target.value as SalaryCalculationType)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="COMBINED">Lương cứng + Tiền giờ</option>
                    <option value="HOURLY">Chỉ tính theo giờ</option>
                    <option value="MONTHLY">Lương cứng cố định</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày vào làm:
                  </label>
                  <input
                    type="date"
                    value={userJoinedDate}
                    onChange={(e) => setUserJoinedDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Dynamic Salary Inputs depending on userSalaryType */}
              {userSalaryType === 'COMBINED' && (
                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  <div>
                    <label className="block font-bold text-amber-900 dark:text-amber-300 mb-1">
                      1. Lương cứng (VNĐ/tháng):
                    </label>
                    <CurrencyInput
                      value={userBaseSalary}
                      onChange={(val) => setUserBaseSalary(val)}
                      placeholder="VD: 3.000.000"
                      className="p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 font-black text-amber-600 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-amber-900 dark:text-amber-300 mb-1">
                      2. Tiền công giờ (VNĐ/h):
                    </label>
                    <CurrencyInput
                      value={userHourlyRate}
                      onChange={(val) => setUserHourlyRate(val)}
                      placeholder="VD: 25.000"
                      className="p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 font-black text-amber-600 text-sm"
                    />
                  </div>
                </div>
              )}

              {userSalaryType === 'HOURLY' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Đơn giá tiền công (VNĐ / giờ):
                  </label>
                  <CurrencyInput
                    value={userHourlyRate}
                    onChange={(val) => {
                      setUserHourlyRate(val);
                      setUserBaseSalary(val);
                    }}
                    placeholder="VD: 25.000"
                    className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-amber-600 text-sm"
                  />
                </div>
              )}

              {userSalaryType === 'MONTHLY' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mức lương cứng hàng tháng (VNĐ / tháng):
                  </label>
                  <CurrencyInput
                    value={userBaseSalary}
                    onChange={(val) => setUserBaseSalary(val)}
                    placeholder="VD: 8.000.000"
                    className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-amber-600 text-sm"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 font-black text-slate-950 shadow-xs cursor-pointer disabled:opacity-50 transition"
                >
                  {isSubmitting
                    ? 'Đang lưu...'
                    : editingUser
                    ? 'Cập Nhật Nhân Viên'
                    : 'Lưu Nhân Viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Xác nhận xóa nhân viên
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Nhân viên: <strong className="text-slate-900 dark:text-white">{userToDelete.name}</strong> ({userToDelete.phone})
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-1.5 text-xs">
              <p className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                Dữ liệu lịch sử được bảo toàn vĩnh viễn:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                <li>Họ tên nhân viên <strong>{userToDelete.name}</strong> vẫn lưu đầy đủ trong bảng lương & ca làm cũ.</li>
                <li>Toàn bộ lịch sử trả lương, số giờ làm và số tiền tháng trước vẫn được bảo lưu 100%.</li>
                <li>Doanh thu và chi phí quán không bị ảnh hưởng.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDeleteUser}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Đang xóa...' : 'Đồng ý xóa nhân viên'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PaySlip Modal */}
      {activePaySlip && (
        <PaySlipModal
          payroll={activePaySlip.payroll}
          employee={activePaySlip.employee}
          settings={settings}
          onClose={() => setActivePaySlip(null)}
          onUpdateStatus={(st) => {
            updatePayrollStatus(activePaySlip.payroll.id, st);
            setActivePaySlip((prev) =>
              prev
                ? {
                    ...prev,
                    payroll: {
                      ...prev.payroll,
                      status: st,
                      paidDate: st === 'PAID' ? new Date().toISOString() : undefined,
                    },
                  }
                : null
            );
          }}
        />
      )}
    </div>
  );
};
