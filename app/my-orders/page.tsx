'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import toast from 'react-hot-toast';
import { useLangStore, dict } from '@/store/useLangStore';

export default function MyOrdersPage() {
  const supabase = createClient();
  const { lang } = useLangStore();
  const t = dict[lang] || dict['ar'];
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (data) setOrders(data);
    }
    setLoading(false);
  };

  // دالة إلغاء وحذف الطلب نهائياً من قاعدة البيانات والشاشة
  const handleCancelOrder = async (orderId: string, orderStatus: string) => {
    if (orderStatus !== 'pending' && orderStatus !== 'paid') {
      toast.error(t.myOrdersCancelNotAllowed);
      return;
    }

    if (!window.confirm(t.myOrdersCancelConfirm)) {
      return;
    }

    setCancellingId(orderId);
    
    // تنفيذ الحذف الفعلي من جدول orders في Supabase
    const { error, count } = await supabase
      .from('orders')
      .delete({ count: 'exact' })
      .eq('id', orderId);

    if (error) {
      console.error("Delete Error:", error.message);
      toast.error(t.myOrdersCancelError);
    } else {
      toast.success(t.myOrdersCancelSuccess);
      // تحديث الحالة المحلية فوراً لإزالة الطلب من الشاشة للأبد
      setOrders(prevOrders => prevOrders.filter(o => o.id !== orderId));
    }
    setCancellingId(null);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending': return { text: t.myOrdersStatusPending, color: 'bg-slate-100 text-slate-600 border-slate-200' };
      case 'paid': return { text: t.myOrdersStatusPaid, color: 'bg-orange-100 text-orange-700 border-orange-200' };
      case 'delivering': return { text: t.myOrdersStatusDelivering, color: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'delivered': return { text: t.myOrdersStatusDelivered, color: 'bg-green-100 text-green-700 border-green-200' };
      case 'cancelled': return { text: t.myOrdersStatusCancelled, color: 'bg-red-100 text-red-700 border-red-200' };
      default: return { text: status, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto pt-32 pb-20 px-4">
        <div className="flex items-center gap-3 mb-8">
          <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h1 className="text-3xl font-black text-slate-800">{t.myOrdersPageTitle}</h1>
        </div>

        {loading ? (
          <div className="text-center py-20 font-bold text-slate-400">{t.myOrdersLoading}</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <span className="text-6xl block mb-4">🛒</span>
            <h2 className="text-2xl font-black text-slate-800 mb-2">{t.myOrdersEmptyTitle}</h2>
            <p className="text-slate-500 mb-8">{t.myOrdersEmptyDesc}</p>
            <Link href="/" className="inline-block bg-orange-500 text-white font-bold px-8 py-3 rounded-xl hover:bg-orange-600 transition-colors">
              {t.myOrdersBrowseBtn}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => {
              const statusInfo = getStatusInfo(order.status);
              const canCancel = order.status === 'pending' || order.status === 'paid';

              return (
                <div key={order.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow">
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono font-bold text-slate-400">#{order.id.slice(0,8)}</span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-500">{t.myOrdersRecipientLabel}</p>
                      <p className="font-black text-lg text-slate-800">{order.recipient_name} <span className="text-sm font-bold text-orange-500">({order.recipient_city})</span></p>
                    </div>
                    
                    <div className="text-sm font-bold text-slate-600">
                      {t.myOrdersDateLabel} <span dir="ltr">{new Date(order.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between md:items-end border-t md:border-t-0 md:border-r border-slate-100 pt-4 md:pt-0 md:pr-6">
                    <div className="text-right">
                      <p className="text-sm text-slate-500 mb-1">{t.myOrdersTotalLabel}</p>
                      <p className="font-black text-3xl text-slate-800">${order.total_amount}</p>
                    </div>

                    {canCancel && (
                      <button
                        onClick={() => handleCancelOrder(order.id, order.status)}
                        disabled={cancellingId === order.id}
                        className="mt-4 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-bold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
                      >
                        {cancellingId === order.id ? t.myOrdersCancelling : t.myOrdersCancelBtn}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}