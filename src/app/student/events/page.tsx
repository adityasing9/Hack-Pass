'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Search, Calendar, MapPin, Tag, ChevronRight } from 'lucide-react';

export default function StudentEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const categories = ['All', 'Hackathon', 'Seminar', 'Workshop', 'Cultural', 'Sports'];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await supabase
          .from('events')
          .select('*')
          .eq('published', true)
          .order('start_time', { ascending: true });

        if (data) {
          setEvents(data);
          setFilteredEvents(data);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    let result = events;

    // Apply Search Filter
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q))
      );
    }

    // Apply Category Filter
    if (category !== 'All') {
      result = result.filter((e) => e.category === category);
    }

    setFilteredEvents(result);
  }, [search, category, events]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-brand-black">Campus Events</h2>
        <p className="text-sm text-brand-brown/70 font-medium">Browse, search, and register for student activities.</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-brand-brown/40" />
        <input
          type="text"
          placeholder="Search by title, keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white/70 border border-brand-brown/15 rounded-2xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-sm shadow-sm"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl border shrink-0 transition-all cursor-pointer ${
              category === cat
                ? 'bg-brand-brown text-brand-bg border-brand-brown shadow-sm'
                : 'bg-white/60 text-brand-brown/70 border-brand-brown/10 hover:border-brand-brown/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Events Listing */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-white/40 animate-pulse rounded-2xl border border-brand-brown/5" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-white/40 rounded-3xl border border-brand-brown/10">
          <Calendar className="w-12 h-12 text-brand-brown/25 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-brand-black">No events match your criteria</h3>
          <p className="text-xs text-brand-brown/60 mt-1">Try resetting your filters or typing another search keyword.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <Link
              key={event.id}
              href={`/student/events/${event.id}`}
              className="glass-card rounded-2xl p-5 flex items-center gap-4 text-left border border-white/40 group block"
            >
              {/* Event Category Thumbnail */}
              <div className="w-16 h-16 rounded-xl bg-brand-brown/10 flex flex-col items-center justify-center shrink-0 border border-brand-brown/5 text-brand-brown">
                <Calendar className="w-6 h-6 mb-1" />
                <span className="text-[9px] font-extrabold uppercase">
                  {new Date(event.start_time).toLocaleDateString(undefined, { month: 'short' })}
                </span>
              </div>

              {/* Event Brief */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider bg-brand-yellow/20 border border-brand-yellow/20 text-brand-brown px-2 py-0.5 rounded-md">
                    {event.category}
                  </span>
                  <span className="text-[9px] font-bold text-brand-brown/50">
                    Seats: {event.capacity}
                  </span>
                </div>
                <h3 className="text-base font-bold text-brand-black mt-1.5 truncate group-hover:text-brand-brown transition-colors">
                  {event.title}
                </h3>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-brand-brown/70 font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-brown/40" />
                    {event.building}, {event.hall}
                  </span>
                </div>
              </div>

              {/* Navigation Indicator */}
              <ChevronRight className="w-5 h-5 text-brand-brown/30 group-hover:text-brand-brown group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
