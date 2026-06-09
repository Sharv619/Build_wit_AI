const assert = require("node:assert/strict");
const test = require("node:test");

const { classifyFallback } = require("../lib/ai.js");
const { writeMedicationResponse } = require("../lib/core/record-response.js");

const unsafeAdvice = /take extra|skip your dose|change your dose|ignore symptoms|diagnosed|you should stop medication/i;

test("write layer records refused response log and refusal notification", async () => {
  const db = new FakeFirestore();
  const classified = classifyFallback("I don't want to take it because I feel sick");

  const result = await writeMedicationResponse(db, {
    householdId: "demo-household-eleanor",
    userId: "demo-eleanor",
    caregiverId: "demo-caregiver",
    medicationId: "med-antibiotic",
    routineEventId: "event-lunch",
    status: "refused",
    intent: classified.intent,
    responseMethod: "typed",
    responseText: "I don't want to take it because I feel sick",
    refusalReason: classified.refusalReason,
    refusalNote: "I don't want to take it because I feel sick",
    safeMessage: classified.safeMessage,
    now: () => "2026-06-01T00:00:00.000Z",
  });

  assert.equal(result.status, "refused");
  assert.equal(result.intent, "refused");
  assert.equal(result.refusalReason, "feeling_unwell");
  assert.equal(result.notifications.length, 1);
  assert.doesNotMatch(result.message, unsafeAdvice);

  assert.equal(db.documents.medicationLogs.length, 1);
  assert.deepEqual(db.documents.medicationLogs[0].data, {
    householdId: "demo-household-eleanor",
    medicationId: "med-antibiotic",
    routineEventId: "event-lunch",
    userId: "demo-eleanor",
    status: "refused",
    responseMethod: "typed",
    responseText: "I don't want to take it because I feel sick",
    refusalReason: "feeling_unwell",
    refusalNote: "I don't want to take it because I feel sick",
    createdAt: "2026-06-01T00:00:00.000Z",
  });

  assert.equal(db.documents.notifications.length, 1);
  assert.deepEqual(db.documents.notifications[0].data, {
    householdId: "demo-household-eleanor",
    userId: "demo-eleanor",
    seniorId: "demo-eleanor",
    caregiverId: "demo-caregiver",
    medicationId: "med-antibiotic",
    routineEventId: "event-lunch",
    type: "refusal",
    severity: "warning",
    title: "Medication reminder refused",
    message: "Eleanor refused a medication reminder. Please check in and review the reason before taking further action.",
    refusalReason: "feeling_unwell",
    status: "sent",
    createdAt: "2026-06-01T00:00:00.000Z",
  });
  assert.doesNotMatch(db.documents.notifications[0].data.message, unsafeAdvice);
});

test("write layer does not duplicate refusal notification for same medication event", async () => {
  const db = new FakeFirestore();
  const classified = classifyFallback("I don't want to take it because I feel sick");
  const input = {
    householdId: "demo-household-eleanor",
    userId: "demo-eleanor",
    medicationId: "med-antibiotic",
    routineEventId: "event-lunch",
    status: "refused",
    intent: classified.intent,
    responseMethod: "typed",
    responseText: "I don't want to take it because I feel sick",
    refusalReason: classified.refusalReason,
    safeMessage: classified.safeMessage,
    now: () => "2026-06-01T00:00:00.000Z",
  };

  await writeMedicationResponse(db, input);
  await writeMedicationResponse(db, input);

  assert.equal(db.documents.medicationLogs.length, 2);
  assert.equal(db.documents.notifications.length, 1);
});

class FakeFirestore {
  constructor() {
    this.documents = {
      medicationLogs: [],
      notifications: [],
    };
  }

  collection(name) {
    if (!this.documents[name]) this.documents[name] = [];
    return new FakeCollection(this.documents[name], name);
  }
}

class FakeCollection {
  constructor(documents, name) {
    this.documents = documents;
    this.name = name;
  }

  async add(data) {
    const id = `${this.name}-${this.documents.length + 1}`;
    this.documents.push({ id, data });
    return { id };
  }

  where(field, op, value) {
    return new FakeQuery(this.documents).where(field, op, value);
  }
}

class FakeQuery {
  constructor(documents) {
    this.documents = documents;
    this.filters = [];
    this.max = Infinity;
  }

  where(field, op, value) {
    assert.equal(op, "==");
    this.filters.push({ field, value });
    return this;
  }

  limit(count) {
    this.max = count;
    return this;
  }

  async get() {
    const matches = this.documents
      .filter((doc) => this.filters.every((filter) => doc.data[filter.field] === filter.value))
      .slice(0, this.max);

    return {
      docs: matches.map((doc) => ({ data: () => doc.data })),
    };
  }
}
