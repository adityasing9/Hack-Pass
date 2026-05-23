'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { User, Mail, Phone, Bookmark, Calendar, Award, LogOut, CheckCircle2, XCircle } from 'lucide-react';

export default function StudentProfilePage() {
  const { student, signOut } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!student) return;

    const fetchAttendanceHistory = async () => {
      try {
        // Fetch student's attendance summaries joined with event titles
        const { data } = await supabase
          .from('attendance_summary')
          .select('*, events(*)')
          .eq('student_id', student.id);

        if (data) {
          setHistory(data);
        }
      } catch (err) {
        console.error('Error fetching attendance history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceHistory();
  }, [student]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-white/40 rounded-3xl" />
        <div className="h-32 bg-white/40 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-slide-up">
      {/* Profile Details Glass Card */}
      <div className="glass-panel rounded-3xl p-6 border border-white/50 text-left relative">
        <div className="absolute top-[-20%] right-[-10%] w-[35%] h-[60%] rounded-full bg-brand-brown/5 blur-[40px] pointer-events-none" />

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-brown/10 flex items-center justify-center border border-brand-brown/15 text-brand-brown shadow-sm">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-brand-black">{student?.name}</h3>
            <span className="text-xs font-bold text-brand-brown bg-brand-brown/10 px-2.5 py-1 rounded-lg border border-brand-brown/10 mt-1 inline-block">
              {student?.usn}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-brand-brown/5 text-xs font-bold text-brand-brown/85">
          <div className="flex items-center gap-3">
            <Bookmark className="w-4 h-4 text-brand-brown/40 shrink-0" />
            <div>
              <span className="text-[9px] text-brand-brown/40 uppercase block">Dept & Year</span>
              <p className="text-brand-black">{student?.dept} Department • Year {student?.year}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-brand-brown/40 shrink-0" />
            <div>
              <span className="text-[9px] text-brand-brown/40 uppercase block">Email Address</span>
              <p className="text-brand-black truncate">{student?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-brand-brown/40 shrink-0" />
            <div>
              <span className="text-[9px] text-brand-brown/40 uppercase block">Phone Contact</span>
              <p className="text-brand-black">{student?.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-brown/60 px-1">Attendance History</h3>
        
        {history.length === 0 ? (
          <div className="text-center py-10 bg-white/40 rounded-3xl border border-brand-brown/10">
            <Award className="w-10 h-10 text-brand-brown/20 mx-auto mb-2" />
            <p className="text-xs text-brand-brown/65">No attendance history records found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((record) => {
              const status = record.status;
              const isPresent = status === 'PRESENT' || status === 'INSIDE';

              return (
                <div
                  key={record.id}
                  className="glass-card rounded-2xl p-4 border border-white/40 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isPresent ? 'bg-green-500/10 text-green-700' : 'bg-brand-red/10 text-brand-red'
                    }`}>
                      {isPresent ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-brand-black truncate">{record.events.title}</h4>
                      <p className="text-[10px] text-brand-brown/50 font-bold uppercase mt-0.5">
                        Threshold: {record.events.attendance_threshold}%
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                      status === 'INSIDE'
                        ? 'bg-brand-yellow/10 border-brand-yellow/20 text-brand-brown'
                        : isPresent
                        ? 'bg-green-500/10 border-green-500/20 text-green-700'
                        : 'bg-brand-red/10 border-brand-red/20 text-brand-red'
                    }`}>
                      {status}
                    </span>
                    <span className="text-xs font-black text-brand-brown block mt-2">{Math.round(record.attendance_percent)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Logout Action (Mobile Friendly) */}
      <button
        onClick={signOut}
        className="w-full py-4 bg-brand-red/10 hover:bg-brand-red/20 border border-brand-red/10 active:scale-95 text-brand-red font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <LogOut className="w-4 h-4" /> Sign Out from HackPass
      </button>
    </div>
  );
}
