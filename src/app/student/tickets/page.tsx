'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Ticket, QrCode, Smartphone, Sparkles, MapPin, Calendar, Clock, ChevronDown, ChevronUp, AlertCircle, Info } from 'lucide-react';
import QRCode from 'qrcode';

// Subcomponent to render QR code image dynamically using the qrcode node library
function TicketQrRenderer({ value }: { value: string }) {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, {
      margin: 1,
      width: 200,
      color: {
        dark: '#111111',
        light: '#FFFFFF'
      }
    })
      .then(url => setQrUrl(url))
      .catch(err => console.error('QR code generation error:', err));
  }, [value]);

  return (
    <div className="bg-white p-3 rounded-2xl border border-brand-brown/10 shadow-inner flex items-center justify-center">
      {qrUrl ? (
        <img src={qrUrl} alt="Ticket QR Code" className="w-40 h-40" />
      ) : (
        <div className="w-40 h-40 flex items-center justify-center bg-brand-bg rounded-lg animate-pulse">
          <QrCode className="w-10 h-10 text-brand-brown/20 animate-spin" />
        </div>
      )}
    </div>
  );
}

export default function StudentTicketsPage() {
  const { student } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletUrl, setWalletUrl] = useState<{ [key: string]: string }>({});
  const [walletLoading, setWalletLoading] = useState<{ [key: string]: boolean }>({});
  const supabase = createClient();

  useEffect(() => {
    if (!student) return;

    const fetchTickets = async () => {
      try {
        // Fetch tickets joined with events
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('*, events(*)')
          .eq('student_id', student.id);

        if (ticketError) throw ticketError;

        if (ticketData) {
          // Fetch attendance summary metrics for each ticket
          const ticketsWithSummary = await Promise.all(
            ticketData.map(async (t: any) => {
              const { data: summary } = await supabase
                .from('attendance_summary')
                .select('*')
                .eq('student_id', student.id)
                .eq('event_id', t.event_id)
                .maybeSingle();

              return {
                ...t,
                attendance_percent: summary?.attendance_percent || 0.0,
                status: summary?.status || 'ABSENT',
                total_minutes: summary?.total_minutes || 0
              };
            })
          );

          setTickets(ticketsWithSummary);
        }
      } catch (err) {
        console.error('Error fetching student tickets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [student]);

  const toggleExpand = (ticketId: string) => {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null);
    } else {
      setExpandedTicket(ticketId);
    }
  };

  const handleAddToWallet = async (ticket: any) => {
    setWalletLoading(prev => ({ ...prev, [ticket.id]: true }));
    try {
      const response = await fetch('/api/wallet/pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          eventTitle: ticket.events.title,
          venue: `${ticket.events.building}, ${ticket.events.hall}`,
          dateTime: ticket.events.start_time,
          qrCode: ticket.qr_code,
          attendancePercent: Math.round(ticket.attendance_percent),
          status: ticket.status
        })
      });

      const result = await response.json();
      
      if (result.url) {
        setWalletUrl(prev => ({ ...prev, [ticket.id]: result.url }));
        // Open Google Wallet url
        window.open(result.url, '_blank');
      }
    } catch (err) {
      console.error('Wallet addition failure:', err);
    } finally {
      setWalletLoading(prev => ({ ...prev, [ticket.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-32 bg-white/40 rounded-xl" />
        <div className="h-36 bg-white/40 rounded-2xl" />
        <div className="h-36 bg-white/40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-slide-up">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-brand-black">My Tickets</h2>
        <p className="text-sm text-brand-brown/70 font-medium">Verify check-in QR credentials and monitor your real-time attendance.</p>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-16 bg-white/40 rounded-3xl border border-brand-brown/10">
          <Ticket className="w-12 h-12 text-brand-brown/25 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-brand-black">No tickets found</h3>
          <p className="text-sm text-brand-brown/60 mt-1">You haven't registered for any events yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {tickets.map((ticket) => {
            const isExpanded = expandedTicket === ticket.id;
            const startDate = new Date(ticket.events.start_time);
            const attendancePercent = Math.round(ticket.attendance_percent);
            const status = ticket.status;

            return (
              <div key={ticket.id} className="transition-all duration-300">
                {/* Standard Ticket Shaped Banner */}
                <div
                  onClick={() => toggleExpand(ticket.id)}
                  className="ticket p-5 flex items-center justify-between border border-white/50 cursor-pointer select-none relative"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider bg-brand-yellow/20 border border-brand-yellow/20 text-brand-brown px-2 py-0.5 rounded-md">
                        {ticket.events.category}
                      </span>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                        status === 'INSIDE'
                          ? 'bg-brand-yellow/10 border-brand-yellow/30 text-brand-brown animate-pulse'
                          : status === 'PRESENT'
                          ? 'bg-green-500/10 border-green-500/30 text-green-700'
                          : 'bg-brand-brown/5 border-brand-brown/10 text-brand-brown/60'
                      }`}>
                        {status}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-brand-black mt-2 truncate">
                      {ticket.events.title}
                    </h3>

                    <div className="flex items-center gap-4 mt-2.5 text-xs font-semibold text-brand-brown/65">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-brown/40" />
                        {ticket.events.hall}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-brown/40" />
                        {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[9px] font-bold text-brand-brown/40 uppercase">Attendance</span>
                    <span className={`text-lg font-black ${
                      attendancePercent >= ticket.events.attendance_threshold
                        ? 'text-brand-brown'
                        : 'text-brand-red'
                    }`}>
                      {attendancePercent}%
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-brand-brown/40 mt-1" /> : <ChevronDown className="w-4 h-4 text-brand-brown/40 mt-1" />}
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="glass-panel border-t-0 border-white/40 rounded-b-2xl p-6 -mt-2 animate-fade-in flex flex-col md:flex-row items-center gap-8 justify-between">
                    
                    {/* Visual QR Code Section */}
                    <div className="flex flex-col items-center gap-3">
                      <TicketQrRenderer value={ticket.qr_code} />
                      <span className="text-[11px] font-mono font-bold text-brand-brown/50 tracking-wider">
                        {ticket.qr_code}
                      </span>
                    </div>

                    {/* Meta information & Add to Wallet */}
                    <div className="flex-1 space-y-5 text-left w-full">
                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold text-brand-brown/50 uppercase tracking-wider">Gatekeeping Protocol</h4>
                        <p className="text-sm font-bold text-brand-black">Present this QR code to the Gatekeeper at entrance and exit.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                        <div className="bg-brand-brown/5 p-3 rounded-xl border border-brand-brown/5">
                          <span className="text-[9px] font-extrabold text-brand-brown/40 uppercase">Time Present</span>
                          <span className="text-sm font-black text-brand-black block mt-1">{ticket.total_minutes} mins</span>
                        </div>
                        <div className="bg-brand-brown/5 p-3 rounded-xl border border-brand-brown/5">
                          <span className="text-[9px] font-extrabold text-brand-brown/40 uppercase">Min Required</span>
                          <span className="text-sm font-black text-brand-black block mt-1">{ticket.events.attendance_threshold}%</span>
                        </div>
                      </div>

                      {/* Google Wallet Integration Box */}
                      <div className="bg-brand-brown/5 border border-brand-brown/10 p-4 rounded-2xl flex flex-col gap-3">
                        <div className="flex items-start gap-2.5">
                          <Info className="w-4 h-4 text-brand-brown/60 shrink-0 mt-0.5" />
                          <p className="text-[11px] font-semibold text-brand-brown/80 leading-relaxed">
                            Google Wallet integration dynamically updates your live Attendance percentage and Entry status (Inside / Completed / Early Exit) on your ticket pass.
                          </p>
                        </div>

                        {walletUrl[ticket.id] ? (
                          <a
                            href={walletUrl[ticket.id]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3 bg-black hover:bg-black/95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.98]"
                          >
                            <Smartphone className="w-4.5 h-4.5 text-brand-yellow" /> Open Google Wallet
                          </a>
                        ) : (
                          <button
                            onClick={() => handleAddToWallet(ticket)}
                            disabled={walletLoading[ticket.id]}
                            className="w-full py-3 bg-black hover:bg-black/90 active:scale-[0.98] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-70 disabled:pointer-events-none"
                          >
                            {walletLoading[ticket.id] ? (
                              <div className="w-4 h-4 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Smartphone className="w-4.5 h-4.5 text-brand-yellow" />
                                Add to Google Wallet
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
