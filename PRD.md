# Pilly PRD

## Product Summary
Pilly is a backend-first medication support prototype for seniors and caregivers. The backend helps caregivers add medicines, reminds seniors around familiar daily events, records whether medicine was taken, missed, snoozed, refused, or help was requested, and alerts caregivers when event-based medication support is needed.

The frontend will be built separately in Stitch and connected later through Firebase SDK and Cloud Functions.

## Problem
Seniors often struggle to manage medication plans that change after hospitalisation. Webster Packs help with stable daily medicines, but they do not cover short-term antibiotics, new temporary prescriptions, or medicines that must remain outside the pack. Complex medication apps can be hard for older adults with declining memory. Families need a simple backend-supported system that can power reminders, medication logs, refusal capture, and caregiver alerts.

## Primary Persona
Eleanor is 86 and lives with his wife , who is 82. Eleanor takes 11 medicines per day and already uses a Webster Pack. After a recent hospitalisation, he was prescribed antibiotics and a couple of other medicines that cannot be added to his regular Webster Pack. Eleanor has noticed his memory is declining and he is forgetting doses. His family lives about an hour away, so they need remote visibility without making Eleanor manage a complex app.

## Target Users
- Seniors who need accessible medication reminders with voice playback and large controls.
- Family caregivers who need quick visibility into adherence, refusals, and missed-dose alerts.
- Partners or spouses who may be nearby but may not be able to manage a complex medication schedule alone.
- Hackathon judges evaluating a realistic, demoable assistive health workflow.

## Goals
- Build the backend contract first so Stitch can add the frontend later.
- Store users, households, medications, events, logs, notifications, and script upload metadata in Firebase.
- Let caregivers or family add medicines manually or from script upload candidates.
- Support event-based medication reminders such as breakfast, lunch, dinner, bedtime, leaving home, post-discharge, and caregiver check-in.
- Capture refusal reasons such as being away from medicine, side effects, feeling unwell, or confusion.
- Notify caregivers when an event passes and a required medicine has not received a final response.
- Keep Gemini and safety-sensitive logic server-side.

## Non-Goals
- No production medical advice.
- No real patient record storage for the hackathon demo.
- No native iOS or Android implementation.
- No dosage adjustment, diagnosis, skip-dose, or extra-dose guidance.
- No real geofencing in v1; leaving home can be simulated as an event.

## Core User Stories
- As a caregiver, I can add Eleanor's temporary medicines after hospital discharge.
- As a caregiver, I can upload or paste a script as a demo intake path.
- As a caregiver, I can assign medicines to routine events instead of only clock times.
- As a senior, I can receive an event-based reminder that shows the medicine and dose.
- As a senior, I can say or type that I took the medication.
- As a senior, I can say I do not want to take it and explain why.
- As a senior, I can ask to be reminded later or request help.
- As a caregiver, I can see today's event-based medication status.
- As a caregiver, I can see why Eleanor refused a dose.
- As a caregiver, I can be notified when Eleanor misses a dose for a completed or skipped event.
- As a senior, I can receive a prompt to take required medicines with me when I leave home.

## Backend Capabilities
- Firebase Auth-ready user and household model.
- Firestore medication, event, log, notification, and script upload records.
- Cloud Functions for medication response classification, reminder copy, missed-dose alerts, event completion, leaving-home simulation, and script processing.
- Firebase Storage path for future prescription/script files.
- Firebase SDK and callable function contract for Stitch.

## Status Values
- `pending`
- `taken`
- `snoozed`
- `missed`
- `refused`
- `help_requested`

## Event Triggers
- Breakfast.
- Lunch.
- Dinner.
- Bedtime.
- Leaving home.
- Post-discharge.
- Caregiver check-in.

## Refusal Reasons
- Away from medicine.
- Worried about side effects.
- Feeling unwell.
- Confused about the medicine.
- Other typed or spoken reason.

## Safety Requirements
The app must always show:

> Pilly does not provide medical advice. Always follow your doctor's or pharmacist's instructions.

Urgent phrases such as chest pain, cannot breathe, fell, dizzy, or emergency must trigger a static emergency response and be logged as `help_requested`.

## Success Criteria
- Backend docs clearly define Firebase collections and Cloud Functions.
- Stitch can build against the documented backend contract later.
- Medication reminders are event-based, not time-window based.
- Refusal reasons are captured and visible to caregivers.
- Event completion can trigger caregiver missed-dose alerts.
- Leaving-home simulation prompts Eleanor to take required medicines with him.
- Gemini fallback works without an API key.
