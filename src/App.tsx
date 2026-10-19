import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TripProvider, useTrip } from './context/TripContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { TripGate } from './components/trip/TripGate';
import { BottomTabBar, TabKey } from './components/navigation/BottomTabBar';
import { MessagesView } from './components/messages/MessagesView';
import { GroceriesView } from './components/groceries/GroceriesView';
import { MealsView } from './components/meals/MealsView';
import { ScheduleView } from './components/schedule/ScheduleView';
import { SettingsView } from './components/settings/SettingsView';

const MainAppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { currentTrip } = useTrip();
  const [activeTab, setActiveTab] = useState<TabKey>('messages');
  const [isForcedReady, setIsForcedReady] = useState(false);

  // Maximum splash timeout of 1.2s to guarantee first-time visitor never hangs
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsForcedReady(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Always reset to messages view whenever a trip opens
  useEffect(() => {
    if (currentTrip?.id) {
      setActiveTab('messages');
    }
  }, [currentTrip?.id]);

  // Splash screen until session resolves (capped by safety timeout)
  if (isLoading && !isForcedReady) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black">
        <div className="w-10 h-10 rounded-[18px] bg-[#0A84FF] flex items-center justify-center animate-pulse" />
      </div>
    );
  }

  // Not signed in: Auth screen
  if (!user) {
    return <AuthScreen />;
  }

  // Signed in but no active trip selected: Trip Gate
  if (!currentTrip) {
    return <TripGate />;
  }

  // Active trip: Main tabs layout with bottom tab bar
  return (
    <div className="h-screen w-full flex flex-col bg-black text-white overflow-hidden select-none">
      <main className="flex-1 w-full overflow-hidden pb-24">
        {activeTab === 'messages' && <MessagesView />}
        {activeTab === 'groceries' && <GroceriesView />}
        {activeTab === 'meals' && <MealsView />}
        {activeTab === 'schedule' && <ScheduleView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      <BottomTabBar activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TripProvider>
          <MainAppContent />
        </TripProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
