import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
    });

    const { searchParams } = new URL(req.url);
    const token = (searchParams.get("token") ?? "").trim();
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const priceId = process.env.STRIPE_PRICE_ID!;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 可选：查一下 token 是否存在，防止乱打
    const { data: program, error } = await supabaseServer
      .from("programs")
      .select("token,is_paid")
      .eq("token", token)
      .single();

    if (error || !program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }
    if (program.is_paid) {
      return NextResponse.json({ url: `${appUrl}/program/${token}` });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/program/${token}?paid=1`,
      cancel_url: `${appUrl}/program/${token}`,
      client_reference_id: token,
      metadata: { token },
    });

    // 可选：记录 session_id 方便排查
    await supabaseServer
      .from("programs")
      .update({ stripe_session_id: session.id })
      .eq("token", token);

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Checkout failed" }, { status: 500 });
  }
}
