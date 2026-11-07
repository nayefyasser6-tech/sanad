export async function sendOrderToTelegram({
  orderId,
  customerName,
  customerPhone,
  cityName,
  address,
  totalAmount,
  items,
  merchantChatId,
}: {
  orderId: string;
  customerName: string;
  customerPhone: string;
  cityName: string;
  address: string;
  totalAmount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  merchantChatId?: string;
}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN is missing in environment variables.");
    return;
  }

  const itemsList = items
    .map((item) => `- ${item.name} (الكمية: ${item.quantity}) - \$${item.price}`)
    .join('\n');

  const message = 
    `🚨 **طلب جديد تم تسجيله في منصة سَنَد!**\n\n` +
    `📦 رقم الطلب: \`#${orderId.slice(0, 8)}\`\n` +
    `📍 المدينة: **${cityName}**\n` +
    `👤 اسم المستلم: ${customerName}\n` +
    `📞 الهاتف: ${customerPhone}\n` +
    `🏠 العنوان: ${address}\n` +
    `💰 المجموع الإجمالي: $${totalAmount}\n\n` +
    `🛒 المنتجات:\n${itemsList}`;

  try {
    // 1. إرسال إشعار للأدمن (أنت)
    if (adminChatId) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });
    }

    // 2. إرسال إشعار لتاجر المدينة إذا وُجد الـ Chat ID الخاص به
    if (merchantChatId) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: merchantChatId,
          text: `🔔 **طلب جديد خاص بمدينتك (${cityName})!**\n\n` + message,
          parse_mode: 'Markdown',
        }),
      });
    }
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}