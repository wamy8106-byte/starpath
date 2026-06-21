import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";
import {
  InvalidPaymentEventError,
  InvalidWebhookSignatureError,
  processStripeEvent,
  verifyStripeWebhook,
} from "@/lib/payment";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!sig) {
    return NextResponse.json({ error: "Missing webhook secret/signature" }, { status: 400 });
  }
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-06-20",
  });

  const body = await req.text();

  let event;
  try {
    event = verifyStripeWebhook(
      body,
      sig,
      webhookSecret,
      stripe.webhooks.constructEvent.bind(stripe.webhooks)
    );
  } catch (error: unknown) {
    console.error(
      "Webhook signature verify failed:",
      error instanceof Error ? error.message : error
    );
    if (error instanceof InvalidWebhookSignatureError) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 500 }
    );
  }

  try {
    const result = await processStripeEvent(event, {
      async getProgram(token) {
        const { data, error } = await supabaseServer
          .from("programs")
          .select("token,is_paid,stripe_session_id")
          .eq("token", token)
          .maybeSingle();
        if (error) throw error;
        if (!data) return null;

        return {
          token: data.token,
          isPaid: data.is_paid,
          stripeSessionId: data.stripe_session_id ?? undefined,
        };
      },
      async markProgramPaid(token, sessionId) {
        const { data, error } = await supabaseServer
          .from("programs")
          .update({ is_paid: true, stripe_session_id: sessionId })
          .eq("token", token)
          .eq("is_paid", false)
          .select("token")
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          const { data: current, error: lookupError } = await supabaseServer
            .from("programs")
            .select("is_paid")
            .eq("token", token)
            .maybeSingle();
          if (lookupError) throw lookupError;
          if (!current?.is_paid) {
            throw new Error("Program payment update affected no rows");
          }
        }
      },
      async clearExpiredSession(token, sessionId) {
        const { error } = await supabaseServer
          .from("programs")
          .update({ stripe_session_id: null })
          .eq("token", token)
          .eq("stripe_session_id", sessionId)
          .eq("is_paid", false);
        if (error) throw error;
      },
    });

    return NextResponse.json({
      received: true,
      handled: result.handled,
      duplicate: result.duplicate ?? false,
    });
  } catch (error: unknown) {
    console.error("Webhook processing failed:", {
      eventId: event.id,
      eventType: event.type,
      error,
    });
    if (error instanceof InvalidPaymentEventError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
