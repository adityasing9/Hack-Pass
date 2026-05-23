'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { QrCode, Smartphone, Sparkles, Calendar, Zap, Shield, ArrowRight, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LandingPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // 1. Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 2. Fetch some published events to showcase
    const fetchEvents = async () => {
      try {
        const { data } = await supabase
          .from('events')
          .select('*')
          .eq('published', true)
          .order('start_time', { ascending: true })
          .limit(3);
        if (data) setEvents(data);
      } catch (err) {
        console.error('Error fetching showcase events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg relative overflow-x-hidden">
      {/* Background radial effects */}
      <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] rounded-full bg-brand-brown/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-brand-yellow/5 blur-[100px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-brand-brown/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-brand-brown flex items-center justify-center shadow-md">
              <QrCode className="w-5 h-5 text-brand-bg" />
            </div>
            <span className="text-xl font-bold text-brand-black tracking-tight">
              Hack<span className="text-brand-brown">Pass</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="px-5 py-2.5 text-sm font-bold text-brand-brown hover:bg-brand-brown/5 rounded-xl border border-brand-brown/15 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="px-5 py-2.5 text-sm font-bold bg-brand-brown hover:bg-brand-brown/95 text-brand-bg shadow-md rounded-xl transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-1">
        <div className="space-y-8 animate-slide-up">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 text-xs font-bold text-brand-brown">
            <Sparkles className="w-3.5 h-3.5 text-brand-yellow" /> Re-imagining Campus Event Attendance
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-brand-black leading-tight">
            The Smart, Instant <br />
            <span className="text-brand-brown bg-gradient-to-r from-brand-brown to-brand-brown/85 bg-clip-text">
              Gatekeeping Ticket
            </span>
          </h1>

          <p className="text-lg text-brand-brown/70 leading-relaxed font-medium">
            Register for college hackathons and conferences, add ticket passes straight to your Google Wallet, and log entry & exit times smoothly via dynamic QR code scanners.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-brand-brown hover:bg-brand-brown/95 text-brand-bg font-bold rounded-2xl shadow-xl hover:shadow-brand-brown/20 transition-all text-base flex items-center gap-2 group"
            >
              Create Account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="px-8 py-4 bg-brand-yellow text-brand-black font-bold rounded-2xl shadow-xl hover:shadow-brand-yellow/20 hover:bg-brand-yellow/95 transition-all text-base flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-5 h-5 animate-bounce" /> Install App
              </button>
            )}
          </div>
        </div>

        {/* Hero Visual: Ticket Stack */}
        <div className="relative flex justify-center lg:justify-end animate-fade-in">
          <div className="w-full max-w-[400px] ticket p-8 bg-white/80 border border-white/40 shadow-2xl rotate-3 transform hover:rotate-0 transition-transform duration-500">
            {/* Header info */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-brown/50">Official Ticket</span>
                <h3 className="text-xl font-bold text-brand-black mt-0.5">National Hackathon</h3>
              </div>
              <div className="px-2.5 py-1 rounded bg-brand-yellow/20 border border-brand-yellow/20 text-[10px] font-bold text-brand-brown">
                ACTIVE
              </div>
            </div>

            {/* Visual QR mock */}
            <div className="bg-brand-bg rounded-2xl p-6 flex flex-col items-center justify-center border border-brand-brown/5 mb-6">
              <div className="w-40 h-40 border-4 border-brand-brown/20 rounded-xl flex items-center justify-center p-3 bg-white shadow-inner">
                <QrCode className="w-full h-full text-brand-brown animate-pulse-slow" />
              </div>
              <span className="text-[11px] font-mono font-bold text-brand-brown/60 tracking-wider mt-3">HACK-2026-USN01</span>
            </div>

            <div className="ticket-divider" />

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-brown/40">Student USN</span>
                <p className="text-sm font-bold text-brand-black mt-0.5">1RV21CS085</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-brown/40">Attendance</span>
                <p className="text-sm font-bold text-brand-brown mt-0.5">92.5% (Present)</p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-brand-brown/5 flex items-center justify-center">
              {/* Google Wallet badge mockup */}
              <div className="px-6 py-2.5 bg-black text-white font-medium text-xs rounded-xl flex items-center gap-2 shadow-md">
                <Smartphone className="w-4 h-4 text-brand-yellow" /> Add to Google Wallet
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white/40 py-20 border-y border-brand-brown/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-extrabold text-brand-black">Packed with Premium Features</h2>
            <p className="text-sm text-brand-brown/70 font-medium leading-relaxed">
              Designed for colleges, engineered for speed. HackPass handles attendance tracking automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-card rounded-2xl p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-brown/10 flex items-center justify-center text-brand-brown">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-black">Instant QR Check-ins</h3>
              <p className="text-sm text-brand-brown/70 leading-relaxed font-medium">
                Fast entry, exit, and re-entry scans. High speed verification prompts that gatekeepers can run straight from a browser.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card rounded-2xl p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-brown/10 flex items-center justify-center text-brand-brown">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-black">Google Wallet Cards</h3>
              <p className="text-sm text-brand-brown/70 leading-relaxed font-medium">
                Add tickets to your phone's digital wallet. Live metrics dynamically update attendance percentages on the card.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card rounded-2xl p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-brown/10 flex items-center justify-center text-brand-brown">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-black">PWA Offline Mode</h3>
              <p className="text-sm text-brand-brown/70 leading-relaxed font-medium">
                Install as a mobile app. View your tickets, registered events, and offline QR codes even with zero signal inside college halls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Events Showcase */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-extrabold text-brand-black">Ongoing & Upcoming Events</h2>
            <p className="text-sm text-brand-brown/70 mt-1 font-medium">Discover top events on campus</p>
          </div>
          <Link href="/auth/register" className="text-sm font-bold text-brand-brown hover:underline flex items-center gap-1">
            See all events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 bg-white/30 animate-pulse rounded-2xl border border-brand-brown/5" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-3xl border border-brand-brown/10">
            <Calendar className="w-12 h-12 text-brand-brown/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-brand-black">No events published yet</h3>
            <p className="text-sm text-brand-brown/60 mt-1">Check back later or register as an administrator to create events.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {events.map((event) => (
              <div key={event.id} className="glass-card rounded-2xl overflow-hidden flex flex-col">
                <div className="h-44 bg-brand-brown/10 relative flex items-center justify-center overflow-hidden">
                  {event.poster_url ? (
                    <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <Calendar className="w-12 h-12 text-brand-brown/35" />
                  )}
                  <span className="absolute top-4 right-4 bg-brand-brown text-brand-bg font-bold text-[10px] uppercase px-2.5 py-1 rounded">
                    {event.category}
                  </span>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-brand-black line-clamp-1">{event.title}</h3>
                    <p className="text-xs text-brand-brown/50 font-bold uppercase mt-1">
                      {event.building}, {event.hall}
                    </p>
                    <p className="text-sm text-brand-brown/75 mt-3 line-clamp-2 font-medium">
                      {event.description}
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-brand-brown/5 flex items-center justify-between">
                    <span className="text-xs text-brand-brown/65 font-bold">
                      {new Date(event.start_time).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <Link
                      href={`/auth/register`}
                      className="text-xs font-extrabold text-brand-brown hover:underline flex items-center gap-1"
                    >
                      Register Now <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-brand-black text-white/50 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-brown flex items-center justify-center">
              <QrCode className="w-4 h-4 text-brand-bg" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">HackPass</span>
          </div>
          <p className="text-xs font-medium">
            © {new Date().getFullYear()} HackPass. Made with love for digital campus events.
          </p>
        </div>
      </footer>
    </div>
  );
}
