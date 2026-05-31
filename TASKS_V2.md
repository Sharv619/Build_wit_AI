# Pilly v2 Tasks

Pilly v2 hardens the existing Firebase-backed medication support prototype. The goal is to prove that AI can be used safely when limited to response classification and workflow routing, while caregivers and healthcare professionals remain responsible for human judgement.

## P0 Backend Hardening Tasks
- [x] Rename the misspelled workflow document to `WORKFLOWS.md`.
- [ ] Align Cloud Function contracts with documented v2 data model values.
- [ ] Ensure deterministic fallback works without `GEMINI_API_KEY`.
- [ ] Ensure urgent phrases return static safety guidance and no medical advice.
- [ ] Create caregiver-visible notifications for refusal responses.
- [ ] Create caregiver-visible notifications for help-request responses.
- [ ] Make missed-dose handling idempotent for repeated routine event completion.
- [ ] Confirm missed-dose alerts are created only for medicines tied to the completed event.
- [ ] Confirm `simulateLeavingHome` writes a caregiver-visible leaving-home notification.
- [ ] Confirm `seedDemoData` creates usable senior, caregiver, household, medication, and event data.
- [ ] Document Firestore household access rules and emulator test status.

## P1 Product Workflow Tasks
- [ ] Document golden path, refusal path, help-request path, missed-dose path, leaving-home path, and Trusted Family Voice Reminder path.
- [ ] Keep AI usage limited to bounded response classification and safe workflow routing.
- [ ] Keep refusal handling visible to caregivers without giving medical advice.
- [ ] Keep help-request and urgent-phrase flows on static guidance.
- [ ] Add `voiceReminders` to documentation as demo metadata only, with consent and no synthetic voice cloning.
- [ ] Update API docs with reads, writes, notification behavior, safety behavior, and coverage gaps.

## P2 Demo/Portfolio Polish Tasks
- [ ] Create portfolio-ready README positioning.
- [ ] Add safety boundary document.
- [ ] Add business direction document.
- [ ] Add demo verification checklist.
- [ ] Keep screenshots and frontend artifacts referenced without implying production readiness.
- [ ] Document known limitations and production hardening roadmap.

## Testing Checklist
- [ ] Deterministic fallback works when `GEMINI_API_KEY` is missing.
- [ ] Urgent phrases return static safety guidance and no medical advice.
- [ ] `recordMedicationResponse` writes expected medication log.
- [ ] Refusal response creates caregiver-visible notification.
- [ ] Help-request response creates caregiver-visible notification.
- [ ] `completeRoutineEvent` creates missed-dose alerts only for medicines tied to that event.
- [ ] `completeRoutineEvent` does not duplicate missed-dose alerts when called repeatedly.
- [ ] `simulateLeavingHome` creates leaving-home notification.
- [ ] `seedDemoData` creates usable senior, caregiver, household, medication, and event data.
- [ ] Firestore household access rules are documented and tested if emulator support is available.

## Build Verification Checklist
- [ ] `cd functions && npm install`
- [ ] `cd functions && npm test`
- [ ] `cd functions && npm run build`
- [ ] Root `npm install`, if root package exists.
- [ ] Root `npm test`, if root package exists.
- [ ] Root `npm run build`, if root package exists.
- [ ] Document any blocker in this file and `BACKEND_CONTRACT_AUDIT.md`.

## Current Blockers
- None documented yet. This section must be updated if emulator setup, function structure, dependency installation, or test harness limitations prevent full verification.
