// lib/edge/memory.ts
import type { Moment } from "./patterns";

type DayMemory = {
  lastPatternId?: string;
  usedTodayIds: string[];
  usedTodayMoments: Moment[];
  usedTodayTexts: string[]; // 用于避免同一句重复
};

type EdgeEvent = {
  dateISO: string;
  sign: string;
  patternId: string;
  moment?: Moment;
  text: string;
};

type Registry = Map<string /* userId */, Map<string /* dateISO */, DayMemory>>;

declare global {
  // eslint-disable-next-line no-var
  var __STARPATH_EDGE_REGISTRY__: Registry | undefined;
}

function getRegistry(): Registry {
  if (!globalThis.__STARPATH_EDGE_REGISTRY__) {
    globalThis.__STARPATH_EDGE_REGISTRY__ = new Map();
  }
  return globalThis.__STARPATH_EDGE_REGISTRY__;
}

function getOrCreateDayMemory(userId: string, dateISO: string): DayMemory {
  const reg = getRegistry();

  if (!reg.has(userId)) reg.set(userId, new Map());
  const userMap = reg.get(userId)!;

  if (!userMap.has(dateISO)) {
    userMap.set(dateISO, {
      usedTodayIds: [],
      usedTodayMoments: [],
      usedTodayTexts: [],
    });
  }

  return userMap.get(dateISO)!;
}

export function getSelectorMemory(userId: string, dateISO: string) {
  const mem = getOrCreateDayMemory(userId, dateISO);

  return {
    lastPatternId: mem.lastPatternId,
    usedTodayIds: [...mem.usedTodayIds],
    usedTodayMoments: [...mem.usedTodayMoments],
    usedTodayTexts: [...mem.usedTodayTexts],
  };
}

export function recordEdge(userId: string, event: EdgeEvent) {
  const mem = getOrCreateDayMemory(userId, event.dateISO);

  mem.lastPatternId = event.patternId;

  if (!mem.usedTodayIds.includes(event.patternId)) {
    mem.usedTodayIds.push(event.patternId);
  }

  if (event.moment && !mem.usedTodayMoments.includes(event.moment)) {
    mem.usedTodayMoments.push(event.moment);
  }

  // text 去重（保留最多 30 条，够用）
  if (event.text && !mem.usedTodayTexts.includes(event.text)) {
    mem.usedTodayTexts.push(event.text);
    if (mem.usedTodayTexts.length > 30) mem.usedTodayTexts.shift();
  }
}