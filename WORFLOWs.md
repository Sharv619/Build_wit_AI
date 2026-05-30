# MediMate Voice Workflows

## Backend Demo Workflow
1. Seed David, Rose, and a linked family caregiver in Firebase.
2. Add David's Webster Pack medicines and one post-hospital antibiotic outside the Webster Pack.
3. Assign the antibiotic to an event trigger such as lunch or post-discharge.
4. Stitch calls `completeRoutineEvent` or a demo trigger to make the event active.
5. Stitch displays backend reminder copy, medicine name, dose, and source.
6. David responds by button, voice, or typed input.
7. Stitch calls `recordMedicationResponse`.
8. Backend writes the medication log and updates caregiver-visible status.
9. Caregiver dashboard reads the updated log and notification records.

## Medication Intake Workflow
1. Caregiver opens Medication Setup in Stitch.
2. Caregiver chooses manual entry or script upload.
3. Backend stores pasted script text or upload metadata.
4. Backend returns candidate medicines when extraction is available.
5. Caregiver confirms medicine name, dose, instructions, source, and event triggers.
6. Backend creates medication records in Firestore.

## Senior Medication Workflow
1. A routine event occurs, such as lunch, bedtime, or leaving home.
2. Backend finds active medications linked to that event.
3. Backend generates safe reminder copy.
4. Stitch shows medicine name, dose, source, and instructions.
5. Senior responds by button, voice, or typed input.
6. Backend classifies and records the response.
7. Caregiver dashboard reflects the latest status.

## Refusal Workflow
1. Senior chooses I don't want to take it or says a refusal phrase.
2. Stitch asks why in simple language.
3. Senior chooses away from medicine, side effects, feeling unwell, confused, or other.
4. Backend logs status as Refused with the reason.
5. Caregiver dashboard shows the refusal reason.
6. Backend avoids medical advice and returns safe caregiver/contact guidance.

## Event-Based Missed-Dose Workflow
1. A routine event is completed or skipped.
2. Backend checks medicines linked to that event.
3. If a medicine has no final response, backend logs or marks the dose as Missed.
4. Backend creates caregiver missed-dose alert copy.
5. Caregiver dashboard highlights the missed dose.

## Leaving-Home Workflow
1. Stitch calls `simulateLeavingHome`.
2. Backend creates a leaving-home routine event.
3. Backend checks medicines linked to leaving home or still needing attention.
4. Backend creates a reminder notification.
5. Stitch shows David which medicines to take along.
6. Caregiver dashboard can show that the reminder was sent.

## Snooze Workflow
1. Senior chooses Remind me later or says a snooze phrase.
2. Backend logs status as Snoozed.
3. Caregiver dashboard shows Snoozed.
4. The medication remains visible as needing later attention.

## Help Workflow
1. Senior taps I need help or says a help phrase.
2. Backend logs status as Help Requested.
3. Backend returns static help guidance.
4. Caregiver dashboard highlights Help Requested.

## Urgent Phrase Workflow
1. Senior says or types an urgent phrase.
2. Backend detects urgent intent using deterministic rules or Gemini.
3. Backend returns static emergency response.
4. Backend logs status as Help Requested.
5. Backend does not generate medical advice.

## Factory Reset Workflow
1. Admin or demo operator triggers reset in the backend environment.
2. Backend clears demo Firestore records for the MediMate project.
3. Backend reseeds David, Rose, caregiver, sample medicines, and event triggers.
