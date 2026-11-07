import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    // تم التعديل هنا ليطابق اسم المتغير في ملف .env.local الخاص بك
    const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID; 

    if (!botToken || !adminChatId) {
      return NextResponse.json({ error: 'إعدادات بوت التليجرام غير مكتفية' }, { status: 500 });
    }

    // صياغة رسالة التليجرام بتنسيق منظم
    const telegramMessage = `
📬 **رسالة جديدة من صفحة تواصل معنا**

👤 **الاسم:** ${name}
📧 **البريد:** ${email}
💬 **الرسالة:**
${message}
    `.trim();

    // إرسال الطلب إلى Telegram Bot API
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminChatId,
        text: telegramMessage,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.description || 'فشل إرسال الرسالة عبر تليجرام');
    }

    return NextResponse.json({ success: true, message: 'تم إرسال الرسالة بنجاح' });
  } catch (error: any) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ داخلي' }, { status: 500 });
  }
}