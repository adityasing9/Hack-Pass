'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart3, TrendingUp, Users, Percent, ShieldCheck } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    avgAttendance: 0,
    presentRate: 0,
    totalSessions: 0,
    uniqueStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        // Fetch summaries
        const { data: summaries } = await supabase.from('attendance_summary').select('*');
        const { data: sessions } = await supabase.from('attendance_sessions').select('*');
        
        // Uniques
        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true });

        const totalSums = summaries?.length || 0;
        const passedSums = summaries?.filter(s => s.status === 'PRESENT' || s.status === 'INSIDE').length || 0;

        let totalPercent = 0;
        if (summaries && totalSums > 0) {
          totalPercent = summaries.reduce((acc, curr) => acc + Number(curr.attendance_percent), 0) / totalSums;
        }

        setAnalytics({
          avgAttendance: Math.round(totalPercent),
          presentRate: totalSums > 0 ? Math.round((passedSums / totalSums) * 100) : 0,
          totalSessions: sessions?.length || 0,
          uniqueStudents: studentCount || 0,
        });

      } catch (err) {
        console.error('Error fetching analytics details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-white/40 rounded-3xl" />
          ))}
        </div>
        <div className="h-72 bg-white/40 rounded-3xl" />
      </div>
    );
  }

  // SVG comparative charts mockup data
  const dataPoints = [45, 65, 80, 55, 90, 75];

  return (
    <div className="space-y-8 animate-slide-up text-left">
      {/* Title */}
      <div className="pb-4 border-b border-brand-brown/5">
        <h2 className="text-3xl font-black text-brand-black">Analytics Summary</h2>
        <p className="text-sm text-brand-brown/70 font-medium">Historical audit summaries and key occupancy insights.</p>
      </div>

      {/* Analytics Aggregate Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-3xl p-6 border border-white/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-brand-brown/40 tracking-wider">Avg Attendance</span>
            <span className="text-3xl font-black text-brand-black block mt-2">{analytics.avgAttendance}%</span>
          </div>
          <div className="w-12 h-12 bg-brand-brown/5 rounded-2xl border border-brand-brown/10 flex items-center justify-center text-brand-brown">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-white/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-brand-brown/40 tracking-wider">Pass Rate</span>
            <span className="text-3xl font-black text-brand-black block mt-2">{analytics.presentRate}%</span>
          </div>
          <div className="w-12 h-12 bg-brand-brown/5 rounded-2xl border border-brand-brown/10 flex items-center justify-center text-brand-brown">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-white/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-brand-brown/40 tracking-wider">Total Scans logged</span>
            <span className="text-3xl font-black text-brand-black block mt-2">{analytics.totalSessions * 2}</span>
          </div>
          <div className="w-12 h-12 bg-brand-brown/5 rounded-2xl border border-brand-brown/10 flex items-center justify-center text-brand-brown">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-white/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-brand-brown/40 tracking-wider">Registered Students</span>
            <span className="text-3xl font-black text-brand-black block mt-2">{analytics.uniqueStudents}</span>
          </div>
          <div className="w-12 h-12 bg-brand-brown/5 rounded-2xl border border-brand-brown/10 flex items-center justify-center text-brand-brown">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Department Ratio Analysis (Comparative SVG layout) */}
      <div className="glass-panel rounded-3xl p-6 border border-white/50 space-y-6">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-brown/60">Department-wise Activity</h3>
          <p className="text-[11px] text-brand-brown/40">Total active students sorted by branches</p>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Computer Science (CSE)', val: 92, count: 185 },
            { label: 'Information Science (ISE)', val: 84, count: 140 },
            { label: 'Electronics & Comm (ECE)', val: 72, count: 120 },
            { label: 'Electrical & Electronics (EEE)', val: 55, count: 65 },
            { label: 'Mechanical Eng (ME)', val: 40, count: 48 },
          ].map((item, idx) => (
            <div key={idx} className="space-y-1.5 font-bold">
              <div className="flex justify-between text-xs text-brand-black">
                <span>{item.label}</span>
                <span className="text-brand-brown">{item.count} students ({item.val}%)</span>
              </div>
              <div className="w-full bg-brand-brown/5 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-brown h-full rounded-full transition-all duration-300"
                  style={{ width: `${item.val}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
