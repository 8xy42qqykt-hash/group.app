import React, { useState, useRef } from 'react';
import { CaretLeft } from '@phosphor-icons/react';
import { useTrip } from '../../context/TripContext';

interface CollapsingHeaderLayoutProps {
  title: string;
  topBarLeft?: React.ReactNode;
  topBarRight?: React.ReactNode;
  headerSubContent?: React.ReactNode;
  children: React.ReactNode;
  showBackButton?: boolean;
}

export const CollapsingHeaderLayout: React.FC<CollapsingHeaderLayoutProps> = ({
  title,
  topBarLeft,
  topBarRight,
  headerSubContent,
  children,
  showBackButton = true,
}) => {
  const { exitTrip } = useTrip();
  const [isScrolled, setIsScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const st = e.currentTarget.scrollTop;
    if (st > 35 && !isScrolled) {
      setIsScrolled(true);
    } else if (st <= 35 && isScrolled) {
      setIsScrolled(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full w-full max-w-md mx-auto bg-[#f2f2f7] dark:bg-black overflow-hidden select-none">
      {/* Translucent blurred sticky/fixed top bar */}
      <header
        style={{
          backdropFilter: isScrolled ? 'blur(24px) saturate(180%)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(24px) saturate(180%)' : 'none',
        }}
        className={`shrink-0 h-12 pt-safe px-3 flex items-center justify-between z-20 transition-all duration-200 ${
          isScrolled
            ? 'bg-white/75 dark:bg-[#1c1c1e]/75 border-b border-black/[0.06] dark:border-white/[0.08]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="w-20 flex items-center">
          {topBarLeft ? (
            topBarLeft
          ) : showBackButton ? (
            <button
              type="button"
              onClick={exitTrip}
              className="flex items-center gap-0.5 text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF] active-press cursor-pointer py-1 pr-1 -ml-1"
              title="Exit to My Trips"
            >
              <CaretLeft size={16} weight="bold" />
              <span>Trips</span>
            </button>
          ) : null}
        </div>

        {/* Centered Small Title, revealed on scroll */}
        <h2
          className={`text-sm font-semibold text-slate-900 dark:text-white transition-all duration-200 truncate ${
            isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1.5 pointer-events-none'
          }`}
        >
          {title}
        </h2>

        <div className="w-20 flex items-center justify-end">
          {topBarRight}
        </div>
      </header>

      {/* Main scroll area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 w-full overflow-y-auto overflow-x-hidden"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Large Title Section at top of content with generous Apple-style padding */}
        <div className="px-4 pt-3 pb-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          {headerSubContent && <div className="mt-1.5">{headerSubContent}</div>}
        </div>

        {/* Content with comfortable clearance above bottom nav bar on mobile */}
        <div className="px-4 pb-28 pb-[max(7rem,calc(env(safe-area-inset-bottom)+5.5rem))]">
          {children}
        </div>
      </div>
    </div>
  );
};
