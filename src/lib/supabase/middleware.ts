import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-project-url.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key';

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if needed
  const { data: { user } } = await supabase.auth.getUser();

  // If user is accessing student or admin routes and is not logged in, redirect to login
  const reqUrl = request.nextUrl.clone();
  
  if (!user && (reqUrl.pathname.startsWith('/student') || reqUrl.pathname.startsWith('/admin') || reqUrl.pathname === '/scanner')) {
    reqUrl.pathname = '/auth/login';
    return NextResponse.redirect(reqUrl);
  }

  // Check role permissions if logged in
  if (user) {
    // If user is logged in and trying to access auth pages, redirect to dashboard
    if (reqUrl.pathname.startsWith('/auth/')) {
      const { data: admin } = await supabase
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (admin) {
        reqUrl.pathname = '/admin/dashboard';
      } else {
        reqUrl.pathname = '/student/home';
      }
      return NextResponse.redirect(reqUrl);
    }

    // Protect Admin routes
    if (reqUrl.pathname.startsWith('/admin') || reqUrl.pathname === '/scanner') {
      const { data: admin } = await supabase
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!admin) {
        reqUrl.pathname = '/student/home';
        return NextResponse.redirect(reqUrl);
      }
    }

    // Protect Student routes
    if (reqUrl.pathname.startsWith('/student')) {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('id', user.id)
        .single();

      const { data: admin } = await supabase
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!student && !admin) {
        reqUrl.pathname = '/auth/register';
        return NextResponse.redirect(reqUrl);
      }
    }
  }

  return supabaseResponse;
}
