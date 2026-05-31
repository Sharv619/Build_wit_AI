const assert = require("node:assert/strict");
const test = require("node:test");

const {
  leavingHomeReminderMessage,
  leavingHomeMedicines,
  medicationsForEvent,
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
