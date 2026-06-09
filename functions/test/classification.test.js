const assert = require("node:assert/strict");
const test = require("node:test");

const { classifyFallback, classifyWithGemini } = require("../lib/ai.js");

const supportedStatuses = new Set(["taken", "snoozed", "missed", "refused", "help_requested", "unknown"]);
const supportedRefusalReasons = new Set([
  "away_from_medicine",
  "side_effects",
  "feeling_unwell",
  "confused",
  "does_not_understand",
  "other",
  "unknown",
]);

test("deterministic fallback classifies common medication responses without Gemini", async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    assert.deepEqual(await classifyWithGemini("I took it"), {
      intent: "taken",
      refusalReason: undefined,
      safeMessage: "Response recorded.",
      source: "fallback",
    });

    assert.equal((await classifyWithGemini("remind me later")).intent, "snoozed");

    const refused = await classifyWithGemini("I don't want to take it because I feel sick");
    assert.equal(refused.intent, "refused");
    assert.equal(refused.refusalReason, "feeling_unwell");

    assert.equal((await classifyWithGemini("I need help")).intent, "help_requested");
  } finally {
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
  }
});

test("fallback response intents map to supported v2 status values when not urgent", () => {
  const inputs = ["I took it", "remind me later", "I refuse", "I need help", "something else"];

  for (const input of inputs) {
    const result = classifyFallback(input);
    assert.ok(supportedStatuses.has(result.intent), `${result.intent} should be a supported status`);
  }
});

test("fallback refusal reasons stay within supported v2 values", () => {
  const inputs = [
    "I don't want to take it because I am away",
    "I refuse because of side effects",
    "I don't want to take it because I feel sick",
    "I don't want it because I am confused",
    "I don't understand this medicine",
    "I refuse for another reason",
  ];

  for (const input of inputs) {
    const result = classifyFallback(input);
    assert.equal(result.intent, "refused");
    assert.ok(supportedRefusalReasons.has(result.refusalReason), `${result.refusalReason} should be supported`);
  }
});
