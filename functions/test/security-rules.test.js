const { readFileSync } = require("node:fs");
const path = require("node:path");
const { after, before, beforeEach, describe, test } = require("node:test");
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");

const repoRoot = path.resolve(__dirname, "..", "..");
const projectId = process.env.GCLOUD_PROJECT || "demo-pilly-security-test";
const emulatorsAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_STORAGE_EMULATOR_HOST);

let testEnv;

describe("Firebase security rules", { skip: emulatorsAvailable ? false : "requires Firestore and Storage emulators" }, () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: {
        rules: readFileSync(path.join(repoRoot, "firestore.rules"), "utf8"),
      },
      storage: {
        rules: readFileSync(path.join(repoRoot, "storage.rules"), "utf8"),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.clearStorage();
    await seedFirestore();
    await seedStorage();
  });

  after(async () => {
    await testEnv?.cleanup();
  });

  test("unauthenticated users cannot access protected Firestore or demo data", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const protectedDocs = [
      "households/household-a",
      "medications/med-a",
      "medicationLogs/log-a",
      "routineEvents/event-a",
      "notifications/note-a",
      "voiceReminders/voice-a",
      "voiceClones/clone-a",
      "scriptUploads/script-a",
      "households/demo-household-eleanor",
    ];

    for (const docPath of protectedDocs) {
      await assertFails(db.doc(docPath).get());
      await assertFails(db.doc(docPath).set({ householdId: "household-a", createdAt: "now" }));
    }
  });

  test("household members read only their own household Firestore data", async () => {
    const seniorA = testEnv.authenticatedContext("senior-a").firestore();
    const caregiverA = testEnv.authenticatedContext("caregiver-a").firestore();
    const caregiverB = testEnv.authenticatedContext("caregiver-b").firestore();

    for (const docPath of [
      "households/household-a",
      "medications/med-a",
      "medicationLogs/log-a",
      "routineEvents/event-a",
      "notifications/note-a",
      "voiceReminders/voice-a",
      "scriptUploads/script-a",
    ]) {
      await assertSucceeds(seniorA.doc(docPath).get());
    }

    for (const docPath of ["households/household-b", "medications/med-b", "medicationLogs/log-b"]) {
      await assertFails(seniorA.doc(docPath).get());
    }

    await assertFails(seniorA.doc("voiceClones/clone-a").get());
    await assertSucceeds(caregiverA.doc("voiceClones/clone-a").get());
    await assertFails(caregiverB.doc("voiceClones/clone-a").get());
  });

  test("caregiver and family roles can create medications, seniors cannot", async () => {
    const seniorA = testEnv.authenticatedContext("senior-a").firestore();
    const caregiverA = testEnv.authenticatedContext("caregiver-a").firestore();
    const familyA = testEnv.authenticatedContext("family-a").firestore();

    await assertFails(seniorA.doc("medications/senior-created").set(medicationPayload("senior-a")));
    await assertSucceeds(caregiverA.doc("medications/caregiver-created").set(medicationPayload("caregiver-a")));
    await assertSucceeds(familyA.doc("medications/family-created").set(medicationPayload("family-a")));
    await assertFails(caregiverA.doc("medications/invalid-source").set({
      ...medicationPayload("caregiver-a"),
      source: "internet_advice",
    }));
  });

  test("users cannot self-escalate role, household, or immutable medication ownership", async () => {
    const selfCaregiver = testEnv.authenticatedContext("self-caregiver").firestore();
    const seniorA = testEnv.authenticatedContext("senior-a").firestore();
    const caregiverA = testEnv.authenticatedContext("caregiver-a").firestore();

    await assertFails(selfCaregiver.doc("users/self-caregiver").set({
      householdId: "household-a",
      name: "Self caregiver",
      role: "caregiver",
      createdAt: "now",
    }));
    await assertFails(caregiverA.doc("users/new-caregiver").set({
      householdId: "household-a",
      name: "New caregiver",
      role: "caregiver",
      createdAt: "now",
    }));
    await assertFails(seniorA.doc("users/senior-a").update({ role: "caregiver" }));
    await assertFails(seniorA.doc("users/senior-a").update({ householdId: "household-b" }));
    await assertSucceeds(seniorA.doc("users/senior-a").update({ name: "Senior A Updated", updatedAt: "later" }));

    await assertFails(caregiverA.doc("medications/med-a").update({ createdBy: "caregiver-b" }));
    await assertFails(caregiverA.doc("medications/med-a").update({ householdId: "household-b" }));
    await assertSucceeds(caregiverA.doc("medications/med-a").update({ name: "Updated medicine", updatedAt: "later" }));
  });

  test("server-owned Firestore collections reject direct client writes and invalid statuses", async () => {
    const caregiverA = testEnv.authenticatedContext("caregiver-a").firestore();

    await assertFails(caregiverA.doc("medicationLogs/client-log").set({
      householdId: "household-a",
      medicationId: "med-a",
      userId: "senior-a",
      status: "taken_confirmed",
      responseMethod: "button",
      createdAt: "now",
    }));
    await assertFails(caregiverA.doc("routineEvents/client-event").set({
      householdId: "household-a",
      userId: "senior-a",
      trigger: "breakfast",
      status: "completed",
      createdAt: "now",
      updatedAt: "now",
    }));
    await assertFails(caregiverA.doc("notifications/client-note").set({ householdId: "household-a", status: "sent" }));
    await assertFails(caregiverA.doc("voiceClones/client-clone").set({ householdId: "household-a" }));
    await assertFails(caregiverA.doc("voiceReminders/client-voice").set({ householdId: "household-a" }));
    await assertFails(caregiverA.doc("scriptUploads/client-script").set({ householdId: "household-a" }));
    await assertFails(caregiverA.doc("notifications/note-a").update({ status: "invalid_status", acknowledgedAt: "now" }));
    await assertSucceeds(caregiverA.doc("notifications/note-a").update({ status: "acknowledged", acknowledgedAt: "now" }));
  });

  test("unauthenticated users cannot access protected Storage paths", async () => {
    const storage = testEnv.unauthenticatedContext().storage();
    const protectedPaths = [
      "households/household-a/voiceReminders/reminder.mp3",
      "households/household-a/voiceCloneSamples/sample.webm",
      "scriptUploads/household-a/script.txt",
      "households/household-a/patient/private.txt",
      "households/demo-household-eleanor/voiceReminders/demo.mp3",
    ];

    for (const filePath of protectedPaths) {
      await assertFails(storage.ref(filePath).getMetadata());
      await assertFails(writeString(storage.ref(filePath), "audio/mpeg"));
    }
  });

  test("Storage household isolation and role read rules are enforced", async () => {
    const seniorA = testEnv.authenticatedContext("senior-a").storage();
    const caregiverA = testEnv.authenticatedContext("caregiver-a").storage();
    const caregiverB = testEnv.authenticatedContext("caregiver-b").storage();

    await assertSucceeds(seniorA.ref("households/household-a/voiceReminders/reminder.mp3").getMetadata());
    await assertFails(seniorA.ref("households/household-b/voiceReminders/reminder.mp3").getMetadata());
    await assertSucceeds(caregiverA.ref("scriptUploads/household-a/script.txt").getMetadata());
    await assertFails(seniorA.ref("scriptUploads/household-a/script.txt").getMetadata());
    await assertFails(caregiverB.ref("scriptUploads/household-a/script.txt").getMetadata());
  });

  test("Storage writes are caregiver/family-only for allowed paths", async () => {
    const seniorA = testEnv.authenticatedContext("senior-a").storage();
    const caregiverA = testEnv.authenticatedContext("caregiver-a").storage();
    const familyA = testEnv.authenticatedContext("family-a").storage();

    await assertFails(writeString(seniorA.ref("households/household-a/voiceReminders/senior.mp3"), "audio/mpeg"));
    await assertSucceeds(writeString(caregiverA.ref("households/household-a/voiceReminders/caregiver.mp3"), "audio/mpeg"));
    await assertSucceeds(writeString(familyA.ref("households/household-a/voiceReminders/family.mp3"), "audio/mpeg"));
    await assertFails(writeString(caregiverA.ref("households/household-a/voiceReminders/not-audio.txt"), "text/plain"));
    await assertFails(seniorA.ref("households/household-a/voiceReminders/reminder.mp3").delete());
    await assertSucceeds(caregiverA.ref("households/household-a/voiceReminders/reminder.mp3").delete());

    await assertFails(writeString(seniorA.ref("scriptUploads/household-a/senior.txt"), "text/plain"));
    await assertSucceeds(writeString(caregiverA.ref("scriptUploads/household-a/caregiver.txt"), "text/plain"));
    await assertFails(caregiverA.ref("scriptUploads/household-a/script.txt").delete());
  });

  test("voice clone sample Storage paths are fully denied", async () => {
    const unauthed = testEnv.unauthenticatedContext().storage();
    const seniorA = testEnv.authenticatedContext("senior-a").storage();
    const caregiverA = testEnv.authenticatedContext("caregiver-a").storage();
    const samplePath = "households/household-a/voiceCloneSamples/sample.webm";

    await assertFails(unauthed.ref(samplePath).getMetadata());
    await assertFails(seniorA.ref(samplePath).getMetadata());
    await assertFails(caregiverA.ref(samplePath).getMetadata());
    await assertFails(writeString(caregiverA.ref("households/household-a/voiceCloneSamples/new.webm"), "audio/webm"));
    await assertFails(caregiverA.ref(samplePath).delete());
  });
});

