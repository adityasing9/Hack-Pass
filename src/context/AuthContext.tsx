'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface StudentProfile {
  id: string;
  usn: string;
  name: string;
  email: string;
  dept: string;
  year: number;
  phone: string;
}

interface AdminProfile {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  student: StudentProfile | null;
  admin: AdminProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchProfile = async (currentUser: User) => {
    try {
      // 1. Try to fetch from admins table
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (adminData) {
        setAdmin(adminData);
        setStudent(null);
        return;
      }

      // 2. Try to fetch from students table
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (studentData) {
        setStudent(studentData);
        setAdmin(null);
      } else {
        setStudent(null);
        setAdmin(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const refreshProfile = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      setUser(currentUser);
      await fetchProfile(currentUser);
    } else {
      setUser(null);
      setStudent(null);
      setAdmin(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && mounted) {
        setUser(session.user);
        await fetchProfile(session.user);
      }
      if (mounted) setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            fetchProfile(session.user).finally(() => {
              if (mounted) setLoading(false);
            });
          } else {
            setUser(null);
            setStudent(null);
            setAdmin(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setStudent(null);
    setAdmin(null);
    setLoading(false);
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, student, admin, loading, signOut, refreshProfile }}>
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
