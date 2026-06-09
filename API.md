# Pilly Backend API

The Stitch/front-end integration should use Firebase SDK for Auth, Firestore reads, Storage uploads, and callable Cloud Functions. Core medication response business logic belongs in Cloud Functions, not the browser.

The current demo frontend still reads Firestore directly for dashboard display and still has demo-only direct writes for seeding and medication setup. The core medication response flow calls `recordMedicationResponse`, the event completion flow calls `completeRoutineEvent`, and the leaving-home flow calls `simulateLeavingHome`, so response classification, medication response log writes, missed-dose event-completion logic, and leaving-home reminder creation happen server-side.

For the demo, callable functions may accept `userId` in the payload when Firebase Auth is not wired yet. Production usage would require authenticated callers and household authorization checks.

## Data Collections
- `users`
- `households`
- `medications`
- `routineEvents`
- `medicationLogs`
- `notifications`
- `scriptUploads`
- `voiceReminders`

## Shared Values

Medication statuses:
- `taken`
- `snoozed`
- `missed`
- `refused`
- `help_requested`
- `unknown`

Routine events:
- `breakfast`
- `lunch`
- `dinner`
- `bedtime`
- `leaving_home`
- `post_discharge_check_in`
- `caregiver_check_in`

Refusal reasons:
- `away_from_medicine`
- `side_effects`
- `feeling_unwell`
- `confused`
- `does_not_understand`
- `other`
- `unknown`

Notification types:
- `missed_dose`
- `refusal`
- `help_requested`
- `leaving_home`
- `urgent_phrase`
- `system`

## Safety Disclaimer

All user-facing flows must show:

> Pilly does not provide medical advice. Always follow your doctor's or pharmacist's instructions.

AI is only used for bounded response classification and safe workflow routing. It must not provide diagnosis, dosage advice, medication recommendations, interaction checks, clinical decision support, or emergency triage.

## Callable Functions

### `seedDemoData`

Creates demo household data for Eleanor, a family caregiver, Webster Pack medicine, a post-hospital antibiotic outside the Webster Pack, and starter routine events.

Request:
```json
{}
```

Response:
```json
{
  "householdId": "demo-household-eleanor",
  "eleanorId": "demo-eleanor",
  "caregiverId": "demo-caregiver"
}
```

### `classifyMedicationResponse`

Classifies free-text senior responses into bounded workflow intents.

Request:
```json
{
  "text": "I don't want to take it because I feel sick"
}
```

Response:
```json
{
  "intent": "refused",
  "refusalReason": "feeling_unwell",
  "safeMessage": "I have recorded that Eleanor does not want to take this medicine. Please contact a caregiver, doctor, or pharmacist for guidance.",
  "source": "fallback"
}
```

### `recordMedicationResponse`

Validates and writes a medication log. Response classification runs server-side. Refusal, help-request, and urgent-phrase responses create caregiver-visible notifications for human follow-up.

Request:
```json
{
  "userId": "demo-eleanor",
  "seniorId": "demo-eleanor",
  "householdId": "demo-household-eleanor",
  "medicationId": "MEDICATION_DOC_ID",
  "routineEventId": "ROUTINE_EVENT_DOC_ID",
  "responseMethod": "typed",
  "responseText": "I took it",
  "rawResponse": "I took it",
  "responseSource": "typed"
}
```

Notes:
- `seniorId` is accepted by the demo backend so the log can be associated with the senior even when the browser is authenticated as a demo caregiver/operator.
- `responseText` is the value currently classified by the backend.
- `rawResponse` and `responseSource` are accepted by the frontend contract for clarity but are not yet persisted by the backend implementation.
- Refusal notifications use `type: "refusal"` and `severity: "warning"`.
- Help-request notifications use `type: "help_requested"` and `severity: "urgent"`.
- Urgent phrase notifications use `type: "urgent_phrase"` and `severity: "urgent"`.
- These notifications are caregiver visibility only. They do not provide diagnosis, dosage advice, medication advice, or automatic emergency triage.
- Duplicate prevention checks for an existing notification with the same household, senior, medication, routine event, and notification type before creating another notification.

Response:
```json
{
  "logId": "LOG_DOC_ID",
  "status": "taken",
  "intent": "taken",
  "message": "Response recorded.",
  "notifications": []
}
```

### `completeRoutineEvent`

Marks an event complete or skipped, then creates missed-dose logs and notifications only for active medicines tied to that event that do not already have a final response for that event.

Request:
```json
{
  "userId": "demo-eleanor",
  "seniorId": "demo-eleanor",
  "householdId": "demo-household-eleanor",
  "routineEventId": "demo-household-eleanor_demo-eleanor_lunch_2026-06-01",
  "trigger": "lunch",
  "status": "completed"
}
```

Notes:
- `seniorId` is accepted by the demo backend so missed-dose checks are scoped to the senior even when the browser is authenticated as a demo caregiver/operator.
- `routineEventId` is optional, but passing a stable event id allows repeated completion of the same demo event to avoid duplicate missed-dose logs and notifications.
- The frontend now calls this callable from `completeEvent()` instead of directly creating routine event, missed-dose log, or missed-dose notification documents.

