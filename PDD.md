# MediMate Voice PDD

## Product Design Direction
MediMate Voice should feel calm, practical, and easy to operate when the Stitch frontend is added. The backend should provide clean state and copy so the frontend can focus on simple senior and caregiver experiences instead of duplicating medication logic.

## Design Principles
- Backend-first; Stitch frontend later.
- Event-based reminders instead of time-window-first scheduling.
- High contrast, large tap targets, and short labels in frontend implementations.
- Clear status language for caregivers.
- No medical advice beyond fixed safety messaging.
- Safety-sensitive logic runs through backend functions.

## Information Architecture For Stitch
- Auth entry using Firebase Auth.
- Senior home reading current event reminders.
- Caregiver dashboard reading household status, logs, and notifications.
- Medication setup writing caregiver-confirmed medicines and event triggers.
- Script upload or pasted script intake.
- History based on medication logs.
- Settings for senior, caregiver, voice preference, and reminder placeholders.

## Senior Home UX Contract
The backend should provide enough data for Stitch to show:
- Current routine event context, such as breakfast, lunch, bedtime, or leaving home.
- Medication name and dose.
- Whether the medicine is part of the Webster Pack or outside it.
- Simple instructions.
- Safety disclaimer.
- Reminder copy from backend.
- Large response actions: I took it, Remind me later, I don't want to take it, I need help.

If the senior refuses, Stitch should call the backend with one of:
- I am away from it.
- I am worried about side effects.
- I feel unwell.
- I am confused.
- Other.

## Caregiver Dashboard UX Contract
The backend should provide:
- Household medication list by routine event.
- Status labels: Pending, Taken, Snoozed, Missed, Refused, Help Requested.
- Medication source: Webster Pack or extra medicine.
- Latest response text and refusal reason when available.
- Missed-dose alert notifications.
- Demo controls for completing routine events and simulating leaving home.

## Medication Setup UX Contract
Stitch should let caregivers confirm:
- Medication name.
- Dose.
- Instructions.
- Source: Webster Pack, temporary post-hospital medicine, antibiotic, or other.
- Event triggers: breakfast, lunch, dinner, bedtime, leaving home, post-discharge, or caregiver check-in.

## Script Upload UX Contract
Script upload should be a caregiver/family flow. The backend may return extracted candidate medicines, but Stitch must ask the caregiver to confirm entries before creating medication records.

## Leaving-Home Reminder UX Contract
Leaving home is an event trigger. For v1, Stitch can call `simulateLeavingHome` and show:
- Medicines to take along.
- A large confirmation action.
- Caregiver-visible reminder notification.

## Accessibility Requirements
- Buttons must have accessible labels.
- Form inputs must have labels.
- Text must remain readable on mobile.
- Interactive elements should be at least 44px high.
- Voice input must not be required; typed fallback is mandatory.
