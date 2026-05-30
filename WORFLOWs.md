# MediMate Voice Workflows

## Demo Workflow
1. Open the app.
2. Sign in as Ravi using the demo auth form.
3. Add a medication named "Blood pressure tablet" at 2:00 PM.
4. Return to Senior Home.
5. Play the voice reminder.
6. Type or say "I took it."
7. Confirm the medication log status becomes Taken.
8. Open Caregiver Dashboard.
9. Confirm the caregiver sees the updated Taken status.
10. Simulate missed medication.
11. Confirm missed-dose alert copy appears.

## Senior Medication Workflow
1. Senior signs in.
2. Senior sees the next scheduled medication.
3. Senior hears reminder through speaker playback.
4. Senior responds by button, voice, or typed input.
5. App classifies response.
6. App logs medication status.
7. Caregiver dashboard reflects the latest status.

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

