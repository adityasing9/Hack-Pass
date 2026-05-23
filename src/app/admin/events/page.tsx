'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Plus, Trash2, Eye, EyeOff, Save, X, Sparkles, MapPin, Clock, ShieldAlert } from 'lucide-react';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const supabase = createClient();

  // Form states
  const [title, setTitle] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Hackathon');
  const [posterUrl, setPosterUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [building, setBuilding] = useState('');
  const [hall, setHall] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [allowReentry, setAllowReentry] = useState(false);
  const [maxReentry, setMaxReentry] = useState(0);
  const [attendanceThreshold, setAttendanceThreshold] = useState(75.0);
  const [walletEnabled, setWalletEnabled] = useState(true);
  const [qrEnabled, setQrEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Registration fields selection state
  const [regFields, setRegFields] = useState({
    usn: true,
    name: true,
    email: true,
    phone: true,
    dept: true,
    year: true,
  });

  const fetchEvents = async () => {
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handlePublishToggle = async (eventId: string, currentPublished: boolean) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ published: !currentPublished })
        .eq('id', eventId);

      if (error) throw error;
      fetchEvents();
    } catch (err) {
      console.error('Publish toggle failed:', err);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This will delete all tickets and attendance metrics for this event.')) return;
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      fetchEvents();
    } catch (err) {
      console.error('Delete event failed:', err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('events')
        .insert([
          {
            title,
            short_code: shortCode.toUpperCase().trim(),
            description,
            category,
            poster_url: posterUrl || null,
            logo_url: logoUrl || null,
            building,
            hall,
            maps_url: mapsUrl || null,
            start_time: new Date(startTime).toISOString(),
            end_time: new Date(endTime).toISOString(),
            capacity: Number(capacity),
            allow_reentry: allowReentry,
            max_reentry: Number(maxReentry),
            attendance_threshold: Number(attendanceThreshold),
            wallet_enabled: walletEnabled,
            qr_enabled: qrEnabled,
            notifications_enabled: notificationsEnabled,
            registration_fields: regFields,
            published: false,
          },
        ]);

      if (error) throw error;

      // Reset form
      setTitle('');
      setShortCode('');
      setDescription('');
      setBuilding('');
      setHall('');
      setMapsUrl('');
      setStartTime('');
      setEndTime('');
      setCapacity(100);
      setAllowReentry(false);
      setMaxReentry(0);
      setAttendanceThreshold(75.0);
      setShowCreateForm(false);
      fetchEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to create event.');
    }
  };

  return (
    <div className="space-y-8 animate-slide-up text-left">
      {/* Title */}
      <div className="flex justify-between items-center pb-4 border-b border-brand-brown/5">
        <div>
          <h2 className="text-3xl font-black text-brand-black">Events Management</h2>
          <p className="text-sm text-brand-brown/70 font-medium">Create, publish, and edit college event configurations.</p>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-5 py-3 bg-brand-brown hover:bg-brand-brown/95 text-brand-bg rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Event
          </button>
        )}
      </div>

      {showCreateForm ? (
        /* Event Creation Form */
        <form onSubmit={handleCreateEvent} className="glass-panel rounded-3xl p-6 md:p-8 border border-white/50 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-brand-brown/10">
            <h3 className="text-lg font-black text-brand-black flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-yellow" /> Create New Event
            </h3>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-brand-brown/65 p-1.5 rounded-lg hover:bg-brand-brown/5 border border-brand-brown/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase text-brand-brown/50 tracking-wider">1. Basic Info</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-brown/65 mb-2">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="Hackathon 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-white/70 border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-brown/65 mb-2">Short Code (Unique)</label>
                <input
                  type="text"
                  required
                  placeholder="HACK26"
                  value={shortCode}
                  onChange={(e) => setShortCode(e.target.value)}
                  className="w-full px-4 py-3 bg-white/70 border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-brown/65 mb-2">Description</label>
              <textarea
                placeholder="Detail event schedule, guidelines, and rules..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white/70 border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-brown/65 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-white/70 border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-xs font-semibold"
                >
                  <option value="Hackathon">Hackathon</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-brown/65 mb-2">Poster Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/poster.jpg"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-white/70 border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Venue & Timing */}
          <div className="space-y-4 pt-4 border-t border-brand-brown/5">
            <h4 className="text-xs font-extrabold uppercase text-brand-brown/50 tracking-wider">2. Venue & Timing</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-brown/65 mb-2">Building</label>
                <input
                  type="text"
                  required
                  placeholder="CSE Block"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="w-full px-4 py-3 bg-white/70 border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-brown/65 mb-2">Hall Room</label>
                <input
                  type="text"
                  required
                  placeholder="Seminar Hall 2"
                  value={hall}
                  onChange={(e) => setHall(e.target.value)}
                  className="w-full px-4 py-3 bg-white/70 border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-brown/65 mb-2">Google Maps link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-white/70 border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-brown/65 mb-2">Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 bg-white/70 border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-brown/65 mb-2">End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 bg-white/70 border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Attendance & Settings */}
          <div className="space-y-4 pt-4 border-t border-brand-brown/5">
            <h4 className="text-xs font-extrabold uppercase text-brand-brown/50 tracking-wider">3. Capacity & Gatekeeping Policies</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-brown/65 mb-2">Capacity (Seats)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/70 border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-brown/65 mb-2">Min Attendance Threshold (%)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  step={5}
                  value={attendanceThreshold}
                  onChange={(e) => setAttendanceThreshold(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/70 border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col justify-end pb-3">
                <label className="inline-flex items-center gap-2 font-bold text-xs text-brand-brown select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowReentry}
                    onChange={(e) => setAllowReentry(e.target.checked)}
                    className="w-4 h-4 text-brand-brown border-brand-brown/20 rounded accent-brand-brown"
                  />
                  Allow User Re-entry
                </label>
              </div>

              {allowReentry && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-brown/65 mb-2">Max Re-entries permitted</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={maxReentry}
                    onChange={(e) => setMaxReentry(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white/70 border border-brand-brown/15 rounded-xl outline-none focus:border-brand-brown focus:bg-white text-brand-black transition-all text-xs font-semibold"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              <label className="inline-flex items-center gap-2 font-bold text-xs text-brand-brown select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={walletEnabled}
                  onChange={(e) => setWalletEnabled(e.target.checked)}
                  className="w-4 h-4 text-brand-brown border-brand-brown/20 rounded accent-brand-brown"
                />
                Enable Google Wallet passes
              </label>

              <label className="inline-flex items-center gap-2 font-bold text-xs text-brand-brown select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={qrEnabled}
                  onChange={(e) => setQrEnabled(e.target.checked)}
                  className="w-4 h-4 text-brand-brown border-brand-brown/20 rounded accent-brand-brown"
                />
                Require Ticket QR verification
              </label>

              <label className="inline-flex items-center gap-2 font-bold text-xs text-brand-brown select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="w-4 h-4 text-brand-brown border-brand-brown/20 rounded accent-brand-brown"
                />
                Enable web push alerts
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-brand-brown/10">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3.5 bg-brand-brown hover:bg-brand-brown/95 text-brand-bg font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-4.5 h-4.5" /> Save and Publish Later
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-6 py-3.5 bg-brand-brown/5 border border-brand-brown/10 hover:bg-brand-brown/10 text-brand-brown font-bold rounded-xl text-xs transition-all active:scale-95"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        /* Event Listing Table */
        <div className="glass-panel rounded-3xl p-6 border border-white/50">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 bg-brand-brown/5 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-brand-brown/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-brand-black">No events created</h3>
              <p className="text-sm text-brand-brown/65 mt-1">Get started by creating your first college event registration.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-[10px] font-extrabold uppercase text-brand-brown/45 border-b border-brand-brown/5">
                    <th className="pb-3 pl-2">Event Detail</th>
                    <th className="pb-3">Code</th>
                    <th className="pb-3">Venue</th>
                    <th className="pb-3">Schedule</th>
                    <th className="pb-3">Capacity</th>
                    <th className="pb-3">Published</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-brown/5 font-semibold text-xs text-brand-brown/80">
                  {events.map((event) => {
                    const start = new Date(event.start_time);
                    return (
                      <tr key={event.id} className="hover:bg-brand-brown/2 transition-colors">
                        <td className="py-4 pl-2">
                          <span className="text-brand-black font-extrabold block text-sm">{event.title}</span>
                          <span className="text-[9px] uppercase tracking-wider text-brand-brown/50 bg-brand-brown/5 border border-brand-brown/10 px-2 py-0.5 rounded mt-1.5 inline-block">
                            {event.category}
                          </span>
                        </td>
                        <td className="py-4 uppercase">{event.short_code}</td>
                        <td className="py-4 font-bold text-brand-black">
                          <span className="block">{event.building}</span>
                          <span className="text-[10px] text-brand-brown/60 block mt-0.5">{event.hall}</span>
                        </td>
                        <td className="py-4">
                          <span className="block">
                            {start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-[10px] text-brand-brown/60 block mt-0.5">
                            {start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-4">{event.capacity} seats</td>
                        <td className="py-4">
                          <button
                            onClick={() => handlePublishToggle(event.id, event.published)}
                            title={event.published ? 'Hide event from catalogue' : 'Publish event to catalogue'}
                            className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                              event.published
                                ? 'bg-green-500/10 border-green-500/20 text-green-700'
                                : 'bg-brand-brown/5 border-brand-brown/15 text-brand-brown/70'
                            }`}
                          >
                            {event.published ? (
                              <>
                                <Eye className="w-3.5 h-3.5" /> Published
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" /> Drafted
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-4 pr-2 text-right">
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            title="Delete Event"
                            className="p-2 bg-brand-red/10 border border-brand-red/15 hover:bg-brand-red/25 text-brand-red rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
