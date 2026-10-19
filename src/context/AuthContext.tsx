import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isCloudActive } from '../lib/supabase';
import { Profile } from '../types';
import { getRandomProfileColor } from '../utils/colors';

interface AuthContextType {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearZombieAuth = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut({ scope: 'local' });
      }
    } catch {
      // Ignore
    }
    setUser(null);
    setProfile(null);
    try {
      localStorage.removeItem('trip_local_user');
      localStorage.removeItem('trip_local_profile');
      localStorage.removeItem('active_trip_id');
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('auth-token'))) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // Ignore
    }
  };

  async function fetchCloudProfile(userId: string, email?: string) {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setProfile(data as Profile);
      } else if (!error) {
        const fallbackColor = getRandomProfileColor();
        const fallbackName = email?.split('@')[0] || 'User';
        const newProf = {
          id: userId,
          display_name: fallbackName,
          color: fallbackColor,
        };
        const { error: upsertErr } = await supabase.from('profiles').upsert(newProf);
        if (!upsertErr) {
          setProfile(newProf);
        } else {
          const { error: checkErr } = await supabase.auth.getUser();
          if (checkErr) {
            await clearZombieAuth();
          }
        }
      } else {
        console.warn('Error fetching profile:', error);
      }
    } catch (err) {
      console.warn('Failed to load profile:', err);
    }
  }

  // Initialize session with safety timer so first-time load NEVER hangs on blank screen
  useEffect(() => {
    let isMounted = true;

    // Hard fallback: after 1.5 seconds, ALWAYS end loading
    const safetyTimer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 1500);

    async function initAuth() {
      try {
        if (isCloudActive && supabase) {
          try {
            // Race with 1.2s timeout so network hangs never freeze the app
            const getUserPromise = supabase.auth.getUser();
            const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((resolve) =>
              setTimeout(() => resolve({ data: { user: null }, error: new Error('Auth check timeout') }), 1200)
            );

            const { data: userData, error: userError } = await Promise.race([
              getUserPromise,
              timeoutPromise,
            ]);

            if (userError || !userData?.user) {
              await clearZombieAuth();
              if (isMounted) {
                setUser(null);
                setProfile(null);
              }
            } else if (isMounted) {
              setUser({ id: userData.user.id, email: userData.user.email });
              await fetchCloudProfile(userData.user.id, userData.user.email);
            }
          } catch (err) {
            console.warn('Error verifying user:', err);
            await clearZombieAuth();
            if (isMounted) {
              setUser(null);
              setProfile(null);
            }
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;
            if (event === 'SIGNED_OUT' || !session?.user) {
              setUser(null);
              setProfile(null);
              setIsLoading(false);
              return;
            }

            if (session?.user) {
              setUser({ id: session.user.id, email: session.user.email });
              await fetchCloudProfile(session.user.id, session.user.email);
            } else {
              setUser(null);
              setProfile(null);
            }
            setIsLoading(false);
          });

          return () => subscription.unsubscribe();
        } else {
          // Local persistence fallback
          try {
            const localUserStr = localStorage.getItem('trip_local_user');
            const localProfileStr = localStorage.getItem('trip_local_profile');
            if (localUserStr && localProfileStr && isMounted) {
              try {
                setUser(JSON.parse(localUserStr));
                setProfile(JSON.parse(localProfileStr));
              } catch {
                localStorage.removeItem('trip_local_user');
                localStorage.removeItem('trip_local_profile');
              }
            }
          } catch {
            // Ignore storage restriction
          }
        }
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimer);
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    const cleanEmail = email.trim();
    if (isCloudActive && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) {
          return { error: error.message };
        }
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email });
          await fetchCloudProfile(data.user.id, data.user.email);
        }
        return {};
      } catch (err: any) {
        return { error: err?.message || 'Failed to sign in' };
      }
    } else {
      const mockUsersStr = localStorage.getItem('trip_mock_users') || '{}';
      const mockUsers = JSON.parse(mockUsersStr);
      const existing = mockUsers[cleanEmail];
      if (!existing || existing.password !== password) {
        return { error: 'Invalid email or password' };
      }
      const mockUser = { id: existing.id, email: cleanEmail };
      const mockProf: Profile = {
        id: existing.id,
        display_name: existing.display_name,
        color: existing.color,
        avatar_url: existing.avatar_url || null,
      };
      setUser(mockUser);
      setProfile(mockProf);
      localStorage.setItem('trip_local_user', JSON.stringify(mockUser));
      localStorage.setItem('trip_local_profile', JSON.stringify(mockProf));
      return {};
    }
  };

  const signUp = async (email: string, password: string, displayName: string): Promise<{ error?: string }> => {
    const cleanEmail = email.trim();
    const cleanName = displayName.trim() || cleanEmail.split('@')[0];

    if (isCloudActive && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              display_name: cleanName,
            },
          },
        });
        if (error) return { error: error.message };
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email });
          const color = getRandomProfileColor();
          const newProf = {
            id: data.user.id,
            display_name: cleanName,
            color,
          };
          await supabase.from('profiles').upsert(newProf);
          setProfile(newProf);
        }
        return {};
      } catch (err: any) {
        return { error: err?.message || 'Failed to sign up' };
      }
    } else {
      const mockUsersStr = localStorage.getItem('trip_mock_users') || '{}';
      const mockUsers = JSON.parse(mockUsersStr);
      if (mockUsers[cleanEmail]) {
        return { error: 'User already exists with this email' };
      }
      const newId = 'usr_' + Math.random().toString(36).substring(2, 10);
      const existingColors = Object.values(mockUsers).map((u: any) => u.color);
      const color = getRandomProfileColor(existingColors);
      const record = {
        id: newId,
        password,
        display_name: cleanName,
        color,
        avatar_url: null,
      };
      mockUsers[cleanEmail] = record;
      localStorage.setItem('trip_mock_users', JSON.stringify(mockUsers));

      const mockUser = { id: newId, email: cleanEmail };
      const mockProf: Profile = {
        id: newId,
        display_name: cleanName,
        color,
        avatar_url: null,
      };
      setUser(mockUser);
      setProfile(mockProf);
      localStorage.setItem('trip_local_user', JSON.stringify(mockUser));
      localStorage.setItem('trip_local_profile', JSON.stringify(mockProf));
      return {};
    }
  };

  const signOut = async () => {
    await clearZombieAuth();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return;
    const updated = { ...profile, ...updates };
    setProfile(updated);
    if (isCloudActive && supabase) {
      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
    } else {
      localStorage.setItem('trip_local_profile', JSON.stringify(updated));
      const mockUsersStr = localStorage.getItem('trip_mock_users') || '{}';
      const mockUsers = JSON.parse(mockUsersStr);
      if (user.email && mockUsers[user.email]) {
        mockUsers[user.email] = { ...mockUsers[user.email], ...updates };
        localStorage.setItem('trip_mock_users', JSON.stringify(mockUsers));
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
