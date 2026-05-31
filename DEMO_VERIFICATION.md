# Demo Verification

Pilly / MediMate Voice is a demo-only medication support prototype. These paths verify workflow behavior without using real patient data and without claiming production medical readiness.

## Golden Path

Manual path:

```text
Seed demo household
-> Select routine event
-> Senior records "taken"
-> Medication log appears
-> Caregiver dashboard updates
```

Expected result:
- Demo household data exists.
- A routine event can be selected.
- The frontend calls `recordMedicationResponse`.
- A `taken` medication log is written by the Cloud Function.
- The caregiver dashboard shows the updated medication status.
- No medical advice is generated.

Status: frontend is wired to `recordMedicationResponse`; pending manual browser/Firebase verification.

## Refusal Path

Manual path:

```text
Senior says "I don't want to take it because I feel sick"
-> Backend classifies refusal
-> Refusal reason appears
-> Caregiver notification appears
-> No medical advice appears
```

Expected result:
- Response is classified as `refused`.
- Refusal reason is `feeling_unwell`.
- Caregiver-visible refusal notification appears once notification behavior is implemented.
- The UI does not tell the senior whether refusing is medically safe.

Status: frontend response path calls `recordMedicationResponse` for server-side classification; caregiver notification still pending backend implementation/manual verification.

## Help Request Path

Manual path:

```text
Senior says "I need help"
-> Backend classifies help_requested
-> Caregiver notification appears
```

Expected result:
- Response is classified as `help_requested`.
- Caregiver-visible notification appears once notification behavior is implemented.
- The response does not provide medical advice.

Status: frontend response path calls `recordMedicationResponse` for server-side classification; caregiver notification still pending backend implementation/manual verification.

## Urgent Phrase Path

Manual path:

```text
Senior says "I have chest pain" or "I cannot breathe"
-> Static safety guidance appears
-> Caregiver-visible notification appears
-> No diagnosis or dosage advice appears
```

Expected result:
- Urgent phrase is detected.
- Static safety guidance appears.
- No diagnosis, dosage advice, medication recommendation, skip-dose advice, or extra-dose advice appears.
- Caregiver-visible notification appears once notification behavior is implemented.

Status: frontend response path calls `recordMedicationResponse` and displays the backend safe message; caregiver notification still pending backend implementation/manual verification.

## Missed-Dose Path

Manual path:

```text
Complete routine event
-> Only unresolved medicines tied to that event are checked
-> Missed-dose alert appears
-> Repeating completion does not duplicate alert
```

Expected result:
- Medicines tied to unrelated events are ignored.
- Missed-dose notification type is `missed_dose`.
- Repeating the same completed event does not create duplicate missed-dose notifications.
- The frontend calls `completeRoutineEvent` and does not directly create routine event, missed-dose log, or missed-dose notification documents.

Status: frontend is wired to `completeRoutineEvent` with a stable demo `routineEventId`; pure workflow helper covered by automated test; full Firestore callable behavior pending emulator/manual verification.

## Leaving-Home Path

Manual path:

```text
simulateLeavingHome
-> Medicines tied to leaving_home appear
-> Notification appears
```

Expected result:
- Only active medicines tied to `leaving_home` are returned.
- A leaving-home notification appears.
- Copy remains bounded and does not provide dosage changes or medical advice.

Status: pure medicine selection covered by automated test; full callable notification behavior pending emulator/manual verification.

## Trusted Family Voice Path

Manual path:

```text
Caregiver records/uploads audio
-> Consent confirmation required
-> Audio metadata saved
-> Senior can play reminder
-> Browser speech fallback works if no recording exists
```

Expected result:
- Consent is required before saving voice reminder metadata.
- Audio metadata is stored under `voiceReminders` when implemented.
- Audio files are constrained by Firebase Storage rules when implemented.
- Browser speech fallback works if no recording exists.
- No synthetic family voice cloning, impersonation, manipulative copy, or medical advice is used.

Status: boundary documented; Firestore/Storage rule coverage and implementation remain pending.

## Current Frontend Architecture Notes

- The core medication response flow calls the `recordMedicationResponse` Cloud Function.
- The event completion flow calls the `completeRoutineEvent` Cloud Function.
- The caregiver dashboard still reads `medications`, `medicationLogs`, and `notifications` directly from Firestore.
- Demo seeding and medication setup still write directly to Firestore.
- `simulateLeavingHome` still writes directly to Firestore in the frontend and should be wired to `simulateLeavingHome` in a later hardening step.
