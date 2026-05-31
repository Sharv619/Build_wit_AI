# Pilly v2 Tasks

Pilly v2 hardens the Firebase-backed medication support prototype while keeping AI limited to bounded response classification and safe workflow routing. It remains demo only and is not for real patient data.

## Current Status
- [x] Repo-local MCP layer exists and builds.
- [x] MCP server starts and exposes repo, audit, verification, and task tools.
- [x] `WORKFLOWS.md` exists; misspelled workflow file is no longer present.
- [x] Safety and business direction docs exist.
- [x] Backend contract audit doc exists.
- [x] Minimal Functions test harness added with `node --test`.
- [x] Deterministic fallback classification is tested.
- [x] Urgent phrase static safety handling is tested.
- [x] Unsafe medical advice guard is tested.
- [x] Pure event-scoped missed-dose helper behavior is tested.
- [x] Pure missed-dose idempotency helper behavior is tested.
- [x] Pure leaving-home medicine selection is tested.
- [x] Demo verification checklist exists.
- [x] Frontend core medication response flow calls `recordMedicationResponse`.
- [x] Frontend event completion flow calls `completeRoutineEvent`.
- [x] Frontend leaving-home flow calls `simulateLeavingHome`.

## P0 Backend Hardening Tasks
- [x] Add `functions/package.json` test script.
- [x] Add real test files under `functions/test/`.
- [x] Align missed-dose notification naming from `missed_dose_alert` toward v2 `missed_dose`.
- [x] Align fallback classifier with v2 `unknown` status and expanded refusal reasons.
- [x] Move frontend medication response classification/log write to `recordMedicationResponse`.
- [x] Move frontend event completion and missed-dose creation to `completeRoutineEvent`.
- [x] Move frontend leaving-home event and notification creation to `simulateLeavingHome`.
- [ ] Create caregiver-visible notifications for refusal responses.
- [ ] Create caregiver-visible notifications for help-request responses.
- [ ] Create caregiver-visible notifications for urgent phrase responses.
- [ ] Confirm callable `completeRoutineEvent` idempotency through emulator tests.
- [ ] Confirm `recordMedicationResponse` log writes through callable/emulator tests.
- [ ] Confirm `simulateLeavingHome` notification writes through callable/emulator tests.
- [ ] Confirm `seedDemoData` creates starter routine event data or document why it intentionally does not.

## P1 Product Workflow Tasks
- [x] Document golden path, refusal path, help-request path, urgent phrase path, missed-dose path, leaving-home path, and Trusted Family Voice path.
- [x] Keep AI usage limited to response classification and safe workflow routing.
- [x] Keep refusal/help/urgent flows bounded by static safety language in tests.
- [x] Keep leaving-home reminder copy bounded by support/check language in tests.
- [ ] Add Firestore rules for `voiceReminders`.
- [ ] Add Storage rule boundaries for voice reminder audio.
- [ ] Add emulator tests for household access rules.
- [ ] Verify caregiver dashboard behavior against the new `missed_dose` notification type.
- [x] Wire frontend `completeEvent` to `completeRoutineEvent`.
- [x] Wire frontend leaving-home demo to callable `simulateLeavingHome`.

## P2 Demo/Portfolio Polish Tasks
- [x] Add README positioning and MCP instructions.
- [x] Link existing v2 docs from README.
- [ ] Add live demo link when finalized.
- [ ] Refresh screenshots if the frontend changes.
- [ ] Refine safety audit heuristic so negated safety statements are not over-reported as unsafe claims.

## Testing Checklist
- [x] Gemini fallback works when `GEMINI_API_KEY` is missing.
- [x] Urgent phrases return static safety guidance and no medical advice.
- [x] Unsafe generated/static safety output avoids blocked advice phrases.
- [x] Response classification values stay within supported v2 status values for non-urgent responses.
- [x] Refusal reasons stay within supported v2 refusal reason values.
- [x] Pure missed-dose planning checks only medicines tied to the completed event.
- [x] Pure missed-dose planning does not duplicate alerts when a final log already exists.
- [x] Pure leaving-home selection returns active `leaving_home` medicines.
- [x] Pure leaving-home reminder copy avoids unsafe medical advice phrases.
- [ ] Callable `recordMedicationResponse` writes expected medication log.
- [ ] Refusal response creates caregiver-visible notification.
- [ ] Help-request response creates caregiver-visible notification.
- [ ] Callable `completeRoutineEvent` creates missed-dose alerts only for medicines tied to that event.
- [ ] Callable `completeRoutineEvent` does not duplicate missed-dose alerts when called repeatedly.
- [ ] Callable `simulateLeavingHome` creates leaving-home notification.
- [ ] Callable `seedDemoData` creates usable senior, caregiver, household, medication, and event data.
- [ ] Firestore household access rules are emulator-tested.

## Build Verification Checklist
- [x] `cd mcp && npm run build`
- [x] `cd functions && npm run build`
- [x] `cd functions && npm test`
- [ ] Root `npm test`; skipped because no root `package.json` exists.
- [ ] Root `npm run build`; skipped because no root `package.json` exists.

## Firestore And Storage Gaps
- Firestore rules still include demo-open access for `demo-household-eleanor`; this is acceptable only for demo mode and must not be used with real patient data.
- Firestore rules do not yet include `voiceReminders`.
- Storage rules do not yet define a voice reminder audio boundary.
- Emulator tests for household isolation are not yet implemented.

## Demo Verification Gaps
- `DEMO_VERIFICATION.md` documents all manual paths.
- Manual Firebase/browser verification remains pending.
- Core response logging is now routed through `recordMedicationResponse`, but manual browser verification is still pending.
- Event completion and missed-dose creation are now routed through `completeRoutineEvent`, but manual browser verification is still pending.
- Leaving-home event and notification creation are now routed through `simulateLeavingHome`, but manual browser verification is still pending.
- Frontend still directly writes Firestore for demo seeding and medication setup.
- Caregiver-visible refusal, help-request, and urgent notification behavior remains pending backend implementation.
- Trusted Family Voice remains a documented boundary concept until consent, metadata, and Storage rules are implemented.

## Next v3 Tasks
- Add emulator-backed callable tests for logs, notifications, routine event completion, seed data, and household rules.
- Implement caregiver-visible notifications for refusal, help-request, and urgent phrase responses.
- Verify missed-dose callable idempotency with emulator tests.
- Add emulator-backed callable tests for `simulateLeavingHome`.
- Add `voiceReminders` Firestore and Storage rule boundaries.
- Refine MCP safety audit to distinguish unsafe claims from negated safety disclaimers.
