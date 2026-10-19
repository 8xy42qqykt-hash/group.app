import React from 'react';
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
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#161618]/80 border-t border-black/[0.06] dark:border-white/[0.08] select-none transition-colors"
    >
      {/* Extra empty space under bottom nav buttons for comfortable mobile reach */}
      <div className="max-w-md mx-auto grid grid-cols-5 items-center px-2 pt-2 pb-6 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
        {tabs.map(({ key, label, Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChangeTab(key)}
              className="flex flex-col items-center justify-center min-h-[44px] w-full cursor-pointer active-press group"
            >
              <Icon
                size={22}
                weight={isActive ? 'fill' : 'regular'}
                className={`transition-colors duration-200 ${
                  isActive ? 'text-[#007AFF] dark:text-[#0A84FF]' : 'text-slate-400 dark:text-slate-500'
                }`}
              />
              <span
                className={`text-[10px] font-medium tracking-tight mt-0.5 transition-colors duration-200 ${
                  isActive ? 'text-[#007AFF] dark:text-[#0A84FF] font-semibold' : 'text-slate-500 dark:text-slate-400'
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
