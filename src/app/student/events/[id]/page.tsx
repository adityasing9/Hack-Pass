'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Calendar, MapPin, Sparkles, CheckCircle2, AlertTriangle, ExternalLink, Bookmark, Clock, UserCheck } from 'lucide-react';
import canvasConfetti from 'canvas-confetti';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StudentEventDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  
  const { student } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!student || !eventId) return;

    const fetchEventDetails = async () => {
      try {
        // 1. Fetch Event
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (eventError) throw eventError;
        setEvent(eventData);

        // 2. Check if registered
        const { data: ticketData } = await supabase
          .from('tickets')
          .select('id')
          .eq('student_id', student.id)
          .eq('event_id', eventId)
          .maybeSingle();

        if (ticketData) {
          setIsRegistered(true);
          setTicketId(ticketData.id);
        }

        // 3. Get total registration count
        const { count } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);

        setTotalRegistrations(count || 0);
      } catch (err: any) {
        console.error('Error fetching event details:', err);
        setError(err.message || 'Failed to load event details.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [student, eventId]);

  const handleRegister = async () => {
    if (!student || !event) return;
    setRegistering(true);
    setError('');

    try {
      // 1. Double check capacity limit
      if (totalRegistrations >= event.capacity) {
        throw new Error('Event registration is full! Capacity reached.');
      }

      // 2. Generate a structured readable QR code
      const qrCode = `HP-${event.short_code.toUpperCase()}-${student.usn.toUpperCase()}`;

      // 3. Insert ticket
      const { data, error: ticketError } = await supabase
        .from('tickets')
        .insert([
          {
            student_id: student.id,
            event_id: event.id,
            qr_code: qrCode,
          },
        ])
        .select('id')
        .single();

      if (ticketError) throw ticketError;

      // 4. Create an attendance summary stub for this student/event
      await supabase
        .from('attendance_summary')
        .insert([
          {
            student_id: student.id,
            event_id: event.id,
            total_minutes: 0,
            attendance_percent: 0.0,
            status: 'ABSENT',
          },
        ]);

      // Fire success confetti
      canvasConfetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6F4E37', '#F4B400', '#D72638']
      });

      setIsRegistered(true);
      if (data) setTicketId(data.id);
      setTotalRegistrations(prev => prev + 1);

    } catch (err: any) {
      setError(err.message || 'Failed to complete registration.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-24 bg-white/40 rounded-xl" />
        <div className="h-56 bg-white/40 rounded-3xl" />
        <div className="h-32 bg-white/40 rounded-3xl" />
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="p-6 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-brand-red mx-auto" />
        <h3 className="text-xl font-bold text-brand-black">Error occurred</h3>
        <p className="text-sm text-brand-brown/70">{error}</p>
        <Link href="/student/events" className="text-sm font-bold text-brand-brown underline block">
          Back to Events
        </Link>
      </div>
    );
  }

  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  const isFull = totalRegistrations >= event.capacity;
  const isExpired = endDate < new Date();

  return (
    <div className="space-y-6 pb-12 animate-slide-up">
      {/* Back to Events */}
      <Link
        href="/student/events"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-brown hover:underline bg-white/60 border border-brand-brown/10 px-3.5 py-2 rounded-xl shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Catalogue
      </Link>

      {/* Poster / Branding Area */}
      <div className="glass-panel rounded-3xl overflow-hidden relative border border-white/50 shadow-md">
        <div className="h-64 bg-brand-brown/10 flex items-center justify-center relative overflow-hidden">
          {event.poster_url ? (
            <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <Bookmark className="w-16 h-16 text-brand-brown/30" />
          )}
          <span className="absolute top-4 right-4 bg-brand-brown text-brand-bg font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl">
            {event.category}
          </span>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-black text-brand-black leading-snug">{event.title}</h2>
          <p className="text-xs text-brand-brown/50 font-bold uppercase tracking-wider mt-1">
            Short Code: {event.short_code}
          </p>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-brand-brown/5">
            <div className="flex items-start gap-2.5">
              <Calendar className="w-5 h-5 text-brand-brown/40 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-extrabold uppercase text-brand-brown/40 block">Event Date</span>
                <span className="text-xs font-bold text-brand-black">
                  {startDate.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-5 h-5 text-brand-brown/40 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-extrabold uppercase text-brand-brown/40 block">Timing</span>
                <span className="text-xs font-bold text-brand-black">
                  {startDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {endDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Venue info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* About Event */}
        <div className="md:col-span-2 glass-card rounded-3xl p-6 border border-white/40 space-y-4 text-left">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-brown/60">About Event</h3>
          <p className="text-sm text-brand-brown/85 font-medium leading-relaxed whitespace-pre-line">
            {event.description || 'No description provided by organizers.'}
          </p>
        </div>

        {/* Venue & Capacity */}
        <div className="glass-card rounded-3xl p-6 border border-white/40 space-y-6 text-left">
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-brown/60">Location</h3>
            <div className="flex items-start gap-2 text-xs font-bold text-brand-black">
              <MapPin className="w-4 h-4 text-brand-brown/50 shrink-0" />
              <div>
                <p>{event.building}</p>
                <p className="text-brand-brown/65 mt-0.5">{event.hall}</p>
              </div>
            </div>
            {event.maps_url && (
              <a
                href={event.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-brown hover:underline mt-2 bg-brand-brown/5 px-2.5 py-1.5 rounded-lg border border-brand-brown/10"
              >
                Google Maps <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="border-t border-brand-brown/5 pt-4 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-brown/40 block">Capacity</span>
            <div className="flex justify-between items-center text-xs font-bold text-brand-black">
              <span>Limit: {event.capacity} seats</span>
              <span className="text-brand-brown">Reg: {totalRegistrations}</span>
            </div>
            <div className="w-full bg-brand-brown/10 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-brand-brown h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min((totalRegistrations / event.capacity) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rules & Parameters */}
      <div className="glass-card rounded-3xl p-6 border border-white/40 text-left space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-brown/60">Attendance Tracking Rules</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold text-brand-brown/85">
          <div className="bg-brand-brown/5 p-3 rounded-xl border border-brand-brown/5">
            <span className="text-[9px] font-extrabold uppercase text-brand-brown/45 block">Allow Re-entry</span>
            <span className="text-sm font-bold text-brand-black block mt-1">{event.allow_reentry ? 'YES' : 'NO'}</span>
          </div>

          {event.allow_reentry && (
            <div className="bg-brand-brown/5 p-3 rounded-xl border border-brand-brown/5">
              <span className="text-[9px] font-extrabold uppercase text-brand-brown/45 block">Max Re-entries</span>
              <span className="text-sm font-bold text-brand-black block mt-1">{event.max_reentry} times</span>
            </div>
          )}

          <div className="bg-brand-brown/5 p-3 rounded-xl border border-brand-brown/5 col-span-2 md:col-span-1">
            <span className="text-[9px] font-extrabold uppercase text-brand-brown/45 block">Min Threshold</span>
            <span className="text-sm font-bold text-brand-black block mt-1">{event.attendance_threshold}% Duration</span>
          </div>
        </div>
      </div>

      {/* Register / Call To Action Footer */}
      <div className="glass-panel p-5 rounded-3xl border border-white/60 shadow-lg flex items-center justify-between">
        <div>
          {isRegistered ? (
            <span className="text-xs font-extrabold text-green-700 flex items-center gap-1 bg-green-500/10 border border-green-500/25 px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="w-4.5 h-4.5" /> Registered Successfully
            </span>
          ) : isExpired ? (
            <span className="text-xs font-bold text-brand-red flex items-center gap-1.5 bg-brand-red/10 border border-brand-red/25 px-3 py-1.5 rounded-xl">
              <AlertTriangle className="w-4.5 h-4.5" /> Registration Closed
            </span>
          ) : isFull ? (
            <span className="text-xs font-bold text-brand-brown/60 flex items-center gap-1.5 bg-brand-brown/5 border border-brand-brown/10 px-3 py-1.5 rounded-xl">
              <AlertTriangle className="w-4.5 h-4.5" /> Event Fully Booked
            </span>
          ) : (
            <span className="text-xs font-bold text-brand-brown/70">
              Only {event.capacity - totalRegistrations} seats left!
            </span>
          )}
        </div>

        <div>
          {isRegistered ? (
            <Link
              href="/student/tickets"
              className="px-6 py-3 bg-brand-brown hover:bg-brand-brown/95 active:scale-95 text-brand-bg font-extrabold rounded-2xl text-sm shadow-md transition-all flex items-center gap-1.5"
            >
              <UserCheck className="w-4.5 h-4.5" /> Go To Tickets
            </Link>
          ) : (
            <button
              onClick={handleRegister}
              disabled={registering || isFull || isExpired}
              className="px-8 py-3.5 bg-brand-brown hover:bg-brand-brown/95 active:scale-95 text-brand-bg font-extrabold rounded-2xl text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {registering ? 'Processing...' : 'Register For Event'}
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="p-4 rounded-2xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-bold animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
}
