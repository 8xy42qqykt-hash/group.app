import React, { useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  title?: string;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
}) => {
  const initialDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  if (!isOpen) return null;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayHeaders = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDayClick = (day: number) => {
    const mStr = String(viewMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const fullDate = `${viewYear}-${mStr}-${dStr}`;
    onSelectDate(fullDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed backdrop WITHOUT fullscreen blur so whole screen is not blurred */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/25 transition-opacity duration-200"
      />

      {/* Calendar Modal with local frosted glass blurring only what's behind it, plus lighter border */}
      <div
        style={{
          backdropFilter: 'blur(30px) saturate(190%)',
          WebkitBackdropFilter: 'blur(30px) saturate(190%)',
          backgroundColor: 'rgba(24, 24, 28, 0.65)',
        }}
        className="relative z-10 w-full max-w-xs border border-white/[0.12] rounded-[26px] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {months[viewMonth]} {viewYear}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 active-press cursor-pointer"
            >
              <CaretLeft size={14} weight="bold" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 active-press cursor-pointer"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1.5">
          {dayHeaders.map((dh) => (
            <div key={dh} className="h-5 flex items-center justify-center">
              {dh}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-8" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const mStr = String(viewMonth + 1).padStart(2, '0');
            const dStr = String(day).padStart(2, '0');
            const dateStr = `${viewYear}-${mStr}-${dStr}`;
            const isSelected = selectedDate === dateStr;
            return (
              <button
                key={day}
                type="button"
                onClick={() => handleDayClick(day)}
                className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full font-medium transition-all duration-150 active-press cursor-pointer ${
                  isSelected
                    ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white shadow-sm'
                    : 'text-slate-800 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
