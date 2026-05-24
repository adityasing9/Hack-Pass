'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Users, Percent, UserCheck, RefreshCw, ArrowRight, ClipboardList, AlertCircle } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    presentStudents: 0,
    avgAttendance: 0,
    activeStudents: 0,
  });
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const supabase = createClient();

  const fetchDashboardStats = async () => {
    try {
      // 1. Total events
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // 2. Attendance summary aggregates
      const { data: summaries } = await supabase
        .from('attendance_summary')
        .select('*');

      const totalSummaries = summaries?.length || 0;
      const presentCount = summaries?.filter((s: any) => s.status === 'PRESENT' || s.status === 'INSIDE').length || 0;
      const insideCount = summaries?.filter((s: any) => s.status === 'INSIDE').length || 0;

      let totalPercent = 0;
      if (summaries && totalSummaries > 0) {
        totalPercent = summaries.reduce((acc: number, curr: any) => acc + Number(curr.attendance_percent), 0) / totalSummaries;
      }

      setStats({
        totalEvents: eventsCount || 0,
        presentStudents: presentCount,
        avgAttendance: Math.round(totalPercent),
        activeStudents: insideCount,
      });

      // 3. Fetch recent session logs (latest 5 entry/exit logs)
      const { data: sessions, error: sessionsError } = await supabase
        .from('attendance_sessions')
        .select('*, students(*), events(*)')
        .order('entry_time', { ascending: false })
        .limit(5);

      if (sessions) {
        setRecentSessions(sessions);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-white/40 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-white/40 rounded-3xl" />
          <div className="h-64 bg-white/40 rounded-3xl" />
        </div>
      </div>
    );
  }

  // Sample data for custom SVG charts (to showcase trend vs occupancy)
  const occupancyTimeline = [35, 45, 60, 85, 95, 75, 50, 40, 20];
  const attendanceTrend = [40, 52, 68, 75, 78, 82, 88];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-brand-black">Dashboard</h2>
          <p className="text-sm text-brand-brown/70 font-medium">Real-time gatekeeping logs and general analytics.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-brand-brown/10 text-brand-brown rounded-xl font-bold text-xs shadow-sm hover:border-brand-brown/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Stats'}
        </button>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Events */}
        <div className="glass-card rounded-3xl p-6 border border-white/40 flex items-center justify-between text-left">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-brand-brown/40 tracking-wider">Total Events</span>
            <span className="text-3xl font-black text-brand-black block mt-2">{stats.totalEvents}</span>
          </div>
          <div className="w-12 h-12 bg-brand-brown/5 rounded-2xl border border-brand-brown/10 flex items-center justify-center text-brand-brown">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Present Students */}
        <div className="glass-card rounded-3xl p-6 border border-white/40 flex items-center justify-between text-left">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-brand-brown/40 tracking-wider">Present Students</span>
            <span className="text-3xl font-black text-brand-black block mt-2">{stats.presentStudents}</span>
          </div>
          <div className="w-12 h-12 bg-brand-brown/5 rounded-2xl border border-brand-brown/10 flex items-center justify-center text-brand-brown">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Attendance % */}
        <div className="glass-card rounded-3xl p-6 border border-white/40 flex items-center justify-between text-left">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-brand-brown/40 tracking-wider">Average Attendance</span>
            <span className="text-3xl font-black text-brand-black block mt-2">{stats.avgAttendance}%</span>
          </div>
          <div className="w-12 h-12 bg-brand-brown/5 rounded-2xl border border-brand-brown/10 flex items-center justify-center text-brand-brown">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        {/* Active Students */}
        <div className="glass-card rounded-3xl p-6 border border-white/40 flex items-center justify-between text-left">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-brand-brown/40 tracking-wider">Active Inside Venue</span>
            <span className="text-3xl font-black text-brand-black block mt-2">{stats.activeStudents}</span>
          </div>
          <div className="w-12 h-12 bg-brand-yellow/10 rounded-2xl border border-brand-yellow/20 flex items-center justify-center text-brand-brown">
            <UserCheck className="w-5 h-5 text-brand-brown" />
          </div>
        </div>
      </div>

      {/* SVG Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        {/* Attendance Trend Line Chart */}
        <div className="glass-panel rounded-3xl p-6 border border-white/50 space-y-4">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-brown/60">Attendance Trend (%)</h3>
            <p className="text-[11px] text-brand-brown/40">Aggregated historical events metrics</p>
          </div>

          <div className="h-48 w-full flex items-end relative pt-4 px-2">
            {/* SVG line graph */}
            <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient-trend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6F4E37" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6F4E37" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="10" x2="100" y2="10" stroke="#6F4E37" strokeWidth="0.05" strokeDasharray="1 2" />
              <line x1="0" y1="20" x2="100" y2="20" stroke="#6F4E37" strokeWidth="0.05" strokeDasharray="1 2" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="#6F4E37" strokeWidth="0.05" strokeDasharray="1 2" />

              {/* Area path */}
              <path
                d={`M 0 40 L 0 ${40 - attendanceTrend[0] / 3} L 16.6 ${40 - attendanceTrend[1] / 3} L 33.3 ${40 - attendanceTrend[2] / 3} L 50 ${40 - attendanceTrend[3] / 3} L 66.6 ${40 - attendanceTrend[4] / 3} L 83.3 ${40 - attendanceTrend[5] / 3} L 100 ${40 - attendanceTrend[6] / 3} L 100 40 Z`}
                fill="url(#gradient-trend)"
              />
              {/* Line path */}
              <path
                d={`M 0 ${40 - attendanceTrend[0] / 3} L 16.6 ${40 - attendanceTrend[1] / 3} L 33.3 ${40 - attendanceTrend[2] / 3} L 50 ${40 - attendanceTrend[3] / 3} L 66.6 ${40 - attendanceTrend[4] / 3} L 83.3 ${40 - attendanceTrend[5] / 3} L 100 ${40 - attendanceTrend[6] / 3}`}
                fill="none"
                stroke="#6F4E37"
                strokeWidth="0.75"
              />
            </svg>
            <div className="absolute inset-x-0 bottom-[-20px] flex justify-between text-[9px] font-bold text-brand-brown/40">
              <span>Evt 1</span>
              <span>Evt 2</span>
              <span>Evt 3</span>
              <span>Evt 4</span>
              <span>Evt 5</span>
              <span>Evt 6</span>
              <span>Evt 7</span>
            </div>
          </div>
        </div>

        {/* Occupancy timeline bar chart */}
        <div className="glass-panel rounded-3xl p-6 border border-white/50 space-y-4">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-brown/60">Occupancy Timeline (%)</h3>
            <p className="text-[11px] text-brand-brown/40">Peak active student logs during the day</p>
          </div>

          <div className="h-48 w-full flex items-end justify-between px-2 pt-4 relative">
            {occupancyTimeline.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center w-[8%] group cursor-help">
                <span className="text-[8px] font-bold text-brand-brown opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1">
                  {val}%
                </span>
                <div
                  className="w-full bg-brand-brown/85 rounded-t-lg group-hover:bg-brand-brown transition-colors shadow-sm"
                  style={{ height: `${val * 1.5}px` }}
                />
              </div>
            ))}
            <div className="absolute inset-x-0 bottom-[-20px] flex justify-between text-[9px] font-bold text-brand-brown/40">
              <span>09:00</span>
              <span>11:00</span>
              <span>13:00</span>
              <span>15:00</span>
              <span>17:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Movement Logs Table */}
      <div className="glass-panel rounded-3xl p-6 border border-white/50 text-left space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-brand-brown/5">
          <div>
            <h3 className="text-base font-extrabold text-brand-black">Live Gatekeeping Feed</h3>
            <p className="text-xs text-brand-brown/50 mt-0.5">Most recent entry and exit actions</p>
          </div>
          <Link
            href="/admin/attendance"
            className="text-xs font-bold text-brand-brown hover:underline flex items-center gap-1.5 bg-brand-brown/5 px-3 py-1.5 rounded-lg border border-brand-brown/10 shadow-inner"
          >
            All Logs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className="text-center py-10">
            <ClipboardList className="w-10 h-10 text-brand-brown/20 mx-auto mb-2" />
            <p className="text-xs text-brand-brown/65">No recent check-ins or exits logged.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-[10px] font-extrabold uppercase text-brand-brown/45 border-b border-brand-brown/5">
                  <th className="pb-3 pl-2">Student Name</th>
                  <th className="pb-3">USN</th>
                  <th className="pb-3">Event</th>
                  <th className="pb-3">Entry Time</th>
                  <th className="pb-3">Exit Time</th>
                  <th className="pb-3 pr-2 text-right">Inside Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-brown/5 font-semibold text-xs text-brand-brown/85">
                {recentSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-brand-brown/2 transition-colors">
                    <td className="py-3.5 pl-2 text-brand-black">{session.students?.name}</td>
                    <td className="py-3.5">{session.students?.usn}</td>
                    <td className="py-3.5 truncate max-w-[150px]">{session.events?.title}</td>
                    <td className="py-3.5">
                      {new Date(session.entry_time).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5">
                      {session.exit_time ? (
                        new Date(session.exit_time).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      ) : (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-brand-yellow/20 text-brand-brown border border-brand-yellow/25">
                          INSIDE
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      {session.duration_minutes !== null ? `${session.duration_minutes}m` : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
