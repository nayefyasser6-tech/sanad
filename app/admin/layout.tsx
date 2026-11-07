"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  // 🔑 ضع كلمة المرور التي تريدها هنا
  const ADMIN_PASSWORD = "sanad2026"; 

  // للتحقق إذا كان الأدمن قد أدخل الرمز مسبقاً في هذه الجلسة حتى لا يطلبه عند كل تنقل داخلي
  useEffect(() => {
    const unlocked = sessionStorage.getItem("admin_unlocked");
    if (unlocked === "true") {
      setIsUnlocked(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsUnlocked(true);
      sessionStorage.setItem("admin_unlocked", "true"); // حفظ الفتح مؤقتاً
      setError(false);
    } else {
      setError(true);
      setPasswordInput("");
    }
  };

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
              {error && <p className="text-red-500 font-bold mt-2 text-sm">كلمة المرور خاطئة، حاول مرة أخرى!</p>}
            </div>
            
            <button
              type="submit"
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow hover:bg-slate-800 transition-all active:scale-95 text-lg"
            >
              فتح اللوحة
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