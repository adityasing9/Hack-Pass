'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ticket, Search, QrCode } from 'lucide-react';

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchTickets = async () => {
    try {
      let query = supabase
        .from('tickets')
        .select('*, students(*), events(*)')
        .order('created_at', { ascending: false });

      if (selectedEventId !== 'All') {
        query = query.eq('event_id', selectedEventId);
      }

      const { data } = await query;
      if (data) setTickets(data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data } = await supabase.from('events').select('id, title');
      if (data) setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchTickets();
  }, [selectedEventId]);

  const filteredTickets = tickets.filter((t) => {
    const query = search.toLowerCase();
    return (
      t.students?.name.toLowerCase().includes(query) ||
      t.students?.usn.toLowerCase().includes(query) ||
      t.qr_code.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8 animate-slide-up text-left">
      {/* Title */}
      <div className="pb-4 border-b border-brand-brown/5">
        <h2 className="text-3xl font-black text-brand-black">Issued Tickets</h2>
        <p className="text-sm text-brand-brown/70 font-medium">Verify credentials, filter registered attendees, and view codes.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-brand-brown/40" />
          <input
            type="text"
            placeholder="Search name, USN, QR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-xs font-semibold"
          />
        </div>

        {/* Event filter */}
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

      {/* Tickets List */}
      <div className="glass-panel rounded-3xl p-6 border border-white/50">
        {loading ? (
          <div className="h-44 bg-brand-brown/5 animate-pulse rounded-2xl" />
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-16">
            <Ticket className="w-12 h-12 text-brand-brown/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-brand-black">No tickets registered</h3>
            <p className="text-xs text-brand-brown/60 mt-1">Tickets will appear here as students sign up for events.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-[10px] font-extrabold uppercase text-brand-brown/45 border-b border-brand-brown/5">
                  <th className="pb-3 pl-2">Student Detail</th>
                  <th className="pb-3">Registered Event</th>
                  <th className="pb-3">QR Credential</th>
                  <th className="pb-3">Issued Time</th>
                  <th className="pb-3 pr-2 text-right">Wallet Id</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-brown/5 font-semibold text-xs text-brand-brown/85">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-brand-brown/2 transition-colors">
                    <td className="py-3.5 pl-2 text-brand-black font-extrabold">
                      <span>{t.students?.name}</span>
                      <span className="text-[10px] text-brand-brown/50 block font-semibold uppercase mt-0.5">{t.students?.usn}</span>
                    </td>
                    <td className="py-3.5 font-bold text-brand-black truncate max-w-[150px]">{t.events?.title}</td>
                    <td className="py-3.5 font-mono text-[11px] text-brand-brown flex items-center gap-1.5 mt-1.5">
                      <QrCode className="w-4 h-4 text-brand-brown/40" />
                      {t.qr_code}
                    </td>
                    <td className="py-3.5 text-xs">
                      {new Date(t.created_at).toLocaleDateString()} at{' '}
                      {new Date(t.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 pr-2 text-right font-mono text-[10px] text-brand-brown/60">
                      {t.wallet_id || 'Not Sync'}
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
