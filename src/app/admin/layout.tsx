'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Calendar, QrCode, ClipboardList, Users, Ticket, BarChart3, Settings, Menu, X, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { admin, signOut, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Events', href: '/admin/events', icon: Calendar },
    { label: 'Attendance', href: '/admin/attendance', icon: ClipboardList },
    { label: 'Students', href: '/admin/students', icon: Users },
    { label: 'Tickets', href: '/admin/tickets', icon: Ticket },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-brand-bg min-h-screen">
        <div className="w-10 h-10 border-4 border-brand-brown border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-brand-brown/70">Syncing Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-brand-bg text-brand-black font-sans">
      {/* Mobile Sidebar Toggle Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-brand-brown/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-brown flex items-center justify-center">
            <QrCode className="w-4 h-4 text-brand-bg" />
          </div>
          <span className="font-extrabold text-brand-black text-base tracking-tight">HackPass <span className="text-brand-brown text-xs font-bold bg-brand-brown/10 px-2 py-0.5 rounded ml-1">Admin</span></span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-brand-brown p-1.5 rounded-lg hover:bg-brand-brown/5 border border-brand-brown/10 transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-md border-r border-brand-brown/10 p-6 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-brown flex items-center justify-center shadow-md">
              <QrCode className="w-5 h-5 text-brand-bg" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-brand-black tracking-tight block">HackPass</span>
              <span className="text-[10px] font-bold text-brand-brown uppercase tracking-widest block -mt-1">Control Panel</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3.5 px-4.5 py-3 rounded-xl transition-all text-sm font-bold ${
                    isActive
                      ? 'bg-brand-brown text-brand-bg shadow-md shadow-brand-brown/10'
                      : 'text-brand-brown/70 hover:text-brand-brown hover:bg-brand-brown/5'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Meta Profile */}
        <div className="space-y-4 pt-6 border-t border-brand-brown/5">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-brand-yellow/10 flex items-center justify-center text-brand-brown border border-brand-yellow/20 shrink-0 font-bold text-sm">
              AD
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-brand-black truncate">{admin?.name}</p>
              <p className="text-[10px] font-semibold text-brand-brown/50 truncate">{admin?.email}</p>
            </div>
          </div>
          
          {/* Quick gatekeeper link */}
          <Link
            href="/scanner"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-yellow hover:bg-brand-yellow/95 text-brand-black font-extrabold rounded-xl text-xs transition-all shadow-md shadow-brand-yellow/10"
          >
            <QrCode className="w-4 h-4" /> Gatekeeper Scanner
          </Link>

          <button
            onClick={signOut}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-red/10 hover:bg-brand-red/20 text-brand-red font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out Panel
          </button>
        </div>
      </aside>

      {/* Main Admin Dashboard Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden pt-20 lg:pt-0">
        <main className="flex-1 p-6 md:p-8 lg:p-10 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Overlay to click off mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-45 bg-brand-black/20 backdrop-blur-xs"
        />
      )}
    </div>
  );
}
