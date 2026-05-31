import * as admin from "firebase-admin";
import textToSpeech = require("@google-cloud/text-to-speech");
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { classifyFallback, classifyWithGemini, missedDoseCopy, reminderCopy } from "./ai";
import { leavingHomeReminderMessage } from "./core/workflow";
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
const storage = admin.storage();
const finalStatuses: MedicationStatus[] = ["taken", "snoozed", "refused", "help_requested", "missed"];
const defaultChirpVoice = "en-US-Chirp3-HD-Charon";
let ttsClient: textToSpeech.TextToSpeechClient | undefined;

export const classifyMedicationResponse = onCall(async (request) => {
  const text = stringField(request.data, "text");
  const result = await classifyWithGemini(text);
  return result;
});

export const recordMedicationResponse = onCall(async (request) => {
  const userId = targetUserId(request);
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
  const userId = targetUserId(request);
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
  const userId = targetUserId(request);
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
  const message = leavingHomeReminderMessage(meds.map((med) => ({ id: med.id, ...med.data })));

  const notification = await createNotification({
    householdId,
    userId,
    routineEventId: eventRef.id,
    type: "leaving_home",
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

export const generateChirpReminderAudio = onCall(async (request) => {
  const userId = targetUserId(request);
  const householdId = stringField(request.data, "householdId");
  const medicationId = stringField(request.data, "medicationId");
  const medicationName = stringField(request.data, "medicationName");
  const dose = stringField(request.data, "dose");
  const trigger = enumField<MedicationEventTrigger>(request.data, "trigger", eventTriggers());
  const voiceName = optionalString(request.data.voiceName) ?? defaultChirpVoice;
  const syntheticVoiceAcknowledged = booleanField(request.data, "syntheticVoiceAcknowledged");

  if (!syntheticVoiceAcknowledged) {
    throw new HttpsError("failed-precondition", "Synthetic voice acknowledgement is required.");
  }

  const message = reminderCopy(medicationName, dose, trigger);
  const [response] = await textToSpeechClient().synthesizeSpeech({
    input: { text: message },
    voice: {
      languageCode: voiceName.slice(0, 5),
      name: voiceName,
    },
    audioConfig: {
      audioEncoding: "MP3",
    },
  });

  if (!response.audioContent) {
    throw new HttpsError("internal", "Text-to-Speech returned no audio content.");
  }

  const voiceReminderRef = db.collection("voiceReminders").doc();
  const storagePath = `households/${householdId}/voiceReminders/${voiceReminderRef.id}.mp3`;
  const file = storage.bucket().file(storagePath);

  await file.save(Buffer.from(response.audioContent as Uint8Array), {
    contentType: "audio/mpeg",
    metadata: {
      metadata: {
        householdId,
        medicationId,
        routineEventTrigger: trigger,
        messageType: "chirp3_hd",
        voiceName,
      },
    },
  });

  await voiceReminderRef.set({
    userId,
    householdId,
    medicationId,
    routineEventId: trigger,
    routineEventTrigger: trigger,
    speakerName: "Pilly Chirp voice",
    relationship: "app_voice",
    storagePath,
    consentConfirmed: false,
    syntheticVoiceAcknowledged: true,
    messageType: "chirp3_hd",
    ttsProvider: "google_cloud_text_to_speech",
    voiceName,
    reminderText: message,
    createdAt: now(),
  });

  return {
    voiceReminderId: voiceReminderRef.id,
    storagePath,
    messageType: "chirp3_hd",
    voiceName,
    message,
  };
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
      eventTriggers: ["lunch", "dinner", "leaving_home"],
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
    if (hasFinal || await hasRecentDemoFinalLog(householdId, userId, med.id)) continue;

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
      type: "missed_dose",
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

function targetUserId(request: { auth?: { uid?: string }; data: unknown }): string {
  // Demo bridge: callable functions may be invoked by an anonymous caregiver session
  // while the medication workflow is for Eleanor. Production should enforce caregiver
  // household membership before honoring a separate target user id.
  if (!isRecord(request.data)) return actorId(request);
  return optionalString(request.data.seniorId) ?? optionalString(request.data.userId) ?? actorId(request);
}

async function hasRecentDemoFinalLog(householdId: string, userId: string, medicationId: string): Promise<boolean> {
  if (householdId !== "demo-household-eleanor") return false;

  const snapshot = await db.collection("medicationLogs")
    .where("householdId", "==", householdId)
    .where("userId", "==", userId)
    .where("medicationId", "==", medicationId)
    .limit(5)
    .get();

  return snapshot.docs.some((doc) => {
    const data = doc.data();
    return !data.routineEventId && finalStatuses.includes(data.status);
  });
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

function booleanField(data: unknown, field: string): boolean {
  if (!isRecord(data) || typeof data[field] !== "boolean") {
    throw new HttpsError("invalid-argument", `Missing required boolean field: ${field}`);
  }
  return data[field];
}

function textToSpeechClient(): textToSpeech.TextToSpeechClient {
  ttsClient ??= new textToSpeech.TextToSpeechClient();
  return ttsClient;
}

function normalizeStatus(status: MedicationStatus | undefined, intent: string): MedicationStatus {
  if (status && finalStatuses.includes(status)) return status;
  if (intent === "urgent") return "help_requested";
  return intent as MedicationStatus;
}

function normalizeRefusalReason(value: unknown): RefusalReason | undefined {
  const allowed: RefusalReason[] = ["away_from_medicine", "side_effects", "feeling_unwell", "confused", "does_not_understand", "other", "unknown"];
  return typeof value === "string" && allowed.includes(value as RefusalReason) ? value as RefusalReason : undefined;
}

function eventTriggers(): MedicationEventTrigger[] {
  return ["breakfast", "lunch", "dinner", "bedtime", "leaving_home", "post_discharge_check_in", "caregiver_check_in"];
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
