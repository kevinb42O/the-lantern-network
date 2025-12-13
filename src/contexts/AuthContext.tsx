import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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

// localStorage keys for session persistence
const STORAGE_KEYS = {
  CACHED_PROFILE: 'lantern_cached_profile',
  HAS_COMPLETED_ONBOARDING: 'lantern_has_completed_onboarding',
} as const;

// Helper functions for localStorage with error handling
const getStoredProfile = (): Profile | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CACHED_PROFILE);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const setStoredProfile = (profile: Profile | null): void => {
  try {
    if (profile) {
      localStorage.setItem(STORAGE_KEYS.CACHED_PROFILE, JSON.stringify(profile));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CACHED_PROFILE);
    }
  } catch {
    // Ignore storage errors
  }
};

const getHasCompletedOnboarding = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING) === 'true';
  } catch {
    return false;
  }
};

const setHasCompletedOnboarding = (value: boolean): void => {
  try {
    if (value) {
      localStorage.setItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING);
    }
  } catch {
    // Ignore storage errors
  }
};

const clearAllStoredData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CACHED_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING);
  } catch {
    // Ignore storage errors
  }
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  hasCompletedOnboarding: boolean;
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
  // Initialize profile from cache for faster startup
  const [profile, setProfile] = useState<Profile | null>(() => getStoredProfile());
  const [loading, setLoading] = useState(isSupabaseConfigured); // Only loading if Supabase is configured
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState<boolean>(() => getHasCompletedOnboarding());
  
  // Track if we're currently refreshing in the background
  const isBackgroundRefreshRef = useRef(false);
  // Use ref to track current user for visibility change handler to avoid circular dependency
  const userRef = useRef<User | null>(null);
  
  // Keep userRef in sync with user state
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Update profile state and cache
  const updateProfileState = useCallback((newProfile: Profile | null, isNewUser = false) => {
    setProfile(newProfile);
    setStoredProfile(newProfile);
    
    // If we have a profile, mark onboarding as completed
    if (newProfile) {
      setHasCompletedOnboardingState(true);
      setHasCompletedOnboarding(true);
    } else if (isNewUser) {
      // Only clear onboarding flag for truly new users (explicit sign out or no profile on first load)
      setHasCompletedOnboardingState(false);
      setHasCompletedOnboarding(false);
    }
    // If newProfile is null but not a new user, preserve the hasCompletedOnboarding flag
  }, []);

  // Fetch user profile with timeout and sync admin status
  const fetchProfile = useCallback(async (userId: string, userEmail?: string, isBackgroundRefresh = false): Promise<Profile | null> => {
    if (!isSupabaseConfigured) return null;
    
    console.log('Fetching profile for user:', userId, isBackgroundRefresh ? '(background refresh)' : '');
    
    // Get cached profile to use as fallback
    const cachedProfile = getStoredProfile();
    
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
      });

      // Create the fetch promise for profile
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

      // Also fetch supporter badge
      const supporterBadgePromise = supabase
        .from('supporter_badges')
        .select('badge_type')
        .eq('user_id', userId)
        .single()
        .then(({ data }) => data?.badge_type || null);

      // Race between fetch and timeout
      const [fetchedProfile, supporterBadge] = await Promise.all([
        Promise.race([fetchPromise, timeoutPromise]),
        supporterBadgePromise.catch((error) => {
          // Not having a supporter badge is normal - only log unexpected errors
          if (error?.code !== 'PGRST116') { // PGRST116 = no rows found
            console.warn('Failed to fetch supporter badge:', error);
          }
          return null;
        })
      ]);
      
      console.log('Profile fetched:', fetchedProfile ? 'found' : 'not found');
      
      // Add supporter badge to profile
      if (fetchedProfile) {
        fetchedProfile.supporter_badge = supporterBadge;
      }
      
      // Sync admin status if user email matches an admin email
      if (fetchedProfile && userEmail) {
        const isAdminEmail = ADMIN_EMAILS.some(email => 
          email.toLowerCase() === userEmail.toLowerCase()
        );
        
        // If user is an admin by email but profile doesn't have is_admin set
        if (isAdminEmail && !fetchedProfile.is_admin) {
          console.log('Syncing admin status for:', userEmail);
          
          // Set admin status optimistically to unblock profile loading
          fetchedProfile.is_admin = true;
          
          // Fire-and-forget database update with timeout protection
          // This runs in the background and won't block profile loading
          Promise.race([
            supabase
              .from('profiles')
              .update({ is_admin: true })
              .eq('user_id', userId),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Admin sync timeout')), 3000)
            )
          ]).catch((error) => {
            // Log errors but don't block - optimistic update already applied
            console.error('Error syncing admin status (non-blocking):', error);
          });
        }
      }
      
      updateProfileState(fetchedProfile);
      return fetchedProfile;
    } catch (err) {
      console.error('Profile fetch error:', err);
      
      // On timeout/error during background refresh, keep the cached profile
      // On timeout/error during foreground fetch, use cached profile if we have completed onboarding
      if (cachedProfile && (isBackgroundRefresh || getHasCompletedOnboarding())) {
        console.log('Using cached profile due to fetch error');
        setProfile(cachedProfile);
        return cachedProfile;
      }
      
      // Only set profile to null if we don't have cached data AND haven't completed onboarding
      // This prevents showing ProfileSetup for existing users
      if (!getHasCompletedOnboarding()) {
        setProfile(null);
      }
      return cachedProfile;
    }
  }, [updateProfileState]);

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
        // Mark as background refresh for TOKEN_REFRESHED events to preserve cached data
        const isBackground = event === 'TOKEN_REFRESHED';
        await fetchProfile(session.user.id, session.user.email, isBackground);
      } else {
        // User signed out - clear profile and stored data
        updateProfileState(null, true);
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    // Listen for visibility changes to handle app resume from background
    const handleVisibilityChange = async () => {
      const currentUser = userRef.current;
      if (document.visibilityState === 'visible' && currentUser && !isBackgroundRefreshRef.current) {
        console.log('App resumed from background, refreshing profile...');
        isBackgroundRefreshRef.current = true;
        try {
          await fetchProfile(currentUser.id, currentUser.email, true);
        } finally {
          isBackgroundRefreshRef.current = false;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchProfile, updateProfileState]);

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
    // Clear all cached data on explicit sign out
    clearAllStoredData();
    setProfile(null);
    setHasCompletedOnboardingState(false);
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
    hasCompletedOnboarding,
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
