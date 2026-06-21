export type PaymentPollResult<T> =
  | { status: "paid"; value: T; attempts: number }
  | { status: "timeout"; attempts: number }
  | { status: "terminal-error"; message: string; attempts: number }
  | { status: "aborted"; attempts: number };

export type PaymentPollAttempt<T> =
  | { status: "paid"; value: T }
  | { status: "unpaid" }
  | { status: "terminal-error"; message: string };

function delay(milliseconds: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });
}

export async function pollForPaidProgram<T>(
  options: {
    check(): Promise<PaymentPollAttempt<T>>;
    maxAttempts?: number;
    intervalMs?: number;
    signal?: AbortSignal;
    wait?: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
  }
): Promise<PaymentPollResult<T>> {
  const maxAttempts = options.maxAttempts ?? 10;
  const intervalMs = options.intervalMs ?? 1500;
  const wait = options.wait ?? delay;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (options.signal?.aborted) {
      return { status: "aborted", attempts: attempt - 1 };
    }

    const result = await options.check();
    if (result.status === "paid") {
      return { ...result, attempts: attempt };
    }
    if (result.status === "terminal-error") {
      return { ...result, attempts: attempt };
    }
    if (attempt < maxAttempts) {
      await wait(intervalMs, options.signal);
    }
  }

  return { status: "timeout", attempts: maxAttempts };
}