async function seedFirestore() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const batch = db.batch();

    batch.set(db.doc("households/household-a"), household("Senior A", "senior-a"));
    batch.set(db.doc("households/household-b"), household("Senior B", "senior-b"));
    batch.set(db.doc("households/demo-household-eleanor"), household("Demo Eleanor", "demo-eleanor"));

    batch.set(db.doc("users/senior-a"), user("household-a", "senior", "Senior A"));
    batch.set(db.doc("users/caregiver-a"), user("household-a", "caregiver", "Caregiver A"));
    batch.set(db.doc("users/family-a"), user("household-a", "family", "Family A"));
    batch.set(db.doc("users/senior-b"), user("household-b", "senior", "Senior B"));
    batch.set(db.doc("users/caregiver-b"), user("household-b", "caregiver", "Caregiver B"));

    batch.set(db.doc("medications/med-a"), medicationPayload("caregiver-a"));
    batch.set(db.doc("medications/med-b"), { ...medicationPayload("caregiver-b"), householdId: "household-b", userId: "senior-b" });
    batch.set(db.doc("routineEvents/event-a"), routineEvent("household-a", "senior-a"));
    batch.set(db.doc("routineEvents/event-b"), routineEvent("household-b", "senior-b"));
    batch.set(db.doc("medicationLogs/log-a"), medicationLog("household-a", "senior-a", "med-a"));
    batch.set(db.doc("medicationLogs/log-b"), medicationLog("household-b", "senior-b", "med-b"));
    batch.set(db.doc("notifications/note-a"), notification("household-a", "senior-a"));
    batch.set(db.doc("scriptUploads/script-a"), { householdId: "household-a", caregiverId: "caregiver-a", status: "needs_confirmation", createdAt: "seed" });
    batch.set(db.doc("voiceReminders/voice-a"), { householdId: "household-a", medicationId: "med-a", storagePath: "households/household-a/voiceReminders/reminder.mp3", createdAt: "seed" });
    batch.set(db.doc("voiceClones/clone-a"), { householdId: "household-a", caregiverId: "caregiver-a", status: "ready", createdAt: "seed" });

    await batch.commit();
  });
}

