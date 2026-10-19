import React, { useState, useEffect } from 'react';
import {
  ChatCircleText,
  ShoppingCart,
  ForkKnife,
  CalendarBlank,
  Gear,
} from '@phosphor-icons/react';

export type TabKey = 'messages' | 'groceries' | 'meals' | 'schedule' | 'settings';

interface BottomTabBarProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onChangeTab,
}) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const onResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const diff = window.innerHeight - (vv.height + (vv.offsetTop || 0));
      setIsKeyboardOpen(diff > 80 || (window.innerHeight - vv.height > 80));
    };

    window.visualViewport.addEventListener('resize', onResize);
    window.visualViewport.addEventListener('scroll', onResize);
    window.addEventListener('resize', onResize);
    onResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('scroll', onResize);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const tabs: { key: TabKey; label: string; Icon: React.ComponentType<any> }[] = [
    { key: 'messages', label: 'Messages', Icon: ChatCircleText },
    { key: 'groceries', label: 'Groceries', Icon: ShoppingCart },
    { key: 'meals', label: 'Meals', Icon: ForkKnife },
    { key: 'schedule', label: 'Schedule', Icon: CalendarBlank },
    { key: 'settings', label: 'Settings', Icon: Gear },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Bottom Navigation"
      style={{
        backdropFilter: 'blur(28px) saturate(190%)',
        WebkitBackdropFilter: 'blur(28px) saturate(190%)',
      }}
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#161618]/85 border-t border-black/[0.06] dark:border-white/[0.08] select-none transition-all duration-200 ${
        isKeyboardOpen ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      {/* Comfortable reach with slightly larger icons and labels for mobile */}
      <div className="max-w-md mx-auto grid grid-cols-5 items-center px-2 pt-2.5 pb-6 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
        {tabs.map(({ key, label, Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChangeTab(key)}
              className="flex flex-col items-center justify-center min-h-[46px] w-full cursor-pointer active-press group"
            >
              <Icon
                size={24}
                weight={isActive ? 'fill' : 'regular'}
                className={`transition-colors duration-200 ${
                  isActive ? 'text-[#007AFF] dark:text-[#0A84FF]' : 'text-slate-400 dark:text-slate-500'
                }`}
              />
              <span
                className={`text-[11px] font-medium tracking-tight mt-1 transition-colors duration-200 ${
                  isActive ? 'text-[#007AFF] dark:text-[#0A84FF] font-semibold' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
