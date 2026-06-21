'use client';

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Lock, Sparkles } from "lucide-react";

import {
  parseProgramApiResponse,
  validateProgramToken,
  type ProgramView,
} from "@/lib/program";
import { pollForPaidProgram } from "@/lib/payment-polling";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; program: ProgramView }
  | { status: "not-found"; message: string }
  | { status: "server-error"; message: string }
  | { status: "malformed-response"; message: string }
  | { status: "invalid-token"; message: string };

type PaymentReturnState =
  | { status: "idle" }
  | { status: "cancelled" }
  | { status: "processing" }
  | { status: "confirmed" }
  | { status: "timeout" }
  | { status: "error"; message: string };

type ProgramFetchResult =
  | { status: "success"; program: ProgramView }
  | {
      status:
        | "not-found"
        | "server-error"
        | "malformed-response"
        | "invalid-token";
      message: string;
    };

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function getErrorMessage(value: unknown, fallback: string) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }

  return fallback;
}

export default function ProgramTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolved = use(params);
  const token = resolved.token;

  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [retryCount, setRetryCount] = useState(0);
  const [paying, setPaying] = useState(false);
  const [paymentReturn, setPaymentReturn] = useState<PaymentReturnState>({
    status: "idle",
  });

  const fetchProgram = useCallback(
    async (signal?: AbortSignal): Promise<ProgramFetchResult> => {
      const tokenResult = validateProgramToken(token);
      if (!tokenResult.ok) {
        return {
          status: "invalid-token",
          message:
            tokenResult.reason === "missing"
              ? "This program link is missing its token."
              : "This program link contains an invalid token.",
        };
      }

      try {
        const response = await fetch(
          `/api/program/${encodeURIComponent(tokenResult.token)}`,
          {
            cache: "no-store",
            signal,
          }
        );

        let body: unknown;
        try {
          body = await response.json();
        } catch {
          return {
            status: "malformed-response",
            message: "The server returned an unreadable program response.",
          };
        }

        if (response.status === 404) {
          return {
            status: "not-found",
            message: "No program was found for this link.",
          };
        }

        if (!response.ok) {
          return {
            status: "server-error",
            message: getErrorMessage(
              body,
              `The server could not load this program (${response.status}).`
            ),
          };
        }

        const parsed = parseProgramApiResponse(body);
        if (!parsed) {
          return {
            status: "malformed-response",
            message: "The program response is missing required data.",
          };
        }

        return { status: "success", program: parsed.program };
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw error;
        }
        return {
          status: "server-error",
          message:
            error instanceof Error
              ? error.message
              : "The server could not load this program.",
        };
      }
    },
    [token]
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("payment") === "cancelled") {
      setPaymentReturn({ status: "cancelled" });
    } else if (searchParams.get("paid") === "1") {
      setPaymentReturn({ status: "processing" });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProgram() {
      setLoadState({ status: "loading" });
      try {
        const result = await fetchProgram(controller.signal);
        if (result.status === "success") {
          setLoadState({ status: "ready", program: result.program });
        } else {
          setLoadState(result);
        }
      } catch (error: unknown) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setLoadState({
            status: "server-error",
            message: "The server could not load this program.",
          });
        }
      }
    }

    void loadProgram();

    return () => {
      controller.abort();
    };
  }, [fetchProgram, retryCount]);

  useEffect(() => {
    if (paymentReturn.status !== "processing" || loadState.status !== "ready") {
      return;
    }

    if (loadState.program.is_paid) {
      setPaymentReturn({ status: "confirmed" });
      return;
    }

    const controller = new AbortController();

    void pollForPaidProgram<ProgramView>({
      signal: controller.signal,
      maxAttempts: 10,
      intervalMs: 1500,
      async check() {
        const result = await fetchProgram(controller.signal);
        if (result.status !== "success") {
          return {
            status: "terminal-error" as const,
            message: result.message,
          };
        }
        if (result.program.is_paid) {
          return { status: "paid" as const, value: result.program };
        }
        return { status: "unpaid" as const };
      },
    }).then((result) => {
      if (result.status === "paid") {
        setLoadState({ status: "ready", program: result.value });
        setPaymentReturn({ status: "confirmed" });
      } else if (result.status === "timeout") {
        setPaymentReturn({ status: "timeout" });
      } else if (result.status === "terminal-error") {
        setPaymentReturn({ status: "error", message: result.message });
      }
    });

    return () => controller.abort();
  }, [fetchProgram, loadState, paymentReturn.status]);

  const retry = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  const program = loadState.status === "ready" ? loadState.program : null;

  const days = useMemo(() => {
    const base = program?.content?.days ?? [];
    return Array.from({ length: 7 }, (_, i) => {
      const d = base.find((x) => x.day === i + 1);
      return (
        d ?? {
          day: i + 1,
          title: "Locked",
          edge: "Unlock the full program.",
        }
      );
    });
  }, [program]);

  const isPaid = !!program?.is_paid;

  async function startCheckout() {
    try {
      setPaying(true);
      const res = await fetch(`/api/checkout?token=${encodeURIComponent(token)}`, {
        method: "POST",
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        throw new Error(getErrorMessage(data, "Checkout failed"));
      }
      if (
        typeof data !== "object" ||
        data === null ||
        !("url" in data) ||
        typeof data.url !== "string"
      ) {
        throw new Error("Missing checkout URL");
      }
      window.location.href = data.url;
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setPaying(false);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  }

  async function shareText(text: string) {
    const sharePayload = {
      title: "StarPath — Personal Edge",
      text,
      url: window.location.href,
    };
    if (typeof navigator.share === "function") {
      await navigator.share(sharePayload);
    } else {
      await copyText(`${text}\n\n${window.location.href}`);
      alert("Copied. Paste it anywhere.");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10 md:px-16 md:py-16 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <Link
            href="/program"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to /program
          </Link>

          {program ? (
            <div className="text-xs text-zinc-500">
              Token: <span className="font-mono text-zinc-300">{program.token}</span>
            </div>
          ) : null}
        </div>

        {/* Header */}
        <div className="mb-12 space-y-2 border-l-2 border-emerald-500 pl-6">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter italic">
            {(program?.zodiac ?? "PROGRAM").toUpperCase()}
          </h1>
          <p className="text-zinc-500 tracking-[0.3em] text-xs font-light">
            7-DAY BEHAVIORAL RECONSTRUCTION / REV 1.0
          </p>
        </div>

        {/* states */}
        {loadState.status === "loading" ? (
          <div className="flex items-center gap-3 text-zinc-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading program...
          </div>
        ) : loadState.status !== "ready" ? (
          <ProgramLoadError state={loadState} onRetry={retry} />
        ) : (
          <>
            <PaymentReturnBanner
              state={paymentReturn}
              onRetry={() => setPaymentReturn({ status: "processing" })}
            />

            {/* Paid status banner */}
            {!isPaid ? (
              <div className="mb-10 rounded-2xl border border-emerald-900/40 bg-emerald-950/15 p-5 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-300 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-emerald-200 font-semibold">
                    Day 1 is unlocked. Days 2–7 are gated.
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">
                    Unlock the full 7-day grid to complete the loop.
                  </div>
                </div>
                <button
                  onClick={startCheckout}
                  disabled={paying}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-semibold",
                    "bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 transition",
                    paying && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {paying ? "Redirecting..." : "Unlock full program"}
                </button>
              </div>
            ) : (
              <div className="mb-10 rounded-2xl border border-emerald-700/40 bg-emerald-950/10 p-5 text-emerald-200 text-sm">
                ✅ Paid unlocked — all days available.
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {days.map((item, idx) => {
                const locked = !isPaid && item.day !== 1; // ✅ Lock 方案 1：仅 Day1
                const shareTextContent = `Day ${item.day}: ${item.title}\n${item.edge}`;

                return (
                  <div
                    key={idx}
                    className={cn(
                      "relative border p-8 min-h-[240px] flex flex-col justify-between transition-all group",
                      locked
                        ? "border-zinc-900 bg-zinc-950/10"
                        : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-600"
                    )}
                  >
                    {/* top row */}
                    <div className="flex justify-between items-start mb-6">
                      <span
                        className={cn(
                          "text-[10px] px-2 py-1 border font-mono",
                          locked
                            ? "border-zinc-800 text-zinc-700"
                            : "border-emerald-500/50 text-emerald-400"
                        )}
                      >
                        DAY {String(item.day).padStart(2, "0")}
                      </span>

                      {/* Copy/Share only when unlocked */}
                      {!locked ? (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyText(shareTextContent)}
                            className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition"
                            aria-label="Copy"
                            title="Copy"
                          >
                            ⧉
                          </button>
                          <button
                            onClick={() => shareText(shareTextContent)}
                            className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition"
                            aria-label="Share"
                            title="Share"
                          >
                            ↗
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-700 text-xs inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className={cn("text-xl font-bold mb-4", locked ? "text-zinc-700" : "text-zinc-100")}>
                        {item.title}
                      </h3>

                      <p className={cn("text-sm leading-relaxed", locked ? "text-zinc-800" : "text-zinc-400")}>
                        {item.edge}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-zinc-800/50 flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", locked ? "bg-zinc-800" : "bg-emerald-500 animate-pulse")} />
                      <span className="text-[10px] text-zinc-600 uppercase tracking-widest">
                        {locked ? "Locked" : "Active Edge"}
                      </span>
                    </div>

                    {/* locked overlay */}
                    {locked ? (
                      <div className="absolute inset-0 backdrop-blur-[6px] bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={startCheckout}
                          disabled={paying}
                          className={cn(
                            "px-4 py-2 rounded-xl text-sm font-semibold",
                            "bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 transition",
                            paying && "opacity-60 cursor-not-allowed"
                          )}
                        >
                          {paying ? "Redirecting..." : "Unlock Days 2–7"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function PaymentReturnBanner({
  state,
  onRetry,
}: {
  state: PaymentReturnState;
  onRetry: () => void;
}) {
  if (state.status === "idle") return null;

  if (state.status === "cancelled") {
    return (
      <div className="mb-6 rounded-2xl border border-amber-700/40 bg-amber-950/20 p-5 text-sm text-amber-100">
        Payment was cancelled. Day 1 remains available, and you have not been
        charged.
      </div>
    );
  }

  if (state.status === "confirmed") {
    return (
      <div className="mb-6 rounded-2xl border border-emerald-700/40 bg-emerald-950/20 p-5 text-sm text-emerald-100">
        Payment confirmed. The full 7-day program is now unlocked.
      </div>
    );
  }

  if (state.status === "processing") {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-sky-700/40 bg-sky-950/20 p-5 text-sm text-sky-100">
        <Loader2 className="h-4 w-4 animate-spin" />
        Payment received. Waiting for secure confirmation from Stripe…
      </div>
    );
  }

  const message =
    state.status === "timeout"
      ? "Payment confirmation is taking longer than expected. Do not pay again yet."
      : state.message;

  return (
    <div className="mb-6 rounded-2xl border border-amber-700/40 bg-amber-950/20 p-5">
      <div className="text-sm text-amber-100">{message}</div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-50 hover:bg-amber-500/20 transition"
      >
        Check payment again
      </button>
    </div>
  );
}

function ProgramLoadError({
  state,
  onRetry,
}: {
  state: Exclude<LoadState, { status: "loading" } | { status: "ready" }>;
  onRetry: () => void;
}) {
  const title =
    state.status === "not-found"
      ? "Program not found"
      : state.status === "malformed-response"
        ? "Program response is malformed"
        : state.status === "invalid-token"
          ? "Invalid program link"
          : "Server error";

  const canRetry =
    state.status === "server-error" || state.status === "malformed-response";

  return (
    <div className="rounded-2xl border border-red-800/60 bg-red-950/30 p-6">
      <div className="text-lg font-semibold text-red-200">{title}</div>
      <div className="text-red-300/80 mt-1">{state.message}</div>
      {canRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/20 transition"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
