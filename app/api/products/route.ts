import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// نستخدم Service Role Key لتخطي قواعد الحماية (RLS) لأن هذا طلب من الأدمن
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// استدعاء واحد لـ Gemini
async function callGemini(model: string, apiKey: string, prompt: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      return { ok: false, status: res.status, body: await res.text(), text: '' };
    }

    const json = await res.json();
    const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { ok: true, status: 200, body: '', text };
  } catch (err) {
    return { ok: false, status: 0, body: String(err), text: '' };
  } finally {
    clearTimeout(timeout);
  }
}

// ترجمة الاسم والوصف للإنجليزية مع إعادة المحاولة وموديل احتياطي
// إذا فشلت كل المحاولات نرجع null ويتم حفظ المنتج بدون ترجمة
async function translateToEnglish(name: string, description: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY غير موجود، تم تخطي الترجمة');
    return null;
  }

  const primary = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const fallback = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.1-flash-lite';
  const models = [primary, fallback].filter((m, i, arr) => m && arr.indexOf(m) === i);

  const prompt =
    'Translate the following Arabic product data into natural, professional English. ' +
    'Keep the same line breaks in the description (each line stays on its own line). ' +
    'Return ONLY a JSON object with exactly two keys: "name_en" and "description_en".\n\n' +
    JSON.stringify({ name, description });

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const result = await callGemini(model, apiKey, prompt);

      if (result.ok) {
        try {
          const clean = result.text.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(clean);
          return {
            name_en: String(parsed.name_en || ''),
            description_en: String(parsed.description_en || ''),
          };
        } catch (err) {
          console.error(`Gemini parse error (${model}, attempt ${attempt}):`, err);
        }
      } else {
        console.error(`Gemini Error (${model}, attempt ${attempt}):`, result.status, result.body);

        // الموديل غير موجود: ننتقل مباشرة للموديل التالي
        if (result.status === 404) break;
        // مفتاح غلط أو طلب غلط: ما في فايدة من إعادة المحاولة
        if (result.status === 400 || result.status === 401 || result.status === 403) return null;
      }

      // 503 أو 429 أو غيرها: ننتظر قليلاً ونعيد المحاولة
      await sleep(1500);
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const productData = await request.json();

    // نحاول الترجمة التلقائية
    const translated = await translateToEnglish(
      productData.name || '',
      productData.description || ''
    );

    const dataToInsert = translated
      ? { ...productData, ...translated }
      : productData;

    // إدخال البيانات في جدول products
    let { data, error } = await supabase
      .from('products')
      .insert([dataToInsert])
      .select();

    // إذا فشل الإدخال بسبب أعمدة الترجمة، نحاول بدونها
    if (error && translated) {
      console.error('Insert with translation failed, retrying without:', error);
      const retry = await supabase
        .from('products')
        .insert([productData])
        .select();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('Database Error:', error);
      return NextResponse.json({ error: 'حدث خطأ في قاعدة البيانات' }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: data });

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'خطأ داخلي في السيرفر' }, { status: 500 });
  }
}