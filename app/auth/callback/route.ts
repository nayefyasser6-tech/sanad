import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    // تبادل الرمز السري بجلسة مستخدم صالحة
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // توجيه المستخدم للصفحة الرئيسية بعد نجاح تسجيل الدخول
      return NextResponse.redirect(`${origin}/`)
    }
  }

  // في حال حدوث خطأ، أعد توجيهه لصفحة الدخول
  return NextResponse.redirect(`${origin}/auth/login?error=true`)
}