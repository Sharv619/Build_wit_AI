const assert = require("node:assert/strict");
const { after, before, beforeEach, describe, test } = require("node:test");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");

const projectId = process.env.GCLOUD_PROJECT || "demo-pilly-security-test";
process.env.GCLOUD_PROJECT = projectId;

const {
  requireAdminClaimForTest,
  requireAuthForTest,
  requireHouseholdMemberForTest,
  requireHouseholdRoleForTest,
} = require("../lib/index");

const emulatorsAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
let testEnv;

test("callable auth helper rejects unauthenticated requests", async () => {
  await assert.rejects(
    () => requireAuthForTest({ data: {} }),
    (error) => error.code === "unauthenticated",
  );
});

test("demo seed admin helper rejects non-admin users", () => {
  assert.throws(
    () => requireAdminClaimForTest({ auth: { uid: "caregiver-a", token: {} }, data: {} }),
    (error) => error.code === "permission-denied",
  );
  assert.equal(requireAdminClaimForTest({ auth: { uid: "admin-a", token: { admin: true } }, data: {} }), "admin-a");
});

describe("callable household authorization helpers", { skip: emulatorsAvailable ? false : "requires Firestore emulator" }, () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({ projectId, firestore: {} });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      const batch = db.batch();
      batch.set(db.doc("users/senior-a"), { householdId: "household-a", role: "senior", name: "Senior A" });
      batch.set(db.doc("users/caregiver-a"), { householdId: "household-a", role: "caregiver", name: "Caregiver A" });
      batch.set(db.doc("users/family-a"), { householdId: "household-a", role: "family", name: "Family A" });
      batch.set(db.doc("users/caregiver-b"), { householdId: "household-b", role: "caregiver", name: "Caregiver B" });
      await batch.commit();
    });
  });

  after(async () => {
    await testEnv?.cleanup();
  });

  test("server-side household membership rejects wrong households", async () => {
    const member = await requireHouseholdMemberForTest("caregiver-a", "household-a");
    assert.equal(member.uid, "caregiver-a");
    assert.equal(member.role, "caregiver");

    await assert.rejects(
      () => requireHouseholdMemberForTest("caregiver-a", "household-b"),
      (error) => error.code === "permission-denied",
    );
  });

  test("server-side role checks reject seniors for caregiver-only actions", async () => {
    await assert.rejects(
      () => requireHouseholdRoleForTest("senior-a", "household-a", ["caregiver", "family"]),
      (error) => error.code === "permission-denied",
    );

    const caregiver = await requireHouseholdRoleForTest("caregiver-a", "household-a", ["caregiver", "family"]);
    const family = await requireHouseholdRoleForTest("family-a", "household-a", ["caregiver", "family"]);
    assert.equal(caregiver.role, "caregiver");
    assert.equal(family.role, "family");
  });
});
