import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  
  console.log('🔍 Auth callback called with:', { 
    code: code ? 'present' : 'missing', 
    origin, 
    next,
    fullUrl: request.url 
  });

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: { [key: string]: unknown }) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: { [key: string]: unknown }) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('❌ Auth error:', error);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }
    
    console.log('✅ Code exchange successful');
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 User after auth:', user ? 'authenticated' : 'not authenticated');
    
    if (user) {
      // Check if profile exists, create if not
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        console.log('📝 Creating new profile for user');
        await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            onboarding_completed: false,
            timezone: 'UTC',
          });
      } else {
        console.log('👤 Profile already exists');
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}${next}`);
}
