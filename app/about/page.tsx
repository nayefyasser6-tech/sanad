'use client';

import { useLangStore, dict } from "@/store/useLangStore";

export default function AboutPage() {
  const { lang } = useLangStore();
  const t = dict[lang] || dict['ar'];

  return (
    <main className="min-h-screen bg-[#f1f5f9] py-12 px-4 sm:px-6 lg:px-8 w-full overflow-hidden">
      <div className="max-w-4xl mx-auto glass-panel p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200 space-y-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 text-center">
          {t.aboutPageTitle} <span className="text-[#f97316]">{t.aboutSanad}</span>
        </h1>
        
        <div className="space-y-6 text-slate-700 font-medium leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 rtl:border-r-4 ltr:border-l-4 rtl:border-l-0 border-[#f97316] rtl:pr-3 ltr:pl-3">
              {t.whoWeAre}
            </h2>
            <p>
              {t.whoWeAreText1}<strong>{t.whoWeAreSanadBold}</strong>{t.whoWeAreText2}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 rtl:border-r-4 ltr:border-l-4 rtl:border-l-0 border-[#f97316] rtl:pr-3 ltr:pl-3">
              {t.missionTitle}
            </h2>
            <p>
              {t.missionText}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 rtl:border-r-4 ltr:border-l-4 rtl:border-l-0 border-[#f97316] rtl:pr-3 ltr:pl-3">
              {t.whySanadTitle}
            </h2>
            <ul className="list-disc list-inside space-y-2 rtl:pr-4 ltr:pl-4 text-slate-700">
              <li><strong>{t.why1Title}</strong> {t.why1Text}</li>
              <li><strong>{t.why2Title}</strong> {t.why2Text}</li>
              <li><strong>{t.why3Title}</strong> {t.why3Text}</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}