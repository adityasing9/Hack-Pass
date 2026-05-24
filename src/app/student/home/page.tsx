'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Calendar, Ticket, Award, Bell, ArrowRight, QrCode } from 'lucide-react';

export default function StudentHomePage() {
  const { student } = useAuth();
  const [stats, setStats] = useState({
    registeredEvents: 0,
    averageAttendance: 0,
    presentEvents: 0,
  });
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!student) return;

    const fetchDashboardData = async () => {
      try {
        // 1. Fetch tickets
        const { data: tickets } = await supabase
          .from('tickets')
          .select('*, events(*)')
          .eq('student_id', student.id);

        const ticketCount = tickets?.length || 0;

        // 2. Fetch summaries
        const { data: summaries } = await supabase
          .from('attendance_summary')
          .select('*')
          .eq('student_id', student.id);

        // Calculate stats
        const totalSummaries = summaries?.length || 0;
        const presentCount = summaries?.filter((s: any) => s.status === 'PRESENT' || s.status === 'INSIDE').length || 0;
        
        let totalPercent = 0;
        if (summaries && totalSummaries > 0) {
          totalPercent = summaries.reduce((acc: number, curr: any) => acc + Number(curr.attendance_percent), 0) / totalSummaries;
        }

        setStats({
          registeredEvents: ticketCount,
          averageAttendance: Math.round(totalPercent),
          presentEvents: presentCount,
        });

        // 3. Find the next/active ticket
        if (tickets && tickets.length > 0) {
          // Sort by start_time. Find closest event that hasn't ended.
          const active = tickets
            .filter((t: any) => new Date(t.events.end_time) > new Date())
            .sort((a: any, b: any) => new Date(a.events.start_time).getTime() - new Date(b.events.start_time).getTime())[0];
          
          if (active) {
            // Check status for this active event
            const { data: activeSum } = await supabase
              .from('attendance_summary')
              .select('*')
              .eq('student_id', student.id)
              .eq('event_id', active.event_id)
              .single();

            setActiveTicket({
              ...active,
              status: activeSum?.status || 'NOT_STARTED',
              percent: activeSum?.attendance_percent || 0
            });
          }
        }
      } catch (err) {
        console.error('Error fetching student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [student]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white/40 rounded-3xl" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-white/40 rounded-2xl" />
          <div className="h-20 bg-white/40 rounded-2xl" />
          <div className="h-20 bg-white/40 rounded-2xl" />
        </div>
        <div className="h-44 bg-white/40 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 animate-slide-up">
      {/* Welcome Banner */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[35%] h-[60%] rounded-full bg-brand-yellow/10 blur-[40px] pointer-events-none" />
        
        <div className="flex items-center gap-2 text-brand-brown font-bold text-xs">
          <Sparkles className="w-4 h-4 text-brand-yellow fill-brand-yellow" /> Student Portal
        </div>
        <h2 className="text-2xl font-extrabold text-brand-black mt-2">
          Welcome, {student?.name}!
        </h2>
        <p className="text-xs font-bold text-brand-brown/65 mt-1 uppercase tracking-wider">
          {student?.dept} Department • {student?.year}
          {student?.year === 1 ? 'st' : student?.year === 2 ? 'nd' : student?.year === 3 ? 'rd' : 'th'} Year
        </p>
      </div>

      {/* Aggregate Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Stat 1 */}
        <div className="bg-white/65 border border-white/40 rounded-2xl p-4 text-center shadow-sm">
          <span className="text-[10px] font-extrabold text-brand-brown/50 uppercase tracking-wider block">Registrations</span>
          <span className="text-2xl font-black text-brand-brown mt-1 block">{stats.registeredEvents}</span>
        </div>

        {/* Stat 2 */}
        <div className="bg-white/65 border border-white/40 rounded-2xl p-4 text-center shadow-sm">
          <span className="text-[10px] font-extrabold text-brand-brown/50 uppercase tracking-wider block">Avg Attendance</span>
          <span className="text-2xl font-black text-brand-brown mt-1 block">{stats.averageAttendance}%</span>
        </div>

        {/* Stat 3 */}
        <div className="bg-white/65 border border-white/40 rounded-2xl p-4 text-center shadow-sm">
          <span className="text-[10px] font-extrabold text-brand-brown/50 uppercase tracking-wider block">Present Status</span>
          <span className="text-2xl font-black text-brand-brown mt-1 block">{stats.presentEvents}</span>
        </div>
      </div>

      {/* Quick Action: Active Ticket */}
      {activeTicket ? (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-brown/60">Upcoming / Ongoing Event</h3>
            <Link href="/student/tickets" className="text-xs font-bold text-brand-brown hover:underline flex items-center gap-0.5">
              My Tickets <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="ticket p-5 flex flex-col justify-between h-48 border border-white/50">
            <div>
              <div className="flex justify-between items-start">
                <h4 className="text-lg font-bold text-brand-black line-clamp-1">{activeTicket.events.title}</h4>
                <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full border ${
                  activeTicket.status === 'INSIDE'
                    ? 'bg-brand-yellow/10 border-brand-yellow/30 text-brand-brown'
                    : activeTicket.status === 'PRESENT'
                    ? 'bg-green-500/10 border-green-500/30 text-green-700'
                    : 'bg-brand-brown/5 border-brand-brown/10 text-brand-brown/60'
                }`}>
                  {activeTicket.status}
                </span>
              </div>
              <p className="text-xs text-brand-brown/60 font-bold uppercase tracking-wider mt-1">
                {activeTicket.events.building} • {activeTicket.events.hall}
              </p>
            </div>

            <div className="ticket-divider" />

            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-brand-brown/40 uppercase block">Pass Percentage</span>
                <span className="text-sm font-black text-brand-brown block">{Math.round(activeTicket.percent)}%</span>
              </div>

              <Link
                href="/student/tickets"
                className="px-4 py-2.5 bg-brand-brown hover:bg-brand-brown/95 active:scale-95 text-brand-bg rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                <QrCode className="w-4 h-4" /> View Ticket QR
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-6 text-center py-10 border border-brand-brown/5">
          <Ticket className="w-10 h-10 text-brand-brown/20 mx-auto mb-2" />
          <h4 className="text-base font-bold text-brand-black">No active event registrations</h4>
          <p className="text-xs text-brand-brown/65 mt-1">Browse campus events to register and secure your pass.</p>
          <Link
            href="/student/events"
            className="inline-flex items-center gap-1 mt-4 px-4 py-2 bg-brand-brown text-brand-bg rounded-xl font-bold text-xs hover:bg-brand-brown/95 transition-all shadow-md"
          >
            Find Events <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Announcements Panel */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-brown/60 px-1">Announcements</h3>
        <div className="glass-card rounded-2xl p-5 border border-brand-brown/5 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-yellow/10 flex items-center justify-center text-brand-brown/80 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-brand-black">Welcome to HackPass PWA</h4>
            <p className="text-xs text-brand-brown/70 mt-1 leading-relaxed font-medium">
              You can now add your event tickets to Google Wallet! Click on any registered ticket in the "Tickets" tab to add your pass. Make sure to keep the app installed for offline access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
