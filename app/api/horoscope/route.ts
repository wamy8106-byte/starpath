import { NextResponse } from "next/server";
import OpenAI from "openai";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";

import { selectPersonalEdge } from "@/lib/edge/selector";
import type { EdgeTags, Moment } from "@/lib/edge/patterns";
import { getSelectorMemory, recordEdge } from "@/lib/edge/memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ALLOWED_SIGNS = new Set([
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
]);

/**
 * 锁定新加坡时区，防止日期在深夜/凌晨发生偏差
 */
function todayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
  }).format(new Date());
}

const CACHE_VERSION = "v2"; // 升级版本号以强制刷新缓存

// Dev: 10 min, Prod: 24h
const CACHE_TTL = process.env.NODE_ENV === "production" ? 60 * 60 * 24 : 60 * 10;

type Section = { score: number; message: string; advice: string };

type HoroscopeData = {
  theme: string;
  micro_insight: { daily_focus: string; caution: string; luck_signals: string };
  personal_edge?: string;
  moment?: string; // 给前端 UI 使用
  label?: string;  // 给前端 UI 使用
  career: Section;
  love: Section;
  luck: Section;
  affirmation: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeScores(data: HoroscopeData) {
  const c = clamp(Math.round(data.career?.score ?? 60), 35, 92);
  const l = clamp(Math.round(data.love?.score ?? 58), 35, 92);
  const k = clamp(Math.round(data.luck?.score ?? 55), 35, 92);

  const arr = [
    { key: "career" as const, v: c },
    { key: "love" as const, v: l },
    { key: "luck" as const, v: k },
  ].sort((a, b) => b.v - a.v);

  if (arr[0].v - arr[1].v < 8) arr[1].v = Math.max(35, arr[0].v - 8);
  if (arr[1].v - arr[2].v < 8) arr[2].v = Math.max(35, arr[1].v - 8);

  const out: any = {};
  for (const it of arr) out[it.key] = clamp(it.v, 35, 92);

  data.career.score = out.career;
  data.love.score = out.love;
  data.luck.score = out.luck;

  return data;
}

function extractTags(d: HoroscopeData): EdgeTags {
  const blob = `${d.theme} ${d.micro_insight.daily_focus} ${d.micro_insight.caution} ${d.career.message} ${d.love.message} ${d.luck.message}`.toLowerCase();
  const has = (re: RegExp) => re.test(blob);

  const decision = has(/\b(decide|choice|commit|plan|confirm|finalize|offer|deadline)\b/) ? "high"
    : has(/\b(consider|options|maybe|weigh)\b/) ? "med" : "low";

  const emotion = has(/\b(feel|emotion|hurt|resent|tender|sensitive|heart|cry|lonely|comfort)\b/) ? "high"
    : has(/\b(mood|warm|soft|care)\b/) ? "med" : "low";

  const social = has(/\b(talk|say|text|reply|speak|listen|friend|partner|date)\b/) ? "high"
    : has(/\b(people|others|team)\b/) ? "med" : "low";

  const conflict = has(/\b(conflict|tension|argument|pushback|confront|awkward|boundary)\b/) ? "high"
    : has(/\b(disagree|friction)\b/) ? "med" : "low";

  const urgency = has(/\b(today|now|immediately|urgent|asap)\b/) ? "med"
    : has(/\b(deadline)\b/) ? "high" : "low";

  const tone = conflict === "high" ? "sharp" : decision === "high" ? "sober" : "soft";

  return { decision_load: decision, emotional_load: emotion, social_load: social, conflict_risk: conflict, urgency, tone };
}

const generateCachedBaseHoroscope = unstable_cache(
  async (signRaw: string, date: string) => {
    const basePrompt = `
You are StarPath’s premium astrologer: mystical, warm, modern, and specific.
Create a DAILY horoscope for:
Sign: ${signRaw}
Date (ISO): ${date}

Output ONLY valid JSON. No markdown.
{
  "theme": "2-5 word poetic title",
  "micro_insight": {
    "daily_focus": "6-10 words",
    "caution": "6-10 words",
    "luck_signals": "Color • Number"
  },
  "career": { "score": 35-92, "message": "2 sentences", "advice": "1 sentence" },
  "love":   { "score": 35-92, "message": "2 sentences", "advice": "1 sentence" },
  "luck":   { "score": 35-92, "message": "2 sentences", "advice": "1 sentence" },
  "affirmation": "one short line"
}`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You output strict JSON only." },
        { role: "user", content: basePrompt },
      ],
    });

    const text = completion.choices?.[0]?.message?.content ?? "{}";
    let data = JSON.parse(text) as HoroscopeData;

    data.micro_insight = data.micro_insight ?? {
      daily_focus: "Stay grounded in your choices.",
      caution: "Avoid unnecessary detours today.",
      luck_signals: "Silver • 11",
    };

    return normalizeScores(data);
  },
  [`horoscope:${CACHE_VERSION}`],
  { revalidate: CACHE_TTL }
);

// ---- Moment Type Guard ----
const MOMENTS = [
  "typing", "rewriting", "about_to_send", "about_to_reply", "delaying_reply",
  "overexplaining", "politeness_loop", "softening_opinion", "validation_seek",
  "offering_help_drained", "filling_silence", "avoiding_hard_talk", "impulse_react",
  "open_loop_decision",
] as const;

function isMoment(x: unknown): x is Moment {
  return typeof x === "string" && (MOMENTS as readonly string[]).includes(x);
}

async function getOrCreateUserId() {
  const store = await cookies();
  const existing = store.get("sp_uid")?.value;
  if (existing && existing.trim()) return { userId: existing, isNew: false };

  const userId = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return { userId, isNew: true };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const signRaw = searchParams.get("sign")?.toLowerCase().trim();

  if (!signRaw || !ALLOWED_SIGNS.has(signRaw)) {
    return NextResponse.json({ error: "Invalid or missing sign" }, { status: 400 });
  }

  const date = todayISO();
  const { userId, isNew } = await getOrCreateUserId();

  try {
    // 1) 基础运势 (Cached)
    const data = await generateCachedBaseHoroscope(signRaw, date);

    // 2) 提取标签
    const tags = extractTags(data);

    // 3) 读取记忆
    const mem = getSelectorMemory(userId, date);

    // 4) 生成 Personal Edge (Per-user, No Cache)
    const edge = selectPersonalEdge({
      sign: signRaw,
      dateISO: date,
      tags,
      lastPatternId: mem.lastPatternId,
      usedTodayIds: mem.usedTodayIds,
      usedTodayMoments: mem.usedTodayMoments,
      usedTodayTexts: mem.usedTodayTexts,
    });

    // 5) 将 Edge 数据同步到返回结果，供前端展示
    data.personal_edge = edge.text;
    data.moment = edge.moment; 
    data.label = edge.label;

    // 6) 记录记忆，使用 Type Guard 保证 Moment 类型安全
    const safeMoment: Moment = isMoment(edge.moment) ? edge.moment : "typing";

    recordEdge(userId, {
      dateISO: date,
      sign: signRaw,
      patternId: edge.patternId,
      moment: safeMoment,
      text: edge.text,
    });

    const res = NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });

    if (isNew) {
      res.cookies.set("sp_uid", userId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
