import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

type AppRole = Database['public']['Enums']['app_role'];

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string, referralCode?: string, phone?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleData) {
        setRole(roleData.role);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // Session refresh mechanism
  const refreshSession = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) return;

      const expiresAt = currentSession.expires_at;
      if (expiresAt) {
        const expiryTime = expiresAt * 1000;
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;

        // If less than 5 minutes until expiry, refresh
        if (timeUntilExpiry < 5 * 60 * 1000) {
          await supabase.auth.refreshSession();
        }
      }
    } catch (err) {
      console.error('Session refresh failed:', err);
    }
  };

  useEffect(() => {
    // Handle OAuth error hashes (e.g. #error=invalid_request&error_description=...)
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const error = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');
      if (error) {
        console.error('OAuth error:', error, errorDescription);
        const decodedDesc = errorDescription ? decodeURIComponent(errorDescription) : 'Sign-in failed. Please try again.';
        // Store error message so the login page can display it
        sessionStorage.setItem('oauth_error', decodedDesc);
        // Navigate properly to /login (full page navigation so React Router picks it up)
        window.location.href = '/login';
        return;
      }
    }

    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
          setRole(null);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setRole(null);
        }

        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setIsLoading(false);
    });

    // Set up session refresh interval (every 10 minutes)
    const refreshInterval = setInterval(refreshSession, 10 * 60 * 1000);

    // Refresh session when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Refresh session when window gains focus
    const handleFocus = () => refreshSession();
    window.addEventListener('focus', handleFocus);

    // Handle deep links for OAuth callback in native apps
    let appUrlHandle: Awaited<ReturnType<typeof App.addListener>> | null = null;
    
    const setupNativeDeepLinks = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          appUrlHandle = await App.addListener('appUrlOpen', async (event) => {
            // Handle OAuth tokens from deep link URLs
            try {
              const url = new URL(event.url);
              const hashParams = new URLSearchParams(url.hash.substring(1));
              const accessToken = hashParams.get('access_token');
              const refreshToken = hashParams.get('refresh_token');

              if (accessToken && refreshToken) {
                await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });
              }
            } catch (err) {
              console.error('Deep link auth handling error:', err);
            }
          });
        }
      } catch {
        // Not in native platform, skip
      }
    };

    setupNativeDeepLinks();

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      appUrlHandle?.remove().catch(() => {});
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, referralCode?: string, phone?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
            referral_code: referralCode,
            phone: phone,
          },
        },
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
  };

  const value = {
    user,
    session,
    profile,
    role,
    isLoading,
    isAdmin: role === 'admin',
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
