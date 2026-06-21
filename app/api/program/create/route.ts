// app/api/program/create/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { nanoid } from "nanoid";
import { supabaseServer } from "@/lib/supabase/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ALLOWED_SIGNS = new Set([
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
]);

function isValidEmail(email: string) {
  // MVP：够用的校验（后续再换更严格的）
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type DayItem = { day: number; title: string; edge: string };
type ProgramContent = { title: string; days: DayItem[] };

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeProgram(raw: unknown, zodiac: string): ProgramContent {
  const program = isRecord(raw) ? raw : {};
  const title =
    typeof program.title === "string" && program.title.trim()
      ? program.title.trim()
      : `${zodiac.toUpperCase()} 7-Day Edge Program`;

  const daysArr = Array.isArray(program.days) ? program.days : [];
  const days: DayItem[] = [];

  for (let i = 1; i <= 7; i++) {
    const found =
      daysArr.find(
        (day) => isRecord(day) && Number(day.day) === i
      ) ?? {};
    const t =
      isRecord(found) &&
      typeof found.title === "string" &&
      found.title.trim()
        ? found.title.trim()
        : `Day ${i}`;

    const e =
      isRecord(found) &&
      typeof found.edge === "string" &&
      found.edge.trim()
        ? found.edge.trim()
        : "Keep it simple today. One clear action, no extra explanations.";

    days.push({ day: i, title: t, edge: e });
  }

  return { title, days };
}

async function generate7DayProgram(zodiac: string): Promise<ProgramContent> {
  const prompt = `
You are StarPath. Create a 7-day "Edge Program" for the zodiac sign: ${zodiac}.

This is NOT astrology fluff. It is behavioral precision.
Tone: modern, crisp, slightly edgy, calming. No mysticism, no clichés.

Output ONLY valid JSON with this exact schema:
{
  "title": "string",
  "days": [
    { "day": 1, "title": "2-4 words", "edge": "ONE sentence, 8-16 words" },
    ...
    { "day": 7, "title": "2-4 words", "edge": "ONE sentence, 8-16 words" }
  ]
}

Rules:
- day must be 1..7 (each exactly once)
- "edge" must be one actionable behavioral constraint (action subtraction style)
- Avoid these words: universe, energy, align, manifest, destiny, fate, vibes, healing, blessed, grateful
- Avoid work-tool-specific words: slack, kpi, standup, deck
- No emojis
`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.9,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "Return strict JSON only. No markdown." },
      { role: "user", content: prompt },
    ],
  });

  const text = completion.choices?.[0]?.message?.content ?? "{}";
  let obj: unknown = {};
  try {
    obj = JSON.parse(text);
  } catch {
    obj = {};
  }

  return normalizeProgram(obj, zodiac);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const emailRaw = typeof body?.email === "string" ? body.email.trim() : "";
    const zodiacRaw = typeof body?.zodiac === "string" ? body.zodiac.trim().toLowerCase() : "";

    if (!emailRaw || !isValidEmail(emailRaw)) {
      return NextResponse.json({ success: false, error: "Invalid email" }, { status: 400 });
    }
    if (!ALLOWED_SIGNS.has(zodiacRaw)) {
      return NextResponse.json({ success: false, error: "Invalid zodiac" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ success: false, error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
      return NextResponse.json({ success: false, error: "Missing Supabase env vars" }, { status: 500 });
    }

    // 1) 生成 token
    const token = nanoid(12);

    // 2) 调 AI 生成 7 天
    const content = await generate7DayProgram(zodiacRaw);

    // 3) 写入 Supabase（服务端 key）
    const { error } = await supabaseServer.from("programs").insert([
      {
        token,
        email: emailRaw,
        zodiac: zodiacRaw,
        content,
        is_paid: false,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      token,
      url: `/program/${token}`,
    });
  } catch (error: unknown) {
    console.error("Create program route crash:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}
