import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getStripeServer } from "@/lib/stripe";

async function ensureSponsorPaymentsTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sponsor_payment (
      id text PRIMARY KEY,
      provider text NOT NULL DEFAULT 'stripe',
      stripe_session_id text,
      stripe_payment_intent_id text,
      user_id text,
      user_email text,
      amount integer NOT NULL,
      currency text NOT NULL,
      status text NOT NULL,
      metadata jsonb,
      created_at timestamp DEFAULT now() NOT NULL
    )
  `);
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || "").trim();

  if (!signature || !webhookSecret) {
    return NextResponse.json({ success: false, error: "Webhook signature or secret missing" }, { status: 400 });
  }

  const rawBody = await request.text();

  try {
    const stripe = getStripeServer();
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      await ensureSponsorPaymentsTable();
      const session = event.data.object;

      await db.execute(sql`
        INSERT INTO sponsor_payment (
          id,
          provider,
          stripe_session_id,
          stripe_payment_intent_id,
          user_id,
          user_email,
          amount,
          currency,
          status,
          metadata
        ) VALUES (
          ${nanoid()},
          'stripe',
          ${session.id || null},
          ${typeof session.payment_intent === "string" ? session.payment_intent : null},
          ${session.metadata?.sponsorUserId || null},
          ${session.customer_details?.email || session.metadata?.sponsorUserEmail || null},
          ${session.amount_total || 0},
          ${session.currency || "cny"},
          ${session.payment_status || "paid"},
          ${JSON.stringify(session.metadata || {})}::jsonb
        )
      `);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 400 });
  }
}
