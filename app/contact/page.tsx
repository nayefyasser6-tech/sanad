'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useLangStore, dict } from "@/store/useLangStore";

export default function ContactPage() {
  const { lang } = useLangStore();
  const t = dict[lang] || dict['ar'];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return; 
    setLoading(true);

    const toastId = toast.loading(t.contactSending);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(t.contactSuccess, { id: toastId });
        setName('');
        setEmail('');
        setMessage('');
      } else {
        toast.error(data.error || t.contactError, { id: toastId });
      }
    } catch (error) {
      toast.error(t.contactFail, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f1f5f9] py-12 px-4 sm:px-6 lg:px-8 w-full overflow-hidden">
      <div className="max-w-2xl mx-auto glass-panel p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-black text-slate-900 mb-2 text-center">{t.contactTitle}</h1>
        <p className="text-slate-600 text-center mb-8 font-medium">
          {t.contactDesc}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">{t.contactNameLabel}</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={t.contactNamePlaceholder}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">{t.contactEmailLabel}</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">{t.contactMessageLabel}</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              placeholder={t.contactMessagePlaceholder}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            ></textarea>
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#f97316] to-[#eab308] text-white font-bold rounded-xl shadow-md hover:opacity-95 transition-all disabled:opacity-50"
          >
            {loading ? t.contactSending : t.contactSendBtn}
          </button>
        </form>
      </div>
    </main>
  );
}