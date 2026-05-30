# MediMate Voice PRD

## Product Summary
MediMate Voice is a mobile-first medication reminder prototype for seniors and caregivers. The demo focuses on a simple loop: remind the senior, accept a voice or typed response, log the medication status, and show caregiver visibility when a dose is taken, snoozed, missed, or help is requested.

## Problem
Seniors may miss medication doses because reminders are too small, too complex, or disconnected from caregiver awareness. Caregivers need a fast way to see whether medication was taken without requiring the senior to navigate a complex app.

## Target Users
- Seniors who need accessible medication reminders with voice playback and large controls.
- Family caregivers who need quick visibility into medication adherence and missed-dose alerts.
- Hackathon judges evaluating a realistic, demoable assistive health workflow.

## Goals
- Provide a clear senior-facing reminder experience.
- Support voice playback through browser speech synthesis.
- Support voice input where available, with typed fallback.
- Classify senior responses into actionable statuses.
- Show caregiver schedule visibility and missed-dose alerts.
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
- As a senior, I can request help.
- As a caregiver, I can see today's medication schedule and current statuses.
- As a caregiver, I can simulate a missed medication for the demo.
- As a caregiver, I can view weekly adherence history.
- As a demo user, I can reset local data.

## Primary Screens
- Demo auth: sign-up/sign-in fields using local demo user storage.
- Senior home: next medication, instructions, voice controls, response controls, safety disclaimer.
- Caregiver dashboard: today's schedule, statuses, missed-dose alert copy, simulate missed medication control.
- Medication setup: add or edit medication name, scheduled time, and instructions.
- History: weekly taken, missed, snoozed, and adherence percentage.
- Settings: senior name, caregiver name/contact, voice preference, reminder tone placeholder, and factory reset.

## Status Values
- `pending`
- `taken`
- `snoozed`
- `missed`
- `help_requested`

## Safety Requirements
The app must always show:

> MediMate Voice does not provide medical advice. Always follow your doctor's or pharmacist's instructions.

Urgent phrases such as chest pain, cannot breathe, fell, dizzy, or emergency must trigger a static emergency response and be logged as `help_requested`.

## Success Criteria
- A user can complete the demo loop from sign-in to medication logging.
- Caregiver status updates reflect senior actions.
- Missed-dose simulation produces caregiver-facing alert copy.
- The app remains usable without `VITE_GEMINI_API_KEY`.
- Mobile layout is readable, high contrast, and uses large tap targets.

