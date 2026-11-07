import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { amount, recipientName, orderId } = await request.json();

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID; // تم جلب المتغير هنا

    if (!apiKey || !storeId || !variantId) {
      return NextResponse.json({ error: "Missing Lemon Squeezy Keys" }, { status: 500 });
    }

    const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            custom_price: Math.round(amount * 100), 
            checkout_data: {
              custom: {
                order_id: orderId, 
              }
            }
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: String(storeId),
              },
            },
            // هذا هو القسم الذي كان مفقوداً ويسبب الخطأ 422
            variant: {
              data: {
                type: "variants",
                id: String(variantId), 
              },
            },
          },
        },
      }),
    });

    const checkoutData = await res.json();

    if (checkoutData.errors) {
      console.error("Lemon Squeezy Error:", checkoutData.errors);
      return NextResponse.json({ error: "فشل إنشاء رابط الدفع" }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutData.data.attributes.url });

  } catch (error) {
    console.error("Payment API Error:", error);
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 });
  }
}