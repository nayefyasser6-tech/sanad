'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useLangStore, dict } from '@/store/useLangStore';

export default function JoinMerchantPage() {
  const supabase = createClient();
  const { lang } = useLangStore();
  const t = dict[lang] || dict['ar'];

  const [loading, setLoading] = useState(true);
  const [userState, setUserState] = useState<'guest' | 'user_only' | 'pending' | 'needs_telegram' | 'active'>('guest');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  
  const [telegramIdInput, setTelegramIdInput] = useState('');

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', storeName: '',
    storeType: 'صندوق المنتجات الغذائية', city: '', storeAddress: '', phone: '', iban: '',
  });

  useEffect(() => {
    checkMerchantState();
  }, []);

  const checkMerchantState = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const sessionUser = session?.user;

    if (sessionUser) {
      setCurrentUser(sessionUser);
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('id, status, telegram_chat_id')
        .eq('user_id', sessionUser.id)
        .single();

      if (merchantData) {
        setMerchantId(merchantData.id);
        if (merchantData.status === 'pending') setUserState('pending');
        else if (merchantData.status === 'approved' && !merchantData.telegram_chat_id) setUserState('needs_telegram');
        else if (merchantData.status === 'approved' && merchantData.telegram_chat_id) setUserState('active');
      } else {
        setUserState('user_only');
      }
    } else {
      setUserState('guest');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.dismiss();
    setLoading(true);

    try {
      let finalUserId = null;

      if (userState === 'guest') {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });
        if (authError) throw authError;
        finalUserId = authData.user?.id;
      } else {
        finalUserId = currentUser.id;
      }

      const { error: dbError } = await supabase.from('merchants').insert([{
        user_id: finalUserId,
        full_name: `${formData.firstName} ${formData.lastName}`,
        last_name: formData.lastName,
        store_type: formData.storeType,
        city: formData.city,
        store_address: formData.storeAddress,
        phone_number: formData.phone.replace(/\D/g, ''),
        iban: formData.iban,
        status: 'pending'
      }]);

      if (dbError) throw dbError;

      if (userState === 'guest') {
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
      }

      toast.success(t.joinMerchantToastSuccess);
      // هذا السطر يضمن تحديث الناف بار والصفحة فوراً دون تدخل منك
      window.location.reload(); 
      
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || t.joinMerchantToastError);
      setLoading(false);
    }
  };

  const handleTelegramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramIdInput) {
      toast.error(t.joinMerchantToastChatIdRequired); return;
    }
    
    setLoading(true);
    const { error } = await supabase
      .from('merchants')
      .update({ telegram_chat_id: telegramIdInput })
      .eq('id', merchantId);

    if (error) {
      toast.error(t.joinMerchantToastChatIdSaveError);
    } else {
      toast.success(t.joinMerchantToastActivated);
      window.location.reload(); 
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-xl text-slate-500">{t.joinMerchantProcessing}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-24 px-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <main className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        
        {userState === 'pending' && (
          <div className="text-center py-10 animate-fade-in">
            <div className="text-6xl mb-6">⏳</div>
            <h1 className="text-3xl font-black text-slate-900 mb-4">{t.joinMerchantPendingTitle}</h1>
            <p className="text-slate-600 text-lg">{t.joinMerchantPendingDesc}</p>
          </div>
        )}

        {userState === 'needs_telegram' && (
          <div className="py-4 animate-fade-in">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🤖</div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">{t.joinMerchantTelegramTitle}</h1>
              <p className="text-slate-600">{t.joinMerchantTelegramDesc}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-blue-900">
              <h3 className="font-black text-lg mb-3">{t.joinMerchantStepsTitle}</h3>
              <ol className="list-decimal list-inside space-y-2 font-bold text-sm">
                <li>
                  {t.joinMerchantStep1Part1}
                  <a href="https://t.me/Sanad_Orders_Bot" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-black mr-1" dir="ltr">@Sanad_Orders_Bot</a>
                </li>
                <li>
                  {t.joinMerchantStep2Part1}
                  <strong>{t.joinMerchantStep2Start}</strong>
                  {t.joinMerchantStep2Part2}
                </li>
                <li>{t.joinMerchantStep3}</li>
                <li>{t.joinMerchantStep4}</li>
              </ol>
            </div>
            <form onSubmit={handleTelegramSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.joinMerchantChatIdLabel}</label>
                <input type="text" required value={telegramIdInput} onChange={e => setTelegramIdInput(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl outline-none font-mono text-left" dir="ltr" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg">
                {loading ? t.joinMerchantActivating : t.joinMerchantActivateBtn}
              </button>
            </form>
          </div>
        )}

        {userState === 'active' && (
          <div className="text-center py-10 animate-fade-in">
            <div className="text-6xl mb-6">✅</div>
            <h1 className="text-3xl font-black text-slate-900 mb-4">{t.joinMerchantActiveTitle}</h1>
            <p className="text-slate-600 text-lg mb-8">{t.joinMerchantActiveDesc}</p>
            <Link href="/provider" className="inline-block bg-orange-500 text-white font-black py-3 px-8 rounded-xl hover:bg-orange-600 transition-colors shadow-lg">
              {t.joinMerchantActiveBtn}
            </Link>
          </div>
        )}

        {(userState === 'guest' || userState === 'user_only') && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-black text-slate-900 mb-2 text-center">{t.joinMerchantFormTitle}</h1>
            <p className="text-slate-500 text-sm text-center mb-8">{t.joinMerchantFormDesc}</p>
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t.joinMerchantFirstNameLabel}</label>
                  <input type="text" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t.joinMerchantLastNameLabel}</label>
                  <input type="text" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none" />
                </div>
              </div>

              {userState === 'guest' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">{t.loginEmailLabel}</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none text-left" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">{t.loginPasswordLabel}</label>
                    <input type="password" required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none text-left" dir="ltr" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t.joinMerchantStoreNameLabel}</label>
                  <input type="text" required value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t.joinMerchantStoreTypeLabel}</label>
                  <select value={formData.storeType} onChange={e => setFormData({...formData, storeType: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold">
                    <option value="صندوق المنتجات الغذائية">{t.joinMerchantStoreTypeFood}</option>
                    <option value="أنظمة الطاقة الشمسية">{t.joinMerchantStoreTypeSolar}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t.joinMerchantCityLabel}</label>
                  <input type="text" required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t.joinMerchantPhoneLabel}</label>
                  <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none text-left" dir="ltr" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.joinMerchantAddressLabel}</label>
                <input type="text" required value={formData.storeAddress} onChange={e => setFormData({...formData, storeAddress: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.joinMerchantIbanLabel}</label>
                <input type="text" value={formData.iban} onChange={e => setFormData({...formData, iban: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none" placeholder={t.joinMerchantIbanPlaceholder} />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white font-black py-4 rounded-xl hover:bg-orange-600 transition-colors shadow-lg">
                {loading ? t.joinMerchantSending : t.joinMerchantSubmitBtn}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}