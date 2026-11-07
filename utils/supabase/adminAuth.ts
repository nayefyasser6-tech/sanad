import { createHash, timingSafeEqual } from 'crypto';

export const ADMIN_COOKIE = 'admin_token';

// الرمز الذي يُحفظ بالكوكي (مشتق من كلمة المرور، ولا يكشفها)
export function getAdminToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHash('sha256').update(`sanad-admin:${password}`).digest('hex');
}

// التحقق من الكوكي
export function isValidAdminToken(token: string | undefined | null): boolean {
  const expected = getAdminToken();
  if (!expected || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// التحقق من كلمة المرور المكتوبة
export function isCorrectPassword(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(password).digest();
  return timingSafeEqual(a, b);
}