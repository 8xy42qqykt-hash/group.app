import React from 'react';

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  size?: number;
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  className = '',
  size = 22,
}) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`min-w-[44px] min-h-[44px] flex items-center justify-center active-press cursor-pointer bg-transparent select-none ${className}`}
    >
      <div
        className="flex items-center justify-center rounded-full transition-all duration-200"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: checked ? '#3A76F0' : 'transparent',
          boxShadow: checked ? 'none' : 'inset 0 0 0 1.5px rgba(150, 155, 165, 0.45)',
          transform: checked ? 'scale(1)' : 'scale(0.96)',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5 transition-all duration-200"
          style={{
            strokeDasharray: 24,
            strokeDashoffset: checked ? 0 : 24,
            opacity: checked ? 1 : 0,
            transform: checked ? 'scale(1)' : 'scale(0.7)',
          }}
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    </button>
  );
};
