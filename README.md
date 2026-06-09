# Pilly / MediMate Voice

Live demo: https://medimate-voice-demo.web.app

> Safety note: This is a prototype for portfolio/hackathon demonstration only. Do not use it with real patient, medication, caregiver, household, voice, or biometric data.

Pilly is a Firebase-backed senior-care medication support prototype that helps model event-based medication reminders, confirmation-gated responses, urgent/help phrase handling, and caregiver visibility into missed doses, refusals, and help requests.

The project has been security-hardened compared to the original hackathon demo: public Firestore demo access was removed, public Storage voice access was removed, household/role isolation is tested, and voice cloning is disabled. It is still not production-ready.

## Problem

Medication plans often become harder to manage after a hospital stay. Seniors may already use Webster Packs for stable daily medicines, but short-term antibiotics, new temporary prescriptions, or medicines kept outside the pack can create confusion. Family caregivers need enough visibility to help without making the senior manage a complex app.

## Solution

Pilly models medication support around familiar daily events such as breakfast, lunch, dinner, bedtime, leaving home, and post-discharge check-ins. Seniors can respond with large controls, typed responses, or voice input. The backend classifies responses, records medication status, and creates caregiver-facing alerts when an event is completed without a final response.

The project is a hackathon MVP and portfolio prototype, not a medical product. It demonstrates workflow, safety boundaries, Firebase authorization patterns, and security regression testing needed before a more robust version could be considered.

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
- Voice or typed response capture for medication check-ins with confirmation-gated `taken_confirmed` status.
- Refusal reason capture for caregiver follow-up.
- Static urgent/help phrase safety handling that resolves to `help_requested`.
- Caregiver dashboard with medication status and notification visibility.
- Leaving-home simulation for medicines that need to be taken along.
- Firebase Auth-aware callable hardening with server-side household and role checks.
- Firestore persistence for users, households, medications, logs, routine events, notifications, and script upload metadata.
- Firestore and Storage security rules with emulator regression tests.
- Cloud Function-first core workflows for medication responses, event completion, and leaving-home reminders.
- Deterministic Gemini fallback when no API key is configured.
- Voice cloning is disabled until production-grade consent, retention, deletion, and audit controls exist.

## Tech Stack

- Frontend: HTML, Tailwind CDN, vanilla JavaScript, browser SpeechRecognition, browser speech synthesis.
- Backend: Firebase Cloud Functions, TypeScript, Node.js 20 runtime.
- Data: Firestore and Firebase Storage rules.
- Auth: Firebase Auth-aware access checks; full onboarding and membership provisioning remain future work.
- AI: Gemini API from Cloud Functions only, with deterministic fallback.
- Hosting: Firebase Hosting.
- Tests: TypeScript build, Node test runner, Firebase emulator Firestore/Storage security rules tests, and callable authorization helper tests.

## Architecture Overview

