import React, { useState } from 'react';
import { ShiftRecord, User } from '../../types/pos';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Trash2,
  Calendar as CalendarIcon,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';

interface AttendanceCalendarProps {
  shifts: ShiftRecord[];
  users: User[];
  onAddShiftForDate: (dateStr: string) => void;
  onDeleteShift: (shiftId: string) => void;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  shifts,
  users,
  onAddShiftForDate,
  onDeleteShift,
}) => {
  // Calendar state
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(7); // 0-indexed: 7 is August
  const [selectedDay, setSelectedDay] = useState<string>('2026-08-24');

  const monthNames = [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
  ];

  const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setSelectedDay(`${today.getFullYear()}-${m}-${d}`);
  };

  // Calendar math:
  // First day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust so Monday is 0 and Sunday is 6
  const startDayOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Create array of days for calendar
  const calendarCells = [];
  // Empty offset cells
  for (let i = 0; i < startDayOffset; i++) {
    calendarCells.push(null);
  }
  // Month days
  for (let day = 1; day <= daysInMonth; day++) {
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    calendarCells.push(`${currentYear}-${monthStr}-${dayStr}`);
  }

  // Shifts on selected day
  const selectedDayShifts = shifts.filter((s) => s.date === selectedDay);

  // Helper for shift color
  const getShiftBadgeStyle = (type: ShiftRecord['shiftType']) => {
    switch (type) {
      case 'MORNING':
        return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200';
      case 'AFTERNOON':
        return 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200';
      case 'EVENING':
        return 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200';
      case 'FULL':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200';
    }
  };

  const getShiftLabel = (type: ShiftRecord['shiftType']) => {
    switch (type) {
      case 'MORNING':
        return 'Sáng';
      case 'AFTERNOON':
        return 'Chiều';
      case 'EVENING':
        return 'Tối';
      case 'FULL':
        return 'Full ca';
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header / Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-sm">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {monthNames[currentMonth]} / {currentYear}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Lịch chấm công trực quan theo tháng — Bấm vào từng ngày để xem hoặc thêm ca làm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title="Tháng trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title="Tháng sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onAddShiftForDate(selectedDay)}
            className="ml-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Chấm Ca Mới</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left is Calendar Grid, Right is Selected Day Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Monthly Matrix */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-black text-xs text-slate-400 py-2 border-b border-slate-100 dark:border-slate-800">
            {daysOfWeek.map((dow, idx) => (
              <div
                key={dow}
                className={idx === 6 ? 'text-rose-500 font-black' : idx === 5 ? 'text-amber-600 font-black' : ''}
              >
                {dow}
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 auto-rows-fr">
            {calendarCells.map((dateStr, index) => {
              if (!dateStr) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-[88px] bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-100 dark:border-slate-800/40"
                  />
                );
              }

              const dayNum = parseInt(dateStr.split('-')[2], 10);
              const dayShifts = shifts.filter((s) => s.date === dateStr);
              const totalHours = dayShifts.reduce((sum, s) => sum + s.hoursWorked, 0);
              const isSelected = selectedDay === dateStr;
              const isToday =
                dateStr ===
                `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(
                  new Date().getDate()
                ).padStart(2, '0')}`;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDay(dateStr)}
                  className={`min-h-[88px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 shadow-md ring-2 ring-amber-500/30'
                      : isToday
                      ? 'border-slate-400 bg-slate-50 dark:bg-slate-800/80'
                      : 'border-slate-100 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        isToday
                          ? 'bg-amber-500 text-slate-950'
                          : isSelected
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {totalHours > 0 && (
                      <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                        {totalHours}h
                      </span>
                    )}
                  </div>

                  {/* Shifts Pills inside Day Cell */}
                  <div className="space-y-1 my-1 overflow-hidden">
                    {dayShifts.slice(0, 2).map((s) => {
                      const staff = users.find((u) => u.id === s.userId);
                      const displayName = staff?.name || s.userName || 'Nhân viên';
                      const shortName = displayName.split(' ').pop() || displayName;
                      return (
                        <div
                          key={s.id}
                          className={`text-[9px] px-1.5 py-0.5 rounded-md border font-bold truncate ${getShiftBadgeStyle(
                            s.shiftType
                          )}`}
                          title={`${displayName} (${getShiftLabel(s.shiftType)} • ${s.hoursWorked}h)`}
                        >
                          {shortName}: {getShiftLabel(s.shiftType)}
                        </div>
                      );
                    })}
                    {dayShifts.length > 2 && (
                      <div className="text-[9px] font-bold text-slate-400 text-center">
                        +{dayShifts.length - 2} ca nữa
                      </div>
                    )}
                  </div>

                  {/* Add button on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddShiftForDate(dateStr);
                      }}
                      className="p-1 rounded-md bg-amber-500 text-slate-950 hover:scale-110 transition"
                      title="Chấm công ngày này"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details Sidebar */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">
                  Chi tiết ngày được chọn
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  {selectedDay}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => onAddShiftForDate(selectedDay)}
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm transition"
                title="Chấm ca cho ngày này"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* List of Shifts for this Day */}
            <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {selectedDayShifts.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/40 text-center text-xs text-slate-400 space-y-2">
                  <p>Chưa có ca làm việc nào được chấm trong ngày {selectedDay}.</p>
                  <button
                    type="button"
                    onClick={() => onAddShiftForDate(selectedDay)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    + Chấm ca ngay
                  </button>
                </div>
              ) : (
                selectedDayShifts.map((shift) => {
                  const staff = users.find((u) => u.id === shift.userId);
                  const displayName = staff?.name || shift.userName || 'Nhân viên';
                  return (
                    <div
                      key={shift.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                            {displayName}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold border ${getShiftBadgeStyle(
                              shift.shiftType
                            )}`}
                          >
                            Ca {getShiftLabel(shift.shiftType)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-amber-500" />
                            {shift.checkIn} - {shift.checkOut}
                          </span>
                          <span className="font-bold text-amber-700 dark:text-amber-400 font-mono">
                            {shift.hoursWorked} giờ
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteShift(shift.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Xóa lượt chấm này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Day summary stats */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">Tổng số ca:</span>
              <span className="font-black text-slate-900 dark:text-white">
                {selectedDayShifts.length} ca
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">Tổng giờ làm việc:</span>
              <span className="font-black text-amber-700 dark:text-amber-400 font-mono">
                {selectedDayShifts.reduce((s, item) => s + item.hoursWorked, 0)} giờ
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
