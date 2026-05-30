# Pilly / MediMate Voice

Live demo: https://medimate-voice-demo.web.app

Pilly is a Firebase-backed medication support prototype that helps seniors respond to event-based medication reminders while giving caregivers visibility into missed doses, refusals, and help requests.

## Problem

Medication plans often become harder to manage after a hospital stay. Seniors may already use Webster Packs for stable daily medicines, but short-term antibiotics, new temporary prescriptions, or medicines kept outside the pack can create confusion. Family caregivers need enough visibility to help without making the senior manage a complex app.

## Solution

Pilly models medication support around familiar daily events such as breakfast, lunch, dinner, bedtime, leaving home, and post-discharge check-ins. Seniors can respond with large controls, typed responses, or voice input. The backend classifies responses, records medication status, and creates caregiver-facing alerts when an event is completed without a final response.

The project is a hackathon MVP, not a medical product. It demonstrates the workflow, safety boundaries, and Firebase architecture needed for a more robust version.

## Core Workflow

1. A caregiver adds or seeds medication records for the demo senior.
2. The senior sees medication prompts tied to a daily event rather than a strict clock time.
3. The senior records a response such as taken, snoozed, refused, or help requested.
4. Cloud Functions classify the response and write the medication log.
5. Completing an event checks active medicines for that event and creates missed-dose alerts when needed.
6. The caregiver dashboard updates from Firestore with logs and notifications.

## Features

- Event-based medication reminders for senior-friendly routines.
- Voice playback for reminders using browser speech synthesis.
- Trusted Family Voice Reminders using uploaded/recorded caregiver-approved audio.
- Voice or typed response capture for medication check-ins.
- Refusal reason capture for caregiver follow-up.
- Static urgent-phrase safety handling.
- Caregiver dashboard with medication status and notification visibility.
- Leaving-home simulation for medicines that need to be taken along.
- Firebase Auth-ready demo flow with anonymous sign-in.
- Firestore persistence for users, households, medications, logs, routine events, notifications, and script upload metadata.
- Firebase Storage persistence for recorded family reminder audio.
- Cloud Function-first core workflows for medication responses, event completion, and leaving-home reminders.
- Deterministic Gemini fallback when no API key is configured.

## Tech Stack

- Frontend: HTML, Tailwind CDN, vanilla JavaScript, browser SpeechRecognition, browser speech synthesis.
- Backend: Firebase Cloud Functions, TypeScript, Node.js 20 runtime.
- Data: Firestore and Firebase Storage rules.
- Auth: Firebase Auth with anonymous demo sign-in.
- AI: Gemini API from Cloud Functions only, with deterministic fallback.
- Hosting: Firebase Hosting.
- Tests: TypeScript build plus Node test runner for safety-classification fallback behavior.

## Architecture Overview

```text
Senior / Caregiver UI
        |
        | Firebase Auth anonymous demo session
        v
Firebase SDK reads Firestore live collections
        |
        | Callable Cloud Functions for core workflows
        v
Cloud Functions
  - recordMedicationResponse
  - completeRoutineEvent
  - simulateLeavingHome
  - classifyMedicationResponse
        |
        v
Firestore
  - users
  - households
  - medications
  - routineEvents
  - medicationLogs
  - notifications
  - scriptUploads
  - voiceReminders
```

### Workflow Roles

- Frontend: Presents senior and caregiver demo views, captures typed or voice responses, and reads live Firestore updates.
- Firebase Auth: Provides anonymous demo identity and the foundation for future senior/caregiver role enforcement.
- Firestore: Stores household, medication, event, log, notification, and script-upload records.
- Cloud Functions: Owns response classification, medication log writes, missed-dose transitions, leaving-home reminders, and alert generation.
- Senior workflow: Receive an event-based reminder, respond, snooze, refuse, or ask for help.
- Caregiver workflow: See current medication state, missed-dose alerts, refusal reasons, and help requests.
- Pharmacy/provider-facing workflow: Prototype framing supports medication intake and visibility around prescriptions outside a Webster Pack; production use would require stricter permissions and clinical review boundaries.

## Trusted Family Voice Reminders

Pilly's differentiator is familiar, trusted reminder delivery. The MVP supports uploaded or recorded family voice reminder audio, attached to a medication and event by a caregiver. When the senior selects `Play Reminder`, the app plays the trusted family recording if one exists. If no recording exists, it falls back to the existing browser speech reminder. The caregiver can replace or delete the demo recording for the selected medication/event.

This is not synthetic voice cloning. The current implementation stores caregiver-uploaded audio in Firebase Storage and stores metadata in Firestore:

- `medicationId`
- `routineEventId` / event trigger
- `speakerName`
- `relationship`
- `storagePath`
- `consentConfirmed`
- `messageType: "recorded"`
- `createdAt`

