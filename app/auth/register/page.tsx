"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "../../../utils/supabase/client";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useLangStore, dict } from "@/store/useLangStore";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();
  const { lang } = useLangStore();
  const t = dict[lang] || dict['ar'];

  // 1. تعريف الحالات (States) لحفظ مدخلات المستخدم
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 2. دالة التسجيل بالبريد وكلمة المرور
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name, // تمرير الاسم ليتم حفظه في ملف المستخدم
        },
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t.registerToastSuccess);
      router.push("/"); // التوجيه للصفحة الرئيسية بعد التسجيل
    }
  };

  // دالة تسجيل الدخول بجوجل
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account'
        }
      },
    });

    if (error) {
      toast.error(t.loginToastGoogleError);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="glass-panel p-10 max-w-md w-full space-y-8 mt-10">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-slate-900">{t.registerTitle}</h1>
          <p className="text-slate-600 font-bold">{t.registerDesc}</p>
        </div>

        {/* 3. ربط النموذج بدالة التسجيل */}
        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-2">
            <label className="text-slate-800 font-bold">{t.registerNameLabel}</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.registerNamePlaceholder} 
              className="w-full px-4 py-3 rounded-xl bg-white/50 border border-slate-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-900"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-slate-800 font-bold">{t.loginEmailLabel}</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com" 
              className="w-full px-4 py-3 rounded-xl bg-white/50 border border-slate-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-900"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-slate-800 font-bold">{t.loginPasswordLabel}</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full px-4 py-3 rounded-xl bg-white/50 border border-slate-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-900"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className={`btn-primary w-full text-xl py-3 mt-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? t.registerSubmitLoading : t.registerSubmitBtn}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-slate-300"></div>
          <span className="px-4 text-slate-500 font-bold text-sm">{t.loginOrDivider}</span>
          <div className="flex-1 border-t border-slate-300"></div>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          type="button" 
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors shadow-sm"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t.loginGoogleBtn}
        </button>

        <div className="text-center text-slate-700 font-bold pt-2">
          {t.registerHasAccount}{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            {t.registerLoginLink}
          </Link>
        </div>
      </div>
    </div>
  );
}