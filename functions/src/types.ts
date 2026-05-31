export type MedicationStatus =
  | "pending"
  | "taken"
  | "snoozed"
  | "missed"
  | "refused"
  | "help_requested"
  | "unknown";

export type ResponseMethod = "button" | "voice" | "typed" | "system";

export type UserRole = "senior" | "spouse" | "caregiver" | "family";

export type MedicationSource =
  | "webster_pack"
  | "temporary_post_hospital"
  | "antibiotic"
  | "other";

export type MedicationEventTrigger =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "bedtime"
  | "leaving_home"
  | "post_discharge_check_in"
  | "caregiver_check_in";

export type RefusalReason =
  | "away_from_medicine"
  | "side_effects"
  | "feeling_unwell"
  | "confused"
  | "does_not_understand"
  | "other"
  | "unknown";

export type Intent =
  | "taken"
  | "snoozed"
  | "refused"
  | "help_requested"
  | "unknown"
  | "urgent";

export type NotificationType =
  | "dose_reminder"
  | "missed_dose"
  | "refusal"
  | "help_requested"
  | "leaving_home"
  | "urgent_phrase"
  | "system";

export type NotificationSeverity = "info" | "warning" | "urgent";

export interface Medication {
  householdId: string;
  userId: string;
  name: string;
  dose: string;
  instructions: string;
  source: MedicationSource;
  eventTriggers: MedicationEventTrigger[];
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineEvent {
  householdId: string;
  userId: string;
  trigger: MedicationEventTrigger;
  status: "pending" | "completed" | "skipped";
  occurredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationLog {
  householdId: string;
  medicationId: string;
  routineEventId?: string;
  userId: string;
  status: MedicationStatus;
  responseMethod: ResponseMethod;
  responseText?: string;
  refusalReason?: RefusalReason;
  refusalNote?: string;
  createdAt: string;
}

export interface NotificationEvent {
  householdId: string;
  userId: string;
  seniorId?: string;
  caregiverId?: string;
  medicationId?: string;
  routineEventId?: string;
  type: NotificationType;
  severity?: NotificationSeverity;
  title?: string;
  message: string;
  refusalReason?: RefusalReason;
  status: "pending" | "sent" | "acknowledged";
  createdAt: string;
  acknowledgedAt?: string;
}
