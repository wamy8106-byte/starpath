// lib/edge/selector.ts
import { EdgeTags, Pattern, PATTERNS_30, Moment } from "./patterns";

export type SelectionContext = {
  sign: string;
  dateISO: string;
  tags: EdgeTags;
  lastPatternId?: string;
  usedTodayIds?: string[];
  usedTodayMoments?: Moment[];
  usedTodayTexts?: string[];
};

function hashToInt(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function loadScore(v: "low" | "med" | "high") {
  return v === "high" ? 3 : v === "med" ? 2 : 1;
}

type ScorableTrigger = "decision" | "emotion" | "social" | "conflict" | "urgency";

function tagWeights(tags: EdgeTags): Record<ScorableTrigger, number> {
  const w: Record<ScorableTrigger, number> = {
    decision: loadScore(tags.decision_load),
    emotion: loadScore(tags.emotional_load),
    social: loadScore(tags.social_load),
    conflict: loadScore(tags.conflict_risk),
    urgency: loadScore(tags.urgency),
  };

  if (tags.tone === "sharp") w.conflict += 1;
  if (tags.tone === "sober") w.decision += 1;

  return w;
}

/**
 * signAffinity 条件加权：
 * 高冲突 / 高社交 / 高决策时，星座“对味”更重要 → 权重更高
 */
function signAffinityWeight(tags: EdgeTags) {
  if (tags.conflict_risk === "high" || tags.social_load === "high" || tags.decision_load === "high") return 4;
  if (tags.emotional_load === "high") return 3;
  return 2;
}

/**
 * Moment 分布控制 v1：
 * - 优先选一个“今天还没用过的 moment”
 * - 如果今天还没出现 ≥ 3 个不同 moment，则更强力惩罚重复 moment
 */
function momentPenalty(p: Pattern, used: Moment[] | undefined) {
  if (!used || used.length === 0) return 0;
  const primary = p.moments?.[0];
  if (!primary) return 0;

  const alreadyUsed = used.includes(primary);
  if (!alreadyUsed) return 0;

  // used moments 少 → 惩罚更大（强制扩散）
  if (used.length < 3) return 8;
  return 4;
}

function scorePattern(p: Pattern, ctx: SelectionContext) {
  let s = 0;
  const w = tagWeights(ctx.tags);

  // moments 命中加分（与你现有逻辑一致）
  if (p.moments.includes("rewriting") || p.moments.includes("typing") || p.moments.includes("about_to_send")) {
    s += w.social;
  }
  if (p.moments.includes("overexplaining")) {
    s += w.decision + w.social;
  }
  if (p.moments.includes("avoiding_hard_talk")) {
    s += w.conflict + w.emotion;
  }
  if (p.moments.includes("delaying_reply") || p.moments.includes("about_to_reply")) {
    s += w.urgency;
  }
  if (p.moments.includes("impulse_react")) {
    s += w.urgency + w.conflict;
  }
  if (p.moments.includes("open_loop_decision")) {
    s += w.decision + w.urgency;
  }
  if (p.moments.includes("politeness_loop") || p.moments.includes("filling_silence")) {
    s += w.social + w.emotion;
  }
  if (p.moments.includes("offering_help_drained")) {
    s += w.emotion + w.social;
  }
  if (p.moments.includes("validation_seek")) {
    s += w.decision;
  }

  // 星座亲和度（条件权重）
  const signKey = (ctx.sign || "").toLowerCase();
  const aff = p.signAffinity?.[signKey] ?? 0;
  s += aff * signAffinityWeight(ctx.tags);

  // 反重复：上一条 pattern 降权
  if (ctx.lastPatternId && p.id === ctx.lastPatternId) s -= 6;

  // 今日已用 pattern 降权
  if (ctx.usedTodayIds?.includes(p.id)) s -= 3;

  // ✅ Moment 分布惩罚（核心）
  s -= momentPenalty(p, ctx.usedTodayMoments);

  return s;
}

function pickCandidatesByMoment(ctx: SelectionContext) {
  const used = ctx.usedTodayMoments ?? [];
  if (used.length === 0) return PATTERNS_30;

  // 优先挑 primary moment 没用过的 patterns
  const fresh = PATTERNS_30.filter((p) => {
    const primary = p.moments?.[0];
    return primary ? !used.includes(primary) : true;
  });

  // 如果 fresh 太少（<=4），放宽到“任意 moment 有一个没用过”
  if (fresh.length <= 4) {
    const broader = PATTERNS_30.filter((p) => {
      const ms = p.moments ?? [];
      return ms.some((m) => !used.includes(m));
    });
    if (broader.length > 0) return broader;
  }

  return fresh.length > 0 ? fresh : PATTERNS_30;
}

function selectPattern(ctx: SelectionContext): Pattern {
  if (!Array.isArray(PATTERNS_30) || PATTERNS_30.length === 0) {
    throw new Error("PATTERNS_30 is empty");
  }

  const candidates = pickCandidatesByMoment(ctx);

  const scored = candidates
    .map((p) => ({ p, s: scorePattern(p, ctx) }))
    .sort((a, b) => b.s - a.s);

  const topK = scored.slice(0, 8);
  const seed = hashToInt(`${ctx.sign}-${ctx.dateISO}-pattern`);

  const weights = topK.map((x, i) => clamp(x.s + 5 - i, 1, 20));
  const total = weights.reduce((a, b) => a + b, 0);

  let r = seed % total;
  for (let i = 0; i < topK.length; i++) {
    r -= weights[i];
    if (r < 0) return topK[i].p;
  }

  return topK[0].p;
}

function pickBlueprint(pattern: Pattern, ctx: SelectionContext) {
  const blueprints = pattern.blueprints || [];
  if (blueprints.length === 0) return "";

  const usedTexts = ctx.usedTodayTexts ?? [];
  const seed = hashToInt(`${ctx.sign}-${ctx.dateISO}-bp-${pattern.id}`);

  // 先尝试找一个“今天没用过的句子”
  if (usedTexts.length > 0) {
    // 从 seed 起步线性探测，最多探测 6 次
    let idx = seed % blueprints.length;
    for (let i = 0; i < Math.min(6, blueprints.length); i++) {
      const candidate = blueprints[idx];
      if (candidate && !usedTexts.includes(candidate)) return candidate;
      idx = (idx + 1) % blueprints.length;
    }
  }

  // fallback：确定性选一个
  return blueprints[seed % blueprints.length];
}

/**
 * ✅ 主函数：生成 Personal Edge（带兜底）
 */
export function selectPersonalEdge(ctx: SelectionContext) {
  try {
    const pattern = selectPattern(ctx);
    const text = pickBlueprint(pattern, ctx) || "Say less. Let your point stand.";

    return {
      text,
      patternId: pattern.id,
      moment: pattern.moments?.[0],
      label: pattern.label,
    };
  } catch (e) {
    return {
      text: "Say less. Let your point stand.",
      patternId: "fallback",
      moment: "typing",
      label: "fallback",
    };
  }
}