"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "../utils/supabase/client";
import { useCartStore } from "@/store/useCartStore"; 
import { useRouter, usePathname } from "next/navigation";
import { useLangStore, dict } from "@/store/useLangStore"; 

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [merchantStatus, setMerchantStatus] = useState<string | null>(null);
  const [hasTelegramId, setHasTelegramId] = useState<boolean>(false);
  
  const supabase = createClient();
  const router = useRouter();
  
  const itemsCount = useCartStore((state) => state.items.length);
  const [mounted, setMounted] = useState(false);

  const { lang, toggleLang } = useLangStore();
  const t = dict[lang] || dict['ar']; 

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    setMounted(true);
    const checkUserAndMerchant = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        // تحميل السلة من قاعدة البيانات فور تسجيل الدخول
        useCartStore.getState().loadCartFromSupabase();

        const { data: merchantData } = await supabase
          .from('merchants')
          .select('status, telegram_chat_id')
          .eq('user_id', currentUser.id)
          .single();

        if (merchantData) {
          setMerchantStatus(merchantData.status);
          setHasTelegramId(!!merchantData.telegram_chat_id);
        }
      }
    };

    checkUserAndMerchant();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        // تحميل السلة من قاعدة البيانات عند تغير الحالة لدخول
        useCartStore.getState().loadCartFromSupabase();

        const { data: merchantData } = await supabase
          .from('merchants')
          .select('status, telegram_chat_id')
          .eq('user_id', currentUser.id)
          .single();
        if (merchantData) {
          setMerchantStatus(merchantData.status);
          setHasTelegramId(!!merchantData.telegram_chat_id);
        }
      } else {
        setMerchantStatus(null);
        setHasTelegramId(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // استخدام clearLocalCart لتفريغ الشاشة محلياً فقط والحفاظ على السلة في قاعدة البيانات للمستخدم
    useCartStore.getState().clearLocalCart(); 
    setIsOpen(false);
    router.push('/auth/login'); 
  };

  if (pathname.startsWith('/admin') || pathname.startsWith('/provider')) {
    return null;
  }

  // أزرار التاجر: "انضم إلينا" فقط هي المترجمة، والباقي ثابت بالعربية
  const renderMerchantLink = (isMobile: boolean = false) => {
    const baseClasses = isMobile ? "text-base block" : "font-extrabold text-sm px-2 transition-colors";
    
    if (!user || (!merchantStatus)) {
      return <Link href="/join-merchant" onClick={() => setIsOpen(false)} className={`${baseClasses} ${isMobile ? 'text-orange-600' : 'text-slate-800 hover:text-primary'}`}>{t.join}</Link>;
    }
    if (merchantStatus === 'pending') {
      return <Link href="/join-merchant" onClick={() => setIsOpen(false)} className={`${isMobile ? 'text-orange-600' : 'bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg border border-orange-200'} font-bold text-xs`}>⏳ قيد المراجعة</Link>;
    }
    if (merchantStatus === 'approved' && !hasTelegramId) {
      return <Link href="/join-merchant" onClick={() => setIsOpen(false)} className={`${isMobile ? 'text-red-600' : 'bg-red-100 text-red-700 px-3 py-1.5 rounded-lg border border-red-200 animate-pulse'} font-bold text-xs`}>⚠️ إكمال التفعيل</Link>;
    }
    if (merchantStatus === 'approved' && hasTelegramId) {
      return <Link href="/provider" onClick={() => setIsOpen(false)} className={`${isMobile ? 'text-green-600' : 'bg-green-100 text-green-700 px-3 py-1.5 rounded-lg border border-green-200'} font-bold text-xs`}>✅ لوحة التاجر</Link>;
    }
    return null;
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="max-w-7xl mx-auto glass-panel px-6 py-3 flex items-center justify-between shadow-sm">
          <Link href="/" className="flex items-center gap-3 hover:scale-105 transition-transform duration-300">
            <div className="relative bg-white rounded-full p-1 border border-slate-200">
              <Image src="/logo.png" alt="سَنَد" width={55} height={55} className="object-cover rounded-full" />
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-lg font-bold text-slate-700 tracking-wide">
            <Link href="/build-box" className="hover:text-[#f97316] transition-colors">{t.buildBox}</Link>
            <Link href="/solar-panels" className="hover:text-[#f97316] transition-colors">{t.solarPanels}</Link>
            <Link href="/about" className="hover:text-[#f97316] transition-colors">{t.about}</Link>
            <Link href="/contact" className="hover:text-[#f97316] transition-colors">{t.contact}</Link>
            <Link href="/my-orders" className="hover:text-[#f97316] transition-colors">{t.myOrders}</Link>
          </div>

          <div className="hidden lg:flex items-center gap-5">
            <button 
              onClick={toggleLang}
              className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-black text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
            >
              🌐 {lang === 'ar' ? 'EN' : 'AR'}
            </button>

            {renderMerchantLink(false)}

            {user ? (
              <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-600 max-w-[120px] truncate">{user.email}</span>
                <button onClick={handleLogout} className="btn-primary py-1 px-3 text-xs !bg-red-500 hover:!bg-red-600 rounded-md">{t.logout}</button>
              </div>
            ) : (
              <Link href="/auth/login" className="btn-primary py-1.5 px-5 text-sm rounded-lg">{t.login}</Link>
            )}
          </div>

          <div className="lg:hidden flex items-center gap-4">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-800 focus:outline-none">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />}
              </svg>
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="lg:hidden mt-4 flex flex-col gap-5 text-lg font-bold text-slate-700 border-t border-slate-200 pt-5 pb-4 glass-panel px-6 rounded-2xl">
            <Link href="/build-box" className="hover:text-[#f97316]" onClick={() => setIsOpen(false)}>{t.buildBox}</Link>
            <Link href="/solar-panels" className="hover:text-[#f97316]" onClick={() => setIsOpen(false)}>{t.solarPanels}</Link>
            <Link href="/about" className="hover:text-[#f97316]" onClick={() => setIsOpen(false)}>{t.about}</Link>
            <Link href="/contact" className="hover:text-[#f97316]" onClick={() => setIsOpen(false)}>{t.contact}</Link>
            <Link href="/my-orders" className="hover:text-[#f97316]" onClick={() => setIsOpen(false)}>{t.myOrders}</Link>
            
            {renderMerchantLink(true)}

            <div className="flex flex-col gap-4 mt-2 border-t border-slate-200 pt-4">
              <button 
                onClick={toggleLang}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-black text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                🌐 {lang === 'ar' ? 'English' : 'عربي'}
              </button>

              {user ? (
                <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-lg text-center border border-slate-200">
                  <span className="text-xs font-bold text-slate-600">{user.email}</span>
                  <button onClick={handleLogout} className="btn-primary py-2 px-6 !bg-red-500 hover:!bg-red-600 text-sm rounded-lg">{t.logout}</button>
                </div>
              ) : (
                <Link href="/auth/login" className="btn-primary py-2 px-6 text-center rounded-lg" onClick={() => setIsOpen(false)}>{t.login}</Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <Link href="/cart" className="fixed bottom-6 left-6 z-50 bg-[#f97316] text-white p-4 rounded-full shadow-xl hover:bg-orange-600 transition-all flex items-center justify-center">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {mounted && itemsCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
            {itemsCount}
          </span>
        )}
      </Link>
    </>
  );
}