# Pilly Backend API

## Frontend Integration
The Stitch frontend should use Firebase SDK for Auth, Firestore reads, Storage uploads, and callable Cloud Functions. Business logic should go through Cloud Functions.

For the hackathon demo, callable functions accept `userId` in the payload when Firebase Auth is not wired yet.

## Callable Functions

### `seedDemoData`
Creates demo household data for Eleanor, , a caregiver, Webster Pack medicine, and one antibiotic outside the Webster Pack.

Response:
```json
{
  "householdId": "demo-household-eleanor",
  "eleanorId": "demo-eleanor",
  "caregiverId": "demo-caregiver"
}
```

### `classifyMedicationResponse`
Request:
```json
{ "text": "I don't want to take it because it makes me feel sick" }
```

Response:
```json
{
  "intent": "refused",
  "refusalReason": "side_effects",
  "safeMessage": "I have recorded that Eleanor does not want to take this medicine. Please contact a caregiver, doctor, or pharmacist for guidance.",
  "source": "fallback"
}
```

### `recordMedicationResponse`
Request:
```json
{
  "userId": "demo-eleanor",
  "householdId": "demo-household-eleanor",
  "medicationId": "MEDICATION_DOC_ID",
  "routineEventId": "ROUTINE_EVENT_DOC_ID",
  "responseMethod": "typed",
  "responseText": "I took it"
}
```

### `completeRoutineEvent`
Request:
```json
{
  "userId": "demo-eleanor",
  "householdId": "demo-household-eleanor",
  "trigger": "lunch",
  "status": "completed"
}
```

### `simulateLeavingHome`
Request:
```json
{
  "userId": "demo-eleanor",
  "householdId": "demo-household-eleanor"
}
```

### `generateReminderCopy`
Request:
```json
{
  "medicationName": "Post-hospital antibiotic",
  "dose": "1 tablet",
  "trigger": "lunch"
}
```

### `generateMissedDoseAlert`
Request:
```json
{
  "medicationName": "Post-hospital antibiotic",
  "trigger": "lunch"
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

### `processScriptUpload`
Request:
```json
{
  "userId": "demo-caregiver",
  "householdId": "demo-household-eleanor",
  "text": "Antibiotic 1 tablet after lunch; Pain medicine 500mg before bed"
}
```
