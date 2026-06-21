import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidPaymentEventError,
  InvalidWebhookSignatureError,
  createProgramCheckout,
  processStripeEvent,
  verifyStripeWebhook,
} from "../lib/payment.ts";
import { pollForPaidProgram } from "../lib/payment-polling.ts";
import { parseProgramApiResponse } from "../lib/program.ts";

const token = "abcDEF_12345";

function checkoutEvent({
  id = "cs_test_123",
  paymentStatus = "paid",
  type = "checkout.session.completed",
} = {}) {
  return {
    id: "evt_test_123",
    type,
    data: {
      object: {
        id,
        client_reference_id: token,
        metadata: { token },
        payment_status: paymentStatus,
      },
    },
  };
}

test("paid=1 does not unlock an unpaid API response", () => {
  const parsed = parseProgramApiResponse({
    success: true,
    program: {
      token,
      zodiac: "libra",
      is_paid: false,
      content: {
        days: [{ day: 1, title: "Preview", edge: "Preview edge" }],
      },
    },
  });

  const returnQuery = new URLSearchParams("paid=1");
  assert.equal(returnQuery.get("paid"), "1");
  assert.ok(parsed);
  assert.equal(parsed.program.is_paid, false);
  assert.equal(parsed.program.content.days.length, 1);
});

test("already-paid program does not create another Checkout Session", async () => {
  let createCalls = 0;
  const result = await createProgramCheckout(
    { token, priceId: "price_test", appUrl: "http://localhost:3000" },
    {
      async getProgram() {
        return { token, isPaid: true };
      },
      async retrieveSession() {
        return null;
      },
      async createSession() {
        createCalls += 1;
        return { id: "cs_new", status: "open", url: "https://checkout.test" };
      },
      async saveSession() {},
    }
  );

  assert.equal(result.kind, "already-paid");
  assert.equal(createCalls, 0);
});

test("open Checkout Session is reused", async () => {
  let createCalls = 0;
  const result = await createProgramCheckout(
    { token, priceId: "price_test", appUrl: "http://localhost:3000" },
    {
      async getProgram() {
        return { token, isPaid: false, stripeSessionId: "cs_open" };
      },
      async retrieveSession() {
        return {
          id: "cs_open",
          status: "open",
          url: "https://checkout.test/open",
        };
      },
      async createSession() {
        createCalls += 1;
        return { id: "cs_new", status: "open", url: "https://checkout.test" };
      },
      async saveSession() {},
    }
  );

  assert.deepEqual(result, {
    kind: "checkout",
    url: "https://checkout.test/open",
    reused: true,
  });
  assert.equal(createCalls, 0);
});

test("invalid webhook signature is rejected", () => {
  assert.throws(
    () =>
      verifyStripeWebhook("body", "bad-signature", "secret", () => {
        throw new Error("signature mismatch");
      }),
    InvalidWebhookSignatureError
  );
});

test("webhook with an invalid program token is rejected", async () => {
  const event = checkoutEvent();
  event.data.object.metadata.token = "bad token";
  event.data.object.client_reference_id = "bad token";

  await assert.rejects(
    processStripeEvent(event, {
      async getProgram() {
        throw new Error("must not query");
      },
      async markProgramPaid() {},
      async clearExpiredSession() {},
    }),
    InvalidPaymentEventError
  );
});

test("completed webhook updates the correct program", async () => {
  const updates = [];
  const result = await processStripeEvent(checkoutEvent(), {
    async getProgram(receivedToken) {
      assert.equal(receivedToken, token);
      return { token, isPaid: false, stripeSessionId: "cs_test_123" };
    },
    async markProgramPaid(receivedToken, sessionId) {
      updates.push({ receivedToken, sessionId });
    },
    async clearExpiredSession() {},
  });

  assert.deepEqual(updates, [
    { receivedToken: token, sessionId: "cs_test_123" },
  ]);
  assert.deepEqual(result, { handled: true, duplicate: false });
});

test("duplicate completed webhook delivery is safe", async () => {
  let updates = 0;
  const result = await processStripeEvent(checkoutEvent(), {
    async getProgram() {
      return { token, isPaid: true, stripeSessionId: "cs_test_123" };
    },
    async markProgramPaid() {
      updates += 1;
    },
    async clearExpiredSession() {},
  });

  assert.equal(updates, 0);
  assert.deepEqual(result, { handled: true, duplicate: true });
});

test("polling stops after payment success", async () => {
  let checks = 0;
  const result = await pollForPaidProgram({
    maxAttempts: 5,
    intervalMs: 0,
    async wait() {},
    async check() {
      checks += 1;
      return checks === 3
        ? { status: "paid", value: "confirmed" }
        : { status: "unpaid" };
    },
  });

  assert.deepEqual(result, {
    status: "paid",
    value: "confirmed",
    attempts: 3,
  });
  assert.equal(checks, 3);
});

test("polling stops at its timeout bound", async () => {
  let checks = 0;
  const result = await pollForPaidProgram({
    maxAttempts: 4,
    intervalMs: 0,
    async wait() {},
    async check() {
      checks += 1;
      return { status: "unpaid" };
    },
  });

  assert.deepEqual(result, { status: "timeout", attempts: 4 });
  assert.equal(checks, 4);
});
