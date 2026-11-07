"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLangStore, dict } from "@/store/useLangStore";

export default function Footer() {
  const pathname = usePathname();
  const { lang } = useLangStore();
  const t = dict[lang] || dict['ar'];

  // إخفاء الفوتر في مسارات الإدارة والتجار
  if (pathname.startsWith('/admin') || pathname.startsWith('/provider')) {
    return null;
  }

  return (
    <footer className="glass-panel mt-auto border-t border-white/60">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-right">

        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="relative bg-white rounded-full p-1 border border-slate-200 shadow-sm">
              <Image src="/logo.png" alt="سَنَد" width={55} height={55} className="object-cover rounded-full" />
            </div>
            <span className="text-4xl font-black text-transparent bg-clip-text bg-btn-gradient">{t.brandSanad}</span>
          </div>
          <p className="text-slate-800 font-bold text-xl mt-1">
            © {new Date().getFullYear()} {t.brandSanad}. {t.footerAllRights}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 text-slate-700 font-extrabold text-xl">
          <Link href="/privacy" className="hover:text-primary transition-colors">{t.footerPrivacy}</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">{t.footerTerms}</Link>
          <Link href="/consumer-protection" className="hover:text-primary transition-colors">{t.footerConsumer}</Link>
          <Link href="/about" className="hover:text-primary transition-colors">{t.about}</Link>
          <Link href="/contact" className="hover:text-primary transition-colors">{t.contact}</Link>
        </div>

      </div>
    </footer>
  );
}