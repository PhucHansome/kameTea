import React from 'react';
import { PayrollRecord, User, StoreSettings } from '../../types/pos';
import { Logo } from '../common/Logo';
import { formatVND } from '../../utils/formatters';
import { Printer, X, Download, CheckCircle, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

interface PaySlipModalProps {
  payroll: PayrollRecord;
  employee?: User | null;
  settings: StoreSettings;
  onClose: () => void;
  onUpdateStatus?: (status: 'DRAFT' | 'PAID') => void;
}

export const PaySlipModal: React.FC<PaySlipModalProps> = ({
  payroll,
  employee,
  settings,
  onClose,
  onUpdateStatus,
}) => {
  // Extract info from employee or fallback to snapshot stored inside payroll record
  const empId = employee?.id || payroll.userId;
  const empName = employee?.name || payroll.userName || 'Nhân viên';
  const empPhone = employee?.phone || payroll.userPhone || '---';
  const empRole = employee?.role || payroll.userRole || 'SERVER';
  const empSalaryType = employee?.salaryType || payroll.salaryType || 'COMBINED';
  const empBaseSalary = payroll.baseSalary !== undefined ? payroll.baseSalary : (employee?.baseSalary || 0);
  const empHourlyRate = payroll.hourlyRate !== undefined ? payroll.hourlyRate : (employee?.hourlyRate || 0);
  const empHourlyPay = payroll.hourlyPay !== undefined ? payroll.hourlyPay : (payroll.totalHours * empHourlyRate);

  const getRoleTitle = (r: string) => {
    switch (r) {
      case 'ADMIN':
        return 'Quản lý / Chủ quán';
      case 'CASHIER':
        return 'Thu ngân';
      case 'SERVER':
        return 'Nhân viên phục vụ';
      case 'KITCHEN':
        return 'Bếp & Pha chế';
      default:
        return 'Nhân viên';
    }
  };

  const getSalaryTypeLabel = (st: string) => {
    switch (st) {
      case 'COMBINED':
        return 'Lương cứng + Tiền giờ';
      case 'HOURLY':
        return 'Lương theo giờ';
      case 'MONTHLY':
        return 'Lương cứng cố định';
      default:
        return 'Lương cố định';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const data = [
      ['KAME - ỐC, ĂN VẶT & TRÀ SỮA'],
      ['PHIẾU LƯƠNG & QUYẾT TOÁN THU NHẬP NHÂN VIÊN'],
      [`Kỳ lương: Tháng ${payroll.month}`],
      [''],
      ['Mã nhân viên', empId],
      ['Họ và tên', empName],
      ['Số điện thoại', empPhone],
      ['Chức vụ', getRoleTitle(empRole)],
      ['Hình thức lương', getSalaryTypeLabel(empSalaryType)],
      ['Lương cứng', `${formatVND(empBaseSalary)} đ`],
      ['Đơn giá theo giờ', `${formatVND(empHourlyRate)} đ/h`],
      [''],
      ['THÔNG TIN CHẤM CÔNG & TÍNH LƯƠNG'],
      ['Tổng số ca làm', payroll.totalShifts],
      ['Tổng số giờ công', `${payroll.totalHours} giờ`],
      ['Tiền lương cứng', `${formatVND(empBaseSalary)} đ`],
      ['Tiền lương theo giờ', `${formatVND(empHourlyPay)} đ (${payroll.totalHours}h x ${formatVND(empHourlyRate)}đ)`],
      ['Thưởng / Phụ cấp', `${formatVND(payroll.bonus || 0)} đ ${payroll.bonusReason ? `(${payroll.bonusReason})` : ''}`],
      ['Khấu trừ / Phạt', `${formatVND(payroll.deduction || 0)} đ ${payroll.deductionReason ? `(${payroll.deductionReason})` : ''}`],
      [''],
      ['TỔNG THỰC LĨNH', `${formatVND(payroll.netSalary)} đ`],
      ['Trạng thái', payroll.status === 'PAID' ? 'Đã chi trả' : 'Chưa chi trả (Bản nháp)'],
      [''],
      ['Người lập phiếu', 'Nhân viên xác nhận', 'Chủ quán phê duyệt'],
      ['(Ký và ghi rõ họ tên)', '(Ký và ghi rõ họ tên)', '(Ký và ghi rõ họ tên)'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Phieu_Luong');
    XLSX.writeFile(wb, `Phieu_Luong_${empName.replace(/\s+/g, '_')}_${payroll.month}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Controls Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-sm sm:text-base">Phiếu Lương & Thanh Toán Thu Nhập</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Phiếu</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Pay Slip Template */}
        <div className="p-6 sm:p-8 overflow-y-auto bg-slate-50 dark:bg-slate-950/50">
          <div
            id="printable-payslip"
            className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-lg mx-auto max-w-lg space-y-6"
          >
            {/* Store Branding Header */}
            <div className="flex items-center justify-between border-b-2 border-amber-500 pb-4">
              <Logo size="md" showSubtitle={true} />
              <div className="text-right">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded-md">
                  KAME POS • HRM
                </span>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Mã phiếu: {payroll.id}
                </p>
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black uppercase text-slate-900 tracking-tight">
                PHIẾU THANH TOÁN LƯƠNG
              </h2>
              <p className="text-xs font-bold text-amber-700">
                Kỳ chi trả: Tháng {payroll.month}
              </p>
            </div>

            {/* Staff info table */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Họ và tên</span>
                <span className="font-black text-slate-900 text-sm">{empName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Vị trí công việc</span>
                <span className="font-bold text-slate-800">{getRoleTitle(empRole)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Số điện thoại</span>
                <span className="font-mono text-slate-700">{empPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Hình thức lương</span>
                <span className="font-bold text-amber-700">
                  {getSalaryTypeLabel(empSalaryType)}
                </span>
              </div>
            </div>

            {/* Working & Calculation Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Tổng số ca làm đã chấm:</span>
                <span className="font-bold font-mono">{payroll.totalShifts} ca</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Tổng số giờ làm việc:</span>
                <span className="font-bold font-mono text-amber-700">{payroll.totalHours} giờ</span>
              </div>

              {/* Base Salary */}
              {(empSalaryType === 'COMBINED' || empSalaryType === 'MONTHLY') && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Tiền lương cứng cố định:</span>
                  <span className="font-bold font-mono text-slate-900">
                    {formatVND(empBaseSalary)} đ
                  </span>
                </div>
              )}

              {/* Hourly Pay */}
              {(empSalaryType === 'COMBINED' || empSalaryType === 'HOURLY') && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <div>
                    <span className="text-slate-600 block">Tiền lương theo giờ công:</span>
                    <span className="text-[10px] text-slate-400">
                      ({payroll.totalHours} giờ × {formatVND(empHourlyRate)} đ/h)
                    </span>
                  </div>
                  <span className="font-bold font-mono text-slate-900">
                    {formatVND(empHourlyPay)} đ
                  </span>
                </div>
              )}

              {/* Bonus / Rewards */}
              {payroll.bonus ? (
                <div className="flex justify-between py-1.5 border-b border-slate-100 text-emerald-700 bg-emerald-50/60 px-2 rounded-lg">
                  <div>
                    <span className="font-bold block">+ Thưởng / Phụ cấp:</span>
                    {payroll.bonusReason && (
                      <span className="text-[10px] text-emerald-600 italic">Lý do: {payroll.bonusReason}</span>
                    )}
                  </div>
                  <span className="font-black font-mono">+{formatVND(payroll.bonus)} đ</span>
                </div>
              ) : null}

              {/* Deductions */}
              {payroll.deduction ? (
                <div className="flex justify-between py-1.5 border-b border-slate-100 text-rose-700 bg-rose-50/60 px-2 rounded-lg">
                  <div>
                    <span className="font-bold block">- Khấu trừ / Phạt:</span>
                    {payroll.deductionReason && (
                      <span className="text-[10px] text-rose-600 italic">Lý do: {payroll.deductionReason}</span>
                    )}
                  </div>
                  <span className="font-black font-mono">-{formatVND(payroll.deduction)} đ</span>
                </div>
              ) : null}
            </div>

            {/* Net Total Box */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black text-amber-900 uppercase block">
                  Tổng Thực Lĩnh (Net Salary)
                </span>
                <span className="text-[10px] text-slate-500">
                  {empSalaryType === 'COMBINED' ? 'Lương cứng + Tiền giờ + Thưởng - Phạt' : 'Đã bao gồm thưởng và khấu trừ'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-700 font-mono">
                  {formatVND(payroll.netSalary)} đ
                </span>
              </div>
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-3 gap-2 pt-6 text-center text-xs">
              <div className="space-y-12">
                <p className="font-bold text-slate-800">Người lập biểu</p>
                <p className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</p>
              </div>
              <div className="space-y-12">
                <p className="font-bold text-slate-800">Người nhận tiền</p>
                <p className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</p>
              </div>
              <div className="space-y-12">
                <p className="font-bold text-slate-800">Chủ quán duyệt</p>
                <p className="text-[11px] text-slate-400 italic">{settings.ownerName || 'KAME POS'}</p>
              </div>
            </div>

            {/* Footer note */}
            <div className="text-center pt-4 border-t border-slate-100">
              <p className="text-[10px] text-slate-400">
                {settings.storeName} • Địa chỉ: {settings.address} • Hotline: {settings.phone}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Status Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Trạng thái:</span>
            {payroll.status === 'PAID' ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                ĐÃ CHI TRẢ ({payroll.paidDate ? new Date(payroll.paidDate).toLocaleDateString('vi-VN') : 'Đã thanh toán'})
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                BẢN NHÁP (Chưa thanh toán)
              </span>
            )}
          </div>

          {onUpdateStatus && (
            <button
              type="button"
              onClick={() => onUpdateStatus(payroll.status === 'PAID' ? 'DRAFT' : 'PAID')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                payroll.status === 'PAID'
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
              }`}
            >
              {payroll.status === 'PAID' ? 'Chuyển về Chưa trả' : 'Đánh dấu Đã Chi Trả Tiền Lương'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
