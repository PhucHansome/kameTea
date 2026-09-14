import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { User, UserRole, SalaryCalculationType } from '../../types/pos';
import { CurrencyInput } from '../common/CurrencyInput';
import {
  ShieldCheck,
  UserPlus,
  Edit2,
  Trash2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Phone,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const {
    users,
    addUser,
    updateUser,
    deleteUser,
    syncToSupabase,
    isSubmitting,
    currentUser,
    activeUser,
  } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Form Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showModalPassword, setShowModalPassword] = useState<boolean>(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('SERVER');
  const [salaryType, setSalaryType] = useState<SalaryCalculationType>('COMBINED');
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [hourlyRate, setHourlyRate] = useState<number>(25000);
  const [status, setStatus] = useState<'ACTIVE' | 'OFF' | 'RESIGNED'>('ACTIVE');
  const [formError, setFormError] = useState('');

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const openNewUserModal = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setShowModalPassword(false);
    setName('');
    setPhone('');
    setRole('SERVER');
    setSalaryType('HOURLY');
    setBaseSalary(0);
    setHourlyRate(25000);
    setStatus('ACTIVE');
    setFormError('');
    setShowUserModal(true);
  };

  const openEditUserModal = (u: User) => {
    setEditingUser(u);
    setUsername(u.username || u.phone || u.id);
    setPassword(u.password || '');
    setShowModalPassword(false);
    setName(u.name);
    setPhone(u.phone);
    setRole(u.role);
    setSalaryType(u.salaryType || 'COMBINED');
    setBaseSalary(u.baseSalary || 0);
    setHourlyRate(u.hourlyRate || 0);
    setStatus(u.status || 'ACTIVE');
    setFormError('');
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!username.trim()) {
      setFormError('Vui lòng nhập Tên đăng nhập (username).');
      return;
    }
    if (!name.trim()) {
      setFormError('Vui lòng nhập Họ và tên nhân viên.');
      return;
    }
    if (!editingUser && !password.trim()) {
      setFormError('Vui lòng đặt Mật khẩu đăng nhập cho tài khoản mới.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check duplicate username
    const exists = users.find(
      (u) =>
        u.id !== editingUser?.id &&
        ((u.username && u.username.toLowerCase() === cleanUsername) ||
          u.phone === phone.trim())
    );
    if (exists) {
      setFormError(`Tên đăng nhập "${cleanUsername}" hoặc số điện thoại đã tồn tại ở nhân viên khác.`);
      return;
    }

    const userData: Partial<User> = {
      username: cleanUsername,
      password: password.trim() ? password.trim() : editingUser?.password || '123456',
      name: name.trim(),
      phone: phone.trim() || '0981417246',
      role,
      salaryType,
      baseSalary,
      hourlyRate,
      status,
      joinedDate: editingUser?.joinedDate || new Date().toISOString().split('T')[0],
    };

    if (editingUser) {
      await updateUser(editingUser.id, userData);
    } else {
      await addUser({
        id: `USR-${Date.now().toString().slice(-4)}`,
        ...userData,
      } as User);
    }

    setShowUserModal(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    if (userToDelete.role === 'ADMIN' || userToDelete.username === 'admin') {
      alert('Không thể xóa tài khoản Quản trị viên (Admin) cao nhất.');
      setUserToDelete(null);
      return;
    }
    await deleteUser(userToDelete.id);
    setUserToDelete(null);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.phone.includes(searchQuery);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-[#582F0E]/30 text-[#E8C5A5] border border-[#7F4F24]/50 text-xs font-black flex items-center gap-1.5 w-fit">
            👑 ADMIN (Toàn quyền)
          </span>
        );
      case 'CASHIER':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-[#B07D62]/20 text-[#E6CCB2] border border-[#B07D62]/40 text-xs font-bold flex items-center gap-1.5 w-fit">
            💰 THU NGÂN
          </span>
        );
      case 'KITCHEN':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-[#9C6644]/25 text-[#EFE4D6] border border-[#9C6644]/40 text-xs font-bold flex items-center gap-1.5 w-fit">
            🍳 BẾP CHÍNH
          </span>
        );
      case 'SERVER':
      default:
        return (
          <span className="px-2.5 py-1 rounded-xl bg-[#6F4E37]/25 text-[#DDB892] border border-[#6F4E37]/40 text-xs font-bold flex items-center gap-1.5 w-fit">
            🏃 PHỤC VỤ (STAFF)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#2A1E17] via-[#35251C] to-[#251A13] border border-[#443024] p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#6F4E37]/30 text-[#E8C5A5] border border-[#8D5B4C]/40 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#FDFBF7] flex items-center gap-2">
                Quản Lý Tài Khoản & Phân Quyền
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#582F0E] text-[#E8C5A5] border border-[#7F4F24] font-mono font-bold">
                  ADMIN ONLY
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-[#CDB49E] mt-0.5">
                Quản lý danh sách đăng nhập, mật khẩu, phân quyền truy cập hệ thống và tự động lưu trực tiếp Supabase.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => syncToSupabase()}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-2xl bg-[#3D2B1F] hover:bg-[#4E3728] text-[#EFE4D6] text-xs font-bold flex items-center gap-2 border border-[#5C402E] transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin text-[#DDB892]' : 'text-[#DDB892]'}`} />
            <span>Đồng bộ Supabase</span>
          </button>

          <button
            type="button"
            onClick={openNewUserModal}
            className="px-5 py-2.5 rounded-2xl bg-[#8D5B4C] hover:bg-[#7A4B3C] text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-[#8D5B4C]/30 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tạo Tài Khoản Mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#2A1E17] border border-[#443024] p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A89080]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, username, SĐT..."
            className="w-full pl-9 pr-4 py-2 bg-[#1C140F] border border-[#443024] rounded-xl text-xs text-[#F5EBE1] placeholder-[#8A7566] focus:outline-hidden focus:border-[#C48B5E]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-[#C48B5E] shrink-0" />
            <label htmlFor="role-filter-select" className="text-xs font-bold text-[#D5C2AF] whitespace-nowrap">
              Lọc vai trò:
            </label>
            <select
              id="role-filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-[#1C140F] text-[#F5EBE1] border border-[#443024] focus:outline-hidden focus:border-[#C48B5E] cursor-pointer w-full sm:w-48"
            >
              <option value="ALL">🌟 Tất cả vai trò ({users.length})</option>
              <option value="ADMIN">👑 ADMIN (Quản trị viên)</option>
              <option value="CASHIER">💰 CASHIER (Thu ngân)</option>
              <option value="SERVER">🏃 SERVER (Phục vụ)</option>
              <option value="KITCHEN">🍳 KITCHEN (Bếp chính)</option>
              <option value="BARISTA">🧋 BARISTA (Pha chế)</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Accounts Table */}
      <div className="bg-[#2A1E17] border border-[#443024] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#EFE4D6]">
            <thead className="bg-[#1C140F]/90 text-[#CDB49E] text-[11px] font-black uppercase border-b border-[#443024]">
              <tr>
                <th className="py-3.5 px-4">Tài khoản & Nhân viên</th>
                <th className="py-3.5 px-4">Tên đăng nhập (User)</th>
                <th className="py-3.5 px-4">Mật khẩu</th>
                <th className="py-3.5 px-4">Vai trò & Quyền</th>
                <th className="py-3.5 px-4">Số điện thoại</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#443024]/60">
              {filteredUsers.map((u) => {
                const isPassVisible = Boolean(showPasswordMap[u.id]);
                const displayPass = u.password || '123456';
                const isCurrent = currentUser?.id === u.id;

                return (
                  <tr key={u.id} className="hover:bg-[#38281E]/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#8D5B4C] to-[#C48B5E] text-white font-black text-xs flex items-center justify-center shadow-md">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#FDFBF7] text-sm flex items-center gap-2">
                            {u.name}
                            {isCurrent && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-700/50 font-bold">
                                Đang trực
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-[#A89080] font-mono">ID: {u.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[#E8C5A5] font-bold bg-[#1C140F] px-2.5 py-1 rounded-md border border-[#5C402E]">
                        {u.username || u.phone || 'user'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-[#1C140F] px-2.5 py-1 rounded-md text-[#DDB892] border border-[#443024] text-xs">
                          {isPassVisible ? displayPass : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(u.id)}
                          className="p-1 rounded-lg text-[#A89080] hover:text-[#FDFBF7] hover:bg-[#3D2B1F] transition cursor-pointer"
                          title={isPassVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>

                    <td className="py-3.5 px-4 font-mono text-[#D5C2AF]">{u.phone}</td>

                    <td className="py-3.5 px-4">
                      {u.status === 'ACTIVE' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[10px] font-bold">
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-400 border border-rose-800/40 text-[10px] font-bold">
                          Tạm ngưng
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditUserModal(u)}
                          className="p-2 rounded-xl bg-[#3D2B1F] hover:bg-[#8D5B4C] text-[#EFE4D6] hover:text-white transition cursor-pointer"
                          title="Chỉnh sửa tài khoản"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {u.role !== 'ADMIN' && u.username !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => setUserToDelete(u)}
                            className="p-2 rounded-xl bg-[#3D2B1F] hover:bg-rose-700 text-[#EFE4D6] hover:text-white transition cursor-pointer"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* Permissions Matrix Reference Table */}
      <div className="bg-[#2A1E17] border border-[#443024] rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-[#FDFBF7] flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#C48B5E]" />
              Bảng Phân Quyền Chi Tiết Giữa Các Tài Khoản
            </h3>
            <p className="text-xs text-[#CDB49E] mt-1">
              Phân quyền chặt chẽ: Tài khoản Admin (Chủ quán) nắm toàn quyền, tài khoản Nhân viên chỉ được thao tác trong phạm vi được chỉ định.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#EFE4D6] border-collapse">
            <thead className="bg-[#1C140F] text-[#CDB49E] text-[11px] font-black uppercase border-b border-[#443024]">
              <tr>
                <th className="py-3 px-4">Tính năng / Khu vực</th>
                <th className="py-3 px-4 text-center text-[#E8C5A5]">👑 ADMIN (Chủ quán)</th>
                <th className="py-3 px-4 text-center text-[#E6CCB2]">💰 Thu ngân</th>
                <th className="py-3 px-4 text-center text-[#DDB892]">🏃 Phục vụ (Staff)</th>
                <th className="py-3 px-4 text-center text-[#EFE4D6]">🍳 Bếp / Pha chế</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#443024] text-xs">
              <tr className="hover:bg-[#38281E]/40">
                <td className="py-3 px-4 font-bold text-white">Xem Doanh Thu & Dòng Tiền (Ngày/Tháng/Năm)</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-black">✔ Toàn quyền</td>
                <td className="py-3 px-4 text-center text-[#8A7566]">✖ Khóa</td>
                <td className="py-3 px-4 text-center text-[#8A7566]">✖ Khóa</td>
                <td className="py-3 px-4 text-center text-[#8A7566]">✖ Khóa</td>
              </tr>
              <tr className="hover:bg-[#38281E]/40">
                <td className="py-3 px-4 font-bold text-white">Cài đặt Sacombank & Cấu hình tài khoản quán</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-black">✔ Toàn quyền</td>
                <td className="py-3 px-4 text-center text-[#8A7566]">✖ Khóa</td>
                <td className="py-3 px-4 text-center text-[#8A7566]">✖ Khóa</td>
                <td className="py-3 px-4 text-center text-[#8A7566]">✖ Khóa</td>
              </tr>
              <tr className="hover:bg-[#38281E]/40">
                <td className="py-3 px-4 font-bold text-white">Quản lý Nhân sự, Phân quyền & Tạo User</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-black">✔ Toàn quyền</td>
                <td className="py-3 px-4 text-center text-[#8A7566]">✖ Khóa</td>
                <td className="py-3 px-4 text-center text-[#8A7566]">✖ Khóa</td>
                <td className="py-3 px-4 text-center text-[#8A7566]">✖ Khóa</td>
              </tr>
              <tr className="hover:bg-[#38281E]/40">
                <td className="py-3 px-4 font-bold text-white">Xem Lịch sử Món Hủy (Void logs) & Lý do hủy</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-black">✔ Toàn quyền</td>
                <td className="py-3 px-4 text-center text-[#8A7566]">✖ Khóa</td>
                <td className="py-3 px-4 text-center text-[#8A7566]">✖ Khóa</td>
                <td className="py-3 px-4 text-center text-[#8A7566]">✖ Khóa</td>
              </tr>
              <tr className="hover:bg-[#38281E]/40">
                <td className="py-3 px-4 font-bold text-white">Thêm / Sửa / Xóa Thực đơn & Thay đổi Giá bán</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-black">✔ Toàn quyền</td>
                <td className="py-3 px-4 text-center text-[#8A7566]">✖ Khóa</td>
                <td className="py-3 px-4 text-center text-[#8A7566]">✖ Khóa</td>
                <td className="py-3 px-4 text-center text-[#8A7566]">✖ Khóa</td>
              </tr>
              <tr className="hover:bg-[#38281E]/40">
                <td className="py-3 px-4 font-bold text-white">Sơ đồ bàn, Nhận đơn, Báo hết món & Giao hàng</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-black">✔ Toàn quyền</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">✔ Có quyền</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">✔ Có quyền</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">✔ Có quyền</td>
              </tr>
              <tr className="hover:bg-[#38281E]/40">
                <td className="py-3 px-4 font-bold text-white">Chấm công ca làm & Xem lịch trực cá nhân</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-black">✔ Toàn quyền</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">✔ Xem ca mình</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">✔ Xem ca mình</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">✔ Xem ca mình</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* User Create/Edit Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#2A1E17] border border-[#443024] rounded-3xl w-full max-w-lg shadow-2xl p-6 text-[#FDFBF7] animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#443024]">
              <h3 className="text-lg font-black text-[#FDFBF7] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#C48B5E]" />
                {editingUser ? 'Chỉnh Sửa Tài Khoản' : 'Tạo Tài Khoản Đăng Nhập Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="p-1.5 rounded-xl text-[#A89080] hover:text-[#FDFBF7] hover:bg-[#3D2B1F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#D5C2AF] font-bold mb-1">
                    Tên đăng nhập (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ví dụ: admin, staff, thungan..."
                    className="w-full p-2.5 bg-[#1C140F] border border-[#443024] rounded-xl text-[#FDFBF7] font-mono focus:border-[#C48B5E] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[#D5C2AF] font-bold mb-1">
                    Mật khẩu {editingUser ? '(Để trống nếu giữ nguyên)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showModalPassword ? 'text' : 'password'}
                      required={!editingUser}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="w-full p-2.5 pr-10 bg-[#1C140F] border border-[#443024] rounded-xl text-[#FDFBF7] font-mono focus:border-[#C48B5E] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A89080] hover:text-[#FDFBF7] p-1 cursor-pointer"
                      title={showModalPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#C48B5E]" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#D5C2AF] font-bold mb-1">Họ và Tên *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ví dụ: Nguyễn Văn A"
                    className="w-full p-2.5 bg-[#1C140F] border border-[#443024] rounded-xl text-[#FDFBF7] focus:border-[#C48B5E] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[#D5C2AF] font-bold mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="ví dụ: 0981417246"
                    className="w-full p-2.5 bg-[#1C140F] border border-[#443024] rounded-xl text-[#FDFBF7] font-mono focus:border-[#C48B5E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#D5C2AF] font-bold mb-1">Vai trò & Phân quyền *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-[#1C140F] border border-[#443024] rounded-xl text-[#FDFBF7] font-bold focus:border-[#C48B5E] focus:outline-hidden cursor-pointer"
                  >
                    <option value="ADMIN">👑 ADMIN (Toàn quyền)</option>
                    <option value="SERVER">🏃 STAFF / Phục vụ (Nhân viên)</option>
                    <option value="CASHIER">💰 CASHIER (Thu ngân)</option>
                    <option value="KITCHEN">🍳 KITCHEN (Bếp chính)</option>
                    <option value="BARISTA">🧋 BARISTA (Pha chế)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#D5C2AF] font-bold mb-1">Trạng thái làm việc</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-[#1C140F] border border-[#443024] rounded-xl text-[#FDFBF7] font-bold focus:border-[#C48B5E] focus:outline-hidden cursor-pointer"
                  >
                    <option value="ACTIVE">Đang làm việc (ACTIVE)</option>
                    <option value="OFF">Tạm nghỉ (OFF)</option>
                    <option value="RESIGNED">Đã nghỉ việc (RESIGNED)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-[#1C140F]/80 rounded-2xl border border-[#443024] space-y-3">
                <p className="text-[11px] font-bold text-[#CDB49E] uppercase tracking-wider">
                  Thiết lập Lương (Tùy chọn)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#A89080] text-[11px] font-bold mb-1">
                      Lương cứng (tháng)
                    </label>
                    <CurrencyInput
                      value={baseSalary}
                      onChange={setBaseSalary}
                      placeholder="0đ"
                      className="w-full p-2 bg-[#2A1E17] border border-[#443024] rounded-xl text-[#FDFBF7] font-mono text-xs focus:border-[#C48B5E] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[#A89080] text-[11px] font-bold mb-1">
                      Lương theo giờ (giờ)
                    </label>
                    <CurrencyInput
                      value={hourlyRate}
                      onChange={setHourlyRate}
                      placeholder="25.000đ"
                      className="w-full p-2 bg-[#2A1E17] border border-[#443024] rounded-xl text-[#FDFBF7] font-mono text-xs focus:border-[#C48B5E] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#443024]">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-[#3D2B1F] text-[#EFE4D6] font-bold hover:bg-[#4E3728] transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-2xl bg-[#8D5B4C] hover:bg-[#7A4B3C] text-white font-black shadow-lg shadow-[#8D5B4C]/30 transition cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingUser ? 'Lưu Thay Đổi' : 'Tạo & Lưu Supabase'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#2A1E17] border border-[#443024] rounded-3xl w-full max-w-sm shadow-2xl p-6 text-[#FDFBF7] text-center animate-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 text-rose-400 border border-rose-800/50 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#FDFBF7]">Xác nhận xóa tài khoản?</h3>
              <p className="text-xs text-[#CDB49E] mt-1">
                Bạn có chắc chắn muốn xóa tài khoản <strong>{userToDelete.name}</strong> (@{userToDelete.username || userToDelete.id})? Hành động này sẽ tự động xóa trực tiếp khỏi Supabase.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#3D2B1F] text-[#EFE4D6] text-xs font-bold hover:bg-[#4E3728] cursor-pointer"
              >
                Không xóa
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-black hover:bg-rose-600 shadow-md shadow-rose-900/40 cursor-pointer"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
