# MediMate Voice Tasks

## Phase 1: Firebase Backend Setup
- [ ] Create Firebase project for MediMate Voice.
- [ ] Enable Firebase Auth, Firestore, Storage, and Cloud Functions.
- [ ] Configure backend environment variables, including optional `GEMINI_API_KEY`.
- [ ] Add Firebase emulator setup for local backend testing.

## Phase 2: Firestore Data Model
- [ ] Define collections for users, households, medications, routine events, medication logs, notifications, and script uploads.
- [ ] Seed David as the senior, Rose as spouse context, and at least one family caregiver.
- [ ] Seed sample Webster Pack medicines and one post-hospital antibiotic outside the Webster Pack.
- [ ] Add event trigger fields for breakfast, lunch, dinner, bedtime, leaving home, post-discharge, and caregiver check-in.

## Phase 3: Security Rules
- [ ] Write Firestore rules scoped by household membership.
- [ ] Allow caregivers to manage medications for linked seniors.
- [ ] Allow seniors to create medication responses for their own reminders.
- [ ] Restrict notification and script upload access to linked household users.
- [ ] Add Storage rules for script uploads.

## Phase 4: Cloud Functions
- [ ] Implement `classifyMedicationResponse`.
- [ ] Implement `recordMedicationResponse`.
- [ ] Implement `completeRoutineEvent`.
- [ ] Implement `simulateLeavingHome`.
- [ ] Implement `generateReminderCopy`.
- [ ] Implement `generateMissedDoseAlert`.
- [ ] Implement `processScriptUpload`.
- [ ] Ensure all functions return simple JSON payloads for Stitch.

## Phase 5: AI and Safety Handling
- [ ] Call Gemini only from Cloud Functions.
- [ ] Add deterministic fallback classification.
- [ ] Classify taken, snoozed, refused, help requested, caregiver attention, and urgent.
- [ ] Capture refusal reasons and optional notes.
- [ ] Return static emergency guidance for urgent phrases.
- [ ] Prevent generated medical advice.

## Phase 6: Event-Based Medication Logic
- [ ] Create routine event records for event triggers.
- [ ] Match active medications to routine events.
- [ ] Mark doses missed when an event is completed or skipped without a final medication response.
- [ ] Create caregiver missed-dose notifications.
- [ ] Treat leaving home as a first-class event trigger.

## Phase 7: Script Upload Backend
- [ ] Store uploaded script metadata in Firestore.
- [ ] Support pasted script text for the demo.
- [ ] Extract candidate medication names, doses, and instructions.
- [ ] Require caregiver confirmation before creating medication records.

## Phase 8: Stitch Integration Contract
- [ ] Document Firebase SDK config needs.
- [ ] Document Firestore collection reads for senior and caregiver screens.
- [ ] Document callable Cloud Function request and response shapes.
- [ ] Provide sample payloads for event completion, response logging, refusal, and leaving-home simulation.

## Phase 9: Verification
- [ ] Run Firebase emulator tests.
- [ ] Verify security rules for senior, spouse, caregiver, and unrelated users.
- [ ] Verify event-based missed-dose behavior.
- [ ] Verify leaving-home reminder simulation.
- [ ] Verify refusal reason logging.
- [ ] Verify caregiver notifications.
- [ ] Verify Gemini fallback without an API key.
