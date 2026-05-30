# MediMate Voice PDD

## Product Design Direction
MediMate Voice should feel calm, practical, and easy to operate on a phone. The senior experience should prioritize clarity and confidence over density. The caregiver experience can show more information, but should remain scan-friendly and focused on medication status.

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
- History
- Settings

## Senior Home UX
The senior home is the main demo screen. It should show:
- Next medication name.
- Scheduled time.
- Simple instructions.
- Safety disclaimer.
- Speaker playback control.
- Voice input control when supported.
- Typed fallback input.
- Large action buttons:
  - I took it
  - Remind me later
  - I need help

## Caregiver Dashboard UX
The caregiver dashboard should show:
- Today's medication list.
- Current status labels:
  - Pending
  - Taken
  - Snoozed
  - Missed
  - Help Requested
- Missed-dose alert copy when relevant.
- A demo control to simulate a missed medication.

## Medication Setup UX
Medication setup should allow a demo user to add:
- Medication name.
- Scheduled time.
- Instructions.
- Optional relationship to the active senior user.

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

