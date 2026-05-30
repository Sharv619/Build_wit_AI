# MediMate Voice PRD

## Product Summary
MediMate Voice is a mobile-first medication reminder prototype for seniors and caregivers. The demo focuses on a realistic medication loop: add medicines from a caregiver, family member, or uploaded script; remind the senior in a familiar voice; show the medicine required; record whether the dose was taken, missed, or refused; and notify caregivers when a dose is missed outside the allowed time window.

## Problem
Seniors often struggle to manage medication plans that change after hospitalisation. Simple tools like Webster Packs are helpful for stable daily medicines, but they do not cover short-term antibiotics, new temporary prescriptions, or medicines that must remain outside the pack. More advanced apps can be too complex for older adults with declining memory. Caregivers need a simple way to add medicines, see adherence, understand refusals, and be notified when action may be needed.

## Primary Persona
David is 86 and lives with his wife Rose, who is 82. David takes 11 medicines per day and already uses a Webster Pack. After a recent hospitalisation, he was prescribed antibiotics and a couple of other medicines that cannot be added to his regular Webster Pack. David has noticed his memory is declining and he is forgetting doses. His family lives about an hour away, so they need remote visibility without making David manage a complex app.

## Target Users
- Seniors who need accessible medication reminders with voice playback and large controls.
- Family caregivers who need quick visibility into medication adherence and missed-dose alerts.
- Partners or spouses who may be nearby but may not be able to manage a complex medication schedule alone.
- Hackathon judges evaluating a realistic, demoable assistive health workflow.

## Goals
- Provide a clear senior-facing reminder experience.
- Support voice playback through browser speech synthesis.
- Support voice input where available, with typed fallback.
- Classify senior responses into actionable statuses.
- Show caregiver schedule visibility and missed-dose alerts.
- Let caregivers or family add medicines manually.
- Support script upload as a future-friendly intake path for new medicines.
- Capture refusal reasons such as being away from the medicine or side effects.
- Remind the senior to take medicine with them when they leave home.
- Persist demo data locally using `localStorage`.
- Work without external services when no Gemini key is configured.

## Non-Goals
- No production medical advice.
- No real patient record storage.
- No Firebase authentication in the first pass.
- No native iOS or Android implementation.
- No dosage adjustment, diagnosis, skip-dose, or extra-dose guidance.

## Core User Stories
- As a senior, I can sign in to the demo and see my next medication reminder.
- As a senior, I can hear the reminder read aloud.
- As a senior, I can say or type that I took the medication.
- As a senior, I can ask to be reminded later.
- As a senior, I can say I do not want to take it and explain why.
- As a senior, I can request help.
- As a caregiver, I can add David's temporary medicines after hospital discharge.
- As a caregiver, I can upload a script as a demo input path.
- As a caregiver, I can see today's medication schedule and current statuses.
- As a caregiver, I can see why David refused a dose.
- As a caregiver, I can be notified when David misses a dose outside the allowed time window.
- As a caregiver, I can simulate a missed medication for the demo.
- As a senior, I can receive a prompt to take required medicines with me when I leave home.
- As a caregiver, I can view weekly adherence history.
- As a demo user, I can reset local data.

## Primary Screens
- Demo auth: sign-up/sign-in fields using local demo user storage.
- Senior home: next medication, dose display, instructions, voice controls, response controls, safety disclaimer.
- Caregiver dashboard: today's schedule, statuses, missed-dose alert copy, simulate missed medication control.
- Medication setup: add or edit medication name, dose, scheduled time, instructions, source, time window, and caregiver/script intake method.
- History: weekly taken, missed, snoozed, and adherence percentage.
- Settings: senior name, caregiver name/contact, voice preference, reminder tone placeholder, and factory reset.

## Status Values
- `pending`
- `taken`
- `snoozed`
- `missed`
- `refused`
- `help_requested`

## Refusal Reasons
- Away from medicine.
- Worried about side effects.
- Feeling unwell.
- Confused about the medicine.
- Other typed or spoken reason.

## Notification Requirements
- Dose reminders should identify the medicine and dose required.
- Reminder audio should support a familiar voice concept for the demo, such as a caregiver-style recorded voice placeholder or selected voice preference.
- Missed-dose caregiver notifications should trigger only after the configured dose time window has passed.
- Leaving-home reminders should prompt David to take required medicine with him when the app detects or simulates that he is leaving home.

## Safety Requirements
The app must always show:

> MediMate Voice does not provide medical advice. Always follow your doctor's or pharmacist's instructions.

Urgent phrases such as chest pain, cannot breathe, fell, dizzy, or emergency must trigger a static emergency response and be logged as `help_requested`.

## Success Criteria
- A user can complete the demo loop from sign-in to medication logging.
- Caregiver status updates reflect senior actions.
- Refusal reasons are captured and visible to caregivers.
- Missed-dose simulation produces caregiver-facing alert copy.
- Leaving-home simulation prompts David to take required medicines with him.
- The app remains usable without `VITE_GEMINI_API_KEY`.
- Mobile layout is readable, high contrast, and uses large tap targets.
