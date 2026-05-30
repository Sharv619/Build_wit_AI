import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { classifyFallback, classifyWithGemini, missedDoseCopy, reminderCopy } from "./ai";
import {
  Medication,
  MedicationEventTrigger,
  MedicationLog,
  MedicationStatus,
  NotificationEvent,
  RefusalReason,
  ResponseMethod,
  RoutineEvent,
} from "./types";

admin.initializeApp();

const db = admin.firestore();
const finalStatuses: MedicationStatus[] = ["taken", "snoozed", "refused", "help_requested", "missed"];

export const classifyMedicationResponse = onCall(async (request) => {
  const text = stringField(request.data, "text");
  const result = await classifyWithGemini(text);
  return result;
});

export const recordMedicationResponse = onCall(async (request) => {
  const userId = actorId(request);
  const householdId = stringField(request.data, "householdId");
  const medicationId = stringField(request.data, "medicationId");
  const responseMethod = enumField<ResponseMethod>(request.data, "responseMethod", ["button", "voice", "typed", "system"]);
  const responseText = optionalString(request.data.responseText);
  const routineEventId = optionalString(request.data.routineEventId);

  const classified = responseText
    ? await classifyWithGemini(responseText)
    : classifyFallback(String(request.data.status ?? ""));

  const requestedStatus = optionalString(request.data.status) as MedicationStatus | undefined;
  const status = normalizeStatus(requestedStatus, classified.intent);
  const refusalReason = normalizeRefusalReason(request.data.refusalReason) ?? classified.refusalReason;

  const log: MedicationLog = {
    householdId,
    medicationId,
    routineEventId,
    userId,
    status,
    responseMethod,
    responseText,
    refusalReason: status === "refused" ? refusalReason ?? "other" : undefined,
    refusalNote: optionalString(request.data.refusalNote),
    createdAt: now(),
  };

  const doc = await db.collection("medicationLogs").add(removeUndefined(log));
  return {
    logId: doc.id,
    status,
    intent: classified.intent,
    refusalReason: log.refusalReason,
    message: classified.safeMessage,
  };
});

export const completeRoutineEvent = onCall(async (request) => {
  const userId = actorId(request);
  const householdId = stringField(request.data, "householdId");
  const trigger = enumField<MedicationEventTrigger>(request.data, "trigger", eventTriggers());
  const status = enumField<"completed" | "skipped">(request.data, "status", ["completed", "skipped"]);
  const routineEventId = optionalString(request.data.routineEventId);
  const eventRef = routineEventId ? db.collection("routineEvents").doc(routineEventId) : db.collection("routineEvents").doc();

  const event: RoutineEvent = {
    householdId,
    userId,
    trigger,
    status,
    occurredAt: now(),
    createdAt: now(),
    updatedAt: now(),
  };

  await eventRef.set(removeUndefined(event), { merge: true });
  const missed = await createMissedLogsForEvent(householdId, userId, eventRef.id, trigger);

  return {
    routineEventId: eventRef.id,
    trigger,
    status,
    missedCount: missed.length,
    notifications: missed.map((item) => item.notificationId),
  };
});

export const simulateLeavingHome = onCall(async (request) => {
  const userId = actorId(request);
  const householdId = stringField(request.data, "householdId");
  const eventRef = await db.collection("routineEvents").add({
    householdId,
    userId,
    trigger: "leaving_home",
    status: "pending",
    createdAt: now(),
    updatedAt: now(),
  } satisfies RoutineEvent);

  const meds = await medicationsForTrigger(householdId, userId, "leaving_home");
  const names = meds.map((med) => `${med.data.name} (${med.data.dose})`);
  const message = names.length
    ? `Before leaving home, please take these medicines with you: ${names.join(", ")}.`
    : "Before leaving home, please check whether you need to take any medicine with you.";

  const notification = await createNotification({
    householdId,
    userId,
    routineEventId: eventRef.id,
    type: "leaving_home_reminder",
    message,
    status: "sent",
    createdAt: now(),
  });

  return {
    routineEventId: eventRef.id,
    notificationId: notification.id,
    medications: meds.map((med) => ({ id: med.id, ...med.data })),
    message,
  };
});

export const generateReminderCopy = onCall(async (request) => {
  const medicationName = stringField(request.data, "medicationName");
  const dose = stringField(request.data, "dose");
  const trigger = stringField(request.data, "trigger");
  return { message: reminderCopy(medicationName, dose, trigger) };
});

export const generateMissedDoseAlert = onCall(async (request) => {
  const medicationName = stringField(request.data, "medicationName");
  const trigger = stringField(request.data, "trigger");
  return { message: missedDoseCopy(medicationName, trigger) };
});

export const processScriptUpload = onCall(async (request) => {
  const userId = actorId(request);
  const householdId = stringField(request.data, "householdId");
  const text = stringField(request.data, "text");
  const candidates = extractMedicationCandidates(text);
  const doc = await db.collection("scriptUploads").add({
    householdId,
    caregiverId: userId,
    source: "pasted_text",
    status: "needs_confirmation",
    text,
    candidates,
    createdAt: now(),
  });

  return { uploadId: doc.id, candidates };
});

