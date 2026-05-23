'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Lock, Mail, QrCode, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (data.user) {
        // Double check roles
        if (role === 'admin') {
          const { data: adminData } = await supabase
            .from('admins')
            .select('id')
            .eq('id', data.user.id)
            .single();

          if (!adminData) {
            await supabase.auth.signOut();
            setError('Access denied. You do not have administrator permissions.');
            setLoading(false);
            return;
          }
          router.push('/admin/dashboard');
        } else {
          const { data: studentData } = await supabase
            .from('students')
            .select('id')
            .eq('id', data.user.id)
            .single();

          if (!studentData) {
            // Logged in but profile incomplete (redirect to complete registration)
            router.push('/auth/register');
            return;
          }
          router.push('/student/home');
        }
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-screen relative overflow-hidden select-none bg-brand-bg">
      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-yellow/10 blur-[80px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-brand-brown/10 blur-[80px]" />

      <div className="w-full max-w-md z-10 animate-slide-up">
        {/* Logo and Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-brown flex items-center justify-center shadow-lg border border-white/20 mb-4 transform hover:rotate-12 transition-transform duration-300">
            <QrCode className="w-8 h-8 text-brand-bg" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-brand-black flex items-center gap-2">
            Hack<span className="text-brand-brown">Pass</span>
          </h1>
          <p className="text-sm text-brand-brown/70 font-medium mt-1">Smart Event Gatekeeping & Tickets</p>
        </div>

        {/* Auth Glass Card */}
        <div className="glass-panel rounded-3xl p-8 relative">
          {/* Decorative ticket notch on card edges */}
          <div className="absolute top-1/2 left-[-10px] w-5 h-5 rounded-full bg-brand-bg border-r border-brand-brown/5 transform -translate-y-1/2" />
          <div className="absolute top-1/2 right-[-10px] w-5 h-5 rounded-full bg-brand-bg border-l border-brand-brown/5 transform -translate-y-1/2" />

          {/* Role Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-brand-brown/5 rounded-2xl mb-8 border border-brand-brown/10">
            <button
              onClick={() => { setRole('student'); setError(''); }}
              className={`py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                role === 'student'
                  ? 'bg-brand-brown text-brand-bg shadow-md'
                  : 'text-brand-brown/70 hover:text-brand-brown hover:bg-brand-brown/5'
              }`}
            >
              Student Portal
            </button>
            <button
              onClick={() => { setRole('admin'); setError(''); }}
              className={`py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                role === 'admin'
                  ? 'bg-brand-brown text-brand-bg shadow-md'
                  : 'text-brand-brown/70 hover:text-brand-brown hover:bg-brand-brown/5'
              }`}
            >
              Admin Dashboard
            </button>
          </div>

          <h2 className="text-2xl font-bold mb-6 text-brand-black flex items-center gap-2">
            Sign In <Sparkles className="w-5 h-5 text-brand-yellow" />
          </h2>

          {error && (
            <div className="p-4 mb-6 rounded-2xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-sm font-medium animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-brown/65 mb-2 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-brand-brown/40" />
                <input
                  type="email"
                  required
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/70 border border-brand-brown/15 rounded-2xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-sm shadow-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-brown/65">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-brand-brown/40" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/70 border border-brand-brown/15 rounded-2xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-sm shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-brown hover:bg-brand-brown/95 active:scale-[0.98] text-brand-bg font-bold rounded-2xl shadow-lg hover:shadow-brand-brown/20 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Verifying...' : 'Authenticate'}
            </button>
          </form>

          {role === 'student' && (
            <div className="mt-8 pt-6 border-t border-brand-brown/10 text-center">
              <p className="text-sm text-brand-brown/70 font-medium">
                New to HackPass?{' '}
                <Link href="/auth/register" className="text-brand-brown font-bold hover:underline">
                  Create student account
                </Link>
              </p>
            </div>
          )}

          {role === 'admin' && (
            <div className="mt-8 pt-6 border-t border-brand-brown/10 text-center">
              <p className="text-sm text-brand-brown/70 font-medium">
                Authorized administrator?{' '}
                <Link href="/auth/register?role=admin" className="text-brand-brown font-bold hover:underline">
                  Enroll admin key
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
