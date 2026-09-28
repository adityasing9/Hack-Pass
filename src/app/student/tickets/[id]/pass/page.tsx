'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { QrCode, MapPin, Calendar, Clock, ArrowLeft, Download, Share2, Shield, Smartphone } from 'lucide-react';
import QRCode from 'qrcode';
import Link from 'next/link';

function PassQrRenderer({ value, size = 180 }: { value: string; size?: number }) {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, {
      margin: 1,
      width: size,
      color: { dark: '#111111', light: '#FFFFFF' },
    })
      .then((url) => setQrUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [value, size]);

  if (!qrUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center bg-white/10 rounded-2xl animate-pulse"
      >
        <QrCode className="w-10 h-10 text-white/20" />
      </div>
    );
  }

  return <img src={qrUrl} alt="Ticket QR Code" style={{ width: size, height: size }} className="rounded-2xl shadow-lg" />;
}

export default function DigitalPassPage() {
  const params = useParams();
  const ticketId = params.id as string;
  const { student } = useAuth();
  const supabase = createClient();

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!student || !ticketId) return;

    const fetchTicketData = async () => {
      try {
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('*, events(*)')
          .eq('id', ticketId)
          .eq('student_id', student.id)
          .single();

        if (ticketError || !ticketData) {
          setError('Ticket not found or access denied.');
          setLoading(false);
          return;
        }

        // Fetch attendance summary
        const { data: summary } = await supabase
          .from('attendance_summary')
          .select('*')
          .eq('student_id', student.id)
          .eq('event_id', ticketData.event_id)
          .maybeSingle();

        setTicket({
          ...ticketData,
          attendance_percent: summary?.attendance_percent || 0,
          status: summary?.status || 'REGISTERED',
          total_minutes: summary?.total_minutes || 0,
        });
      } catch (err) {
        setError('Failed to load ticket data.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [student, ticketId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50">
        <div className="w-10 h-10 border-3 border-brand-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-50 text-white p-6">
        <Shield className="w-12 h-12 text-brand-red mb-4" />
        <h2 className="text-lg font-bold">{error || 'Ticket not found'}</h2>
        <Link href="/student/tickets" className="mt-4 text-sm text-brand-yellow underline">
          ← Back to Tickets
        </Link>
      </div>
    );
  }

  const event = ticket.events;
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  const attendancePercent = Math.round(ticket.attendance_percent);
  const isPassed = attendancePercent >= (event.attendance_threshold || 75);

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; glow: string }> = {
    INSIDE: {
      label: '● INSIDE VENUE',
      color: 'text-emerald-300',
      bg: 'bg-emerald-500/15',
      border: 'border-emerald-500/30',
      glow: 'shadow-emerald-500/20',
    },
    PRESENT: {
      label: '✓ ATTENDANCE COMPLETE',
      color: 'text-blue-300',
      bg: 'bg-blue-500/15',
      border: 'border-blue-500/30',
      glow: 'shadow-blue-500/20',
    },
    ABSENT: {
      label: '○ NOT CHECKED IN',
      color: 'text-red-300',
      bg: 'bg-red-500/15',
      border: 'border-red-500/30',
      glow: 'shadow-red-500/20',
    },
    REGISTERED: {
      label: '◈ REGISTERED',
      color: 'text-amber-300',
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/30',
      glow: 'shadow-amber-500/20',
    },
  };

  const currentStatus = statusConfig[ticket.status] || statusConfig['REGISTERED'];

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-50 overflow-y-auto">
      {/* Background ambient glow */}
      <div className="absolute top-[-20%] left-[10%] w-[60%] h-[40%] rounded-full bg-brand-brown/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[5%] w-[50%] h-[35%] rounded-full bg-brand-yellow/5 blur-[100px] pointer-events-none" />

      {/* Top Bar */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-black/60 border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/student/tickets"
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-brand-yellow" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">HackPass Digital Pass</span>
          </div>
          <div className="w-12" />
        </div>
      </div>

      {/* Pass Card */}
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="rounded-[28px] overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-b from-[#1a1a1a] to-[#111111]">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-brand-brown to-brand-brown/80 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 block">HackPass</span>
                  <span className="text-sm font-extrabold text-white">Event Ticket</span>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${currentStatus.bg} ${currentStatus.border} ${currentStatus.color} border`}>
                {currentStatus.label}
              </div>
            </div>
          </div>

          {/* Event Info */}
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-xl font-black text-white leading-tight">{event.title}</h2>
            <p className="text-xs text-white/40 font-semibold mt-1 uppercase tracking-wider">{event.category}</p>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="flex items-center gap-2 text-white/60">
                <MapPin className="w-3.5 h-3.5 text-brand-yellow/80 shrink-0" />
                <span className="text-xs font-semibold truncate">{event.building}, {event.hall}</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Calendar className="w-3.5 h-3.5 text-brand-yellow/80 shrink-0" />
                <span className="text-xs font-semibold">
                  {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Clock className="w-3.5 h-3.5 text-brand-yellow/80 shrink-0" />
                <span className="text-xs font-semibold">
                  {startDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  {' — '}
                  {endDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Divider with notches */}
          <div className="relative py-1">
            <div className="border-t border-dashed border-white/10 mx-6" />
            <div className="absolute top-1/2 left-[-12px] w-6 h-6 rounded-full bg-[#0a0a0a] transform -translate-y-1/2" />
            <div className="absolute top-1/2 right-[-12px] w-6 h-6 rounded-full bg-[#0a0a0a] transform -translate-y-1/2" />
          </div>

          {/* QR Code Section */}
          <div className="px-6 py-6 flex flex-col items-center">
            <div className="p-3 bg-white rounded-2xl shadow-xl">
              <PassQrRenderer value={ticket.qr_code} size={180} />
            </div>
            <span className="text-[11px] font-mono font-bold text-white/30 tracking-[0.2em] mt-3">
              {ticket.qr_code}
            </span>
            <p className="text-[10px] text-white/25 font-medium mt-1.5">
              Present this QR to the Gatekeeper at entry/exit
            </p>
          </div>

          {/* Divider with notches */}
          <div className="relative py-1">
            <div className="border-t border-dashed border-white/10 mx-6" />
            <div className="absolute top-1/2 left-[-12px] w-6 h-6 rounded-full bg-[#0a0a0a] transform -translate-y-1/2" />
            <div className="absolute top-1/2 right-[-12px] w-6 h-6 rounded-full bg-[#0a0a0a] transform -translate-y-1/2" />
          </div>

          {/* Attendance Stats */}
          <div className="px-6 py-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/30 block">Attendance</span>
                <span className={`text-xl font-black block mt-1 ${isPassed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {attendancePercent}%
                </span>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/30 block">Time Inside</span>
                <span className="text-xl font-black text-white block mt-1">{ticket.total_minutes}<span className="text-xs text-white/40">m</span></span>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/30 block">Threshold</span>
                <span className="text-xl font-black text-brand-yellow block mt-1">{event.attendance_threshold}%</span>
              </div>
            </div>

            {/* Attendance bar */}
            <div className="mt-4">
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${isPassed ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
                  style={{ width: `${Math.min(attendancePercent, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Student Info Footer */}
          <div className="px-6 pb-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/25 block">Ticket Holder</span>
                <span className="text-sm font-extrabold text-white block mt-0.5">{student?.name}</span>
                <span className="text-[11px] font-semibold text-white/40">{student?.usn} • {student?.dept}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/25 block">Live Clock</span>
                <span className="text-sm font-mono font-bold text-brand-yellow block mt-0.5">
                  {currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer branding */}
        <div className="text-center mt-6 pb-8">
          <p className="text-[10px] font-bold text-white/15 uppercase tracking-widest">
            Secured by HackPass • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
