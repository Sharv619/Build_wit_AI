const assert = require("node:assert/strict");
const test = require("node:test");

const {
  classifyFallback,
  classifyWithGemini,
} = require("../lib/ai");
const {
  resolveMedicationStatusForTest,
} = require("../lib/index");

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

test("fallback classifies help phrases before taken language", () => {
  const result = classifyFallback("I took it but I fell and need help");

  assert.equal(result.intent, "urgent");
  assert.match(result.safeMessage, /Call emergency services now/i);
});

test("backend status resolution requires confirmation for taken responses", () => {
  assert.equal(resolveMedicationStatusForTest("taken", false), "pending_confirmation");
  assert.equal(resolveMedicationStatusForTest("taken", true), "taken_confirmed");
});

test("backend status resolution maps urgent and caregiver attention to help requested", () => {
  assert.equal(resolveMedicationStatusForTest("urgent", true), "help_requested");
  assert.equal(resolveMedicationStatusForTest("caregiver_attention", true), "help_requested");
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
