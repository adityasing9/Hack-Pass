'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ClipboardList, Search, PlusCircle, ArrowUpRight, ArrowDownLeft, ShieldAlert } from 'lucide-react';

export default function AdminAttendancePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Manual Check-in state
  const [manualUsn, setManualUsn] = useState('');
  const [manualEventId, setManualEventId] = useState('');
  const [manualType, setManualType] = useState<'entry' | 'exit'>('entry');
  const [manualLoading, setManualLoading] = useState(false);

  const fetchAttendanceLogs = async () => {
    try {
      let query = supabase
        .from('attendance_sessions')
        .select('*, students(*), events(*)')
        .order('entry_time', { ascending: false });

      if (selectedEventId !== 'All') {
        query = query.eq('event_id', selectedEventId);
      }

      const { data } = await query;
      if (data) {
        setSessions(data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data } = await supabase.from('events').select('id, title');
      if (data) {
        setEvents(data);
        if (data.length > 0) setManualEventId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchAttendanceLogs();
  }, [selectedEventId]);

  const handleManualAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUsn || !manualEventId) return;
    setManualLoading(true);

    try {
      // 1. Find student by USN
      const { data: student, error: studentErr } = await supabase
        .from('students')
        .select('id, name')
        .eq('usn', manualUsn.toUpperCase().trim())
        .single();

      if (studentErr || !student) {
        throw new Error('Student USN not found in database.');
      }

      if (manualType === 'entry') {
        // Log entry session
        const { error: insertErr } = await supabase
          .from('attendance_sessions')
          .insert([
            {
              student_id: student.id,
              event_id: manualEventId,
              entry_time: new Date().toISOString(),
            },
          ]);

        if (insertErr) throw insertErr;

        // Upsert attendance summary
        const { data: currentSummary } = await supabase
          .from('attendance_summary')
          .select('*')
          .eq('student_id', student.id)
          .eq('event_id', manualEventId)
          .maybeSingle();

        if (currentSummary) {
          await supabase
            .from('attendance_summary')
            .update({ status: 'INSIDE' })
            .eq('id', currentSummary.id);
        } else {
          await supabase
            .from('attendance_summary')
            .insert([
              {
                student_id: student.id,
                event_id: manualEventId,
                status: 'INSIDE',
                attendance_percent: 0,
                total_minutes: 0,
              },
            ]);
        }
      } else {
        // Log exit session: find active entry session
        const { data: activeSession, error: sErr } = await supabase
          .from('attendance_sessions')
          .select('*')
          .eq('student_id', student.id)
          .eq('event_id', manualEventId)
          .is('exit_time', null)
          .order('entry_time', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sErr || !activeSession) {
          throw new Error('No active INSIDE session found for this student.');
        }

        const exitTime = new Date();
        const entryTime = new Date(activeSession.entry_time);
        const durationMinutes = Math.max(
          Math.round((exitTime.getTime() - entryTime.getTime()) / 60000),
          1
        );

        // Update session
        const { error: updateErr } = await supabase
          .from('attendance_sessions')
          .update({
            exit_time: exitTime.toISOString(),
            duration_minutes: durationMinutes,
          })
          .eq('id', activeSession.id);

        if (updateErr) throw updateErr;

        // Recalculate summary metrics
        // Fetch all completed sessions for this student
        const { data: completedSessions } = await supabase
          .from('attendance_sessions')
          .select('duration_minutes')
          .eq('student_id', student.id)
          .eq('event_id', manualEventId)
          .not('exit_time', 'is', null);

        const totalMinutes = completedSessions?.reduce((acc: number, curr: any) => acc + (curr.duration_minutes || 0), 0) || 0;

        // Fetch event duration
        const { data: event } = await supabase
          .from('events')
          .select('*')
          .eq('id', manualEventId)
          .single();

        let percent = 0;
        if (event) {
          const eventDuration = Math.round(
            (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000
          );
          percent = Math.min(Math.round((totalMinutes / eventDuration) * 100), 100);
        }

        const status = percent >= (event?.attendance_threshold || 75.0) ? 'PRESENT' : 'ABSENT';

        await supabase
          .from('attendance_summary')
          .upsert(
            {
              student_id: student.id,
              event_id: manualEventId,
              total_minutes: totalMinutes,
              attendance_percent: percent,
              status: status,
            },
            { onConflict: 'student_id,event_id' }
          );
      }

      alert(`Manual override log successful for ${student.name}!`);
      setManualUsn('');
      fetchAttendanceLogs();
    } catch (err: any) {
      alert(err.message || 'Manual action failed.');
    } finally {
      setManualLoading(false);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const query = searchQuery.toLowerCase();
    return (
      s.students?.name.toLowerCase().includes(query) ||
      s.students?.usn.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8 animate-slide-up text-left">
      {/* Title */}
      <div className="pb-4 border-b border-brand-brown/5">
        <h2 className="text-3xl font-black text-brand-black">Attendance Audit</h2>
        <p className="text-sm text-brand-brown/70 font-medium">Verify movement sessions, filter logs, and manually override check-ins.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Attendance Feed / List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-brand-brown/40" />
              <input
                type="text"
                placeholder="Search USN, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-xs font-semibold"
              />
            </div>

            {/* Event Filter */}
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full sm:w-64 px-4 py-2.5 bg-white border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown text-xs font-semibold text-brand-brown"
            >
              <option value="All">All Events</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>

          {/* Table container */}
          <div className="glass-panel rounded-3xl p-6 border border-white/50">
            {loading ? (
              <div className="h-44 bg-brand-brown/5 animate-pulse rounded-2xl" />
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-16">
                <ClipboardList className="w-12 h-12 text-brand-brown/20 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-brand-black">No movement logs</h3>
                <p className="text-xs text-brand-brown/60 mt-1">Scan student ticket QRs at gate checkpoints to see active feeds.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-[10px] font-extrabold uppercase text-brand-brown/45 border-b border-brand-brown/5">
                      <th className="pb-3 pl-2">Student</th>
                      <th className="pb-3">Event</th>
                      <th className="pb-3">Check-In</th>
                      <th className="pb-3">Check-Out</th>
                      <th className="pb-3 pr-2 text-right">Inside Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-brown/5 font-semibold text-xs text-brand-brown/85">
                    {filteredSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-brand-brown/2 transition-colors">
                        <td className="py-3.5 pl-2">
                          <span className="text-brand-black font-extrabold block">{session.students?.name}</span>
                          <span className="text-[9px] text-brand-brown/50 block mt-0.5">{session.students?.usn}</span>
                        </td>
                        <td className="py-3.5 truncate max-w-[130px]">{session.events?.title}</td>
                        <td className="py-3.5">
                          <span className="flex items-center gap-1">
                            <ArrowUpRight className="w-3.5 h-3.5 text-green-600" />
                            {new Date(session.entry_time).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td className="py-3.5">
                          {session.exit_time ? (
                            <span className="flex items-center gap-1">
                              <ArrowDownLeft className="w-3.5 h-3.5 text-brand-red" />
                              {new Date(session.exit_time).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          ) : (
                            <span className="text-[8px] font-extrabold bg-brand-yellow/10 border border-brand-yellow/20 text-brand-brown px-2 py-0.5 rounded">
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

        {/* Manual Movement Override Panel */}
        <div className="glass-panel rounded-3xl p-6 border border-white/50 space-y-5 text-left">
          <div className="flex items-center gap-2 pb-3 border-b border-brand-brown/5">
            <PlusCircle className="w-5 h-5 text-brand-brown" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-black">Manual Override</h3>
          </div>

          <form onSubmit={handleManualAction} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-brown/65 mb-1.5">Select Event</label>
              <select
                value={manualEventId}
                onChange={(e) => setManualEventId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown text-xs font-semibold text-brand-black shadow-sm"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-brown/65 mb-1.5">Student USN</label>
              <input
                type="text"
                required
                placeholder="1RV21CS001"
                value={manualUsn}
                onChange={(e) => setManualUsn(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown text-xs font-semibold text-brand-black shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-brown/65 mb-1.5">Override Action</label>
              <div className="grid grid-cols-2 gap-2 bg-brand-brown/5 p-1 rounded-xl border border-brand-brown/10">
                <button
                  type="button"
                  onClick={() => setManualType('entry')}
                  className={`py-2 text-[10px] uppercase font-bold rounded-lg transition-all ${
                    manualType === 'entry'
                      ? 'bg-brand-brown text-brand-bg shadow-sm'
                      : 'text-brand-brown/70 hover:text-brand-brown'
                  }`}
                >
                  Force Entry
                </button>
                <button
                  type="button"
                  onClick={() => setManualType('exit')}
                  className={`py-2 text-[10px] uppercase font-bold rounded-lg transition-all ${
                    manualType === 'exit'
                      ? 'bg-brand-brown text-brand-bg shadow-sm'
                      : 'text-brand-brown/70 hover:text-brand-brown'
                  }`}
                >
                  Force Exit
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={manualLoading}
              className="w-full py-3.5 bg-brand-brown hover:bg-brand-brown/95 active:scale-95 text-brand-bg font-extrabold rounded-xl text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {manualLoading ? 'Logging Override...' : 'Log Movement Override'}
            </button>
          </form>

          <div className="bg-brand-red/5 border border-brand-red/10 rounded-2xl p-4 flex gap-2.5">
            <ShieldAlert className="w-5 h-5 text-brand-red shrink-0" />
            <p className="text-[10px] font-semibold text-brand-brown/85 leading-relaxed">
              <strong>Security Protocol Warning:</strong> This bypasses physical QR codes. Use ONLY for student battery failure or registration anomalies. Actions are logged under administrator audit history.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
