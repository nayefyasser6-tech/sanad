import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  getAdminToken,
  isCorrectPassword,
  isValidAdminToken,
} from '@/utils/adminAuth';

export const runtime = 'nodejs';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// هل الزائر مفتوح له؟
export async function GET(request: NextRequest) {
  const ok = isValidAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);
  return NextResponse.json({ ok });
}

// تسجيل الدخول بكلمة المرور
export async function POST(request: NextRequest) {
  const token = getAdminToken();
  if (!token) {
    // متغير ADMIN_PASSWORD غير موجود بإعدادات السيرفر
    return NextResponse.json({ ok: false, error: 'config' }, { status: 500 });
  }

  let password = '';
  try {
    const body = await request.json();
    password = String(body?.password || '');
  } catch {
    // body غير صالح
  }

  if (!isCorrectPassword(password)) {
    await sleep(800); // تأخير بسيط لإبطاء التخمين
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 ساعات
  });
  return res;
}

// تسجيل الخروج من اللوحة
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}