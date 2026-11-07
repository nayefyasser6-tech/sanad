'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [activeTab, setActiveTab] = useState('merchants');
  
  // حالات التجار
  const [merchants, setMerchants] = useState<any[]>([]);
  const [expandedMerchant, setExpandedMerchant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualForm, setManualForm] = useState({ 
    firstName: '', lastName: '', phone: '', transferInfo: '', city: '', 
    telegramChatId: '', storeAddress: '', storeType: '' 
  });
  const [adding, setAdding] = useState(false);

  // حالات المنتجات والطلبات
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [addingProduct, setAddingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', stock_quantity: '', image_url: ''
  });

  useEffect(() => {
    fetchData();
    fetchProducts();
    fetchOrders();

    // السحر هنا: تحديث تلقائي كل 10 ثواني لجلب البيانات الجديدة بدون ريفريش!
    const interval = setInterval(() => {
      fetchData(false); // نمرر false حتى لا تظهر رسالة "جاري التحميل" ويزعجك أثناء العمل
      fetchOrders(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // جلب التجار
  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data } = await supabase.from('merchants').select('*').order('created_at', { ascending: false });
    if (data) setMerchants(data);
    if (showLoading) setLoading(false);
  };

  // جلب المنتجات
  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  // جلب الطلبات
  const fetchOrders = async (showLoading = true) => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  // وظائف التجار
  const handleApprove = async (id: string) => {
    const { error } = await supabase.from('merchants').update({ status: 'approved' }).eq('id', id);
    if (error) toast.error('حدث خطأ أثناء الموافقة');
    else {
      toast.success('تمت الموافقة! أُضيف التاجر للقائمة المعتمدة.');
      fetchData(); 
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف التاجر (${name}) بشكل نهائي؟`)) {
      const { error } = await supabase.from('merchants').delete().eq('id', id);
      if (error) toast.error('حدث خطأ أثناء الحذف');
      else {
        toast.success('تم حذف التاجر بنجاح');
        fetchData();
      }
    }
  };

  const updateChatId = async (id: string, newChatId: string) => {
    const { error } = await supabase.from('merchants').update({ telegram_chat_id: newChatId }).eq('id', id);
    if (error) toast.error('لم يتم حفظ معرف التلغرام');
    else toast.success('تم ربط التاجر بالتلغرام بنجاح');
  };

  const saveMerchantNotes = async (id: string, notes: string) => {
    const { error } = await supabase.from('merchants').update({ financial_notes: notes }).eq('id', id);
    if (error) toast.error('لم يتم الحفظ');
    else toast.success('تم حفظ الملاحظات المالية');
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = manualForm.phone.replace(/\D/g, '');
    if (phoneDigits.length < 9) {
      toast.error('رقم الهاتف يجب أن يتكون من 9 أرقام على الأقل');
      return;
    }

    setAdding(true);
    const { error } = await supabase.from('merchants').insert([{
      full_name: manualForm.firstName,
      last_name: manualForm.lastName,
      phone_number: phoneDigits,
      iban: manualForm.transferInfo, 
      city: manualForm.city,
      telegram_chat_id: manualForm.telegramChatId,
      store_address: manualForm.storeAddress,
      store_type: manualForm.storeType,
      status: 'approved' 
    }]);

    if (error) {
      toast.error('حدث خطأ أثناء الإضافة');
    } else {
      toast.success('تمت إضافة التاجر بنجاح');
      setManualForm({ firstName: '', lastName: '', phone: '', transferInfo: '', city: '', telegramChatId: '', storeAddress: '', storeType: '' });
      fetchData();
    }
    setAdding(false);
  };

  // وظائف المنتجات (إضافة وحذف)
  const handleAddProduct = async (e: React.FormEvent, category: string) => {
    e.preventDefault();
    setAddingProduct(true);
    
    const productData = {
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      stock_quantity: parseInt(productForm.stock_quantity),
      image_url: productForm.image_url,
      category: category,
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        toast.success('تمت إضافة المنتج بنجاح!');
        setProductForm({ name: '', description: '', price: '', stock_quantity: '', image_url: '' });
        fetchProducts();
      } else {
        toast.error('حدث خطأ أثناء الإضافة');
      }
    } catch (err) {
      toast.error('حدث خطأ في الاتصال بالخادم');
    }
    setAddingProduct(false);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المنتج (${name})؟`)) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        toast.error('خطأ: يرجى تفعيل صلاحية الحذف في RLS');
      } else {
        toast.success('تم حذف المنتج بنجاح');
        fetchProducts();
      }
    }
  };

  // تحديث حالة الطلب
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
      toast.error('حدث خطأ أثناء تحديث حالة الطلب');
    } else {
      toast.success('تم تحديث حالة الطلب بنجاح');
      fetchOrders();
    }
  };

  const pendingMerchants = merchants.filter(m => m.status === 'pending');
  const approvedMerchants = merchants.filter(m => m.status === 'approved');
  const foodProducts = products.filter(p => p.category === 'food');
  const energyProducts = products.filter(p => p.category === 'energy');

  const ProductSection = ({ title, category, data, colorClass, icon }: any) => (
    <div className="space-y-8">
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className={`text-xl font-black ${colorClass} mb-6 flex items-center gap-2`}>
          {icon} إضافة {title} جديد
        </h2>
        <form onSubmit={(e) => handleAddProduct(e, category)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">اسم المنتج</label>
            <input type="text" required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">السعر ($)</label>
            <input type="number" step="0.01" required value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">الكمية المتوفرة</label>
            <input type="number" required value={productForm.stock_quantity} onChange={e => setProductForm({...productForm, stock_quantity: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div className="md:col-span-4">
            <label className="block text-sm font-bold text-slate-700 mb-1">الوصف والمواصفات</label>
            <textarea required value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} rows={2} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none resize-none" />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-bold text-slate-700 mb-1">رابط الصورة (URL)</label>
            <input type="url" required value={productForm.image_url} onChange={e => setProductForm({...productForm, image_url: e.target.value})} placeholder="https://example.com/image.jpg" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none text-left" dir="ltr" />
          </div>
          <div className="md:col-span-1 mt-6">
            <button type="submit" disabled={addingProduct} className="w-full bg-slate-800 text-white font-black py-3 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50">
              {addingProduct ? 'جاري الإضافة...' : '➕ إضافة المنتج'}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          قائمة {title} المعروضة في الموقع ({data.length})
        </h2>
        {data.length === 0 ? (
          <p className="text-slate-500 text-center p-6">لا توجد منتجات مضافة في هذا القسم حتى الآن.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((product: any) => (
              <div key={product.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col">
                <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover bg-white" />
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-black text-lg text-slate-800 mb-2">{product.name}</h3>
                  <p className="text-slate-500 text-sm mb-4 flex-1">{product.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-orange-600 font-black text-xl">${product.price}</span>
                    <span className="text-slate-500 text-sm font-bold bg-slate-200 px-3 py-1 rounded-full">الكمية: {product.stock_quantity}</span>
                  </div>
                  <button onClick={() => handleDeleteProduct(product.id, product.name)} className="w-full bg-white border border-red-200 text-red-500 font-bold py-2 rounded-lg hover:bg-red-50 transition-colors">
                    حذف المنتج
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderContent = () => {
    if (loading) return <div className="p-20 text-center text-xl font-bold text-slate-400">جاري تحميل البيانات...</div>;

    switch (activeTab) {
      case 'merchants':
        return (
          <div className="space-y-8">
            
            {/* الطلبات المعلقة */}
            {pendingMerchants.length > 0 && (
              <section className="bg-white border-l-4 border-orange-500 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  طلبات انضمام جديدة ({pendingMerchants.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingMerchants.map(merchant => (
                    <div key={merchant.id} className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                      <h3 className="font-black text-lg text-slate-800">{merchant.full_name} {merchant.last_name}</h3>
                      <p className="text-slate-500 text-sm mb-2">{merchant.store_type || 'محل تجاري'} - {merchant.city}</p>
                      <p className="text-slate-700 text-sm mb-4"><strong>الهاتف:</strong> <span dir="ltr">{merchant.phone_number}</span></p>
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(merchant.id)} className="flex-1 bg-slate-800 text-white font-bold py-2 rounded-lg hover:bg-slate-700 transition-colors">
                          موافقة وتفعيل
                        </button>
                        <button onClick={() => handleDelete(merchant.id, merchant.full_name)} className="px-4 bg-white border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                          رفض
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* إضافة تاجر يدوياً */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                إضافة شريك جديد يدوياً
              </h2>
              <form onSubmit={handleAddManual} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الاسم الأول</label>
                  <input type="text" required value={manualForm.firstName} onChange={e => setManualForm({...manualForm, firstName: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الكنية (العائلة)</label>
                  <input type="text" required value={manualForm.lastName} onChange={e => setManualForm({...manualForm, lastName: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">نوع المحل (مثال: سوبر ماركت)</label>
                  <input type="text" required value={manualForm.storeType} onChange={e => setManualForm({...manualForm, storeType: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">رقم الهاتف (أرقام فقط)</label>
                  <input type="tel" required value={manualForm.phone} onChange={e => setManualForm({...manualForm, phone: e.target.value.replace(/\D/g, '')})} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none text-left" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">المدينة</label>
                  <input type="text" required value={manualForm.city} onChange={e => setManualForm({...manualForm, city: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-bold text-slate-700 mb-1">العنوان التفصيلي للمحل</label>
                  <input type="text" required value={manualForm.storeAddress} onChange={e => setManualForm({...manualForm, storeAddress: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">طريقة التحويل (مثال: شركة الهرم)</label>
                  <input type="text" value={manualForm.transferInfo} onChange={e => setManualForm({...manualForm, transferInfo: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">معرف التلغرام (Chat ID) - إن وُجد</label>
                  <input type="text" value={manualForm.telegramChatId} onChange={e => setManualForm({...manualForm, telegramChatId: e.target.value.replace(/\D/g, '')})} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none text-left font-mono" dir="ltr" />
                </div>
                <div className="md:col-span-1 md:col-start-2 lg:col-start-3 lg:col-span-2 mt-4">
                  <button type="submit" disabled={adding} className="w-full bg-orange-500 text-white font-black py-3 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-md">
                    {adding ? 'جاري الحفظ...' : 'إضافة التاجر للنظام'}
                  </button>
                </div>
              </form>
            </section>

            {/* سجل التجار المعتمدين */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                سجل التجار والشركاء ({approvedMerchants.length})
              </h2>
              
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
                {approvedMerchants.length === 0 ? (
                  <p className="text-slate-500 p-6 text-center">لا يوجد تجار معتمدين حالياً.</p>
                ) : (
                  approvedMerchants.map((merchant) => (
                    <div key={merchant.id} className="overflow-hidden">
                      <div 
                        className="p-5 cursor-pointer flex justify-between items-center hover:bg-slate-50 transition-colors"
                        onClick={() => setExpandedMerchant(expandedMerchant === merchant.id ? null : merchant.id)}
                      >
                        <div className="flex gap-4 items-center">
                          <span className="w-3 h-3 rounded-full bg-slate-800"></span>
                          <h3 className="font-bold text-slate-800 text-lg">{merchant.full_name} {merchant.last_name}</h3>
                          <span className="text-slate-500 text-sm bg-slate-100 px-3 py-1 rounded-full hidden md:inline-block">{merchant.store_type || 'محل تجاري'} - {merchant.city}</span>
                        </div>
                        <svg className={`w-6 h-6 text-slate-400 transform transition-transform duration-300 ${expandedMerchant === merchant.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>

                      {expandedMerchant === merchant.id && (
                        <div className="p-6 bg-slate-50 grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-slate-100 shadow-inner">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                <span className="block text-xs font-bold text-slate-400 mb-1">المدينة</span>
                                <strong className="text-slate-800">{merchant.city}</strong>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                <span className="block text-xs font-bold text-slate-400 mb-1">رقم الهاتف</span>
                                <strong className="text-slate-800" dir="ltr">{merchant.phone_number || '-'}</strong>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm col-span-2">
                                <span className="block text-xs font-bold text-slate-400 mb-1">العنوان التفصيلي</span>
                                <strong className="text-slate-800">{merchant.store_address || '-'}</strong>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm col-span-2 flex justify-between items-center">
                                <div>
                                  <span className="block text-xs font-bold text-slate-400 mb-1">معرف التلغرام (Chat ID)</span>
                                  <input 
                                    type="text" 
                                    defaultValue={merchant.telegram_chat_id || ''} 
                                    onBlur={(e) => updateChatId(merchant.id, e.target.value)} 
                                    placeholder="أدخل الـ ID هنا بعد التواصل معه"
                                    className="text-slate-800 font-mono w-full outline-none bg-transparent" dir="ltr" 
                                  />
                                </div>
                                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm col-span-2">
                                <span className="block text-xs font-bold text-slate-400 mb-1">طريقة التحويل</span>
                                <strong className="text-slate-800">{merchant.iban || '-'}</strong>
                              </div>
                            </div>
                            
                            <button onClick={() => handleDelete(merchant.id, merchant.full_name)} className="w-full bg-white border border-slate-300 text-red-500 font-bold py-3 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors flex justify-center items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              حذف التاجر نهائياً
                            </button>
                          </div>
                          
                          <div className="flex flex-col h-full">
                            <label className="block text-sm font-bold text-slate-700 mb-2">الملاحظات المالية وسجل الدفعات</label>
                            <textarea 
                              className="flex-1 w-full p-4 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none transition-colors shadow-sm text-slate-700 leading-relaxed"
                              defaultValue={merchant.financial_notes}
                              onBlur={(e) => saveMerchantNotes(merchant.id, e.target.value)}
                              placeholder="سجل هنا الدفعات المحولة، المبالغ المتبقية، وتواريخ التحويل..."
                            ></textarea>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        );
           case 'food':
        return ProductSection({
          title: "المنتجات الغذائية",
          category: "food",
          data: foodProducts,
          colorClass: "text-green-600",
          icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
        });
      case 'solar':
        return ProductSection({
          title: "أنظمة الطاقة الشمسية",
          category: "energy",
          data: energyProducts,
          colorClass: "text-yellow-500",
          icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
        });
      case 'orders':
        return (
          <div className="space-y-6">
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                📦 إدارة طلبات الزبائن ({orders.length})
              </h2>
              {orders.length === 0 ? (
                <p className="text-slate-500 text-center p-6">لا توجد طلبات مسجلة حتى الآن.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-sm">
                        <th className="p-3 border-b">رقم الطلب (ID)</th>
                        <th className="p-3 border-b">اسم المستلم</th>
                        <th className="p-3 border-b">المدينة</th>
                        <th className="p-3 border-b">المبلغ الإجمالي</th>
                        <th className="p-3 border-b">الحالة</th>
                        <th className="p-3 border-b">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {orders.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                          <td className="p-3 font-bold text-slate-800">{order.recipient_name || order.sender_name || 'زبون'}</td>
                          <td className="p-3">{order.recipient_city || 'غير محدد'}</td>
                          <td className="p-3 font-black text-orange-600">${order.total_amount}</td>
                          <td className="p-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {order.status === 'paid' ? 'مدفوع' : order.status}
                            </span>
                          </td>
                          <td className="p-3 flex gap-2">
                            <select 
                              value={order.status} 
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="bg-slate-50 border border-slate-300 rounded p-1 text-xs outline-none"
                            >
                              <option value="pending">قيد الانتظار</option>
                              <option value="paid">مدفوع</option>
                              <option value="delivering">قيد التوصيل</option>
                              <option value="delivered">تم التسليم</option>
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
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute top-0 right-0 w-full min-h-screen bg-slate-50 z-50 flex" dir="rtl">
      <aside className="w-[280px] bg-slate-900 text-slate-300 flex-col h-screen fixed right-0 top-0 border-l border-slate-800 z-50">
        <div className="p-8 pb-6 border-b border-slate-800">
          <span className="text-3xl font-black text-white tracking-wide">سَنَد</span>
          <span className="text-sm font-bold text-orange-500 block mt-2">لوحة الإدارة المركزية</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => { setActiveTab('merchants'); setProductForm({name: '', description: '', price: '', stock_quantity: '', image_url: ''}); }} className={`w-full flex items-center gap-3 text-right p-4 rounded-xl transition-all duration-200 text-sm font-bold ${activeTab === 'merchants' ? 'bg-orange-500 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            إدارة الشركاء والتجار
          </button>

          <button onClick={() => { setActiveTab('orders'); }} className={`w-full flex items-center gap-3 text-right p-4 rounded-xl transition-all duration-200 text-sm font-bold ${activeTab === 'orders' ? 'bg-orange-500 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            إدارة الطلبات والمبيعات
          </button>
          
          <div className="pt-8 pb-2">
            <p className="text-slate-500 text-xs font-bold px-4 mb-4 uppercase tracking-wider">إدارة المنتجات</p>
            <button onClick={() => { setActiveTab('food'); setProductForm({name: '', description: '', price: '', stock_quantity: '', image_url: ''}); }} className={`w-full flex items-center gap-3 text-right p-4 rounded-xl transition-all duration-200 text-sm font-bold ${activeTab === 'food' ? 'bg-orange-500 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              صندوق المنتجات الغذائية
            </button>
            <button onClick={() => { setActiveTab('solar'); setProductForm({name: '', description: '', price: '', stock_quantity: '', image_url: ''}); }} className={`w-full flex items-center gap-3 text-right p-4 rounded-xl transition-all duration-200 text-sm font-bold ${activeTab === 'solar' ? 'bg-orange-500 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              أنظمة الطاقة الشمسية
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 min-h-screen p-8 mr-[280px]">
        {renderContent()}
      </main>
      
    </div>
  );
}