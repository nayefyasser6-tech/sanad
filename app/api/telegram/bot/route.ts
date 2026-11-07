import { NextResponse } from 'next/server';

// هذا المسار يستقبل التحديثات من بوت تيليجرام عندما يرسل المستخدم /start
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // التحقق من وجود رسالة ونصف النص
    if (body.message && body.message.text) {
      const chatId = body.message.chat.id;
      const text = body.message.text;
      const userName = body.message.from.first_name || 'صديقي';

      if (text.startsWith('/start')) {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const message = `أهلاً بك يا ${userName} في منصة سَنَد التقنية 🚀\n\nمعرف تيليجرام الخاص بك (Chat ID) هو:\n\`${chatId}\`\n\nيرجى نسخ هذا المعرف ولصقه في لوحة التحكم الخاصة بك لتفعيل إشعارات الطلبات فوراً.`;

        // إرسال الرد للتاجر عبر تيليجرام
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
          }),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram Bot Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}