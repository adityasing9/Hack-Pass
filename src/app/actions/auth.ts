'use server';

import { createClient } from '@supabase/supabase-js';

// Initialize a supabase client with service role to bypass RLS for admin enrollment
export async function registerAdminAction(data: {
  userId: string;
  name: string;
  email: string;
  adminCode: string;
}) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
  );
  const { userId, name, email, adminCode } = data;

  const serverAdminCode = process.env.ADMIN_REGISTRATION_CODE || 'HACKPASS_ADMIN_2026';

  if (adminCode !== serverAdminCode) {
    return { success: false, error: 'Invalid admin registration code.' };
  }

  try {
    // Insert into public.admins using service role client
    const { error } = await supabaseAdmin
      .from('admins')
      .insert([
        {
          id: userId,
          name,
          email,
        },
      ]);

    if (error) {
      console.error('Error inserting admin record:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Admin action exception:', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}
