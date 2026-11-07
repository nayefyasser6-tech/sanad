'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ProviderDashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [merchant, setMerchant] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('orders');
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [parsedItems, setParsedItems] = useState<any[]>([]);

  useEffect(() => {
    checkAccessAndFetchData();
    
    const interval = setInterval(() => {
      if (merchant) fetchOrders(merchant.city, false);
    }, 15000);

    return () => clearInterval(interval);
  }, [merchant?.city]);

  const checkAccessAndFetchData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      router.push('/auth/login');
      return;
    }

    const { data: merchantData, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error || !merchantData || merchantData.status !== 'approved') {
      toast.error('ليس لديك صلاحية للوصول إلى لوحة التجار');
      router.push('/');
      return;
    }

    setMerchant(merchantData);
    await fetchOrders(merchantData.city, true);
  };

  const fetchOrders = async (city: string, showLoading: boolean) => {
    if (showLoading) setLoading(true);
    
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('recipient_city', city)
      .neq('status', 'pending')
      .order('created_at', { ascending: false });

    if (data) setOrders(data);
    if (showLoading) setLoading(false);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
      toast.error('حدث خطأ أثناء تحديث حالة الطلب');
    } else {
      toast.success('تم تحديث حالة الطلب بنجاح');
      fetchOrders(merchant.city, false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  // وظيفة ذكية لاستخراج المنتجات من قاعدة البيانات بأي صيغة كانت
  const handleOpenDetails = (order: any) => {
    let items = [];
    try {
      const rawData = order.items || order.cart_items || order.products;
      if (typeof rawData === 'string') {
        items = JSON.parse(rawData);
      } else if (Array.isArray(rawData)) {
        items = rawData;
      }
    } catch (e) {
      console.error("خطأ في قراءة المنتجات", e);
    }
    setParsedItems(items);
    setSelectedOrder(order);
  };

  if (loading && !merchant) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-xl text-slate-500">جاري تحميل لوحة التاجر...</div>;
  }

  return (
    <div className="absolute top-0 right-0 w-full min-h-screen bg-slate-50 z-50 flex" dir="rtl">
      
      <aside className="w-[280px] bg-slate-900 text-slate-300 flex flex-col h-screen fixed right-0 top-0 border-l border-slate-800 z-50 shadow-2xl">
        <div className="p-8 pb-6 border-b border-slate-800">
          <span className="text-3xl font-black text-white tracking-wide">سَنَد</span>
          <span className="text-sm font-bold text-orange-500 block mt-2">لوحة التاجر | {merchant?.city}</span>
        </div>
        
        <div className="p-6 border-b border-slate-800 bg-slate-800/50">
          <p className="text-white font-bold text-lg">{merchant?.full_name}</p>
          <p className="text-slate-400 text-xs mt-1">{merchant?.store_name || merchant?.store_type}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4 flex flex-col">
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 text-right p-4 rounded-xl transition-all duration-200 text-sm font-bold ${activeTab === 'orders' ? 'bg-orange-500 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            الطلبات الواردة
          </button>

          <div className="mt-auto pt-8">
            <Link href="/" className="w-full flex items-center gap-3 text-right p-4 rounded-xl transition-all duration-200 text-sm font-bold hover:bg-slate-800 hover:text-white text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              العودة للموقع الرئيسي
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-slate-800 text-slate-400 font-bold p-3 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <main className="flex-1 min-h-screen p-8 mr-[280px] relative">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              📦 إدارة طلبات الزبائن في مدينة ({merchant?.city})
            </h2>
            <div className="bg-orange-100 text-orange-700 font-bold px-4 py-2 rounded-lg text-sm border border-orange-200">
              إجمالي الطلبات: {orders.length}
            </div>
          </div>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-4">📭</span>
                <p className="text-slate-500 font-bold">لا توجد طلبات مدفوعة لمدينتك حتى الآن.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-sm">
                      <th className="p-4 border-b rounded-tr-lg">رقم الطلب</th>
                      <th className="p-4 border-b">اسم المستلم</th>
                      <th className="p-4 border-b">العنوان ورقم الهاتف</th>
                      <th className="p-4 border-b">المنتجات</th>
                      <th className="p-4 border-b">المبلغ</th>
                      <th className="p-4 border-b rounded-tl-lg">حالة الطلب (تحديث)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono text-xs font-bold text-slate-500">{order.id.slice(0, 8)}</td>
                        <td className="p-4 font-black text-slate-800">{order.recipient_name}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-700 mb-1">{order.recipient_address}</p>
                          <p className="text-slate-500 font-mono text-xs" dir="ltr">{order.recipient_phone}</p>
                        </td>
                        <td className="p-4">
                          {/* زر عرض التفاصيل المحسّن بالهوية البصرية */}
                          <button 
                            onClick={() => handleOpenDetails(order)}
                            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-3 rounded-lg text-xs transition-colors border border-slate-200 shadow-sm"
                          >
                            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            التفاصيل
                          </button>
                        </td>
                        <td className="p-4 font-black text-orange-600">${order.total_amount}</td>
                        <td className="p-4">
                          <select 
                            value={order.status} 
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className={`border-2 rounded-lg p-2 text-xs font-bold outline-none cursor-pointer shadow-sm ${
                              order.status === 'paid' ? 'border-orange-300 bg-orange-50 text-orange-700' : 
                              order.status === 'delivering' ? 'border-blue-300 bg-blue-50 text-blue-700' : 
                              'border-green-300 bg-green-50 text-green-700'
                            }`}
                          >
                            <option value="paid">مدفوع (بانتظار التجهيز)</option>
                            <option value="delivering">قيد التوصيل للمستلم</option>
                            <option value="delivered">تم التسليم بنجاح</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* النافذة المنبثقة (Modal) لعرض تفاصيل الطلب */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border border-slate-200">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                  تفاصيل المنتجات 
                  <span className="text-slate-400 text-sm font-mono block">#{selectedOrder.id.slice(0, 8)}</span>
                </h3>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-red-500 transition-colors p-1 bg-white rounded-lg shadow-sm border border-slate-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  {parsedItems.length > 0 ? (
                    parsedItems.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                          <h4 className="font-bold text-slate-800">{item.name || item.title || 'منتج'}</h4>
                          <p className="text-slate-500 text-sm mt-1">الكمية المطلوبة: <span className="font-bold text-slate-800">{item.quantity || 1}</span></p>
                        </div>
                        <div className="font-black text-slate-800 text-lg">
                          ${(item.price * (item.quantity || 1)).toFixed(2)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <span className="text-4xl block mb-2">📦</span>
                      <p className="text-slate-500 font-bold">عذراً، لم يتم حفظ المنتجات بشكل تفصيلي في هذا الطلب.</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 p-4 rounded-xl shadow-sm border">
                  <span className="font-bold text-slate-600 text-lg">المبلغ الإجمالي:</span>
                  <span className="font-black text-2xl text-orange-600">${selectedOrder.total_amount}</span>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button onClick={() => setSelectedOrder(null)} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-md">
                  إغلاق التفاصيل
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}