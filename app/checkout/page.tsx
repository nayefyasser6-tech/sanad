"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/useCartStore";
import { useLangStore, dict } from "@/store/useLangStore";
import { createBrowserClient } from '@supabase/ssr';

export default function CheckoutPage() {
  const router = useRouter();
  const { lang } = useLangStore();
  const t = dict[lang] || dict['ar'];

  // إعداد عميل Supabase للمتصفح
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { items, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  
  // حساب السعر الإجمالي برمجياً
  const totalPrice = items.reduce((total: number, item: any) => {
    const itemPrice = typeof item.price === 'number' ? item.price : 0;
    const itemQty = typeof item.quantity === 'number' ? item.quantity : 1;
    return total + (itemPrice * itemQty);
  }, 0);

  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientCity, setRecipientCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [senderPhone, setSenderPhone] = useState("");

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (items.length === 0) {
      toast.error(t.checkoutToastEmptyCart, { id: 'empty-cart' });
      router.push("/cart");
    }
  }, [items.length, router]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const onlyNums = e.target.value.replace(/[^0-9]/g, '');
    setter(onlyNums);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const nameWords = recipientName.trim().split(/\s+/);
    if (nameWords.length < 3) {
      toast.error(t.checkoutToastNameError, { id: 'name-error' });
      return;
    }

    if (recipientPhone.length < 9) {
      toast.error(t.checkoutToastRecipientPhoneError, { id: 'phone-error' });
      return;
    }

    if (senderPhone.length < 9) {
      toast.error(t.checkoutToastSenderPhoneError, { id: 'sender-phone-error' });
      return;
    }

    if (!neighborhood.trim()) {
      toast.error(t.checkoutToastNeighborhoodError, { id: 'neighborhood-error' });
      return;
    }

    if (!recipientAddress.trim()) {
      toast.error(t.checkoutToastAddressError, { id: 'address-error' });
      return;
    }

    setLoading(true);
    toast.loading(t.checkoutToastSavingOrder, { id: 'save-order' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error(t.checkoutToastLoginRequired, { id: 'save-order' });
        router.push('/auth/login');
        return;
      }

      const fullAddress = `${neighborhood} - ${recipientAddress}`;

      // 1. حفظ الطلب في قاعدة البيانات
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          recipient_city: recipientCity,
          recipient_address: fullAddress,
          sender_name: user.user_metadata?.full_name || t.checkoutSenderFallbackName, 
          sender_phone: senderPhone,
          total_amount: totalPrice,
          status: 'pending' // الطلب قيد الانتظار حتى تؤكد بوابة الدفع
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      // 2. حفظ تفاصيل المنتجات في قاعدة البيانات
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. التجهيز لتحويل المستخدم إلى بوابة الدفع (Lemon Squeezy)
      toast.loading(t.checkoutToastPaymentPreparing, { id: 'save-order' });

      const paymentRes = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice,
          recipientName: recipientName,
          orderId: order.id 
        })
      });

      if (paymentRes.ok) {
        const data = await paymentRes.json();
        if (data.url) {
          // تفريغ السلة قبل المغادرة لأن الطلب تم حفظه
          clearCart();
          // توجيه المستخدم مباشرة إلى رابط Lemon Squeezy
          window.location.href = data.url; 
        } else {
          toast.error(t.checkoutToastPaymentUrlFail, { id: 'save-order' });
        }
      } else {
        toast.error(t.checkoutToastPaymentGatewayError, { id: 'save-order' });
      }

    } catch (error) {
      console.error("Error saving order:", error);
      toast.error(t.checkoutToastSaveOrderError, { id: 'save-order' });
    } finally {
      setLoading(false);
    }
  };

  if (!isClient || items.length === 0) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto backdrop-blur-xl bg-white/60 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 p-8 rounded-3xl shadow-xl">
        <h1 className="text-3xl font-black text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600 dark:from-orange-400 dark:to-yellow-400">
          {t.checkoutTitle}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-10">
          <section className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-gray-300 dark:border-slate-600 pb-3 text-slate-800 dark:text-slate-100">
              {t.checkoutRecipientSection}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="flex flex-col">
                <label className="mb-2 font-bold text-slate-700 dark:text-slate-300">{t.checkoutRecipientNameLabel}</label>
                <input 
                  type="text" 
                  required 
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="p-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all" 
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-2 font-bold text-slate-700 dark:text-slate-300">{t.checkoutRecipientPhoneLabel}</label>
                <input 
                  type="tel" 
                  required 
                  value={recipientPhone}
                  onChange={(e) => handlePhoneChange(e, setRecipientPhone)}
                  className="p-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all" 
                  dir="ltr"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-2 font-bold text-slate-700 dark:text-slate-300">{t.checkoutCityLabel}</label>
                <select 
                  required 
                  value={recipientCity}
                  onChange={(e) => setRecipientCity(e.target.value)}
                  className="p-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                >
                  <option value="">{t.checkoutCityPlaceholder}</option>
                  <option value="damascus">{t.checkoutCityDamascus}</option>
                  <option value="aleppo">{t.checkoutCityAleppo}</option>
                  <option value="homs">{t.checkoutCityHoms}</option>
                  <option value="hama">{t.checkoutCityHama}</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="mb-2 font-bold text-slate-700 dark:text-slate-300">{t.checkoutNeighborhoodLabel}</label>
                <input 
                  type="text" 
                  required 
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="p-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all" 
                />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="mb-2 font-bold text-slate-700 dark:text-slate-300">{t.checkoutAddressLabel}</label>
                <input 
                  type="text" 
                  required 
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="p-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all" 
                />
              </div>

            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-gray-300 dark:border-slate-600 pb-3 text-slate-800 dark:text-slate-100">
              {t.checkoutSenderSection}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="flex flex-col">
                <label className="mb-2 font-bold text-slate-700 dark:text-slate-300">{t.checkoutSenderPhoneLabel}</label>
                <input 
                  type="tel" 
                  required
                  value={senderPhone}
                  onChange={(e) => handlePhoneChange(e, setSenderPhone)}
                  className="p-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all" 
                  dir="ltr"
                />
              </div>
              
            </div>
          </section>

          <div className="border-t border-gray-300 dark:border-slate-600 pt-6 mt-8">
            <div className="flex justify-between items-center mb-8 px-2">
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{t.checkoutTotalLabel}</span>
              <span className="text-3xl font-black text-teal-600 dark:text-orange-400">${totalPrice.toFixed(2)}</span>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full text-white font-bold py-4 rounded-xl shadow-lg text-lg transition-transform duration-300 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-teal-500 to-blue-600 dark:from-orange-500 dark:to-yellow-500 hover:scale-[1.02]'}`}
            >
              {loading ? t.checkoutSaving : t.checkoutConfirmBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}