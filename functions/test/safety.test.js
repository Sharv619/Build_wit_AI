const assert = require("node:assert/strict");
const test = require("node:test");

const { classifyFallback, missedDoseCopy, reminderCopy } = require("../lib/ai.js");

const unsafeAdvice = [
  /take extra/i,
  /skip your dose/i,
  /change your dose/i,
  /ignore symptoms/i,
  /diagnosed/i,
  /you should stop medication/i,
];

test("urgent phrases return static safety guidance without medical advice", () => {
  const urgentInputs = ["chest pain", "cannot breathe", "I fell", "I feel dizzy", "emergency"];

  for (const input of urgentInputs) {
    const result = classifyFallback(input);
    assert.equal(result.intent, "urgent");
    assert.match(result.safeMessage, /emergency services|medical advice/i);
    assertNoUnsafeAdvice(result.safeMessage);
  }
});

test("bounded reminder and alert copy avoids unsafe medical advice", () => {
  const messages = [
    classifyFallback("I don't want to take it because I feel sick").safeMessage,
    classifyFallback("I need help").safeMessage,
    classifyFallback("unknown response").safeMessage,
    reminderCopy("Post-hospital antibiotic", "1 tablet", "lunch"),
    missedDoseCopy("Post-hospital antibiotic", "lunch"),
  ];

  for (const message of messages) {
    assertNoUnsafeAdvice(message);
  }
});

function assertNoUnsafeAdvice(message) {
  for (const pattern of unsafeAdvice) {
    assert.doesNotMatch(message, pattern);
  }
}
