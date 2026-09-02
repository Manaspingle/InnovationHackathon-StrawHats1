import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, Donor, Hospital } from '@/types';

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  donor: Donor | null;
  hospital: Hospital | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [donor, setDonor] = useState<Donor | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUserData(userId: string, userEmail: string) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    setProfile(profileData as Profile | null);

    if (profileData) {
      if (profileData.role === 'individual') {
        const { data: donorData } = await supabase
          .from('donors')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        setDonor(donorData as Donor | null);
      } else if (profileData.role === 'hospital') {
        const { data: hospitalData } = await supabase
          .from('hospitals')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        setHospital(hospitalData as Hospital | null);
      }
    } else {
      // Try to find seed data by email (for demo accounts)
      const { data: donorByEmail } = await supabase
        .from('donors')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();
      if (donorByEmail) {
        setDonor(donorByEmail as Donor);
        return;
      }
      const { data: hospitalByEmail } = await supabase
        .from('hospitals')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();
      if (hospitalByEmail) {
        setHospital(hospitalByEmail as Hospital);
        return;
      }
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserData(session.user.id, session.user.email || '').finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        (async () => {
          await loadUserData(session.user.id, session.user.email || '');
          setLoading(false);
        })();
      } else {
        setProfile(null);
        setDonor(null);
        setHospital(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      // Profile will be created after signup form submits role data
    }
    return { error: null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setDonor(null);
    setHospital(null);
  }

  async function refreshProfile() {
    if (session?.user) {
      await loadUserData(session.user.id, session.user.email || '');
    }
  }

  return (
    <AuthContext.Provider value={{ session, profile, donor, hospital, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
