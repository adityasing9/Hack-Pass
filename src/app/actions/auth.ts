'use server';

import { createClient } from '@supabase/supabase-js';

const getAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
  );

// Admin registration: creates auth user (auto-confirmed) + admin profile
export async function registerAdminAction(data: {
  name: string;
  email: string;
  password: string;
  adminCode: string;
}) {
  const supabaseAdmin = getAdminClient();
  const { name, email, password, adminCode } = data;

  const serverAdminCode = process.env.ADMIN_REGISTRATION_CODE || 'HACKPASS_ADMIN_2026';

  if (adminCode !== serverAdminCode) {
    return { success: false, error: 'Invalid admin registration code.' };
  }

  try {
    // Use admin API to create user with auto-confirm (bypasses email confirmation)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      console.error('Error creating admin auth user:', createError);
      return { success: false, error: createError.message };
    }

    // Insert admin profile
    const { error: insertError } = await supabaseAdmin
      .from('admins')
      .insert([
        {
          id: userData.user.id,
          name,
          email,
        },
      ]);

    if (insertError) {
      console.error('Error inserting admin record:', insertError);
      // Clean up the auth user if profile insert fails
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Admin action exception:', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

// Student registration: creates auth user (auto-confirmed) + student profile
export async function registerStudentAction(data: {
  name: string;
  email: string;
  password: string;
  usn: string;
  dept: string;
  year: number;
  phone: string;
}) {
  const supabaseAdmin = getAdminClient();
  const { name, email, password, usn, dept, year, phone } = data;

  try {
    // Use admin API to create user with auto-confirm
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      console.error('Error creating student auth user:', createError);
      return { success: false, error: createError.message };
    }

    // Insert student profile
    const { error: insertError } = await supabaseAdmin
      .from('students')
      .insert([
        {
          id: userData.user.id,
          usn: usn.toUpperCase().trim(),
          name,
          email,
          dept,
          year: Number(year),
          phone,
        },
      ]);

    if (insertError) {
      console.error('Error inserting student record:', insertError);
      // Clean up auth user if profile insert fails
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Student action exception:', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}