export const seedDemoData = onCall(async () => {
  const householdId = "demo-household-eleanor";
  const eleanorId = "demo-eleanor";
  const caregiverId = "demo-caregiver";
  const timestamp = now();

  const batch = db.batch();
  batch.set(db.collection("households").doc(householdId), {
    name: "Eleanor",
    primarySeniorId: eleanorId,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  batch.set(db.collection("users").doc(eleanorId), {
    householdId,
    name: "Eleanor",
    age: 86,
    role: "senior",
    createdAt: timestamp,
  });
  batch.set(db.collection("users").doc(caregiverId), {
    householdId,
    name: "Family caregiver",
    role: "caregiver",
    contact: "demo@example.com",
    createdAt: timestamp,
  });

  const medicines: Array<Omit<Medication, "createdAt" | "updatedAt">> = [
    {
      householdId,
      userId: eleanorId,
      name: "Webster Pack morning medicines",
      dose: "1 pack",
      instructions: "Take the morning Webster Pack if it matches current pharmacy instructions.",
      source: "webster_pack",
      eventTriggers: ["breakfast"],
      active: true,
      createdBy: caregiverId,
    },
    {
      householdId,
      userId: eleanorId,
      name: "Post-hospital antibiotic",
      dose: "1 tablet",
      instructions: "Temporary medicine outside the Webster Pack.",
      source: "antibiotic",
      eventTriggers: ["lunch", "dinner"],
      active: true,
      createdBy: caregiverId,
    },
  ];

  medicines.forEach((medicine) => {
    const ref = db.collection("medications").doc();
    batch.set(ref, { ...medicine, createdAt: timestamp, updatedAt: timestamp });
  });

  await batch.commit();
  return { householdId, eleanorId, caregiverId };
});

async function createMissedLogsForEvent(
  householdId: string,
  userId: string,
  routineEventId: string,
  trigger: MedicationEventTrigger,
): Promise<Array<{ medicationId: string; logId: string; notificationId: string }>> {
  const meds = await medicationsForTrigger(householdId, userId, trigger);
  const created: Array<{ medicationId: string; logId: string; notificationId: string }> = [];

  for (const med of meds) {
    const existing = await db.collection("medicationLogs")
      .where("householdId", "==", householdId)
      .where("medicationId", "==", med.id)
      .where("routineEventId", "==", routineEventId)
      .limit(10)
      .get();

    const hasFinal = existing.docs.some((doc) => finalStatuses.includes(doc.data().status));
    if (hasFinal) continue;

    const logRef = await db.collection("medicationLogs").add({
      householdId,
      medicationId: med.id,
      routineEventId,
      userId,
      status: "missed",
      responseMethod: "system",
      createdAt: now(),
    } satisfies MedicationLog);

    const notification = await createNotification({
      householdId,
      userId,
      medicationId: med.id,
      routineEventId,
      type: "missed_dose_alert",
      message: missedDoseCopy(med.data.name, trigger),
      status: "sent",
      createdAt: now(),
    });

    created.push({ medicationId: med.id, logId: logRef.id, notificationId: notification.id });
  }

  return created;
}

async function medicationsForTrigger(householdId: string, userId: string, trigger: MedicationEventTrigger) {
  const snapshot = await db.collection("medications")
    .where("householdId", "==", householdId)
    .where("userId", "==", userId)
    .where("active", "==", true)
    .where("eventTriggers", "array-contains", trigger)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() as Medication }));
}

async function createNotification(data: NotificationEvent) {
  return db.collection("notifications").add(removeUndefined(data));
}

function extractMedicationCandidates(text: string) {
  return text
    .split(/\n|;/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((line) => ({
      name: line.split(/\s+-\s+|\s+\d/)[0]?.trim() || line,
      dose: line.match(/\d+\s*(mg|mcg|g|ml|tablet|capsule|pack)/i)?.[0] ?? "",
      instructions: line,
      source: line.toLowerCase().includes("antibiotic") ? "antibiotic" : "other",
      eventTriggers: [] as MedicationEventTrigger[],
    }));
}

function actorId(request: { auth?: { uid?: string }; data: unknown }): string {
  if (request.auth?.uid) return request.auth.uid;
  return stringField(request.data, "userId");
}

function stringField(data: unknown, field: string): string {
  if (!isRecord(data) || typeof data[field] !== "string" || !data[field].trim()) {
    throw new HttpsError("invalid-argument", `Missing required string field: ${field}`);
  }
  return data[field].trim();
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function enumField<T extends string>(data: unknown, field: string, allowed: readonly T[]): T {
  const value = stringField(data, field);
  if (!allowed.includes(value as T)) {
    throw new HttpsError("invalid-argument", `Invalid ${field}: ${value}`);
  }
  return value as T;
}

function normalizeStatus(status: MedicationStatus | undefined, intent: string): MedicationStatus {
  if (status && finalStatuses.includes(status)) return status;
  if (intent === "urgent") return "help_requested";
  if (intent === "caregiver_attention") return "help_requested";
  return intent as MedicationStatus;
}

function normalizeRefusalReason(value: unknown): RefusalReason | undefined {
  const allowed: RefusalReason[] = ["away_from_medicine", "side_effects", "feeling_unwell", "confused", "other"];
  return typeof value === "string" && allowed.includes(value as RefusalReason) ? value as RefusalReason : undefined;
}

function eventTriggers(): MedicationEventTrigger[] {
  return ["breakfast", "lunch", "dinner", "bedtime", "leaving_home", "post_discharge", "caregiver_check_in"];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function removeUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

function now(): string {
  return new Date().toISOString();
}
