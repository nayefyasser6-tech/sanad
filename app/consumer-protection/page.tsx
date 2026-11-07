"use client";
import { useLangStore, dict } from "@/store/useLangStore";

export default function ConsumerProtectionPage() {
  const { lang } = useLangStore();
  const t = dict[lang] || dict['ar'];

  return (
    <main className="min-h-screen bg-[#f1f5f9] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto glass-panel p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200 space-y-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 text-center">
          {t.consumerTitle}
        </h1>
        
        <div className="space-y-6 text-slate-700 font-medium leading-relaxed">
          <p>
            {t.consumerIntroBefore}<strong className="text-slate-900">{t.brandSanad}</strong>{t.consumerIntroAfter}
          </p>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-r-4 border-[#eab308] pr-3">{t.consumerSec1Title}</h2>
            <p>{t.consumerSec1Text}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-r-4 border-[#eab308] pr-3">{t.consumerSec2Title}</h2>
            <p>{t.consumerSec2Text}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-r-4 border-[#eab308] pr-3">{t.consumerSec3Title}</h2>
            <p>{t.consumerSec3Text}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-r-4 border-[#eab308] pr-3">{t.consumerSec4Title}</h2>
            <p>{t.consumerSec4Text}</p>
          </section>
        </div>
      </div>
    </main>
  );
}