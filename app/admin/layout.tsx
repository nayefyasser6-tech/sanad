"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // نسأل السيرفر إذا كان الزائر مفتوح له مسبقاً
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/admin-auth", { cache: "no-store" });
        const data = await res.json();
        setIsUnlocked(Boolean(data?.ok));
      } catch {
        setIsUnlocked(false);
      }
      setChecking(false);
    };
    check();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });

      if (res.ok) {
        setIsUnlocked(true);
      } else if (res.status === 500) {
        setError("إعدادات السيرفر ناقصة (ADMIN_PASSWORD غير موجود).");
        setPasswordInput("");
      } else {
        setError("كلمة المرور خاطئة، حاول مرة أخرى!");
        setPasswordInput("");
      }
    } catch {
      setError("حدث خطأ في الاتصال بالخادم.");
    }

    setSubmitting(false);
  };

  // أثناء التحقق لا نعرض شيئاً (حتى لا تظهر شاشة القفل للحظة)
  if (checking) return null;

  // إذا لم يتم إدخال الرمز الصحيح، اعرض شاشة القفل فقط
  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">قفل الإدارة</h2>
          <p className="text-slate-500 mb-8 font-bold">الرجاء إدخال كلمة المرور للوصول إلى لوحة التحكم</p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="كلمة المرور..."
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-500 focus:ring-0 outline-none text-center text-xl font-bold transition-colors"
                autoFocus
              />
              {error && <p className="text-red-500 font-bold mt-2 text-sm">{error}</p>}
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow hover:bg-slate-800 transition-all active:scale-95 text-lg disabled:opacity-50"
            >
              {submitting ? "جاري التحقق..." : "فتح اللوحة"}
            </button>
          </form>
          
          <button 
            onClick={() => router.push('/')}
            className="mt-6 text-slate-400 font-bold hover:text-slate-600 text-sm"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  // إذا تم إدخال الرمز بنجاح، اعرض محتوى الإدارة
  return <>{children}</>;
}