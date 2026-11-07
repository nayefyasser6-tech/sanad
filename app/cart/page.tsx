// app/cart/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useLangStore, dict } from "@/store/useLangStore";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();
  const { lang } = useLangStore();
  const t = dict[lang] || dict['ar'];

  // حل مشكلة الـ Hydration (لضمان تطابق تصيير السيرفر والعميل مع التخزين المحلي)
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null; // لا تعرض شيئاً حتى يتم التحميل على المتصفح

  const total = getTotal();

  return (
    <main className="min-h-screen bg-slate-100 py-20 px-4">
      <div className="max-w-6xl mx-auto mt-10">

        <h1 className="text-4xl font-black text-slate-900 mb-8">{t.cartTitle}</h1>

        {items.length === 0 ? (
          // حالة السلة الفارغة
          <div className="glass-panel text-center py-20 rounded-3xl">
            <svg className="w-24 h-24 mx-auto text-slate-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-3xl font-black text-slate-800 mb-4">{t.cartEmptyTitle}</h2>
            <p className="text-xl text-slate-500 font-bold mb-8">{t.cartEmptyDesc}</p>
            <div className="flex justify-center gap-4">
              <Link href="/build-box" className="px-8 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-primary transition-colors text-lg">
                {t.cartEmptyBuildBtn}
              </Link>
              <Link href="/solar-panels" className="px-8 py-3 border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-lg">
                {t.cartEmptySolarBtn}
              </Link>
            </div>
          </div>
        ) : (
          // حالة السلة الممتلئة
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* قائمة المنتجات */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <div key={item.id} className="glass-panel bg-white p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-6 shadow-sm">
                  {/* صورة المنتج */}
                  <div className="w-full sm:w-32 h-32 bg-slate-50 rounded-xl overflow-hidden shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />
                  </div>

                  {/* تفاصيل المنتج */}
                  <div className="flex-grow text-center sm:text-right">
                    <h3 className="text-xl font-black text-slate-800">{item.name}</h3>
                    <p className="text-2xl font-black text-primary mt-2">${item.price.toFixed(2)}</p>
                  </div>

                  {/* التحكم بالكمية والحذف */}
                  <div className="flex flex-col items-center gap-4 shrink-0 w-full sm:w-auto">
                    <div className="flex items-center justify-between w-32 h-10 border-2 border-slate-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-1/3 h-full bg-slate-50 hover:bg-slate-200 text-slate-800 font-black text-xl transition-colors"
                      >
                        -
                      </button>
                      <span className="w-1/3 h-full flex items-center justify-center font-black text-lg text-slate-900 bg-white border-x border-slate-200">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-1/3 h-full bg-slate-50 hover:bg-slate-200 text-slate-800 font-black text-xl transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 font-bold text-sm flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      {t.cartRemoveBtn}
                    </button>
                  </div>
                </div>
              ))}

              <div className="text-right">
                <button onClick={clearCart} className="text-slate-500 hover:text-slate-800 font-bold underline">
                  {t.cartClearBtn}
                </button>
              </div>
            </div>

            {/* ملخص الطلب */}
            <div className="lg:col-span-1">
              <div className="glass-panel bg-white p-8 rounded-3xl sticky top-24 shadow-md">
                <h3 className="text-2xl font-black text-slate-900 mb-6">{t.cartSummaryTitle}</h3>

                <div className="space-y-4 mb-6 text-lg font-bold text-slate-600">
                  <div className="flex justify-between">
                    <span>{t.cartItemsCount}</span>
                    <span>{items.reduce((acc, item) => acc + item.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.cartSubtotal}</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>{t.cartDeliveryFee}</span>
                    <span>{t.cartFree}</span>
                  </div>
                </div>

                <div className="border-t-2 border-slate-100 pt-6 mb-8 flex justify-between items-center">
                  <span className="text-xl font-black text-slate-900">{t.cartTotalLabel}</span>
                  <span className="text-4xl font-black text-primary">${total.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => router.push('/checkout')}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-black rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all text-xl"
                >
                  {t.cartCheckoutBtn}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}