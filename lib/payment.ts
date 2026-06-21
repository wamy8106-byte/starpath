import type Stripe from "stripe";

export type PaymentProgram = {
  token: string;
  isPaid: boolean;
  stripeSessionId?: string;
};

export type CheckoutSessionSummary = {
  id: string;
  status: Stripe.Checkout.Session.Status | null;
  url: string | null;
};

type CheckoutDependencies = {
  getProgram(token: string): Promise<PaymentProgram | null>;
  retrieveSession(sessionId: string): Promise<CheckoutSessionSummary | null>;
  createSession(input: {
    token: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSessionSummary>;
  saveSession(token: string, sessionId: string): Promise<void>;
  expireSession?(sessionId: string): Promise<void>;
};

export type CheckoutResult =
  | { kind: "already-paid"; url: string }
  | { kind: "checkout"; url: string; reused: boolean }
  | { kind: "not-found" };

function validatePaymentToken(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false as const, reason: "missing" as const };
  }

  const token = value.trim();
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(token)) {
    return { ok: false as const, reason: "malformed" as const };
  }

  return { ok: true as const, token };
}

export async function createProgramCheckout(
  input: {
    token: unknown;
    priceId: string;
    appUrl: string;
  },
  dependencies: CheckoutDependencies
): Promise<CheckoutResult> {
  const tokenResult = validatePaymentToken(input.token);
  if (!tokenResult.ok) {
    throw new Error(
      tokenResult.reason === "missing" ? "Missing token" : "Malformed token"
    );
  }

  const token = tokenResult.token;
  const program = await dependencies.getProgram(token);
  if (!program) return { kind: "not-found" };

  const programUrl = `${input.appUrl}/program/${token}`;
  if (program.isPaid) {
    return { kind: "already-paid", url: programUrl };
  }

  if (program.stripeSessionId) {
    const existing = await dependencies.retrieveSession(
      program.stripeSessionId
    );
    if (existing?.status === "open" && existing.url) {
      return { kind: "checkout", url: existing.url, reused: true };
    }
  }

  const session = await dependencies.createSession({
    token,
    priceId: input.priceId,
    successUrl: `${programUrl}?paid=1`,
    cancelUrl: `${programUrl}?payment=cancelled`,
  });

  if (!session.url) {
    throw new Error("Stripe Checkout Session is missing a URL");
  }

  try {
    await dependencies.saveSession(token, session.id);
  } catch (error) {
    if (dependencies.expireSession) {
      await dependencies.expireSession(session.id).catch(() => undefined);
    }
    throw error;
  }

  return { kind: "checkout", url: session.url, reused: false };
}

type WebhookDependencies = {
  getProgram(token: string): Promise<PaymentProgram | null>;
  markProgramPaid(token: string, sessionId: string): Promise<void>;
  clearExpiredSession(token: string, sessionId: string): Promise<void>;
};

export type WebhookResult = {
  handled: boolean;
  duplicate?: boolean;
};

export class InvalidWebhookSignatureError extends Error {
  constructor() {
    super("Invalid webhook signature");
    this.name = "InvalidWebhookSignatureError";
  }
}

export class InvalidPaymentEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPaymentEventError";
  }
}

export function verifyStripeWebhook(
  body: string,
  signature: string,
  secret: string,
  constructEvent: (
    body: string,
    signature: string,
    secret: string
  ) => Stripe.Event
) {
  try {
    return constructEvent(body, signature, secret);
  } catch {
    throw new InvalidWebhookSignatureError();
  }
}

function getSessionToken(session: Stripe.Checkout.Session) {
  return session.metadata?.token || session.client_reference_id || "";
}

export async function processStripeEvent(
  event: Stripe.Event,
  dependencies: WebhookDependencies
): Promise<WebhookResult> {
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded" &&
    event.type !== "checkout.session.expired"
  ) {
    return { handled: false };
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const tokenResult = validatePaymentToken(getSessionToken(session));
  if (!tokenResult.ok) {
    throw new InvalidPaymentEventError(
      "Webhook session has an invalid program token"
    );
  }

  const token = tokenResult.token;
  const program = await dependencies.getProgram(token);
  if (!program) {
    throw new Error("Webhook program not found");
  }

  if (event.type === "checkout.session.expired") {
    if (program.stripeSessionId === session.id && !program.isPaid) {
      await dependencies.clearExpiredSession(token, session.id);
    }
    return { handled: true };
  }

  if (session.payment_status !== "paid") {
    return { handled: true };
  }

  if (program.isPaid) {
    return { handled: true, duplicate: true };
  }

  await dependencies.markProgramPaid(token, session.id);
  return { handled: true, duplicate: false };
}
