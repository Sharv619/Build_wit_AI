import * as admin from "firebase-admin";
import textToSpeech = require("@google-cloud/text-to-speech");
import { onCall, HttpsError } from "firebase-functions/v2/https";
import type { CallableRequest } from "firebase-functions/v2/https";
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
  UserRole,
} from "./types";

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();
const finalStatuses: MedicationStatus[] = ["taken_confirmed", "skipped_confirmed", "refused", "help_requested", "missed"];
const defaultChirpVoice = "en-US-Chirp3-HD-Charon";
let ttsClient: textToSpeech.TextToSpeechClient | undefined;

interface HouseholdMember {
  uid: string;
  householdId: string;
  role: UserRole;
}

export const classifyMedicationResponse = onCall(async (request) => {
  await requireAuth(request);
  const text = stringField(request.data, "text");
  const result = await classifyWithGemini(text);
  return result;
});

export const recordMedicationResponse = onCall(async (request) => {
  const uid = await requireAuth(request);
  const medicationId = stringField(request.data, "medicationId");
  const { id: verifiedMedicationId, data: medication } = await requireMedication(medicationId);
  assertProvidedHouseholdMatches(request.data, medication.householdId);
  await requireHouseholdMember(uid, medication.householdId);
  const responseMethod = enumField<ResponseMethod>(request.data, "responseMethod", ["button", "voice", "typed"]);
  const responseText = optionalString(request.data.responseText);
  const routineEventId = optionalString(request.data.routineEventId);
  if (routineEventId) {
    await requireRoutineEvent(routineEventId, medication.householdId, medication.userId);
  }
  const confirmed = optionalBoolean(request.data.confirmed) === true;

  const classified = responseText
    ? await classifyWithGemini(responseText)
    : classifyFallback("");

  const status = resolveMedicationStatus(classified.intent, confirmed);
  const refusalReason = normalizeRefusalReason(request.data.refusalReason) ?? classified.refusalReason;

  const log: MedicationLog = {
    householdId: medication.householdId,
    medicationId: verifiedMedicationId,
    routineEventId,
    userId: medication.userId,
    status,
    responseMethod,
    responseText,
    refusalReason: status === "skipped_confirmed" || status === "refused" ? refusalReason ?? "other" : undefined,
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
  const uid = await requireAuth(request);
  const householdId = stringField(request.data, "householdId");
  const member = await requireHouseholdMember(uid, householdId);
  const userId = await targetSeniorIdForHousehold(householdId, member);
  const trigger = enumField<MedicationEventTrigger>(request.data, "trigger", eventTriggers());
  const status = enumField<"completed" | "skipped">(request.data, "status", ["completed", "skipped"]);
  const routineEventId = optionalString(request.data.routineEventId);
  const eventRef = routineEventId ? db.collection("routineEvents").doc(routineEventId) : db.collection("routineEvents").doc();
  if (routineEventId) {
    await requireRoutineEvent(routineEventId, householdId, userId);
  }

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
  const uid = await requireAuth(request);
  const householdId = stringField(request.data, "householdId");
  const member = await requireHouseholdMember(uid, householdId);
  const userId = await targetSeniorIdForHousehold(householdId, member);
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
  await requireAuth(request);
  const medicationName = stringField(request.data, "medicationName");
  const dose = stringField(request.data, "dose");
  const trigger = stringField(request.data, "trigger");
  return { message: reminderCopy(medicationName, dose, trigger) };
});

export const generateMissedDoseAlert = onCall(async (request) => {
  await requireAuth(request);
  const medicationName = stringField(request.data, "medicationName");
  const trigger = stringField(request.data, "trigger");
  return { message: missedDoseCopy(medicationName, trigger) };
});

export const generateChirpReminderAudio = onCall(async (request) => {
  const uid = await requireAuth(request);
  const medicationId = stringField(request.data, "medicationId");
  const { id: verifiedMedicationId, data: medication } = await requireMedication(medicationId);
  assertProvidedHouseholdMatches(request.data, medication.householdId);
  await requireHouseholdRole(uid, medication.householdId, ["caregiver", "family"]);
  const trigger = enumField<MedicationEventTrigger>(request.data, "trigger", eventTriggers());
  if (!medication.eventTriggers.includes(trigger)) {
    throw new HttpsError("failed-precondition", "Medication is not configured for the requested reminder trigger.");
  }
  const voiceName = optionalString(request.data.voiceName) ?? defaultChirpVoice;
  const syntheticVoiceAcknowledged = booleanField(request.data, "syntheticVoiceAcknowledged");

  if (!syntheticVoiceAcknowledged) {
    throw new HttpsError("failed-precondition", "Synthetic voice acknowledgement is required.");
  }

  const message = reminderCopy(medication.name, medication.dose, trigger);
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
  const storagePath = `households/${medication.householdId}/voiceReminders/${voiceReminderRef.id}.mp3`;
  const file = storage.bucket().file(storagePath);

  await file.save(Buffer.from(response.audioContent as Uint8Array), {
    contentType: "audio/mpeg",
    metadata: {
      metadata: {
        householdId: medication.householdId,
        medicationId: verifiedMedicationId,
        routineEventTrigger: trigger,
        messageType: "chirp3_hd",
        voiceName,
      },
    },
  });

  await voiceReminderRef.set({
    userId: medication.userId,
    householdId: medication.householdId,
    medicationId: verifiedMedicationId,
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

export const createElevenLabsVoiceClone = onCall(async (request) => {
  const uid = await requireAuth(request);
  const householdId = stringField(request.data, "householdId");
  await requireHouseholdRole(uid, householdId, ["caregiver", "family"]);
  throw new HttpsError("failed-precondition", "Voice cloning is disabled until production-grade consent, retention, deletion, and audit controls are implemented.");
});

export const generateClonedVoiceReminderAudio = onCall(async (request) => {
  const uid = await requireAuth(request);
  const householdId = stringField(request.data, "householdId");
  await requireHouseholdRole(uid, householdId, ["caregiver", "family"]);
  throw new HttpsError("failed-precondition", "Cloned voice reminders are disabled until production-grade voice safety controls are implemented.");
});

export const processScriptUpload = onCall(async (request) => {
  const uid = await requireAuth(request);
  const householdId = stringField(request.data, "householdId");
  await requireHouseholdRole(uid, householdId, ["caregiver", "family"]);
  const text = stringField(request.data, "text");
  const candidates = extractMedicationCandidates(text);
  const doc = await db.collection("scriptUploads").add({
    householdId,
    caregiverId: uid,
    source: "pasted_text",
    status: "needs_confirmation",
    text,
    candidates,
    createdAt: now(),
  });

  return { uploadId: doc.id, candidates };
});

export const seedDemoData = onCall(async (request) => {
  requireAdminClaim(request);
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

async function requireAuth(request: CallableRequest<unknown>): Promise<string> {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }
  return uid;
}

function requireAdminClaim(request: CallableRequest<unknown>): string {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }
  if (request.auth?.token.admin !== true) {
    throw new HttpsError("permission-denied", "Admin access is required.");
  }
  return uid;
}

async function requireHouseholdMember(uid: string, householdId: string): Promise<HouseholdMember> {
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError("permission-denied", "No household membership was found for this user.");
  }

  const data = userDoc.data() as { householdId?: unknown; role?: unknown };
  if (data.householdId !== householdId || !isUserRole(data.role)) {
    throw new HttpsError("permission-denied", "This user is not authorized for the requested household.");
  }

  return { uid, householdId, role: data.role };
}

async function requireHouseholdRole(uid: string, householdId: string, allowedRoles: UserRole[]): Promise<HouseholdMember> {
  const member = await requireHouseholdMember(uid, householdId);
  if (!allowedRoles.includes(member.role)) {
    throw new HttpsError("permission-denied", "This action requires a caregiver or family role.");
  }
  return member;
}

async function targetSeniorIdForHousehold(householdId: string, member: HouseholdMember): Promise<string> {
  const householdDoc = await db.collection("households").doc(householdId).get();
  if (!householdDoc.exists) {
    throw new HttpsError("not-found", "Household not found.");
  }

  const primarySeniorId = householdDoc.data()?.primarySeniorId;
  if (typeof primarySeniorId === "string" && primarySeniorId.trim()) {
    return primarySeniorId.trim();
  }
  return member.uid;
}

async function requireMedication(medicationId: string): Promise<{ id: string; data: Medication }> {
  const medicationDoc = await db.collection("medications").doc(medicationId).get();
  if (!medicationDoc.exists) {
    throw new HttpsError("not-found", "Medication not found.");
  }

  const medication = medicationDoc.data() as Medication;
  if (!medication.householdId || !medication.userId) {
    throw new HttpsError("failed-precondition", "Medication is missing household ownership fields.");
  }

  return { id: medicationDoc.id, data: medication };
}

async function requireRoutineEvent(routineEventId: string, householdId: string, userId: string): Promise<RoutineEvent> {
  const eventDoc = await db.collection("routineEvents").doc(routineEventId).get();
  if (!eventDoc.exists) {
    throw new HttpsError("not-found", "Routine event not found.");
  }

  const event = eventDoc.data() as RoutineEvent;
  if (event.householdId !== householdId || event.userId !== userId) {
    throw new HttpsError("permission-denied", "Routine event does not belong to the verified household and senior.");
  }

  return event;
}

function assertProvidedHouseholdMatches(data: unknown, verifiedHouseholdId: string): void {
  const providedHouseholdId = optionalString(isRecord(data) ? data.householdId : undefined);
  if (providedHouseholdId && providedHouseholdId !== verifiedHouseholdId) {
    throw new HttpsError("permission-denied", "Requested household does not match the verified record owner.");
  }
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

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
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

function resolveMedicationStatus(intent: string, confirmed: boolean): MedicationStatus {
  if (intent === "urgent") return "help_requested";
  if (intent === "caregiver_attention") return "help_requested";
  if (intent === "help_requested") return "help_requested";
  if (intent === "taken") return confirmed ? "taken_confirmed" : "pending_confirmation";
  if (intent === "refused") return confirmed ? "skipped_confirmed" : "pending_confirmation";
  if (intent === "snoozed") return "pending_confirmation";
  return "unknown";
}

export function resolveMedicationStatusForTest(intent: string, confirmed: boolean): MedicationStatus {
  return resolveMedicationStatus(intent, confirmed);
}

export async function requireAuthForTest(request: CallableRequest<unknown>): Promise<string> {
  return requireAuth(request);
}

export function requireAdminClaimForTest(request: CallableRequest<unknown>): string {
  return requireAdminClaim(request);
}

export async function requireHouseholdMemberForTest(uid: string, householdId: string): Promise<HouseholdMember> {
  return requireHouseholdMember(uid, householdId);
}

export async function requireHouseholdRoleForTest(uid: string, householdId: string, allowedRoles: UserRole[]): Promise<HouseholdMember> {
  return requireHouseholdRole(uid, householdId, allowedRoles);
}

function normalizeRefusalReason(value: unknown): RefusalReason | undefined {
  const allowed: RefusalReason[] = ["away_from_medicine", "side_effects", "feeling_unwell", "confused", "other"];
  return typeof value === "string" && allowed.includes(value as RefusalReason) ? value as RefusalReason : undefined;
}

function eventTriggers(): MedicationEventTrigger[] {
  return ["breakfast", "lunch", "dinner", "bedtime", "leaving_home", "post_discharge", "caregiver_check_in"];
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && ["senior", "spouse", "caregiver", "family"].includes(value);
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
