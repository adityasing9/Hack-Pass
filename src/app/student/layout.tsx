'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Home, Calendar, Ticket, User, QrCode, LogOut } from 'lucide-react';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { student, signOut, loading } = useAuth();

  const navItems = [
    { label: 'Home', href: '/student/home', icon: Home },
    { label: 'Events', href: '/student/events', icon: Calendar },
    { label: 'Tickets', href: '/student/tickets', icon: Ticket },
    { label: 'Profile', href: '/student/profile', icon: User },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-brand-bg min-h-screen">
        <div className="w-10 h-10 border-4 border-brand-brown border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-brand-brown/70">Syncing HackPass...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg pb-24 md:pb-6">
      {/* Top Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-brand-brown/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-brown flex items-center justify-center">
            <QrCode className="w-4 h-4 text-brand-bg" />
          </div>
          <span className="font-bold text-lg text-brand-black tracking-tight">HackPass</span>
        </div>
        <div className="flex items-center gap-4">
          {student && (
            <span className="text-xs font-bold bg-brand-brown/10 text-brand-brown px-3 py-1 rounded-full border border-brand-brown/10">
              {student.usn}
            </span>
          )}
          <button
            onClick={signOut}
            title="Sign Out"
            className="text-brand-brown/60 hover:text-brand-red p-1.5 rounded-lg hover:bg-brand-red/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Main Student Portal Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6 md:pt-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-brand-brown/5 px-4 py-2.5 flex justify-around md:max-w-md md:mx-auto md:mb-6 md:rounded-2xl md:border md:shadow-lg">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1.5 px-3 py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-brand-brown font-bold'
                  : 'text-brand-brown/50 hover:text-brand-brown/85'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] uppercase tracking-wider font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
