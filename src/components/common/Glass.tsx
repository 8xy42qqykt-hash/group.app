import React from 'react';

interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'floating' | 'card' | 'sheet';
  children: React.ReactNode;
  className?: string;
}

export const Glass: React.FC<GlassProps> = ({
  variant = 'surface',
  children,
  className = '',
  style,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'floating':
        return 'glass-floating rounded-[24px]';
      case 'card':
        return 'glass-card rounded-[20px]';
      case 'sheet':
        return 'glass-surface rounded-t-[28px]';
      case 'surface':
      default:
        return 'glass-surface';
    }
  };

  return (
    <div
      className={`${getVariantStyles()} ${className}`}
      style={{
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};
