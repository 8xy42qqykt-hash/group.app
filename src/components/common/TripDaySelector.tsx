import React, { useState } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';
import { formatDayShort, getDateLabel, getTripDaysList, isToday } from '../../utils/date';

interface TripDaySelectorProps {
  startDate: string;
  endDate: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  daysWithItems?: Set<string>;
}

export const TripDaySelector: React.FC<TripDaySelectorProps> = ({
  startDate,
  endDate,
  selectedDate,
  onSelectDate,
  daysWithItems = new Set(),
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tripDays = getTripDaysList(startDate, endDate);
  const currentLabel = getDateLabel(selectedDate);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[44px] flex items-center gap-1.5 text-base font-semibold text-slate-900 dark:text-slate-100 active-press cursor-pointer"
      >
        <span>{currentLabel}</span>
        <CaretDown
          size={14}
          weight="bold"
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Transparent dismiss backdrop - NO whole-screen blur */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-transparent"
          />

          {/* Dropdown list that blurs ONLY what's directly behind it, with lighter border */}
          <div
            style={{
              backdropFilter: 'blur(30px) saturate(190%)',
              WebkitBackdropFilter: 'blur(30px) saturate(190%)',
              backgroundColor: 'rgba(24, 24, 28, 0.65)',
            }}
            className="absolute left-0 top-full mt-1 z-50 w-56 max-h-72 overflow-y-auto border border-white/[0.12] rounded-[22px] p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.5)]"
          >
            {tripDays.map((day) => {
              const isSelected = day === selectedDate;
              const hasItems = daysWithItems.has(day);
              const label = isToday(day) ? `Today (${formatDayShort(day)})` : formatDayShort(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    onSelectDate(day);
                    setIsOpen(false);
                  }}
                  className={`w-full min-h-[38px] px-3 rounded-[14px] flex items-center justify-between text-xs active-press cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-black/5 dark:bg-white/10 font-semibold text-[#007AFF] dark:text-[#0A84FF]'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{label}</span>
                    {hasItems && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] dark:bg-[#0A84FF]" />
                    )}
                  </div>
                  {isSelected && <Check size={14} weight="bold" className="text-[#007AFF] dark:text-[#0A84FF]" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
