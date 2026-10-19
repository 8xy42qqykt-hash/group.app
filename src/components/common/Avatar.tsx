import React from 'react';

interface AvatarProps {
  name?: string;
  avatarUrl?: string | null;
  color?: string;
  size?: number;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name = 'User',
  avatarUrl,
  color = '#3A76F0',
  size = 32,
  className = '',
}) => {
  const initial = (name || 'U').charAt(0).toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className={`rounded-full object-cover shrink-0 select-none ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`rounded-full flex items-center justify-center font-medium text-white shrink-0 select-none ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        fontSize: `${Math.round(size * 0.42)}px`,
      }}
    >
      {initial}
    </div>
  );
};
