"use client";
import { useLangStore, dict } from "@/store/useLangStore";

export default function TermsPage() {
  const { lang } = useLangStore();
  const t = dict[lang] || dict['ar'];

  return (
    <main className="min-h-screen bg-[#f1f5f9] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto glass-panel p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200 space-y-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 text-center">
          {t.termsTitle}
        </h1>
        
        <div className="space-y-6 text-slate-700 font-medium leading-relaxed">
          <p className="text-sm text-slate-500">{t.termsLastUpdated}</p>
          <p>
            {t.termsIntroBefore}<strong className="text-slate-900">{t.brandSanad}</strong>{t.termsIntroAfter}
          </p>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">{t.termsSec1Title}</h2>
            <p>{t.termsSec1Text}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">{t.termsSec2Title}</h2>
            <p>{t.termsSec2Text}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">{t.termsSec3Title}</h2>
            <p>{t.termsSec3Text}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">{t.termsSec4Title}</h2>
            <p>{t.termsSec4Text}</p>
          </section>
        </div>
      </div>
    </main>
  );
}