async function seedStorage() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const storage = context.storage();
    await writeString(storage.ref("households/household-a/voiceReminders/reminder.mp3"), "audio/mpeg");
    await writeString(storage.ref("households/household-b/voiceReminders/reminder.mp3"), "audio/mpeg");
    await writeString(storage.ref("households/household-a/voiceCloneSamples/sample.webm"), "audio/webm");
    await writeString(storage.ref("scriptUploads/household-a/script.txt"), "text/plain");
    await writeString(storage.ref("households/demo-household-eleanor/voiceReminders/demo.mp3"), "audio/mpeg");
  });
}

function writeString(ref, contentType) {
  return ref.putString("test content", "raw", { contentType });
}

function user(householdId, role, name) {
  return { householdId, role, name, createdAt: "seed", updatedAt: "seed" };
}

function household(name, primarySeniorId) {
  return { name, primarySeniorId, createdAt: "seed", updatedAt: "seed" };
}

function medicationPayload(createdBy) {
  return {
    householdId: "household-a",
    userId: "senior-a",
    name: "Morning medicine",
    dose: "1 tablet",
    instructions: "Follow clinician instructions.",
    source: "webster_pack",
    eventTriggers: ["breakfast"],
    active: true,
    createdBy,
    createdAt: "seed",
    updatedAt: "seed",
  };
}

function routineEvent(householdId, userId) {
  return { householdId, userId, trigger: "breakfast", status: "pending", createdAt: "seed", updatedAt: "seed" };
}

function medicationLog(householdId, userId, medicationId) {
  return { householdId, userId, medicationId, status: "taken_confirmed", responseMethod: "button", createdAt: "seed" };
}

function notification(householdId, userId) {
  return { householdId, userId, type: "missed_dose_alert", message: "Check in.", status: "sent", createdAt: "seed" };
}
