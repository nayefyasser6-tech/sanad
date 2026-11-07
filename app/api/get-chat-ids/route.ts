export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!telegramToken) {
      return NextResponse.json({ error: 'توكن البوت غير موجود' }, { status: 400 });
    }

    const response = await fetch(`https://api.telegram.org/bot${telegramToken}/getUpdates`);
    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json({ error: 'خطأ في الاتصال بتلغرام', details: data }, { status: 500 });
    }

    const users = data.result
      .map((update: any) => {
        if (update.message) {
          return {
            الاسم: update.message.from.first_name,
            المعرف_Chat_ID: update.message.from.id,
            الرسالة: update.message.text,
            تاريخ_الرسالة: new Date(update.message.date * 1000).toLocaleString('ar-EG')
          };
        }
        return null;
      })
      .filter(Boolean);

    return NextResponse.json({ 
      رسالة: 'هذه قائمة بالأشخاص الذين راسلوا بوتك مؤخراً', 
      عدد_الأشخاص: users.length,
      البيانات: users.reverse() 
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}