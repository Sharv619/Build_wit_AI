# Pilly Business Direction

## 1. Product Thesis
Pilly / MediMate Voice is a responsible-AI medication support prototype for seniors and caregivers. It uses Firebase-backed workflows and bounded AI response classification to help seniors respond to event-based medication reminders while caregivers retain visibility and human judgement.

The product thesis is that medication support can be safer and easier when reminders are tied to familiar events, AI is constrained to classification, and caregivers or healthcare professionals remain responsible for decisions.

## 2. Target User
Primary users are seniors managing post-discharge medication complexity and family caregivers who need visibility without forcing seniors to operate a complex medical app.

Secondary users may include pharmacists, discharge coordinators, aged-care support workers, and family members who help manage temporary medicines.

## 3. First Niche
Pharmacy-assisted post-discharge medication support for seniors and caregivers.

## 4. Post-Discharge Medication Complexity
After discharge, seniors may receive temporary medicines, antibiotics, pain medication, changed doses, or instructions that do not fit their regular routine. Families often need to help without living nearby, and seniors may forget doses, refuse medication, become confused, or need help.

Pilly focuses on supporting this transition period as a demo workflow, not replacing professional care.

## 5. Webster Pack Gap
Webster Packs are useful for stable daily medicines, but they may not cover new temporary prescriptions, medicines that must remain outside the pack, or fast-changing post-discharge instructions.

Pilly positions itself around that gap: medicines outside regular packs that need caregiver visibility and event-based support.

## 6. Caregiver Visibility
The caregiver value is visibility into:
- Missed doses.
- Refusals.
- Snoozes.
- Help requests.
- Leaving-home reminders.
- Refusal reasons.

This visibility is intended to support follow-up by humans. It is not clinical judgement.

## 7. Why Event-Based Reminders
Clock-based reminders can be brittle for seniors whose routines vary. Event-based reminders use familiar anchors such as breakfast, lunch, dinner, bedtime, leaving home, post-discharge check-in, and caregiver check-in.

This makes the workflow easier to demo and easier to reason about for temporary medication support.

## 8. Why Trusted Family Voice
Trusted Family Voice Reminder is intended to make reminders feel familiar and less clinical. A recorded family reminder can help seniors understand that a prompt comes from someone they trust.

The boundary is strict: only recorded or uploaded caregiver audio with consent is allowed. Synthetic family voice cloning is not part of Pilly.

## 9. Possible Pilot Paths
Possible future pilot paths, after production hardening, could include:
- Pharmacy-assisted post-discharge support for temporary medicines.
- Family caregiver support after hospital discharge.
- Aged-care transition support for medicines outside Webster Packs.
- Discharge coordinator demo workflows with pharmacist oversight.

No pilot should proceed without privacy, security, consent, clinical safety, and operational review.

## 10. What v2 Must Prove
Pilly v2 must prove:
- AI can be useful when limited to bounded response classification.
- Medication support workflows can remain safety-bounded.
- Caregiver visibility can be created from senior responses.
- Refusal and help-request workflows can avoid medical advice.
- Missed-dose logic can be tied to routine events.
- The demo can be explained clearly as responsible AI, not medical automation.

## 11. What Production Would Require
Production would require:
- Clinical governance and safety case.
- Privacy and healthcare compliance review.
- Real authentication and household authorization.
- Emulator-tested Firestore and Storage rules.
- Notification delivery guarantees and audit trails.
- Consent flows for audio reminders and caregiver access.
- Data retention, deletion, export, and breach response processes.
- Monitoring for Cloud Functions and notification failures.
- Human escalation pathways independent of AI.
- Accessibility testing with seniors and caregivers.
- Clear separation between support workflows and medical decision-making.
