"use client";
import { useLangStore, dict } from "@/store/useLangStore";

export default function PrivacyPolicyPage() {
  const { lang } = useLangStore();
  const t = dict[lang] || dict['ar'];

  return (
    <main className="min-h-screen bg-[#f1f5f9] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto glass-panel p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200 space-y-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 text-center">
          {t.privacyTitle}
        </h1>
        
        <div className="space-y-6 text-slate-700 font-medium leading-relaxed">
          <p>
            {t.privacyIntroBefore}<strong className="text-slate-900">{t.brandSanad}</strong>{t.privacyIntroAfter}
          </p>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">{t.privacySec1Title}</h2>
            <ul className="list-disc list-inside space-y-2 pr-4 text-slate-700">
              <li><strong>{t.privacySec1Li1Bold}</strong>{t.privacySec1Li1Text}</li>
              <li><strong>{t.privacySec1Li2Bold}</strong>{t.privacySec1Li2Text}</li>
              <li><strong>{t.privacySec1Li3Bold}</strong>{t.privacySec1Li3Text}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">{t.privacySec2Title}</h2>
            <p>{t.privacySec2Text}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">{t.privacySec3Title}</h2>
            <p>{t.privacySec3Text}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">{t.privacySec4Title}</h2>
            <p>{t.privacySec4Text}</p>
          </section>
        </div>
      </div>
    </main>
  );
}