import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { User, UserRole, SalaryCalculationType } from '../../types/pos';
import { formatVND } from '../../utils/formatters';
import { CurrencyInput } from '../common/CurrencyInput';
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  Lock,
  UserCheck,
  UserX,
  Phone,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Sparkles,
  Info,
  Check,
  X,
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, activeUser, showToast, isSubmitting } = usePOS();

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('SERVER');
  const [salaryType, setSalaryType] = useState<SalaryCalculationType>('COMBINED');
  const [baseSalary, setBaseSalary] = useState<number>(3000000);
  const [hourlyRate, setHourlyRate] = useState<number>(25000);
  const [status, setStatus] = useState<'ACTIVE' | 'OFF' | 'RESIGNED'>('ACTIVE');
  const [showPasswordText, setShowPasswordText] = useState(false);

  const openNewModal = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('123456');
    setName('');
    setPhone('');
    setRole('SERVER');
    setSalaryType('COMBINED');
    setBaseSalary(3000000);
    setHourlyRate(25000);
    setStatus('ACTIVE');
    setShowModal(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setUsername(u.username || '');
    setPassword(u.password || '');
    setName(u.name);
    setPhone(u.phone);
    setRole(u.role);
    setSalaryType(u.salaryType);
    setBaseSalary(u.baseSalary || 0);
    setHourlyRate(u.hourlyRate || 0);
    setStatus(u.status);
    setShowModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Lỗi', 'Vui lòng nhập họ và tên nhân viên');
      return;
    }
    if (!username.trim()) {
      showToast('error', 'Lỗi', 'Vui lòng nhập tên đăng nhập');
      return;
    }

    // Check duplicate username
    const duplicate = users.find(
      (u) => u.username?.toLowerCase() === username.trim().toLowerCase() && u.id !== editingUser?.id
    );
    if (duplicate) {
      showToast('error', 'Lỗi trùng lặp', 'Tên đăng nhập này đã tồn tại trên hệ thống');
      return;
    }

    const userData: User = {
      id: editingUser ? editingUser.id : `USR-${Date.now().toString().slice(-4)}`,
      username: username.trim().toLowerCase(),
      password: password.trim() || '123456',
      name: name.trim(),
      phone: phone.trim() || '0900000000',
      role,
      salaryType,
      baseSalary: Number(baseSalary || 0),
      hourlyRate: Number(hourlyRate || 0),
      status,
      joinedDate: editingUser ? editingUser.joinedDate : new Date().toISOString().split('T')[0],
      avatar: editingUser?.avatar,
    };

    if (editingUser) {
      await updateUser(userData);
      showToast('success', 'Thành công', `Đã cập nhật thông tin tài khoản ${userData.name}`);
    } else {
      await addUser(userData);
      showToast('success', 'Thành công', `Đã tạo mới tài khoản ${userData.name}`);
    }

    setShowModal(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    if (userToDelete.id === activeUser.id) {
      showToast('error', 'Không thể xóa', 'Bạn không thể xóa tài khoản đang đăng nhập hiện tại');
      setUserToDelete(null);
      return;
    }
    if (userToDelete.username === 'admin') {
      showToast('error', 'Không thể xóa', 'Tài khoản admin mặc định không thể bị xóa');
      setUserToDelete(null);
      return;
    }

    await deleteUser(userToDelete.id);
    showToast('success', 'Đã xóa', `Đã xóa tài khoản ${userToDelete.name}`);
    setUserToDelete(null);
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-rose-500/15 text-rose-500 border border-rose-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin (Toàn quyền)</span>
          </span>
        );
      case 'CASHIER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-blue-500/15 text-blue-500 border border-blue-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Thu ngân</span>
          </span>
        );
      case 'SERVER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-amber-500/15 text-amber-500 border border-amber-500/20">
            <Shield className="w-3.5 h-3.5" />
            <span>Phục vụ (Staff)</span>
          </span>
        );
      case 'KITCHEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
            <Shield className="w-3.5 h-3.5" />
            <span>Bếp & Pha chế</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Hệ Thống Phân Quyền Bảo Mật</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Quản Lý Tài Khoản & Phân Quyền Nhân Sự
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Thiết lập tên đăng nhập, mật khẩu, phân cấp vai trò truy cập giữa Chủ quán (Admin) và Nhân viên App.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewModal}
          className="px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 font-black text-xs text-white shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>THÊM TÀI KHOẢN MỚI</span>
        </button>
      </div>

      {/* Role Permissions Matrix Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Bảng Ma Trận Phân Quyền Truy Cập (RBAC)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-3">Chức năng & Module</th>
                <th className="py-3 px-3 text-center text-rose-500">Tài khoản Admin (admin/admin)</th>
                <th className="py-3 px-3 text-center text-blue-500">Tài khoản App / Nhân viên</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              <tr>
                <td className="py-3 px-3 text-slate-800 dark:text-slate-200">Sơ đồ bàn, Bán hàng & Đơn ship</td>
                <td className="py-3 px-3 text-center text-emerald-500"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-3 text-center text-emerald-500"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-slate-800 dark:text-slate-200">Báo cáo Doanh thu & Dòng tiền Ngày / Tháng / Năm</td>
                <td className="py-3 px-3 text-center text-emerald-500"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-3 text-center text-rose-500"><XCircle className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-slate-800 dark:text-slate-200">Cài đặt Sacombank & Cửa hàng</td>
                <td className="py-3 px-3 text-center text-emerald-500"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-3 text-center text-rose-500"><XCircle className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-slate-800 dark:text-slate-200">Xem Sổ Hủy Món (Số món hủy)</td>
                <td className="py-3 px-3 text-center text-emerald-500"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-3 text-center text-rose-500"><XCircle className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-slate-800 dark:text-slate-200">Bảng tính lương & Xuất phiếu lương nhân viên</td>
                <td className="py-3 px-3 text-center text-emerald-500"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-3 text-center text-rose-500"><XCircle className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-slate-800 dark:text-slate-200">Thêm / Sửa / Xóa nhân sự</td>
                <td className="py-3 px-3 text-center text-emerald-500"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-3 text-center text-rose-500"><XCircle className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-slate-800 dark:text-slate-200">Chấm công ca làm & Xem danh sách (Chỉ Tên, Vị trí, SĐT)</td>
                <td className="py-3 px-3 text-center text-emerald-500"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-3 text-center text-emerald-500"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-slate-800 dark:text-slate-200">Tab Quản lý User & Phân quyền trên Sidebar</td>
                <td className="py-3 px-3 text-center text-emerald-500"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-3 text-center text-rose-500"><XCircle className="w-4 h-4 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Accounts List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" />
            <span>Danh Sách Tài Khoản Hệ Thống ({users.length} tài khoản)</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => {
            const isSelf = u.id === activeUser.id;
            return (
              <div
                key={u.id}
                className={`p-4 rounded-2xl border transition relative flex flex-col justify-between ${
                  isSelf
                    ? 'bg-orange-500/5 border-orange-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Top Role & Status */}
                  <div className="flex items-center justify-between mb-3">
                    {getRoleBadge(u.role)}
                    {isSelf && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                        Đang đăng nhập
                      </span>
                    )}
                  </div>

                  {/* Name & Username */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {u.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                      <span className="font-bold text-slate-700 dark:text-slate-300">@{u.username || 'chua_tao'}</span>
                      <span>•</span>
                      <span>Pass: {u.password ? '••••••' : 'Chưa đặt'}</span>
                    </div>
                  </div>

                  {/* Phone & Joined */}
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.phone || 'Chưa cập nhật SĐT'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ngày tham gia: {u.joinedDate || '2023-01-01'}</span>
                    </div>
                    {u.role !== 'ADMIN' && (
                      <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        <span>
                          {u.salaryType === 'HOURLY'
                            ? `${formatVND(u.hourlyRate || 0)}/giờ`
                            : u.salaryType === 'MONTHLY'
                            ? `${formatVND(u.baseSalary || 0)}/tháng`
                            : `${formatVND(u.baseSalary || 0)}/tháng + ${formatVND(u.hourlyRate || 0)}/giờ`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(u)}
                    className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Chỉnh sửa tài khoản"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Sửa</span>
                  </button>

                  {u.username !== 'admin' && !isSelf && (
                    <button
                      type="button"
                      onClick={() => setUserToDelete(u)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      title="Xóa tài khoản"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/15 text-orange-500">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingUser ? 'Cập Nhật Tài Khoản' : 'Thêm Tài Khoản Mới'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cấu hình quyền hạn và thông tin đăng nhập nhân viên
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên đăng nhập (Username) *
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="vd: staff1, thungan..."
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mật khẩu *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="vd: 123456"
                      required
                      className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:border-orange-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Họ và Tên Nhân Viên *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="vd: Nguyễn Văn A"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Số Điện Thoại
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="vd: 0981417246"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vai trò & Phân quyền
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-orange-500 focus:outline-hidden"
                >
                  <option value="SERVER">Nhân viên Phục vụ (Staff - Không xem Doanh thu & Bảng lương)</option>
                  <option value="CASHIER">Thu ngân (Không xem Báo cáo doanh thu & Bảng lương)</option>
                  <option value="KITCHEN">Bếp & Pha chế (Chỉ xem ca làm & chấm công)</option>
                  <option value="ADMIN">Quản trị viên (Chủ quán Admin - Toàn quyền mọi mục)</option>
                </select>
              </div>

              {role !== 'ADMIN' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Cấu hình Lương & Chế độ
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Hình thức tính lương
                      </label>
                      <select
                        value={salaryType}
                        onChange={(e) => setSalaryType(e.target.value as SalaryCalculationType)}
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      >
                        <option value="COMBINED">Lương cứng + Giờ</option>
                        <option value="HOURLY">Theo giờ (Part-time)</option>
                        <option value="MONTHLY">Cố định tháng</option>
                      </select>
                    </div>

                    {(salaryType === 'COMBINED' || salaryType === 'MONTHLY') && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Lương cứng (đ/tháng)
                        </label>
                        <CurrencyInput
                          value={baseSalary}
                          onChange={setBaseSalary}
                          className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                        />
                      </div>
                    )}

                    {(salaryType === 'COMBINED' || salaryType === 'HOURLY') && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Đơn giá giờ (đ/giờ)
                        </label>
                        <CurrencyInput
                          value={hourlyRate}
                          onChange={setHourlyRate}
                          className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-md shadow-orange-500/20 transition cursor-pointer"
                >
                  {isSubmitting ? 'Đang lưu...' : editingUser ? 'LƯU THAY ĐỔI' : 'TẠO TÀI KHOẢN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Xóa Tài Khoản?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Bạn có chắc chắn muốn xóa tài khoản <span className="font-bold text-slate-800 dark:text-slate-200">{userToDelete.name}</span> (@{userToDelete.username})?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition cursor-pointer"
              >
                Xóa Vĩnh Viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
