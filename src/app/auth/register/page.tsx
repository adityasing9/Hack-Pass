'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { registerAdminAction } from '@/app/actions/auth';
import { UserPlus, Sparkles, Shield, User, Award, Phone, Hash } from 'lucide-react';
import canvasConfetti from 'canvas-confetti';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Determine role from query param or switch manually
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(searchParams.get('role') === 'admin');
  }, [searchParams]);

  // Auth fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Student specific fields
  const [usn, setUsn] = useState('');
  const [dept, setDept] = useState('');
  const [year, setYear] = useState(1);
  const [phone, setPhone] = useState('');

  // Admin specific fields
  const [adminCode, setAdminCode] = useState('');

  const triggerConfetti = () => {
    canvasConfetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#6F4E37', '#F4B400', '#111111']
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed.');

      const userId = authData.user.id;

      if (isAdmin) {
        // 2a. Admin Registration flow: verify code & insert profile via server action
        const response = await registerAdminAction({
          userId,
          name,
          email,
          adminCode,
        });

        if (!response.success) {
          // If profile enrollment fails, we should sign them out
          await supabase.auth.signOut();
          throw new Error(response.error || 'Failed to enroll administrator credentials.');
        }

        triggerConfetti();
        // Redirect to admin dashboard
        setTimeout(() => {
          router.push('/admin/dashboard');
          router.refresh();
        }, 1500);
      } else {
        // 2b. Student Registration: insert directly via client
        const { error: profileError } = await supabase
          .from('students')
          .insert([
            {
              id: userId,
              usn: usn.toUpperCase().trim(),
              name,
              email,
              dept,
              year: Number(year),
              phone,
            },
          ]);

        if (profileError) {
          // If inserting the profile fails, sign out user
          await supabase.auth.signOut();
          throw profileError;
        }

        triggerConfetti();
        // Redirect to student portal
        setTimeout(() => {
          router.push('/student/home');
          router.refresh();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check inputs.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-screen relative overflow-hidden select-none bg-brand-bg">
      {/* Background blurs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-yellow/10 blur-[80px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-brand-brown/10 blur-[80px]" />

      <div className="w-full max-w-xl z-10 animate-slide-up my-8">
        <div className="glass-panel rounded-3xl p-8 relative">
          {/* Ticket notch cutouts */}
          <div className="absolute top-1/2 left-[-10px] w-5 h-5 rounded-full bg-brand-bg border-r border-brand-brown/5 transform -translate-y-1/2" />
          <div className="absolute top-1/2 right-[-10px] w-5 h-5 rounded-full bg-brand-bg border-l border-brand-brown/5 transform -translate-y-1/2" />

          {/* Toggle buttons for portal roles */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-brand-brown/10">
            <h2 className="text-2xl font-extrabold text-brand-black flex items-center gap-2">
              {isAdmin ? (
                <>
                  <Shield className="w-6 h-6 text-brand-brown" /> Admin Enrollment
                </>
              ) : (
                <>
                  <UserPlus className="w-6 h-6 text-brand-brown" /> Student Signup
                </>
              )}
            </h2>
            <button
              onClick={() => {
                setIsAdmin(!isAdmin);
                setError('');
              }}
              className="text-xs font-bold text-brand-brown hover:text-brand-brown/80 bg-brand-brown/5 px-3 py-1.5 rounded-lg border border-brand-brown/10"
            >
              Switch to {isAdmin ? 'Student' : 'Admin'}
            </button>
          </div>

          {error && (
            <div className="p-4 mb-6 rounded-2xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-sm font-medium animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-brown/65 mb-2 ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-brand-brown/40" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/70 border border-brand-brown/15 rounded-2xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-sm shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-brown/65 mb-2 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="john.doe@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white/70 border border-brand-brown/15 rounded-2xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-sm shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-brown/65 mb-2 ml-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/70 border border-brand-brown/15 rounded-2xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-sm shadow-sm"
                />
              </div>

              {/* Student specific fields */}
              {!isAdmin && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-brown/65 mb-2 ml-1">
                    USN / Roll Number
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-3.5 w-5 h-5 text-brand-brown/40" />
                    <input
                      type="text"
                      required
                      placeholder="1RV21CS001"
                      value={usn}
                      onChange={(e) => setUsn(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/70 border border-brand-brown/15 rounded-2xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-sm shadow-sm"
                    />
                  </div>
                </div>
              )}

              {/* Admin specific field */}
              {isAdmin && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-brown/65 mb-2 ml-1 flex items-center gap-1.5">
                    Admin Registration Code <Sparkles className="w-3.5 h-3.5 text-brand-yellow" />
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter admin verification key"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white/70 border-brand-red/35 border-2 rounded-2xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-sm shadow-sm"
                  />
                </div>
              )}
            </div>

            {/* Student specific blocks */}
            {!isAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-brown/65 mb-2 ml-1">
                    Department
                  </label>
                  <select
                    required
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white/70 border border-brand-brown/15 rounded-2xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-sm shadow-sm"
                  >
                    <option value="">Select Dept</option>
                    <option value="CSE">Computer Science</option>
                    <option value="ISE">Information Science</option>
                    <option value="ECE">Electronics & Communication</option>
                    <option value="EEE">Electrical & Electronics</option>
                    <option value="ME">Mechanical Eng</option>
                    <option value="CE">Civil Eng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-brown/65 mb-2 ml-1">
                    Academic Year
                  </label>
                  <select
                    required
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-4 py-3.5 bg-white/70 border border-brand-brown/15 rounded-2xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-sm shadow-sm"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-brown/65 mb-2 ml-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-5 h-5 text-brand-brown/40" />
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/70 border border-brand-brown/15 rounded-2xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-sm shadow-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-brown hover:bg-brand-brown/95 active:scale-[0.98] text-brand-bg font-bold rounded-2xl shadow-lg hover:shadow-brand-brown/20 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none mt-4"
            >
              {loading ? 'Registering...' : 'Complete Enrollment'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-brand-brown/10 text-center">
            <p className="text-sm text-brand-brown/70 font-medium">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-brand-brown font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bg flex items-center justify-center text-brand-brown font-bold">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
