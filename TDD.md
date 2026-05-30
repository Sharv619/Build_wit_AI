# MediMate Voice TDD

## Technical Overview
MediMate Voice will be implemented as a React + Vite + TypeScript browser app. The prototype stores data in `localStorage` and optionally calls Gemini from the browser for intent classification and friendly generated copy.

## Stack
- React
- Vite
- TypeScript
- Browser `localStorage`
- Browser `speechSynthesis`
- Browser Speech Recognition API where available
- Optional Gemini API through `VITE_GEMINI_API_KEY`

## Environment Variables
- `VITE_GEMINI_API_KEY`: optional API key for Gemini demo calls.

## Local Storage Keys
- `medimate.users`
- `medimate.activeUserId`
- `medimate.medications`
- `medimate.logs`
- `medimate.settings`
- `medimate.notifications`

## Shared Types
```ts
type MedicationStatus =
  | "pending"
  | "taken"
  | "snoozed"
  | "missed"
  | "refused"
  | "help_requested";

type ResponseMethod = "button" | "voice" | "typed" | "system";

type UserRole = "senior" | "caregiver";

type MedicationSource =
  | "webster_pack"
  | "temporary_post_hospital"
  | "antibiotic"
  | "other";

type RefusalReason =
  | "away_from_medicine"
  | "side_effects"
  | "feeling_unwell"
  | "confused"
  | "other";

interface User {
  id: string;
  name: string;
  role: UserRole;
  caregiverContact?: string;
}

interface Medication {
  id: string;
  userId: string;
  name: string;
  dose: string;
  scheduledTime: string;
  allowedWindowMinutes: number;
  instructions: string;
  source: MedicationSource;
  active: boolean;
}

interface MedicationLog {
  id: string;
  medicationId: string;
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
  userId: string;
  medicationId?: string;
  type: "dose_reminder" | "missed_dose_alert" | "leaving_home_reminder";
  message: string;
  createdAt: string;
  acknowledgedAt?: string;
}
```

## Suggested Modules
- `src/types.ts`: shared domain types.
- `src/services/storage.ts`: localStorage read/write helpers.
- `src/services/ai.ts`: Gemini calls and deterministic fallback.
- `src/services/voice.ts`: speech synthesis and speech recognition helpers.
- `src/services/notifications.ts`: missed-dose window checks and leaving-home reminder simulation.
- `src/App.tsx`: route/view state and top-level layout.
- `src/components/*`: screen and UI components.

## Gemini Behavior
The AI service should support:
- Classifying user responses into:
  - `taken`
  - `snoozed`
  - `refused`
  - `help_requested`
  - `caregiver_attention`
  - `urgent`
- Generating friendly reminder copy.
- Generating caregiver missed-dose alert copy.
- Summarizing refusal context without giving medical advice.

If the key is missing or the API fails, the service must use deterministic keyword fallback.

## Fallback Classification
Example deterministic rules:
- `taken`: took, done, yes, completed, had it
- `snoozed`: later, remind, snooze, wait
- `refused`: do not want, don't want, refuse, side effects, not taking
- `urgent`: chest pain, cannot breathe, fell, dizzy, emergency
- `help_requested`: help, call, caregiver, need someone
- Default: `caregiver_attention`

Urgent intent should be handled with static emergency copy and logged as `help_requested`.

## Missed-Dose Logic
- Each medication has an `allowedWindowMinutes` value.
- A pending dose becomes missed only after scheduled time plus allowed window.
- When a dose becomes missed, create a caregiver-facing `missed_dose_alert` notification.
- The prototype may include a simulate missed dose control to trigger this path for demo purposes.

## Leaving-Home Logic
- The first prototype may simulate leaving home with a button rather than using real geolocation.
- When leaving home is simulated, the app checks for active medicines due soon or not yet taken.
- It creates a `leaving_home_reminder` notification and shows David which medicines to take along.
- Real geofencing and background notifications are future work.

## Safety Constraints
The app must not generate or display dosage, diagnosis, skip-dose, or extra-dose advice. All generated copy should be reminder-oriented and include no medical decisioning.

## Testing
- Run TypeScript build.
- Verify app works without `VITE_GEMINI_API_KEY`.
- Verify typed response fallback.
- Verify voice playback in a supported browser.
- Verify refusal reason capture.
- Verify missed-dose alert fires only after the configured window.
- Verify leaving-home reminder simulation.
- Verify local reset clears all MediMate storage keys.
- Verify mobile viewport has no overlapping controls.
