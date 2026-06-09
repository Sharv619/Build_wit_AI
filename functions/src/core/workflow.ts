import {
  Intent,
  MedicationEventTrigger,
  MedicationStatus,
  NotificationSeverity,
  NotificationType,
  RefusalReason,
} from "../types";

export interface WorkflowMedication {
  id: string;
  name: string;
  dose?: string;
  active?: boolean;
  eventTriggers: MedicationEventTrigger[];
}

export interface WorkflowLog {
  medicationId: string;
  routineEventId?: string;
  status: MedicationStatus;
}

export interface MissedDosePlanItem {
  medicationId: string;
  notificationType: "missed_dose";
}

export interface MedicationResponseNotificationInput {
  householdId: string;
  seniorId: string;
  caregiverId?: string;
  medicationId: string;
  routineEventId?: string;
  status: MedicationStatus;
  intent: Intent;
  refusalReason?: RefusalReason;
}

export interface MedicationResponseNotificationPlan {
  householdId: string;
  seniorId: string;
  caregiverId?: string;
  medicationId: string;
  routineEventId?: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  refusalReason?: RefusalReason;
}

const finalStatuses: MedicationStatus[] = ["taken", "snoozed", "refused", "help_requested", "missed"];

export function medicationsForEvent(
  medications: WorkflowMedication[],
  trigger: MedicationEventTrigger,
): WorkflowMedication[] {
  return medications.filter((medication) =>
    medication.active !== false && medication.eventTriggers.includes(trigger),
  );
}

export function planMissedDoseNotifications(
  medications: WorkflowMedication[],
  logs: WorkflowLog[],
  routineEventId: string,
  trigger: MedicationEventTrigger,
): MissedDosePlanItem[] {
  return medicationsForEvent(medications, trigger)
    .filter((medication) => !hasFinalLog(logs, medication.id, routineEventId))
    .map((medication) => ({
      medicationId: medication.id,
      notificationType: "missed_dose",
    }));
}

export function leavingHomeMedicines(medications: WorkflowMedication[]): WorkflowMedication[] {
  return medicationsForEvent(medications, "leaving_home");
}

export function leavingHomeReminderMessage(medications: WorkflowMedication[]): string {
  const names = leavingHomeMedicines(medications)
    .map((medication) => medication.dose ? `${medication.name} (${medication.dose})` : medication.name);
  const prefix = names.length
    ? `Some medicines may need to be taken along when leaving home: ${names.join(", ")}.`
    : "Some medicines may need to be taken along when leaving home.";
  return `${prefix} Please check the medication list and contact a caregiver, pharmacist, or clinician if unsure.`;
}

export function planMedicationResponseNotifications(
  input: MedicationResponseNotificationInput,
): MedicationResponseNotificationPlan[] {
  if (input.intent === "urgent") {
    return [{
      householdId: input.householdId,
      seniorId: input.seniorId,
      caregiverId: input.caregiverId,
      medicationId: input.medicationId,
      routineEventId: input.routineEventId,
      type: "urgent_phrase",
      severity: "urgent",
      title: "Urgent phrase used",
      message: "Eleanor used language that may need urgent human attention. Please check in and contact appropriate support if needed.",
    }];
  }

  if (input.status === "refused") {
    return [{
      householdId: input.householdId,
      seniorId: input.seniorId,
      caregiverId: input.caregiverId,
      medicationId: input.medicationId,
      routineEventId: input.routineEventId,
      type: "refusal",
      severity: "warning",
      title: "Medication reminder refused",
      message: "Eleanor refused a medication reminder. Please check in and review the reason before taking further action.",
      refusalReason: input.refusalReason,
    }];
  }

  if (input.status === "help_requested") {
    return [{
      householdId: input.householdId,
      seniorId: input.seniorId,
      caregiverId: input.caregiverId,
      medicationId: input.medicationId,
      routineEventId: input.routineEventId,
      type: "help_requested",
      severity: "urgent",
      title: "Help requested",
      message: "Eleanor asked for help with a medication reminder. Please check in when possible.",
    }];
  }

  return [];
}

function hasFinalLog(logs: WorkflowLog[], medicationId: string, routineEventId: string): boolean {
  return logs.some((log) =>
    log.medicationId === medicationId &&
    log.routineEventId === routineEventId &&
    finalStatuses.includes(log.status),
  );
}
