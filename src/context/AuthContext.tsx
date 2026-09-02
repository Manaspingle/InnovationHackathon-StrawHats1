import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { mockDonors, mockHospitals } from '@/lib/mockData';
import type { Profile, Donor, Hospital } from '@/types';

interface AuthContextType {
  session: User | null;
  profile: Profile | null;
  donor: Donor | null;
  hospital: Hospital | null;
  loading: boolean;
  signUp: (email: string, password: string, role: 'individual' | 'hospital', data: any) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [donor, setDonor] = useState<Donor | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUserData(user: User) {
    try {
      // First try to find in mock data
      const mockDonor = mockDonors.find(d => d.email === user.email);
      if (mockDonor) {
        setDonor(mockDonor);
        setProfile({
          id: user.uid,
          user_id: user.uid,
          role: 'individual',
          email: user.email || '',
          created_at: new Date().toISOString(),
        });
        return;
      }

      const mockHospital = mockHospitals.find(h => h.email === user.email);
      if (mockHospital) {
        setHospital(mockHospital);
        setProfile({
          id: user.uid,
          user_id: user.uid,
          role: 'hospital',
          email: user.email || '',
          created_at: new Date().toISOString(),
        });
        return;
      }

      // Try to query Firestore
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('user_id', '==', user.uid));
      const profileSnap = await getDocs(q);

      if (!profileSnap.empty) {
        const profileData = profileSnap.docs[0].data() as Profile;
        setProfile(profileData);

        if (profileData.role === 'individual') {
          const donorsRef = collection(db, 'donors');
          const donorQuery = query(donorsRef, where('user_id', '==', user.uid));
          const donorSnap = await getDocs(donorQuery);
          if (!donorSnap.empty) {
            setDonor(donorSnap.docs[0].data() as Donor);
          }
        } else if (profileData.role === 'hospital') {
          const hospitalsRef = collection(db, 'hospitals');
          const hospitalQuery = query(hospitalsRef, where('user_id', '==', user.uid));
          const hospitalSnap = await getDocs(hospitalQuery);
          if (!hospitalSnap.empty) {
            setHospital(hospitalSnap.docs[0].data() as Hospital);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setSession(user);
      if (user) {
        await loadUserData(user);
      } else {
        setProfile(null);
        setDonor(null);
        setHospital(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function signUp(email: string, password: string, role: 'individual' | 'hospital', data: any) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create profile document
      const profilesRef = collection(db, 'profiles');
      await addDoc(profilesRef, {
        user_id: user.uid,
        email: user.email,
        role: role,
        created_at: Timestamp.now(),
      } as Profile);

      // Create donor or hospital document
      if (role === 'individual') {
        const donorsRef = collection(db, 'donors');
        await addDoc(donorsRef, {
          user_id: user.uid,
          email: user.email,
          ...data,
          created_at: Timestamp.now(),
        } as Donor);
      } else if (role === 'hospital') {
        const hospitalsRef = collection(db, 'hospitals');
        await addDoc(hospitalsRef, {
          user_id: user.uid,
          email: user.email,
          ...data,
          created_at: Timestamp.now(),
        } as Hospital);
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async function signIn(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async function signOut() {
    try {
      await firebaseSignOut(auth);
      setProfile(null);
      setDonor(null);
      setHospital(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
    }
  }

  async function refreshProfile() {
    if (session) {
      await loadUserData(session);
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
