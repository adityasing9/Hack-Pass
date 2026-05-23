import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Initialize service role client to bypass RLS for write-critical check-in operations
export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
  );
  try {
    // 1. Authenticate scanner client (must be an admin)
    const supabaseUser = await createServerClient();
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user.' }, { status: 401 });
    }

    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Access denied. Administrator privileges required.' }, { status: 403 });
    }

    // 2. Parse request payload
    const { qrCode } = await request.json();

    if (!qrCode || typeof qrCode !== 'string') {
      return NextResponse.json({ status: 'INVALID QR', error: 'Missing QR code data.' });
    }

    // 3. Find ticket matching QR code
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('*, students(*), events(*)')
      .eq('qr_code', qrCode)
      .maybeSingle();

    if (ticketError || !ticket) {
      return NextResponse.json({ status: 'INVALID QR', error: 'Ticket QR code not registered.' });
    }

    const studentId = ticket.student_id;
    const eventId = ticket.event_id;
    const event = ticket.events;

    // Check if event has ended
    if (new Date(event.end_time) < new Date()) {
      return NextResponse.json({
        status: 'REENTRY BLOCKED',
        error: 'Registration expired. This event has already concluded.',
        studentName: ticket.students.name,
      });
    }

    // 4. Find student's active attendance session (where exit_time is NULL)
    const { data: activeSession } = await supabaseAdmin
      .from('attendance_sessions')
      .select('*')
      .eq('student_id', studentId)
      .eq('event_id', eventId)
      .is('exit_time', null)
      .order('entry_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 5. Flow State Control
    if (activeSession) {
      // Student is inside -> TRIGGER EXIT FLOW
      const exitTime = new Date();
      const entryTime = new Date(activeSession.entry_time);
      const durationMinutes = Math.max(
        Math.round((exitTime.getTime() - entryTime.getTime()) / 60000),
        1
      );

      // Close the session
      await supabaseAdmin
        .from('attendance_sessions')
        .update({
          exit_time: exitTime.toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq('id', activeSession.id);

      // Recalculate total minutes and status
      const { data: completedSessions } = await supabaseAdmin
        .from('attendance_sessions')
        .select('duration_minutes')
        .eq('student_id', studentId)
        .eq('event_id', eventId)
        .not('exit_time', 'is', null);

      const totalMinutes = completedSessions?.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) || 0;
      
      const eventDuration = Math.round(
        (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000
      );
      
      const percent = Math.min(Math.round((totalMinutes / eventDuration) * 100), 100);
      const status = percent >= Number(event.attendance_threshold) ? 'PRESENT' : 'ABSENT';

      await supabaseAdmin
        .from('attendance_summary')
        .upsert(
          {
            student_id: studentId,
            event_id: eventId,
            total_minutes: totalMinutes,
            attendance_percent: percent,
            status: status,
          },
          { onConflict: 'student_id,event_id' }
        );

      return NextResponse.json({
        status: 'VALID EXIT',
        studentName: ticket.students.name,
        usn: ticket.students.usn,
        eventTitle: event.title,
        percent,
        totalMinutes,
      });

    } else {
      // Student is outside -> TRIGGER ENTRY OR REENTRY FLOW
      // Get all completed sessions count
      const { data: completedSessions, count: sessionsCount } = await supabaseAdmin
        .from('attendance_sessions')
        .select('id', { count: 'exact', head: false })
        .eq('student_id', studentId)
        .eq('event_id', eventId)
        .not('exit_time', 'is', null);

      const count = sessionsCount || 0;

      if (count === 0) {
        // First entry
        await supabaseAdmin
          .from('attendance_sessions')
          .insert([
            {
              student_id: studentId,
              event_id: eventId,
              entry_time: new Date().toISOString(),
            },
          ]);

        await supabaseAdmin
          .from('attendance_summary')
          .upsert(
            {
              student_id: studentId,
              event_id: eventId,
              status: 'INSIDE',
            },
            { onConflict: 'student_id,event_id' }
          );

        return NextResponse.json({
          status: 'VALID ENTRY',
          studentName: ticket.students.name,
          usn: ticket.students.usn,
          eventTitle: event.title,
        });

      } else {
        // Re-entry check
        if (!event.allow_reentry) {
          return NextResponse.json({
            status: 'REENTRY BLOCKED',
            error: 'Re-entry policy is disabled for this event.',
            studentName: ticket.students.name,
          });
        }

        if (count > event.max_reentry) {
          return NextResponse.json({
            status: 'REENTRY BLOCKED',
            error: `Maximum re-entries reached (${event.max_reentry} limit).`,
            studentName: ticket.students.name,
          });
        }

        // Allow re-entry
        await supabaseAdmin
          .from('attendance_sessions')
          .insert([
            {
              student_id: studentId,
              event_id: eventId,
              entry_time: new Date().toISOString(),
            },
          ]);

        await supabaseAdmin
          .from('attendance_summary')
          .upsert(
            {
              student_id: studentId,
              event_id: eventId,
              status: 'INSIDE',
            },
            { onConflict: 'student_id,event_id' }
          );

        return NextResponse.json({
          status: 'REENTRY SUCCESS',
          studentName: ticket.students.name,
          usn: ticket.students.usn,
          eventTitle: event.title,
          count,
        });
      }
    }
  } catch (err: any) {
    console.error('Verify API error:', err);
    return NextResponse.json({ error: err.message || 'Verification system exception.' }, { status: 500 });
  }
}
