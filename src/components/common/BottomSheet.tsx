import React, { useEffect, useRef, useState } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  const [translateY, setTranslateY] = useState(0);
  const startYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTranslateY(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    startYRef.current = e.clientY;
    isDraggingRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const delta = e.clientY - startYRef.current;
    if (delta > 0) {
      setTranslateY(delta);
    }
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (translateY > 80) {
      onClose();
    } else {
      setTranslateY(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end select-none">
      {/* Dimmed backdrop - NO backdrop-blur here so the sheet panel can directly blur everything behind it */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/45 transition-opacity duration-200 ease-out"
      />

      {/* Sheet Content: Frosted Glass panel that blurs everything behind it */}
      <div
        role="dialog"
        aria-modal="true"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translateY(${translateY}px)`,
          transition: isDraggingRef.current ? 'none' : 'transform 260ms cubic-bezier(0.175, 0.885, 0.32, 1.1)',
          backdropFilter: 'blur(32px) saturate(190%)',
          WebkitBackdropFilter: 'blur(32px) saturate(190%)',
          backgroundColor: 'rgba(22, 22, 26, 0.65)',
        }}
        className="relative z-10 w-full max-w-lg mx-auto border-t border-white/[0.12] rounded-t-[28px] pt-3 px-5 pb-8 pb-[max(2.25rem,env(safe-area-inset-bottom))] shadow-[0_-16px_48px_rgba(0,0,0,0.6)]"
      >
        {/* Grabber */}
        <div className="w-10 h-1.5 bg-white/20 rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing" />
        <div onPointerDown={(e) => e.stopPropagation()} className="pb-1">
          {children}
        </div>
      </div>
    </div>
  );
};
