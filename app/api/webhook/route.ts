import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(request: Request) {
  try {
    // 1. التحقق الأمني من توقيع Lemon Squeezy
    const bodyText = await request.text(); // يجب قراءة الجسم كنص للتحقق
    const signature = request.headers.get('x-signature');
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return new NextResponse('Missing signature or secret', { status: 400 });
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(bodyText).digest('hex'), 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (!crypto.timingSafeEqual(digest, signatureBuffer)) {
      return new NextResponse('Invalid signature', { status: 403 });
    }

    // 2. تحليل البيانات واستخراج رقم الطلب
    const payload = JSON.parse(bodyText);
    const eventName = payload.meta.event_name;
    const orderId = payload.meta.custom_data?.order_id; // استخراج الـ ID من custom_data

    // التأكد من أن الحدث هو نجاح الدفع وأن رقم الطلب موجود
    if (eventName !== 'order_created' || !orderId) {
         return NextResponse.json({ message: 'تم تجاهل الحدث أو رقم الطلب مفقود' }, { status: 200 });
    }

    // 3. تحديث حالة الطلب إلى مدفوع في Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId)
      .select('*')
      .maybeSingle(); 

    if (orderError || !order) {
      return NextResponse.json({ error: 'الطلب غير موجود أو حدث خطأ في قاعدة البيانات' }, { status: 404 });
    }

    const targetCity = order.recipient_city; 
    if (!targetCity) {
       return NextResponse.json({ error: 'المدينة مفقودة في الطلب' }, { status: 400 });
    }

    // جلب تفاصيل المنتجات المرتبطة بهذا الطلب من جدول order_items
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_name, quantity, price')
      .eq('order_id', orderId);

    // تنسيق قائمة المنتجات لعرضها في التيليجرام
    const itemsList = orderItems && orderItems.length > 0
      ? orderItems.map((item) => `- ${item.product_name} (الكمية: ${item.quantity}) - \$${item.price}`).join('\n')
      : '- تفاصيل المنتجات غير متوفرة';

    // 4. البحث عن التاجر في المدينة المطلوبة
    const { data: merchant } = await supabase
      .from('merchants')
      .select('telegram_chat_id, full_name')
      .eq('city', targetCity)
      .eq('status', 'approved')
      .maybeSingle();

    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID;

    // تجهيز الدالة المسؤولة عن إرسال رسائل التلغرام
    const sendTelegramMessage = async (chatId: string, text: string) => {
      if (!chatId || !telegramToken) return; // التأكد من وجود التوكن
      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' }),
      });
    };

    // تجهيز نص الرسالة الأساسي مع معلومات المستلم والمنتجات
    const baseMessage = `
🛎️ *طلب جديد مدفوع!*
ـــــــــــــــــــــــــــــــــــــــ
*رقم الطلب:* #${orderId.slice(0, 8)}
*المدينة:* ${targetCity}
*اسم المستلم:* ${order.recipient_name || 'غير متوفر'}
*الهاتف:* ${order.recipient_phone || 'غير متوفر'}
*العنوان:* ${order.recipient_address || 'غير متوفر'}
*المبلغ الإجمالي:* $${order.total_amount}

📦 *المنتجات المطلوبة:*
${itemsList}
`;

    // 5. إرسال الإشعار للتاجر (إذا كان موجوداً)
    if (merchant && merchant.telegram_chat_id) {
      await sendTelegramMessage(
        merchant.telegram_chat_id, 
        baseMessage + '\nيرجى الدخول للوحة التحكم لمراجعة التفاصيل والبدء بالتجهيز.'
      );
    }

    // 6. إرسال الإشعار للإدارة
    if (adminChatId){ 
      const adminNote = merchant 
        ? `\n👨‍💻 *نسخة للإدارة:* تم تحويل الطلب للتاجر (${merchant.full_name}).`
        : `\n⚠️ *تنبيه للإدارة:* لا يوجد تاجر معتمد أو مفعل لمدينة (${targetCity})!`;
        
      await sendTelegramMessage(adminChatId, baseMessage + adminNote);
    }

    return NextResponse.json({ success: true, message: 'تم التحديث وإرسال الإشعارات بنجاح' });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'خطأ سيرفر داخلي' }, { status: 500 });
  }
}