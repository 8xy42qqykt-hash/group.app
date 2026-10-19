import React from 'react';

interface CustomToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  label?: string;
}

export const CustomToggle: React.FC<CustomToggleProps> = ({
  checked,
  onChange,
  className = '',
  label,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`min-h-[44px] flex items-center justify-between gap-4 cursor-pointer active-press bg-transparent select-none ${className}`}
    >
      {label && (
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {label}
        </span>
      )}
      <div
        className="w-11 h-6 rounded-full relative transition-colors duration-200 flex items-center px-0.5"
        style={{
          backgroundColor: checked ? '#3A76F0' : 'rgba(150, 155, 165, 0.25)',
        }}
      >
        <div
          className="w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{
            transform: checked ? 'translateX(20px)' : 'translateX(0px)',
          }}
        />
      </div>
    </button>
  );
};
