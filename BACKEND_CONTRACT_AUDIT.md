# Backend Contract Audit

Audit date: 2026-06-01

Scope: existing Firebase callable functions in `functions/src/index.ts`, AI helpers in `functions/src/ai.ts`, and Firestore rules in `firestore.rules`.

## Summary

The backend already supports the core Pilly workflow: bounded response classification, medication response logging, event completion, missed-dose notifications, leaving-home simulation, reminder copy, missed-dose copy, script upload extraction, and demo seeding.

v2 hardening gaps found during audit:
- Refusal, help-request, and urgent phrase responses now create caregiver-visible notifications from `recordMedicationResponse`.
- The frontend core medication response flow now calls `recordMedicationResponse`; the frontend event completion flow now calls `completeRoutineEvent`.
- The frontend leaving-home flow now calls `simulateLeavingHome`.
- The frontend still writes Firestore directly for demo seeding and medication setup.
- Missed-dose handling is idempotent for a repeated `routineEventId`; the frontend now passes a stable demo event id for the selected event/day, but callable idempotency still needs emulator verification.
- `seedDemoData` creates users, household, and medications, but no starter routine events.
- Firestore rules do not yet include `voiceReminders`.
- Current code has been partially aligned with v2 naming: missed-dose notifications now use `missed_dose`, and routine event values use `post_discharge_check_in`.
- A minimal Node test harness now covers fallback classification, urgent phrase safety, unsafe advice guards, and pure workflow helper behavior. Firestore emulator integration tests are still missing.
- A write-layer test double now verifies the refused-response `recordMedicationResponse` path writes the expected medication log and refusal notification payloads without using a live Firebase emulator.

## `classifyMedicationResponse`

Input:
- `text`: required string.

Output:
- `intent`: `taken`, `snoozed`, `refused`, `help_requested`, `unknown`, or `urgent`.
- `refusalReason`: optional refusal reason.
- `safeMessage`: static or bounded safe message.
- `source`: `gemini` or `fallback`.

Firestore reads:
- None.

Firestore writes:
- None.

Notification behavior:
- None.

Safety behavior:
- Gemini is called server-side only when `GEMINI_API_KEY` exists.
- Missing or failed Gemini calls fall back to deterministic keyword classification.
- Urgent phrases return static emergency-oriented guidance and do not generate medical advice.

Existing test coverage:
- None found.

Missing test coverage:
- Missing `GEMINI_API_KEY` fallback.
- Urgent phrase static guidance.
- Refusal reason classification.
- Unknown or ambiguous response classification.

## `recordMedicationResponse`

Input:
- `userId`: required when Auth is not present.
- `seniorId`: optional demo field. When present, the log is associated with this senior instead of the authenticated demo operator.
- `householdId`: required string.
- `medicationId`: required string.
- `routineEventId`: optional string.
- `responseMethod`: `button`, `voice`, `typed`, or `system`.
- `responseText`: optional string.
- `rawResponse`: optional frontend contract field, not yet persisted.
- `responseSource`: optional frontend contract field, not yet persisted.
- `status`: optional status override.
- `refusalReason`: optional refusal reason.
- `refusalNote`: optional string.

Output:
- `logId`.
- `status`.
- `intent`.
- `refusalReason`, when applicable.
- `message`.

Firestore reads:
- None in current implementation.

Firestore writes:
- Adds one `medicationLogs` document.
- Adds caregiver-visible `notifications` documents for refusal, help-request, and urgent phrase responses.

Notification behavior:
- `refused` responses create `refusal` notifications with `warning` severity and refusal reason when available.
- `help_requested` responses create `help_requested` notifications with `urgent` severity.
- Urgent phrase responses create `urgent_phrase` notifications with `urgent` severity.
- Duplicate prevention checks for an existing notification with the same household, senior, medication, routine event, and notification type before creating another notification.

Safety behavior:
- Response text is classified server-side.
- Urgent intents normalize to `help_requested`; unknown responses remain `unknown`.
- Refusal reason is stored only when status is `refused`.
- Safe message comes from bounded AI/fallback helper.
- Notification copy is caregiver-facing and does not provide medical advice, dosage advice, diagnosis, or automatic emergency triage.

Existing test coverage:
- Pure workflow helper tests cover refusal, help-request, urgent-phrase notification planning, supported notification types, refusal reason inclusion, and unsafe-advice guards.
- Write-layer test double covers refused-response medication log payload, refusal notification payload, refusal reason preservation, unsafe-advice guard, and duplicate refusal-notification prevention for the same medication/event/type.

Missing test coverage:
- Full callable/emulator medication log write.
- Full callable/emulator refusal notification creation.
- Callable Firestore help-request notification creation.
- Callable Firestore urgent phrase notification creation.
- Callable duplicate-prevention behavior.

## `completeRoutineEvent`

Input:
- `userId`: required when Auth is not present.
- `seniorId`: optional demo field. When present, missed-dose checks are scoped to this senior instead of the authenticated demo operator.
- `householdId`: required string.
- `trigger`: routine event trigger.
- `status`: `completed` or `skipped`.
- `routineEventId`: optional string.

