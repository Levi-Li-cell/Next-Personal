import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/get-session";
import { getStripeServer } from "@/lib/stripe";

const ALLOWED_AMOUNTS = [990, 1990, 3990, 6600, 9900];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const amount = Number(body?.amount || 0);

    if (!ALLOWED_AMOUNTS.includes(amount)) {
      return NextResponse.json({ success: false, error: "不支持的打赏金额" }, { status: 400 });
    }

    const origin = request.nextUrl.origin;
    const stripe = getStripeServer();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: session.user.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "cny",
            unit_amount: amount,
            product_data: {
              name: "请作者喝杯奶茶",
              description: "感谢你对内容创作的支持",
            },
          },
        },
      ],
      success_url: `${origin}/sponsor?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/sponsor?status=cancelled`,
      metadata: {
        sponsorUserId: session.user.id,
        sponsorUserEmail: session.user.email || "",
      },
    });

    return NextResponse.json({ success: true, url: checkoutSession.url });
  } catch (error) {
    console.error("Create Stripe checkout session failed:", error);
    return NextResponse.json({ success: false, error: "创建支付会话失败" }, { status: 500 });
  }
}
