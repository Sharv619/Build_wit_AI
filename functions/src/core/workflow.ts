import { MedicationEventTrigger, MedicationStatus } from "../types";

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

function hasFinalLog(logs: WorkflowLog[], medicationId: string, routineEventId: string): boolean {
  return logs.some((log) =>
    log.medicationId === medicationId &&
    log.routineEventId === routineEventId &&
    finalStatuses.includes(log.status),
  );
}
