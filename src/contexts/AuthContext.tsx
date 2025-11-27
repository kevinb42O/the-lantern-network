import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/database.types';

// Check if Supabase is properly configured
const isSupabaseConfigured = 
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

/**
 * Admin emails - users with these emails will have is_admin set to true in their profile.
 * This enables RLS policies that require admin status for certain operations.
 * Note: This list should match the ADMIN_EMAILS in App.tsx for consistent behavior.
 * For production, consider moving to environment variables or a secure database table.
 */
const ADMIN_EMAILS = [
  'kevinb42O@hotmail.com',
];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured); // Only loading if Supabase is configured

  // Fetch user profile with timeout and sync admin status
  const fetchProfile = async (userId: string, userEmail?: string): Promise<Profile | null> => {
    if (!isSupabaseConfigured) return null;
    
    console.log('Fetching profile for user:', userId);
    
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
      });

      // Create the fetch promise
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching profile:', error);
            return null;
          }
          return data && data.length > 0 ? data[0] : null;
        });

      // Race between fetch and timeout
      const fetchedProfile = await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log('Profile fetched:', fetchedProfile ? 'found' : 'not found');
      
      // Sync admin status if user email matches an admin email
      if (fetchedProfile && userEmail) {
        const isAdminEmail = ADMIN_EMAILS.some(email => 
          email.toLowerCase() === userEmail.toLowerCase()
        );
        
        // If user is an admin by email but profile doesn't have is_admin set
        if (isAdminEmail && !fetchedProfile.is_admin) {
          console.log('Syncing admin status for:', userEmail);
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_admin: true })
            .eq('user_id', userId);
          
          if (!updateError) {
            fetchedProfile.is_admin = true;
          } else {
            console.error('Error syncing admin status:', updateError);
          }
        }
      }
      
      setProfile(fetchedProfile);
      return fetchedProfile;
    } catch (err) {
      console.error('Profile fetch error:', err);
      // On timeout, set profile to null and continue - user will see profile setup
      setProfile(null);
      return null;
    }
  };

  // Initialize auth state - only if Supabase is configured
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Get initial session - no timeout, just let it complete
    const initAuth = async () => {
      try {
        console.log('Getting session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
        }
        
        if (!isMounted) return;
        
        console.log('Session:', session ? 'exists' : 'none');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email);
        }
        
        if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error getting session:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (!error) {
      await fetchProfile(user.id, user.email);
    }

    return { error: error ? new Error(error.message) : null };
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signInWithOtp,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
