# MediMate Voice PDD

## Product Design Direction
MediMate Voice should feel calm, practical, and easy to operate on a phone. The senior experience should prioritize clarity and confidence over density. The caregiver experience can show more information, but should remain scan-friendly and focused on medication setup, medication status, missed-dose risk, and refusal context.

## Design Principles
- Mobile first.
- High contrast.
- Large tap targets.
- Short labels.
- Clear status language.
- Minimal navigation depth.
- No medical advice beyond fixed safety messaging.

## Information Architecture
- Auth
- Senior Home
- Caregiver Dashboard
- Medication Setup
- Script Upload
- History
- Settings

## Senior Home UX
The senior home is the main demo screen. It should show:
- Next medication name.
- Dose required.
- Scheduled time.
- Simple instructions.
- Whether the medicine is part of the Webster Pack or an extra medicine outside the pack.
- Safety disclaimer.
- Speaker playback control.
- Voice input control when supported.
- Typed fallback input.
- Large action buttons:
  - I took it
  - Remind me later
  - I don't want to take it
  - I need help

If the senior selects I don't want to take it, the app should ask for a simple reason:
- I am away from it
- I am worried about side effects
- I feel unwell
- I am confused
- Other

## Caregiver Dashboard UX
The caregiver dashboard should show:
- Today's medication list.
- Medicine source: Webster Pack or extra medicine.
- Current status labels:
  - Pending
  - Taken
  - Snoozed
  - Missed
  - Refused
  - Help Requested
- Refusal reason when available.
- Missed-dose alert copy when relevant.
- A demo control to simulate a missed medication.
- A demo control to simulate leaving home.

## Medication Setup UX
Medication setup should allow a demo user to add:
- Medication name.
- Dose.
- Scheduled time.
- Allowed time window.
- Instructions.
- Source:
  - Webster Pack
  - Temporary post-hospital medicine
  - Antibiotic
  - Other
- Optional relationship to the active senior user.

## Script Upload UX
Script upload should be designed as a caregiver/family flow. For the prototype, upload can be a placeholder that extracts or pre-fills medication fields from typed script text or a selected file. The UI should make clear that the caregiver confirms entries before they become reminders.

## Leaving-Home Reminder UX
Leaving-home reminders should be presented as a gentle prompt:
- Show which medicines should be taken along.
- Provide a large confirmation button.
- Let the caregiver dashboard display that the reminder was sent.
- In the prototype, this can be simulated rather than using real geofencing.

## History UX
History should summarize the last seven days:
- Taken count.
- Missed count.
- Snoozed count.
- Adherence percentage.

## Settings UX
Settings should include:
- Senior name.
- Caregiver name.
- Caregiver contact.
- Voice preference.
- Familiar voice placeholder for family-recorded reminders.
- Reminder tone placeholder.
- Factory reset with confirmation.

## Visual Style
- Use a restrained healthcare-oriented palette with strong contrast.
- Avoid decorative clutter.
- Prefer simple panels, clear section headings, and consistent spacing.
- Buttons should be easy to hit on mobile.
- Statuses should use both text and color; color must not be the only signal.

## Accessibility Requirements
- Buttons must have accessible labels.
- Form inputs must have labels.
- Text must remain readable on mobile.
- Interactive elements should be at least 44px high.
- Voice input must not be required; typed fallback is mandatory.
