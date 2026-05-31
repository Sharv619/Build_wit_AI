# Pilly TDD

## Technical Overview
Pilly will be implemented backend-first on Firebase. The Stitch frontend will be added later and should consume Firebase Auth, Firestore, Storage, and Cloud Functions rather than owning medication business logic.

The backend owns event-based medication reminders, medication response logging, caregiver alerts, script upload processing, Gemini integration, deterministic AI fallback, and safety enforcement.

## Stack
- Firebase Auth for future senior/caregiver identity.
- Firestore for users, households, medications, routine events, logs, notifications, and script upload metadata.
- Firebase Storage for prescription/script files in future versions.
- Cloud Functions for AI, event completion, missed-dose transitions, caregiver alert generation, and script processing.
- Gemini API called server-side from Cloud Functions.

## Environment Variables
- `GEMINI_API_KEY`: optional server-side Gemini key for Cloud Functions.
- `FIREBASE_PROJECT_ID`: Firebase project identifier.

## Firestore Collections
- `users/{userId}`: senior, spouse, caregiver, or family profile.
- `households/{householdId}`: links Eleanor, , and family caregivers.
- `medications/{medicationId}`: medicine details, dose, source, active state, and event triggers.
- `routineEvents/{eventId}`: event instances such as breakfast, lunch, dinner, bedtime, leaving home, post-discharge, or caregiver check-in.
- `medicationLogs/{logId}`: taken, snoozed, missed, refused, or help-requested records.
- `notifications/{notificationId}`: caregiver alerts and senior reminder events.
- `scriptUploads/{uploadId}`: uploaded script metadata, extracted candidates, and confirmation state.

## Shared Types
```ts
type MedicationStatus =
  | "pending"
  | "taken"
  | "snoozed"
  | "missed"
  | "refused"
  | "help_requested"
  | "unknown";

type ResponseMethod = "button" | "voice" | "typed" | "system";

type UserRole = "senior" | "spouse" | "caregiver" | "family";

type MedicationSource =
  | "webster_pack"
  | "temporary_post_hospital"
  | "antibiotic"
  | "other";

type MedicationEventTrigger =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "bedtime"
  | "leaving_home"
  | "post_discharge_check_in"
  | "caregiver_check_in";

type RefusalReason =
  | "away_from_medicine"
  | "side_effects"
  | "feeling_unwell"
  | "confused"
  | "does_not_understand"
  | "other"
  | "unknown";

interface Medication {
  id: string;
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

interface RoutineEvent {
  id: string;
  householdId: string;
  userId: string;
  trigger: MedicationEventTrigger;
  status: "pending" | "completed" | "skipped";
  occurredAt?: string;
  createdAt: string;
}

interface MedicationLog {
  id: string;
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

interface NotificationEvent {
  id: string;
  householdId: string;
  userId: string;
  caregiverId?: string;
  medicationId?: string;
  routineEventId?: string;
  type: "dose_reminder" | "missed_dose" | "leaving_home_reminder";
  message: string;
  status: "pending" | "sent" | "acknowledged";
  createdAt: string;
  acknowledgedAt?: string;
}
```

## Cloud Functions Contract
- `classifyMedicationResponse`: classifies senior text into taken, snoozed, refused, help requested, unknown, or urgent.
- `recordMedicationResponse`: validates and writes medication logs, including refusal reasons.
- `completeRoutineEvent`: marks an event complete or skipped and creates missed-dose alerts when relevant medicines have no final response.
- `simulateLeavingHome`: creates a leaving-home routine event and reminder notification.
- `generateReminderCopy`: creates short friendly reminder text without medical advice.
- `generateMissedDoseAlert`: creates caregiver alert copy for missed event-based doses.
- `processScriptUpload`: extracts candidate medicines from pasted script text or uploaded file metadata for caregiver confirmation.

## AI and Safety Behavior
- Gemini calls run only in Cloud Functions, never directly in the Stitch frontend.
- If Gemini is unavailable, deterministic keyword fallback must classify responses.
- Urgent phrases such as chest pain, cannot breathe, fell, dizzy, or emergency must return static emergency guidance and log `help_requested`.
- Backend-generated text must never provide dosage, diagnosis, skip-dose, or extra-dose advice.

## Event-Based Missed-Dose Logic
- A medication is due because one of its event triggers occurs.
- A dose is missed when the related routine event is completed or skipped and the medication has no final log of taken, snoozed, refused, or help requested.
- Leaving home is a first-class event trigger and can be simulated in v1.
- Clock-based schedules may be added later as optional metadata, but they are not the v1 reminder model.

## Stitch Frontend Contract
- Stitch should read/write safe Firestore documents and call Cloud Functions for business logic.
- Stitch should not call Gemini directly.
- Stitch should display backend-returned reminder, alert, refusal, and event status data.
- Stitch should use Firebase SDK configuration supplied by the backend project.

## Testing
- Verify Firestore security rules restrict household data to linked users.
- Verify Cloud Functions write expected logs and notifications.
- Verify event completion creates missed-dose alerts only for medicines tied to that event.
- Verify leaving-home simulation creates a reminder notification.
- Verify Gemini fallback works without `GEMINI_API_KEY`.
- Verify urgent phrases produce static emergency guidance and no medical advice.
