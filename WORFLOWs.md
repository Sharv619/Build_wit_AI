# MediMate Voice Workflows

## Demo Workflow
1. Open the app.
2. Sign in as David using the demo auth form.
3. Add an antibiotic outside the Webster Pack at 2:00 PM with a dose and allowed time window.
4. Return to Senior Home.
5. Play the voice reminder.
6. Type or say "I took it."
7. Confirm the medication log status becomes Taken.
8. Open Caregiver Dashboard.
9. Confirm the caregiver sees the updated Taken status.
10. Simulate missed medication.
11. Confirm missed-dose alert copy appears.
12. Simulate leaving home.
13. Confirm David sees a prompt to take required medicines with him.

## Medication Intake Workflow
1. Caregiver opens Medication Setup.
2. Caregiver chooses manual entry or script upload.
3. Caregiver enters or confirms medicine name, dose, scheduled time, allowed window, and source.
4. App marks whether the medicine is in the Webster Pack or outside it.
5. App saves the medicine to David's schedule.

## Senior Medication Workflow
1. Senior signs in.
2. Senior sees the next scheduled medication.
3. Senior sees the medicine name, dose, and whether it is outside the Webster Pack.
4. Senior hears reminder through speaker playback in the selected or familiar voice.
5. Senior responds by button, voice, or typed input.
6. App classifies response.
7. App logs medication status.
8. Caregiver dashboard reflects the latest status.

## Refusal Workflow
1. Senior chooses I don't want to take it or says a refusal phrase.
2. App asks why in simple language.
3. Senior chooses away from medicine, side effects, feeling unwell, confused, or other.
4. App logs status as Refused with the reason.
5. Caregiver dashboard shows the refusal reason.
6. App avoids medical advice and suggests contacting the caregiver or pharmacist if needed.

## Missed Window Workflow
1. Medication remains Pending after scheduled time.
2. App checks the configured allowed time window.
3. If the window passes, app logs or marks the dose as Missed.
4. App creates caregiver missed-dose alert copy.
5. Caregiver dashboard highlights the missed dose.

## Leaving-Home Workflow
1. App detects or simulates that David is leaving home.
2. App checks medicines due soon or not yet taken.
3. App shows a prompt to take required medicines along.
4. App records that the leaving-home reminder was sent.
5. Caregiver dashboard can show the reminder event.

## Snooze Workflow
1. Senior chooses Remind me later or says a snooze phrase.
2. App logs status as Snoozed.
3. Senior Home keeps the medication visible as still needing attention.
4. Caregiver dashboard shows Snoozed.

## Help Workflow
1. Senior taps I need help or says a help phrase.
2. App logs status as Help Requested.
3. App displays static help guidance.
4. Caregiver dashboard highlights Help Requested.

## Urgent Phrase Workflow
1. Senior says or types an urgent phrase.
2. App detects urgent intent using deterministic rules or Gemini.
3. App displays static emergency response.
4. App logs status as Help Requested.
5. App does not generate medical advice.

## Caregiver Missed-Dose Workflow
1. Caregiver opens dashboard.
2. Caregiver reviews today's medication schedule.
3. Caregiver triggers Simulate missed medication.
4. App logs status as Missed.
5. App shows missed-dose alert copy.

## Factory Reset Workflow
1. User opens Settings.
2. User selects Factory Reset.
3. App asks for confirmation.
4. App clears all MediMate localStorage keys.
5. App returns to demo auth state.
