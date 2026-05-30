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

## Shared Types
```ts
type MedicationStatus =
  | "pending"
  | "taken"
  | "snoozed"
  | "missed"
  | "help_requested";

type ResponseMethod = "button" | "voice" | "typed" | "system";

type UserRole = "senior" | "caregiver";

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
  scheduledTime: string;
  instructions: string;
  active: boolean;
}

interface MedicationLog {
  id: string;
  medicationId: string;
  userId: string;
  status: MedicationStatus;
  responseMethod: ResponseMethod;
  responseText?: string;
  createdAt: string;
}
```

## Suggested Modules
- `src/types.ts`: shared domain types.
- `src/services/storage.ts`: localStorage read/write helpers.
- `src/services/ai.ts`: Gemini calls and deterministic fallback.
- `src/services/voice.ts`: speech synthesis and speech recognition helpers.
- `src/App.tsx`: route/view state and top-level layout.
- `src/components/*`: screen and UI components.

## Gemini Behavior
The AI service should support:
- Classifying user responses into:
  - `taken`
  - `snoozed`
  - `help_requested`
  - `caregiver_attention`
  - `urgent`
- Generating friendly reminder copy.
- Generating caregiver missed-dose alert copy.

If the key is missing or the API fails, the service must use deterministic keyword fallback.

## Fallback Classification
Example deterministic rules:
- `taken`: took, done, yes, completed, had it
- `snoozed`: later, remind, snooze, wait
- `urgent`: chest pain, cannot breathe, fell, dizzy, emergency
- `help_requested`: help, call, caregiver, need someone
- Default: `caregiver_attention`

Urgent intent should be handled with static emergency copy and logged as `help_requested`.

## Safety Constraints
The app must not generate or display dosage, diagnosis, skip-dose, or extra-dose advice. All generated copy should be reminder-oriented and include no medical decisioning.

## Testing
- Run TypeScript build.
- Verify app works without `VITE_GEMINI_API_KEY`.
- Verify typed response fallback.
- Verify voice playback in a supported browser.
- Verify local reset clears all MediMate storage keys.
- Verify mobile viewport has no overlapping controls.