The upload flow requires the caregiver to confirm: "I confirm I have permission to use this person's voice for medication reminders." The UI also warns caregivers to use calm, supportive reminders only and avoid guilt-based or manipulative language.

Allowed example: "Hi Dad, it's time for your evening medication. Please take it with water."

Future custom voice work, such as consent-based Google Chirp or similar voice generation, is roadmap-only and is not implemented in this repository.

## Screenshots

Screenshots from the design and demo iterations are stored in `FRONT_END/*/screen.png`.

- Senior home: `FRONT_END/medimate_home_simplified_voice_navigation/screen.png`
- Add medication: `FRONT_END/add_medication_updated_navigation/screen.png`
- Log medication: `FRONT_END/log_medication_updated_navigation/screen.png`
- Caregiver dashboard: `FRONT_END/caregiver_dashboard_updated_navigation/screen.png`
- Sign in: `FRONT_END/sign_in_updated_navigation/screen.png`

## Demo Instructions

1. Open the live demo: https://medimate-voice-demo.web.app
2. Wait for Firebase connection status.
3. Select `Seed Demo` if the medication list is empty.
4. Choose an event such as lunch or leaving home.
5. Type a response such as `I took it`, `remind me later`, or `I don't want to take it because I feel sick`.
6. Select `Record Response`.
7. Select `Complete Event` to trigger missed-dose handling for unresolved medicines.
8. Select `Simulate Leaving Home` to create a leaving-home reminder notification.
9. To test family voice reminders, choose a medication/event, upload a recorded audio file in `Trusted Family Voice`, confirm consent, then select `Play Reminder`.

For local function checks:

```bash
cd functions
npm install
npm test
```

## Built in 12 Hours

This project was built during a Google AI hackathon sprint in roughly 12 hours. The sprint produced a working Firebase-hosted demo, Firestore-backed medication state, voice-friendly senior interactions, caregiver visibility, server-owned safety classification, and Cloud Function-first core medication workflows.

The repository has since been cleaned up for portfolio presentation, but it still reflects an MVP. Production use would require stronger authentication, role enforcement, audited clinical safety review, emulator coverage, privacy controls, and removal of demo-open access paths.

## Safety and Medical Boundary

- Pilly does not diagnose conditions.
- Pilly does not recommend medication, dosage changes, skipped doses, or extra doses.
- Pilly only supports an existing medication schedule entered by a caregiver or provider.
- Urgent phrases such as chest pain, cannot breathe, fell, dizzy, or emergency produce static safety guidance.
- Caregiver and pharmacy/provider visibility is assistive only and is not a substitute for professional medical advice.
- Trusted Family Voice Reminders are for familiarity, not manipulation or impersonation.
- Recorded reminders must be calm and supportive, with consent from the speaker.
- Always follow the instructions from a doctor, pharmacist, or qualified healthcare professional.

## My Contribution

- Designed and framed the pharmacy/provider-facing workflow around temporary medicines and post-discharge medication complexity.
- Integrated Firebase-backed persistence for the demo data model.
- Refactored the core medication workflow toward Cloud Function-first behavior.
- Stabilised the hosted demo flow while keeping hackathon demo data usable.
- Defined product and safety boundaries so the prototype avoids diagnosis, dosage recommendations, and unsafe medical advice.

## Known Limitations

- Demo household access remains intentionally permissive for portfolio/demo use.
- Callable functions still need full production-grade role and household membership checks.
- Firestore and Storage rules require additional hardening before real user data.
- Recorded family voice reminders use a demo/MVP consent checkbox and need production-grade consent, deletion, and audit flows.
- The UI is a hackathon prototype and is not fully accessibility-audited.
- Medication intake parsing is basic and not suitable for real prescriptions.
- Tests cover AI fallback behavior, but full emulator tests are still pending.
- This repository must not be used with real patient data.

## Future Roadmap

- Add Firebase emulator tests for Firestore rules and callable workflows.
- Enforce caregiver, senior, family, and provider roles in Cloud Functions.
- Replace demo-open access with explicit household membership.
- Add production-safe medication intake review and confirmation flows.
- Add production-grade senior/caregiver delete and replacement controls for family voice reminders with audit trails.
- Explore consent-based custom voice reminders with Google Chirp or equivalent only after safety, consent, and opt-out controls are designed.
- Improve accessibility, keyboard support, and mobile viewport testing.
- Add CI for build, lint, tests, and rules validation.
- Add audit logging and privacy review before any real-world pilot.

## Repository Notes

- Product requirements: `PRD.md`
- Technical design: `TDD.md`
- Callable function contract: `API.md`
- Current task state: `TASKS.md`
- Hosted frontend: `FRONT_END/app`
- Cloud Functions: `functions/src`