Output:
- `routineEventId`.
- `trigger`.
- `status`.
- `missedCount`.
- `notifications`: created notification IDs.

Firestore reads:
- Reads active `medications` for the household, user, and trigger.
- Reads existing `medicationLogs` for each due medicine and routine event.

Firestore writes:
- Sets or creates one `routineEvents` document.
- Adds missed `medicationLogs` documents when no final response exists.
- Adds missed-dose `notifications` documents.

Notification behavior:
- Creates missed-dose notifications for unresolved medicines tied to the event.

Safety behavior:
- Does not provide medication advice.
- Creates caregiver visibility rather than instructions to change medication behavior.

Existing test coverage:
- Pure workflow helper tests cover event-scoped missed-dose planning and idempotency when a final log already exists for the same `routineEventId`.

Missing test coverage:
- Callable Firestore reads/writes for missed-dose alerts only for medicines tied to the event.
- Callable idempotency when completing the same event repeatedly.
- No duplicate notifications on repeated callable completion.

## `simulateLeavingHome`

Input:
- `userId`: required when Auth is not present.
- `seniorId`: optional demo field. When present, medicine selection is scoped to this senior instead of the authenticated demo operator.
- `householdId`: required string.

Output:
- `routineEventId`.
- `notificationId`.
- `medications`: active medicines tied to `leaving_home`.
- `message`.

Firestore reads:
- Reads active `medications` for `leaving_home`.

Firestore writes:
- Adds one `routineEvents` document.
- Adds one `notifications` document.

Notification behavior:
- Creates a `leaving_home` notification.

Safety behavior:
- Reminder copy uses support/check language.
- It does not diagnose, recommend medication, recommend dose changes, tell the senior to skip medication, or tell the senior to take extra medication.
- Frontend calls this callable instead of directly creating leaving-home routine event or notification documents.

Existing test coverage:
- Pure workflow helper tests cover active `leaving_home` medicine selection and bounded reminder copy.

Missing test coverage:
- Leaving-home event creation.
- Leaving-home notification creation.
- Callable Firestore verification that returned medicine list is limited to `leaving_home` medicines.

## `generateReminderCopy`

Input:
- `medicationName`: required string.
- `dose`: required string.
- `trigger`: required string.

Output:
- `message`.

Firestore reads:
- None.

Firestore writes:
- None.

Notification behavior:
- None.

Safety behavior:
- Includes doctor's/pharmacist's instruction boundary.
- Does not recommend medication or dosage changes.

Existing test coverage:
- None found.

Missing test coverage:
- Copy includes safety boundary.
- Copy avoids disallowed medical advice.

## `generateMissedDoseAlert`

Input:
- `medicationName`: required string.
- `trigger`: required string.

Output:
- `message`.

Firestore reads:
- None.

Firestore writes:
- None.

Notification behavior:
- None directly; copy is used by missed-dose notification creation.

Safety behavior:
- Asks caregiver to check in.
- Does not tell senior to take, skip, or change medication.

Existing test coverage:
- None found.

Missing test coverage:
- Copy avoids disallowed medical advice.

## `processScriptUpload`

Input:
- `userId`: required when Auth is not present.
- `householdId`: required string.
- `text`: required string.

Output:
- `uploadId`.
- `candidates`: extracted candidate medicines requiring caregiver confirmation.

Firestore reads:
- None.

Firestore writes:
- Adds one `scriptUploads` document with pasted text, candidate medicines, status, and timestamp.

Notification behavior:
- None.

Safety behavior:
- Returns candidates only.
- Does not create medication records directly.
- Requires caregiver confirmation before medication records should exist.

Existing test coverage:
- None found.

Missing test coverage:
- Upload metadata write.
- Candidate extraction shape.
- No medication records created directly.

## `seedDemoData`

Input:
- None.

Output:
- `householdId`.
- `eleanorId`.
- `caregiverId`.

Firestore reads:
- None.

Firestore writes:
- Sets demo `households/demo-household-eleanor`.
- Sets demo `users/demo-eleanor`.
- Sets demo `users/demo-caregiver`.
- Adds demo `medications` documents.

Notification behavior:
- None.

Safety behavior:
- Creates demo-only data and should not include real patient data.

Existing test coverage:
- None found.

Missing test coverage:
- Senior, caregiver, household, medication, and routine event data existence.
- Idempotent or reset behavior for repeated demo seeding.

## Firestore Rules Audit

Current rules cover:
- `users`
- `households`
- `medications`
- `routineEvents`
- `medicationLogs`
- `notifications`
- `scriptUploads`

Current rules do not cover:
- `voiceReminders`

Household access behavior:
- Demo household data is broadly readable/writable for demo paths.
- Non-demo access is based on signed-in user household linkage.
- Caregiver-only writes are enforced for medications and script uploads outside demo mode.

Existing test coverage:
- No emulator tests found.

Missing test coverage:
- Linked household read access.
- Unlinked household denial.
- Caregiver-only medication writes.
- `voiceReminders` access rules.
