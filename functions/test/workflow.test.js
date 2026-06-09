const assert = require("node:assert/strict");
const test = require("node:test");

const {
  leavingHomeReminderMessage,
  leavingHomeMedicines,
  medicationsForEvent,
  planMedicationResponseNotifications,
  planMissedDoseNotifications,
} = require("../lib/core/workflow.js");

const medicines = [
  { id: "breakfast-pack", name: "Webster Pack", active: true, eventTriggers: ["breakfast"] },
  { id: "lunch-antibiotic", name: "Post-hospital antibiotic", active: true, eventTriggers: ["lunch"] },
  { id: "inactive-lunch", name: "Inactive lunch medicine", active: false, eventTriggers: ["lunch"] },
  { id: "leaving-home-dose", name: "Medicine to take along", active: true, eventTriggers: ["leaving_home"] },
];

test("event helper selects only active medicines tied to the completed event", () => {
  assert.deepEqual(
    medicationsForEvent(medicines, "lunch").map((medicine) => medicine.id),
    ["lunch-antibiotic"],
  );
});

test("missed-dose planning is event-scoped and idempotent when final logs exist", () => {
  const routineEventId = "event-lunch";
  const firstPlan = planMissedDoseNotifications(medicines, [], routineEventId, "lunch");

  assert.deepEqual(firstPlan, [{ medicationId: "lunch-antibiotic", notificationType: "missed_dose" }]);

  const secondPlan = planMissedDoseNotifications(
    medicines,
    [{ medicationId: "lunch-antibiotic", routineEventId, status: "missed" }],
    routineEventId,
    "lunch",
  );

  assert.deepEqual(secondPlan, []);
});

test("leaving-home helper returns active medicines tied to leaving_home", () => {
  assert.deepEqual(
    leavingHomeMedicines(medicines).map((medicine) => medicine.id),
    ["leaving-home-dose"],
  );
});

test("leaving-home reminder copy is bounded support language", () => {
  const message = leavingHomeReminderMessage(medicines);

  assert.match(message, /Some medicines may need to be taken along when leaving home/i);
  assert.match(message, /Please check the medication list/i);
  assert.doesNotMatch(message, /take extra|skip your dose|change your dose|you should stop medication/i);
});

test("refusal response creates caregiver-visible notification plan with reason", () => {
  const [notification] = planMedicationResponseNotifications({
    householdId: "demo-household-eleanor",
    seniorId: "demo-eleanor",
    medicationId: "med-antibiotic",
    routineEventId: "event-lunch",
    status: "refused",
    intent: "refused",
    refusalReason: "feeling_unwell",
  });

  assert.equal(notification.type, "refusal");
  assert.equal(notification.severity, "warning");
  assert.equal(notification.refusalReason, "feeling_unwell");
  assertNoUnsafeAdvice(notification.message);
});

test("help-request response creates caregiver-visible notification plan", () => {
  const [notification] = planMedicationResponseNotifications({
    householdId: "demo-household-eleanor",
    seniorId: "demo-eleanor",
    medicationId: "med-antibiotic",
    status: "help_requested",
    intent: "help_requested",
  });

  assert.equal(notification.type, "help_requested");
  assert.equal(notification.severity, "urgent");
  assertNoUnsafeAdvice(notification.message);
});

test("urgent phrase creates urgent notification plan with static guidance", () => {
  const [notification] = planMedicationResponseNotifications({
    householdId: "demo-household-eleanor",
    seniorId: "demo-eleanor",
    medicationId: "med-antibiotic",
    status: "help_requested",
    intent: "urgent",
  });

  assert.equal(notification.type, "urgent_phrase");
  assert.equal(notification.severity, "urgent");
  assert.match(notification.message, /urgent human attention/i);
  assertNoUnsafeAdvice(notification.message);
});

test("response notification planner only returns supported notification types", () => {
  const supportedTypes = new Set(["missed_dose", "refusal", "help_requested", "leaving_home", "urgent_phrase", "system"]);
  const cases = [
    { status: "refused", intent: "refused", refusalReason: "other" },
    { status: "help_requested", intent: "help_requested" },
    { status: "help_requested", intent: "urgent" },
  ];

  for (const item of cases) {
    const plans = planMedicationResponseNotifications({
      householdId: "demo-household-eleanor",
      seniorId: "demo-eleanor",
      medicationId: "med-antibiotic",
      ...item,
    });

    for (const plan of plans) {
      assert.ok(supportedTypes.has(plan.type), `${plan.type} should be supported`);
    }
  }
});

function assertNoUnsafeAdvice(message) {
  assert.doesNotMatch(message, /take extra|skip your dose|change your dose|ignore symptoms|diagnosed|you should stop medication/i);
}
