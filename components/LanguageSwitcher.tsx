'use client';

import { useLocale } from 'next-intl';

export default function LanguageSwitcher() {
  const locale = useLocale();

  const toggleLanguage = () => {
    // تحديد اللغة العكسية
    const nextLocale = locale === 'ar' ? 'en' : 'ar';
    
    // حفظ اللغة الجديدة في الكوكيز ليقرأها الميدل وير
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;
    
    // إعادة تحميل الصفحة لتحديث الاتجاه والترجمة فوراً
    window.location.reload();
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center min-w-[120px]"
    >
      {locale === 'ar' ? 'EN | الإنجليزية' : 'عربي | AR'}
    </button>
  );
}