// types/global.d.ts

export {};

// 必须与 memory.ts 中的 DayMemory 结构对齐
type DayMemory = {
  lastPatternId?: string;
  usedTodayIds: string[];
  usedTodayMoments: any[]; // 这里可以用 any[] 避开复杂的类型导入循环
  usedTodayTexts: string[];
};

declare global {
  // 保持与 memory.ts 逻辑一致的嵌套 Map 结构
  var __STARPATH_EDGE_REGISTRY__: 
    | Map<string, Map<string, DayMemory>> 
    | undefined;
}