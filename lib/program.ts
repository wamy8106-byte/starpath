export type ProgramDay = {
  day: number;
  title: string;
  edge: string;
};

export type ProgramContent = {
  title?: string;
  days: ProgramDay[];
};

export type ProgramView = {
  token: string;
  zodiac: string;
  is_paid: boolean;
  content: ProgramContent;
};

export type ProgramApiSuccess = {
  success: true;
  program: ProgramView;
};

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseDay(value: unknown): ProgramDay | null {
  if (!isRecord(value)) return null;

  const { day, title, edge } = value;
  if (
    !Number.isInteger(day) ||
    typeof day !== "number" ||
    day < 1 ||
    day > 7 ||
    typeof title !== "string" ||
    !title.trim() ||
    typeof edge !== "string" ||
    !edge.trim()
  ) {
    return null;
  }

  return {
    day,
    title: title.trim(),
    edge: edge.trim(),
  };
}

function parseContent(value: unknown): ProgramContent | null {
  if (!isRecord(value) || !Array.isArray(value.days)) return null;

  const days = value.days.map(parseDay);
  if (days.some((day) => day === null)) return null;

  const validDays = days as ProgramDay[];
  const uniqueDays = new Set(validDays.map((day) => day.day));
  if (uniqueDays.size !== validDays.length) return null;

  const title =
    typeof value.title === "string" && value.title.trim()
      ? value.title.trim()
      : undefined;

  return {
    ...(title ? { title } : {}),
    days: validDays.sort((a, b) => a.day - b.day),
  };
}

export function validateProgramToken(
  value: unknown
):
  | { ok: true; token: string }
  | { ok: false; reason: "missing" | "malformed" } {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, reason: "missing" };
  }

  const token = value.trim();
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(token)) {
    return { ok: false, reason: "malformed" };
  }

  return { ok: true, token };
}

export function projectProgramForClient(
  value: unknown
): ProgramView | null {
  if (!isRecord(value)) return null;

  const tokenResult = validateProgramToken(value.token);
  const content = parseContent(value.content);
  if (
    !tokenResult.ok ||
    typeof value.zodiac !== "string" ||
    !value.zodiac.trim() ||
    typeof value.is_paid !== "boolean" ||
    !content
  ) {
    return null;
  }

  const visibleDays = value.is_paid
    ? content.days
    : content.days.filter((day) => day.day === 1);

  const expectedDayCount = value.is_paid ? 7 : 1;
  if (
    visibleDays.length !== expectedDayCount ||
    visibleDays.some((day, index) => day.day !== index + 1)
  ) {
    return null;
  }

  return {
    token: tokenResult.token,
    zodiac: value.zodiac.trim().toLowerCase(),
    is_paid: value.is_paid,
    content: {
      ...(content.title ? { title: content.title } : {}),
      days: visibleDays,
    },
  };
}

export function parseProgramApiResponse(
  value: unknown
): ProgramApiSuccess | null {
  if (!isRecord(value) || value.success !== true) return null;

  const program = projectProgramForClient(value.program);
  return program ? { success: true, program } : null;
}
