import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 允许的星座 slug
const ALLOWED_SIGNS = new Set([
  "aries","taurus","gemini","cancer","leo","virgo",
  "libra","scorpio","sagittarius","capricorn","aquarius","pisces",
]);

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const signRaw = searchParams.get("sign")?.toLowerCase().trim();

  if (!signRaw) {
    return NextResponse.json({ error: "Missing sign" }, { status: 400 });
  }
  if (!ALLOWED_SIGNS.has(signRaw)) {
    return NextResponse.json({ error: "Invalid sign" }, { status: 400 });
  }

  const date = todayISO();

  const prompt = `
You are StarPath’s premium astrologer: mystical, warm, modern, and specific.

Create a DAILY horoscope for:
- Sign: ${signRaw}
- Date (ISO): ${date}

CRITICAL OUTPUT RULES:
1) Output ONLY valid JSON. No markdown. No extra text.
2) Be fresh and specific. Avoid generic lines like "Trust your instincts", "the universe", "serendipity", "align", "journey".
3) Make it feel like TODAY: include at least one subtle time anchor like "this morning", "midday", or "tonight" (do not mention times in all 3 sections—spread naturally).
4) Each section must feel different:
   - Career: practical + concrete (work, money, decisions)
   - Love: emotional + relational (communication, boundaries, intimacy)
   - Luck: mystical + intuitive (synchronicity, signs, timing)
5) Keep messages concise and elegant:
   - micro_insight: 6–10 words, punchy, not a full sentence, no quotes
   - message: exactly 2 sentences
   - advice: exactly 1 sentence, actionable, specific
6) Scores must feel believable and not all similar. Use 0–100 integers.

Return STRICT JSON in this exact shape:

{
  "theme": "2-5 word poetic title",

  "micro_insight": {
    "daily_focus": "short focus phrase",
    "caution": "short caution",
    "luck_signals": "symbol + number (e.g. 'Silver • 43')"
  },

  "personal_edge": "one bold behavioral nudge (max 10 words)",

  "career": {
    "score": 0,
    "message": "exactly 2 sentences",
    "advice": "exactly 1 sentence"
  },
  "love": {
    "score": 0,
    "message": "exactly 2 sentences",
    "advice": "exactly 1 sentence"
  },
  "luck": {
    "score": 0,
    "message": "exactly 2 sentences",
    "advice": "exactly 1 sentence"
  },

  "affirmation": "one short empowering line"
}


Micro rules:
- micro_insight.daily_focus / caution / luck_signals must NEVER be empty.
- luck_signals must be exactly: "<Color> • <Number 1-99>"


Style notes:
- Vivid but clean wording (no over-the-top fantasy).
- Do not repeat the same verbs across sections.
- Tailor details to ${signRaw}.
- personal_edge must feel decisive, human, slightly uncomfortable.

`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a premium mystical astrologer." },
        { role: "user", content: prompt },
      ],
    });

    const text = completion.choices?.[0]?.message?.content ?? "{}";

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Bad JSON from model" }, { status: 502 });
    }

    // 可选：避免 Next 在 dev 里缓存导致你“刷新还一样”
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "AI failed" }, { status: 500 });
  }
}




