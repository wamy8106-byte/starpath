import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";
import { createProgramCheckout } from "@/lib/payment";

function isMissingStripeResource(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "resource_missing"
  );
}

export async function POST(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!stripeSecretKey || !priceId) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
    });

    const { searchParams } = new URL(req.url);
    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    ).replace(/\/$/, "");

    const result = await createProgramCheckout(
      {
        token: searchParams.get("token"),
        priceId,
        appUrl,
      },
      {
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
        async retrieveSession(sessionId) {
          try {
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            return {
              id: session.id,
              status: session.status,
              url: session.url,
            };
          } catch (error: unknown) {
            if (isMissingStripeResource(error)) return null;
            throw error;
          }
        },
        async createSession(input) {
          const session = await stripe.checkout.sessions.create({
            mode: "payment",
            line_items: [{ price: input.priceId, quantity: 1 }],
            success_url: input.successUrl,
            cancel_url: input.cancelUrl,
            client_reference_id: input.token,
            metadata: { token: input.token },
          });
          return {
            id: session.id,
            status: session.status,
            url: session.url,
          };
        },
        async saveSession(token, sessionId) {
          const { data, error } = await supabaseServer
            .from("programs")
            .update({ stripe_session_id: sessionId })
            .eq("token", token)
            .eq("is_paid", false)
            .select("token")
            .maybeSingle();
          if (error) throw error;
          if (!data) {
            throw new Error("Checkout Session could not be saved");
          }
        },
        async expireSession(sessionId) {
          await stripe.checkout.sessions.expire(sessionId);
        },
      }
    );

    if (result.kind === "not-found") {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json({
      url: result.url,
      alreadyPaid: result.kind === "already-paid",
      reused: result.kind === "checkout" ? result.reused : false,
    });
  } catch (error: unknown) {
    console.error("Checkout creation failed:", error);
    const message =
      error instanceof Error ? error.message : "Checkout failed";
    const status =
      message === "Missing token" || message === "Malformed token" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