Response:
```json
{
  "routineEventId": "ROUTINE_EVENT_DOC_ID",
  "trigger": "lunch",
  "status": "completed",
  "missedCount": 1,
  "notifications": ["NOTIFICATION_DOC_ID"]
}
```

### `simulateLeavingHome`

Creates a `leaving_home` routine event and caregiver-visible leaving-home notification.

Request:
```json
{
  "userId": "demo-eleanor",
  "seniorId": "demo-eleanor",
  "householdId": "demo-household-eleanor"
}
```

Notes:
- `seniorId` is accepted by the demo backend so leaving-home medicine selection is scoped to the senior even when the browser is authenticated as a demo caregiver/operator.
- The frontend now calls this callable from `simulateLeavingHome()` instead of directly creating a `routineEvents` document or leaving-home `notifications` document.
- Returned copy is support/reminder language only. It does not diagnose, recommend medication, recommend dose changes, or tell the senior to skip or take extra medication.

Response:
```json
{
  "routineEventId": "ROUTINE_EVENT_DOC_ID",
  "notificationId": "NOTIFICATION_DOC_ID",
  "medications": [],
  "message": "Some medicines may need to be taken along when leaving home. Please check the medication list and contact a caregiver, pharmacist, or clinician if unsure."
}
```

### `generateReminderCopy`

Creates bounded reminder copy that avoids medical advice.

Request:
```json
{
  "medicationName": "Post-hospital antibiotic",
  "dose": "1 tablet",
  "trigger": "lunch"
}
```

Response:
```json
{
  "message": "It is lunch. Please take 1 tablet of Post-hospital antibiotic if this matches your doctor's or pharmacist's instructions."
}
```

### `generateMissedDoseAlert`

Creates caregiver alert copy for a missed event-based dose.

Request:
```json
{
  "medicationName": "Post-hospital antibiotic",
  "trigger": "lunch"
}
```

Response:
```json
{
  "message": "Eleanor did not record Post-hospital antibiotic for lunch. Please check in when you can."
}
```

### `generateChirpReminderAudio`
Generates a generic Google Cloud Text-to-Speech Chirp 3 HD reminder from approved backend reminder copy, saves MP3 audio to Firebase Storage, and stores `voiceReminders` metadata. This is not family voice cloning.

Request:
```json
{
  "userId": "demo-eleanor",
  "householdId": "demo-household-eleanor",
  "medicationId": "MEDICATION_DOC_ID",
  "medicationName": "Post-hospital antibiotic",
  "dose": "1 tablet",
  "trigger": "lunch",
  "voiceName": "en-US-Chirp3-HD-Charon",
  "syntheticVoiceAcknowledged": true
}
```

Response:
```json
{
  "voiceReminderId": "VOICE_REMINDER_DOC_ID",
  "storagePath": "households/demo-household-eleanor/voiceReminders/VOICE_REMINDER_DOC_ID.mp3",
  "messageType": "chirp3_hd",
  "voiceName": "en-US-Chirp3-HD-Charon",
  "message": "It is lunch. Please take 1 tablet of Post-hospital antibiotic if this matches your doctor's or pharmacist's instructions."
}
```

### `createElevenLabsVoiceClone`
Creates an explicit-consent ElevenLabs Instant Voice Clone from a caregiver-uploaded audio sample in Firebase Storage. Requires `ELEVENLABS_API_KEY` on the Cloud Functions runtime.

Request:
```json
{
  "userId": "demo-caregiver",
  "householdId": "demo-household-eleanor",
  "speakerName": "Sarah",
  "relationship": "daughter",
  "sampleStoragePath": "households/demo-household-eleanor/voiceCloneSamples/sample.webm",
  "speakerConsentConfirmed": true,
  "voiceCloneConsentConfirmed": true,
  "syntheticVoiceAcknowledged": true
}
```

Response:
```json
{
  "voiceCloneId": "VOICE_CLONE_DOC_ID",
  "provider": "elevenlabs",
  "providerVoiceId": "ELEVENLABS_VOICE_ID",
  "requiresVerification": false,
  "status": "ready"
}
```

### `generateClonedVoiceReminderAudio`
Generates medication reminder audio from a consented voice clone, saves the MP3 to Firebase Storage, and stores `voiceReminders` metadata with `messageType: "elevenlabs_voice_clone"`.

Request:
```json
{
  "userId": "demo-eleanor",
  "householdId": "demo-household-eleanor",
  "medicationId": "MEDICATION_DOC_ID",
  "medicationName": "Post-hospital antibiotic",
  "dose": "1 tablet",
  "trigger": "lunch",
  "voiceCloneId": "VOICE_CLONE_DOC_ID",
  "syntheticVoiceAcknowledged": true
}
```

### `processScriptUpload`

Stores pasted demo script text and returns candidate medication entries for caregiver confirmation. It does not create medication records directly.

Request:
```json
{
  "userId": "demo-caregiver",
  "householdId": "demo-household-eleanor",
  "text": "Antibiotic 1 tablet after lunch; Pain medicine 500mg before bed"
}
```

Response:
```json
{
  "uploadId": "SCRIPT_UPLOAD_DOC_ID",
  "candidates": [
    {
      "name": "Antibiotic",
      "dose": "1 tablet",
      "instructions": "Antibiotic 1 tablet after lunch",
      "source": "antibiotic",
      "eventTriggers": []
    }
  ]
}
```
