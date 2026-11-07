"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useLangStore, dict } from "@/store/useLangStore"; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const { lang } = useLangStore();
  const t = dict[lang] || dict['ar'];

  // نبدأ افتراضياً بأن المستخدم مسجل دخول (أو نقرأ من localStorage فوراً) لمنع ظهور الزر نهائياً عند التحميل
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function checkUser() {
      // فحص سريع جداً للجلسة
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      setIsReady(true);
    }

    checkUser();

    // الاستماع لأي تغير فوري في حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      setIsReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const charityImages = [
    "https://images.pexels.com/photos/6995201/pexels-photo-6995201.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/6994992/pexels-photo-6994992.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/8078401/pexels-photo-8078401.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/6647119/pexels-photo-6647119.jpeg?auto=compress&cs=tinysrgb&w=600"
  ];

  // إذا لم تكتمل الجاهزية، لا نرسم القسم الأخير نهائياً لحين التأكد
  if (!isReady) {
    return <div className="space-y-40 mb-32 w-full overflow-hidden"></div>;
  }

  return (
    <div className="space-y-40 mb-32 w-full overflow-hidden">
      
      {/* القسم الأول (1): البداية والدعوة للعطاء */}
      <section className="flex flex-col items-center justify-center text-center mt-12 px-4">
        <div className="glass-panel p-16 max-w-5xl w-full space-y-10 shadow-xl">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight">
            {t.heroTitle1} <br/>
            <span className="text-transparent bg-clip-text bg-btn-gradient pt-2 block">{t.heroTitle2}</span>
          </h1>
          <p className="text-slate-700 text-3xl font-bold leading-relaxed">
            {t.heroDesc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-4">
            <Link href="/build-box" className="btn-primary text-2xl px-12 py-5">
              {t.btnBuild}
            </Link>
            <Link href="/solar-panels" className="glass-panel px-12 py-5 text-2xl font-black text-slate-800 hover:text-primary transition-colors border-slate-400">
              {t.btnSolar}
            </Link>
          </div>
        </div>
      </section>

      {/* القسم الثاني (2): شريط الصور المتحرك للأعمال الخيرية */}
      <section className="w-full bg-slate-300/40 py-16 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 mb-10">
          <h2 className="text-4xl font-black text-slate-900 text-center">{t.marqueeTitle}</h2>
        </div>
        <div className="marquee-container">
          <div className="marquee-content gap-6 px-4">
            {[...charityImages, ...charityImages].map((imgSrc, idx) => (
              <div key={idx} className="w-[400px] h-[280px] rounded-3xl overflow-hidden flex-shrink-0 border-4 border-white shadow-lg">
                <img 
                  src={imgSrc} 
                  alt={`أعمال خيرية ${idx}`} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* القسم الثالث (3): كيف تصنع الفرق (آلية العمل) */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20 space-y-6">
          <h2 className="text-6xl font-black text-slate-900">{t.stepsTitle}</h2>
          <p className="text-3xl text-slate-600 font-bold">{t.stepsDesc}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="glass-panel p-12 text-center space-y-8">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-5xl font-black text-primary">1</div>
            <h3 className="text-4xl font-black text-slate-900">{t.step1Title}</h3>
            <p className="text-2xl text-slate-700 font-bold leading-relaxed">{t.step1Desc}</p>
          </div>
          <div className="glass-panel p-12 text-center space-y-8">
            <div className="w-24 h-24 bg-secondary/20 rounded-full flex items-center justify-center mx-auto text-5xl font-black text-secondary">2</div>
            <h3 className="text-4xl font-black text-slate-900">{t.step2Title}</h3>
            <p className="text-2xl text-slate-700 font-bold leading-relaxed">{t.step2Desc}</p>
          </div>
          <div className="glass-panel p-12 text-center space-y-8">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-5xl font-black text-primary">3</div>
            <h3 className="text-4xl font-black text-slate-900">{t.step3Title}</h3>
            <p className="text-2xl text-slate-700 font-bold leading-relaxed">{t.step3Desc}</p>
          </div>
        </div>
      </section>

      {/* القسم الرابع (4): شراكة المجتمع وفرق الدعم */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <h2 className="text-6xl font-black text-slate-900 leading-tight">{t.partnerTitle1} <br/> {t.partnerTitle2}</h2>
            <p className="text-slate-700 text-3xl font-bold leading-relaxed">
              {t.partnerDesc}
            </p>
            <ul className="text-2xl text-slate-800 font-black space-y-6">
              <li className="flex items-center gap-4">✅ {t.partnerLi1}</li>
              <li className="flex items-center gap-4">✅ {t.partnerLi2}</li>
              <li className="flex items-center gap-4">✅ {t.partnerLi3}</li>
            </ul>
          </div>
          <div className="relative h-[600px] rounded-3xl overflow-hidden shadow-orange-glow border-8 border-white">
             <img 
                src="https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&cs=tinysrgb&w=800" 
                alt="دعم مدني وخيري" 
                className="w-full h-full object-cover"
             />
          </div>
        </div>
      </section>

      {/* القسم الخامس (5): الأمان والثقة بالأرقام */}
      <section className="glass-panel max-w-6xl mx-auto p-20 text-center space-y-12">
        <h2 className="text-6xl font-black text-slate-900">{t.trustTitle}</h2>
        <p className="text-slate-700 text-3xl font-bold max-w-4xl mx-auto leading-relaxed">
          {t.trustDesc}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pt-10">
           <div className="flex flex-col items-center gap-4 text-slate-800">
             <span className="text-6xl font-black text-primary">+500</span>
             <span className="text-2xl font-bold">{t.stat1}</span>
           </div>
           <div className="flex flex-col items-center gap-4 text-slate-800">
             <span className="text-6xl font-black text-primary">24/7</span>
             <span className="text-2xl font-bold">{t.stat2}</span>
           </div>
           <div className="flex flex-col items-center gap-4 text-slate-800">
             <span className="text-6xl font-black text-primary">100%</span>
             <span className="text-2xl font-bold">{t.stat3}</span>
           </div>
           <div className="flex flex-col items-center gap-4 text-slate-800">
             <span className="text-6xl font-black text-primary">+50</span>
             <span className="text-2xl font-bold">{t.stat4}</span>
           </div>
        </div>
      </section>

      {/* القسم السادس (6): دعوة أخيرة للانطلاق (CTA) - لا يظهر أبداً إلا إذا أكدنا أنه غير مسجل */}
      {!isLoggedIn && (
        <section className="max-w-5xl mx-auto text-center space-y-12">
          <h2 className="text-6xl font-black text-slate-900">{t.ctaTitle}</h2>
          <p className="text-3xl text-slate-700 font-bold leading-relaxed">
            {t.ctaDesc}
          </p>
          <Link href="/auth/register" className="btn-primary text-3xl px-16 py-6 inline-block mt-4">
            {t.ctaBtn}
          </Link>
        </section>
      )}

    </div>
  );
}