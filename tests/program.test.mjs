import assert from "node:assert/strict";
import test from "node:test";

import {
  parseProgramApiResponse,
  projectProgramForClient,
  validateProgramToken,
} from "../lib/program.ts";

const days = Array.from({ length: 7 }, (_, index) => ({
  day: index + 1,
  title: `Day ${index + 1}`,
  edge: `Edge ${index + 1}`,
}));

function row(overrides = {}) {
  return {
    token: "abcDEF_12345",
    email: "private@example.com",
    zodiac: "libra",
    is_paid: false,
    content: {
      title: "Libra Personal Edge",
      days,
    },
    ...overrides,
  };
}

test("unpaid program response contains only Day 1 and excludes email", () => {
  const program = projectProgramForClient(row());

  assert.ok(program);
  assert.deepEqual(program.content.days.map((day) => day.day), [1]);
  assert.equal("email" in program, false);
});

test("paid program response contains all seven days", () => {
  const program = projectProgramForClient(row({ is_paid: true }));

  assert.ok(program);
  assert.deepEqual(
    program.content.days.map((day) => day.day),
    [1, 2, 3, 4, 5, 6, 7]
  );
});

test("missing and malformed tokens are rejected", () => {
  assert.deepEqual(validateProgramToken(""), {
    ok: false,
    reason: "missing",
  });
  assert.deepEqual(validateProgramToken("bad token!"), {
    ok: false,
    reason: "malformed",
  });
});

test("frontend parser reads program from the response wrapper", () => {
  const parsed = parseProgramApiResponse({
    success: true,
    program: row(),
  });

  assert.ok(parsed);
  assert.equal(parsed.program.token, "abcDEF_12345");
  assert.equal(parsed.program.content.days.length, 1);
});

test("frontend parser rejects malformed wrappers", () => {
  assert.equal(parseProgramApiResponse(row()), null);
  assert.equal(
    parseProgramApiResponse({ success: true, program: { token: "short" } }),
    null
  );
});

test("malformed program content is rejected", () => {
  assert.equal(
    projectProgramForClient(
      row({
        content: {
          title: "Broken program",
          days: [{ day: 1, title: "", edge: "Missing title" }],
        },
      })
    ),
    null
  );
});
