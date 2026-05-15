import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getProfile, supabase, supabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = session?.user || null;

  const refreshProfile = useCallback(
    async (targetUser = user) => {
      if (!targetUser || !supabaseConfigured) {
        setProfile(null);
        return null;
      }
      const nextProfile = await getProfile(targetUser.id);
      setProfile(nextProfile);
      return nextProfile;
    },
    [user],
  );

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      if (!supabaseConfigured) {
        if (mounted) setLoading(false);
        return;
      }

      const {
        data: { session: activeSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      setSession(activeSession);

      if (activeSession?.user) {
        try {
          await refreshProfile(activeSession.user);
        } catch {
          setProfile(null);
        }
      }
      setLoading(false);
    }

    loadSession();

    if (!supabaseConfigured) return () => {};

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        try {
          await refreshProfile(nextSession.user);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      refreshProfile,
      signOut,
      supabaseConfigured,
    }),
    [session, user, profile, loading, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
