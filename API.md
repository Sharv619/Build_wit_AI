# MediMate Backend API

## Frontend Integration
The Stitch frontend should use Firebase SDK for Auth, Firestore reads, Storage uploads, and callable Cloud Functions. Business logic should go through Cloud Functions.

For the hackathon demo, callable functions accept `userId` in the payload when Firebase Auth is not wired yet.

## Callable Functions

### `seedDemoData`
Creates demo household data for David, Rose, a caregiver, Webster Pack medicine, and one antibiotic outside the Webster Pack.

Response:
```json
{
  "householdId": "demo-household-david-rose",
  "davidId": "demo-david",
  "roseId": "demo-rose",
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
  "safeMessage": "I have recorded that David does not want to take this medicine. Please contact a caregiver, doctor, or pharmacist for guidance.",
  "source": "fallback"
}
```

### `recordMedicationResponse`
Request:
```json
{
  "userId": "demo-david",
  "householdId": "demo-household-david-rose",
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
  "userId": "demo-david",
  "householdId": "demo-household-david-rose",
  "trigger": "lunch",
  "status": "completed"
}
```

### `simulateLeavingHome`
Request:
```json
{
  "userId": "demo-david",
  "householdId": "demo-household-david-rose"
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

### `processScriptUpload`
Request:
```json
{
  "userId": "demo-caregiver",
  "householdId": "demo-household-david-rose",
  "text": "Antibiotic 1 tablet after lunch; Pain medicine 500mg before bed"
}
```