```text
Senior / Caregiver UI
        |
        | Firebase Auth authenticated household member
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
- Firebase Auth: Provides authenticated identity for server-side household and role checks. A full onboarding/provisioning flow is not implemented yet.
- Firestore: Stores household, medication, event, log, notification, and script-upload records.
- Cloud Functions: Owns response classification, medication log writes, missed-dose transitions, leaving-home reminders, and alert generation.
- Senior workflow: Receive an event-based reminder, respond, snooze, refuse, or ask for help.
- Caregiver workflow: See current medication state, missed-dose alerts, refusal reasons, and help requests.
- Pharmacy/provider-facing workflow: Prototype framing supports medication intake and visibility around prescriptions outside a Webster Pack; production use would require stricter permissions and clinical review boundaries.

## Voice And Audio Boundary

Pilly explores familiar, trusted reminder delivery as a product direction, but the current hardened prototype does not enable voice cloning and must not be used with real voice or biometric data.

The active hosted flow falls back to browser speech reminders. Backend support for generic Google Cloud Text-to-Speech Chirp 3 HD reminders exists behind authenticated caregiver/family checks, but production voice reminder use would still require stronger consent, retention, deletion, and audit workflows.

Voice cloning is disabled in both the frontend and callable functions. Storage rules fully deny `voiceCloneSamples` paths.

Production use of any family voice, recorded reminder, or synthetic voice path would require identity verification, speaker consent records, senior opt-out, retention/deletion controls, audit trails, provider policy review, and clinical/safety review.

Allowed reminder-copy example: "Hi Dad, it's time for your evening medication. Please take it with water."

For local development with Google Cloud Text-to-Speech, use Application Default Credentials:

```bash
gcloud auth application-default login
```

For deployed Firebase Functions, attach permissions to the runtime service account rather than committing a service-account JSON file. The service account needs access to Cloud Text-to-Speech and the Firebase Storage bucket if the generic Chirp path is used.

## Screenshots

Screenshots from the design and demo iterations are stored in `FRONT_END/*/screen.png`.

- Senior home: `FRONT_END/medimate_home_simplified_voice_navigation/screen.png`
- Add medication: `FRONT_END/add_medication_updated_navigation/screen.png`
- Log medication: `FRONT_END/log_medication_updated_navigation/screen.png`
- Caregiver dashboard: `FRONT_END/caregiver_dashboard_updated_navigation/screen.png`
- Sign in: `FRONT_END/sign_in_updated_navigation/screen.png`

## Demo Instructions

The live site is a portfolio artifact, not a public data-entry demo. Public demo writes have been disabled. Do not enter real names, medication details, caregiver details, household information, prescriptions, audio samples, or other sensitive data.

Use the repository tests and local emulator validation to review the hardening work:

```bash
cd functions
npm install
npm run lint
npm test
npm run test:rules
```

For MCP checks:

```bash
cd mcp
npm install
npm run lint
npm audit --omit=dev
```

See `docs/SECURITY_HARDENING.md` for the latest fixed/tested/remaining-risk summary.

## What This Demonstrates

- Firebase Auth-aware callable hardening.
- Firestore and Storage security rule design.
- Household/role-based access control.
- Medication safety state design with confirmation-gated `taken_confirmed` status.
- Urgent phrase prioritisation to `help_requested`.
- Security regression testing with Firebase emulator rules tests.
- Practical cleanup of unsafe AI-generated demo code.

## Latest Validation

- `cd functions && npm run lint` - passed.
- `cd functions && npm test` - passed.
- `cd functions && npm run test:rules` - passed, 13/13 emulator security tests.
- `cd functions && npm audit --omit=dev` - still reports 8 moderate production dependency advisories through Firebase/Google dependency chain.
- `cd mcp && npm run lint` - passed.
- `cd mcp && npm audit --omit=dev` - 0 vulnerabilities.

## Continuous Validation

This repository runs CI checks for Functions lint/tests, Firebase security rules tests, and MCP lint/audit on push and pull request. The Functions production audit is currently non-blocking because known Firebase/Google dependency-chain advisories remain documented in `docs/SECURITY_HARDENING.md`; MCP production audit is blocking.

## Built in 12 Hours

This project was built during a Google AI hackathon sprint in roughly 12 hours. The sprint produced a working Firebase-hosted demo, Firestore-backed medication state, voice-friendly senior interactions, caregiver visibility, server-owned safety classification, and Cloud Function-first core medication workflows.

The repository has since been hardened for portfolio presentation. Public demo access paths were removed, role/household checks were added, and security rules tests now cover the highest-risk access-control boundaries. It remains a prototype with safety-critical production gaps.

## Safety and Medical Boundary

- Pilly does not diagnose conditions.
- Pilly does not recommend medication, dosage changes, skipped doses, or extra doses.
- Pilly only supports an existing medication schedule entered by a caregiver or provider.
- Urgent phrases such as chest pain, cannot breathe, fell, dizzy, emergency, call someone, or need help produce static safety guidance and resolve to `help_requested`.
- Caregiver and pharmacy/provider visibility is assistive only and is not a substitute for professional medical advice.
- Medication `taken` state requires explicit confirmation before it is stored as `taken_confirmed`.
- Voice cloning is disabled. Any future recorded or synthetic reminder path must support consent, deletion, retention, opt-out, and audit controls.
- Always follow the instructions from a doctor, pharmacist, or qualified healthcare professional.

## My Contribution

- Designed and framed the pharmacy/provider-facing workflow around temporary medicines and post-discharge medication complexity.
- Integrated Firebase-backed persistence for the demo data model.
- Refactored the core medication workflow toward Cloud Function-first behavior.
- Reworked the original open demo into a security-hardened prototype with authenticated callable checks, server-side household/role validation, and Firebase emulator rules tests.
- Defined product and safety boundaries so the prototype avoids diagnosis, dosage recommendations, real patient data, and unsafe voice cloning.

## Known Limitations

- No real onboarding or household membership provisioning flow exists yet.
- App Check and callable rate limiting are not implemented yet.
- Full callable emulator invocation tests are still future work; current callable coverage is helper-level plus Firebase rules emulator tests.
- Functions production dependency audit still reports moderate advisories through Firebase/Google dependencies.
- Voice cloning is disabled, not production-hardened.
- Recorded/family voice reminder consent, deletion, retention, opt-out, and audit workflows are not production-grade.
- The UI is a hackathon prototype and is not fully accessibility-audited.
- Medication intake parsing is basic and not suitable for real prescriptions.
- This repository must not be used with real patient, medication, caregiver, household, voice, or biometric data.

## Future Roadmap

- Add full callable emulator integration tests.
- Add real onboarding, invitation, and household membership provisioning flows.
- Add App Check enforcement and callable rate limits/quotas.
- Add production-safe medication intake review and confirmation flows.
- Add production-grade senior/caregiver delete and replacement controls for family voice reminders with audit trails.
- Explore any consent-based recorded or synthetic voice reminders only after safety, consent, deletion, retention, audit, and opt-out design is complete.
- Improve accessibility, keyboard support, and mobile viewport testing.
- Add CI for build, lint, tests, and rules validation.
- Add audit logging and privacy review before any real-world pilot.

## Repository Notes

- Product requirements: `PRD.md`
- Technical design: `TDD.md`
- Callable function contract: `API.md`
- Security hardening summary: `docs/SECURITY_HARDENING.md`
- Current task state: `TASKS.md`
- Hosted frontend: `FRONT_END/app`
- Mobile demo screens: `FRONT_END/app/sign-in`, `FRONT_END/app/home`, `FRONT_END/app/add-medication`, `FRONT_END/app/log-medication`, `FRONT_END/app/caregiver-dashboard`
- Cloud Functions: `functions/src`
- Local MCP server: `mcp`
