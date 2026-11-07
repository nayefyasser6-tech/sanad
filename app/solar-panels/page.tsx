"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/useCartStore";
import { useLangStore, dict } from "@/store/useLangStore";
import { createClient } from "@/utils/supabase/client";

type SolarPackage = {
  id: string | number;
  name: string;
  name_en?: string;
  price: number;
  image: string;
  specs: string[];
  specs_en?: string[];
};

function SolarCard({ packageData }: { packageData: SolarPackage }) {
  const { lang } = useLangStore();
  const t = dict[lang] || dict['ar'];
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();

  // رفعنا السطر للأعلى ليتم استخدامه داخل دالة الإضافة
  const packageName = lang === 'en' && packageData.name_en ? packageData.name_en : packageData.name;
  const rawSpecs = lang === 'en' && packageData.specs_en && packageData.specs_en.length > 0 ? packageData.specs_en : (packageData.specs || []);
  const packageSpecs = Array.isArray(rawSpecs) ? rawSpecs : [];

  const handleAddToCart = () => {
    // التمرير الصريح للبيانات
    const success = addItem({
      id: String(packageData.id),
      name: packageName,
      price: Number(packageData.price),
      image: packageData.image || '',
    }, 1);
    
    const toastId = "cart-status-toast";
    if (success) toast.success(t.solarAddedSuccess, { id: toastId });
    else toast.error(t.solarAlreadyInCart, { id: toastId });
  };

  const handleBuyNow = () => {
    addItem({
      id: String(packageData.id),
      name: packageName,
      price: Number(packageData.price),
      image: packageData.image || '',
    }, 1);
    router.push("/checkout");
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col bg-white border border-slate-200">
      <div className="h-64 w-full overflow-hidden relative">
        <img 
          src={packageData.image} 
          alt={packageName} 
          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur text-white px-4 py-1 rounded-full font-bold">
          {t.inclusiveInstall}
        </div>
      </div>
      <div className="p-8 flex flex-col flex-grow rtl:text-right ltr:text-left border-t border-slate-100 space-y-6">
        <div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">{packageName}</h3>
          <span className="text-4xl font-black text-primary">${Number(packageData.price).toFixed(2)}</span>
        </div>
        <ul className="space-y-3 flex-grow text-slate-700 font-bold">
          {packageSpecs.map((spec, index) => (
            <li key={index} className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span>{spec}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3 mt-auto pt-4">
          <button onClick={handleBuyNow} className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-xl shadow hover:shadow-lg transition-all active:scale-95 text-lg">
            {t.btnSendNow}
          </button>
          <button onClick={handleAddToCart} className="w-full py-3 font-bold rounded-xl transition-all active:scale-95 text-lg border-2 bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200">
            {t.btnAddToCart}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SolarPanelsPage() {
  const { lang } = useLangStore();
  const t = dict[lang] || dict['ar'];
  const supabase = createClient();
  
  const [packages, setPackages] = useState<SolarPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSolarPackages = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'energy')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching energy products:", error);
      } else if (data) {
        const mapped: SolarPackage[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          name_en: p.name_en,
          price: p.price,
          image: p.image_url || p.image,
          specs: String(p.description || "")
            .split("\n")
            .map((s: string) => s.trim())
            .filter(Boolean),
          specs_en: String(p.description_en || "")
            .split("\n")
            .map((s: string) => s.trim())
            .filter(Boolean),
        }));
        setPackages(mapped);
      }
      setLoading(false);
    };
    fetchSolarPackages();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-slate-100 py-20 px-4">
      <div className="max-w-7xl mx-auto space-y-16 mt-10">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black text-slate-900">
            {t.solarPageTitle1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">{t.solarPageTitle2}</span>
          </h1>
          <p className="text-2xl text-slate-600 font-bold max-w-3xl mx-auto leading-relaxed">{t.solarPageDesc}</p>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-20 text-2xl font-bold text-slate-600">لا توجد باقات طاقة مضافة حالياً.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {packages.map((pkg) => <SolarCard key={pkg.id} packageData={pkg} />)}
          </div>
        )}
      </div>
    </main>
  );
}