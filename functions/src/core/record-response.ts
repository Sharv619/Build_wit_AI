import { Intent, MedicationLog, MedicationStatus, RefusalReason, ResponseMethod } from "../types";
import { MedicationResponseNotificationPlan, planMedicationResponseNotifications } from "./workflow";

export interface RecordMedicationResponseWriteInput {
  householdId: string;
  userId: string;
  caregiverId?: string;
  medicationId: string;
  routineEventId?: string;
  status: MedicationStatus;
  intent: Intent;
  responseMethod: ResponseMethod;
  responseText?: string;
  refusalReason?: RefusalReason;
  refusalNote?: string;
  safeMessage: string;
  now: () => string;
}

export interface RecordMedicationResponseWriteResult {
  logId: string;
  status: MedicationStatus;
  intent: Intent;
  refusalReason?: RefusalReason;
  message: string;
  notifications: string[];
}

export interface FirestoreWriteAdapter {
  collection(name: string): FirestoreCollectionAdapter;
}

export interface FirestoreCollectionAdapter {
  add(data: Record<string, unknown>): Promise<{ id: string }>;
  where(field: string, op: "==", value: unknown): FirestoreQueryAdapter;
}

export interface FirestoreQueryAdapter {
  where(field: string, op: "==", value: unknown): FirestoreQueryAdapter;
  limit(count: number): FirestoreQueryAdapter;
  get(): Promise<{ docs: Array<{ data(): Record<string, unknown> }> }>;
}

export async function writeMedicationResponse(
  db: FirestoreWriteAdapter,
  input: RecordMedicationResponseWriteInput,
): Promise<RecordMedicationResponseWriteResult> {
  const log: MedicationLog = {
    householdId: input.householdId,
    medicationId: input.medicationId,
    routineEventId: input.routineEventId,
    userId: input.userId,
    status: input.status,
    responseMethod: input.responseMethod,
    responseText: input.responseText,
    refusalReason: input.status === "refused" ? input.refusalReason ?? "other" : undefined,
    refusalNote: input.refusalNote,
    createdAt: input.now(),
  };

  const doc = await db.collection("medicationLogs").add(removeUndefined(log));
  const notifications = await createMedicationResponseNotifications(
    db,
    planMedicationResponseNotifications({
      householdId: input.householdId,
      seniorId: input.userId,
      caregiverId: input.caregiverId,
      medicationId: input.medicationId,
      routineEventId: input.routineEventId,
      status: input.status,
      intent: input.intent,
      refusalReason: log.refusalReason,
    }),
    input.now,
  );

  return {
    logId: doc.id,
    status: input.status,
    intent: input.intent,
    refusalReason: log.refusalReason,
    message: input.safeMessage,
    notifications,
  };
}

async function createMedicationResponseNotifications(
  db: FirestoreWriteAdapter,
  plans: MedicationResponseNotificationPlan[],
  now: () => string,
): Promise<string[]> {
  const created: string[] = [];

  for (const plan of plans) {
    if (await hasExistingMedicationResponseNotification(db, plan)) continue;

    const notification = await db.collection("notifications").add(removeUndefined({
      householdId: plan.householdId,
      userId: plan.seniorId,
      seniorId: plan.seniorId,
      caregiverId: plan.caregiverId,
      medicationId: plan.medicationId,
      routineEventId: plan.routineEventId,
      type: plan.type,
      severity: plan.severity,
      title: plan.title,
      message: plan.message,
      refusalReason: plan.refusalReason,
      status: "sent",
      createdAt: now(),
    }));

    created.push(notification.id);
  }

  return created;
}

async function hasExistingMedicationResponseNotification(
  db: FirestoreWriteAdapter,
  plan: MedicationResponseNotificationPlan,
): Promise<boolean> {
  const snapshot = await db.collection("notifications")
    .where("householdId", "==", plan.householdId)
    .where("userId", "==", plan.seniorId)
    .where("medicationId", "==", plan.medicationId)
    .where("type", "==", plan.type)
    .limit(10)
    .get();

  return snapshot.docs.some((doc) => {
    const data = doc.data();
    return (data.routineEventId ?? undefined) === (plan.routineEventId ?? undefined);
  });
}

function removeUndefined<T extends object>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
