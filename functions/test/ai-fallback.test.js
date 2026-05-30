const assert = require("node:assert/strict");
const test = require("node:test");

const {
  classifyFallback,
  classifyWithGemini,
} = require("../lib/ai");

test("fallback classifies refusal and captures reason", () => {
  const result = classifyFallback("I don't want to take it because of side effects");

  assert.equal(result.intent, "refused");
  assert.equal(result.refusalReason, "side_effects");
  assert.equal(result.source, "fallback");
  assert.match(result.safeMessage, /does not want to take this medicine/i);
});

test("fallback classifies urgent phrases with static safety message", () => {
  const result = classifyFallback("I fell and have chest pain");

  assert.equal(result.intent, "urgent");
  assert.equal(result.source, "fallback");
  assert.match(result.safeMessage, /Call emergency services now/i);
  assert.match(result.safeMessage, /does not provide medical advice/i);
});

test("Gemini classifier falls back when no API key is configured", async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const result = await classifyWithGemini("Please remind me later");

    assert.equal(result.intent, "snoozed");
    assert.equal(result.source, "fallback");
  } finally {
    if (originalKey) {
      process.env.GEMINI_API_KEY = originalKey;
    }
  }
});
