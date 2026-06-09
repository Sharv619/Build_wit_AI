# Pilly Safety Boundaries

Pilly / MediMate Voice is a medication support prototype for seniors and caregivers. It is designed for demo and portfolio use, with a focus on post-discharge medication support, temporary medicines, antibiotics, pain medication, and medicines outside a regular Webster Pack.

Pilly is not a medical product and is not ready for real patient data.

## What Pilly Does
- Supports event-based medication reminders such as breakfast, lunch, dinner, bedtime, leaving home, post-discharge check-in, and caregiver check-in.
- Lets seniors respond to reminders with statuses such as taken, snoozed, refused, missed, help requested, or unknown.
- Gives caregivers visibility into missed-dose, refusal, snooze, and help-request events.
- Captures refusal reasons so caregivers can follow up with human judgement.
- Uses bounded AI classification to route senior responses into safe workflow states.
- Provides static safety guidance when a response indicates urgency or help is needed.
- Stores demo medication workflow data in Firebase-backed collections.

## What Pilly Does Not Do
- Does not diagnose medical conditions.
- Does not recommend medication.
- Does not recommend dosage changes.
- Does not tell a senior to skip medication.
- Does not tell a senior to take extra medication.
- Does not check medication interactions.
- Does not replace doctors, pharmacists, nurses, caregivers, or emergency services.
- Does not act as automatic emergency triage.
- Does not support real patient data in this prototype.
- Does not provide production healthcare readiness.

## AI Usage Boundary
AI may only be used for bounded response classification and safe workflow routing.

Allowed AI behavior:
- Classify response intent into workflow labels such as taken, snoozed, refused, help requested, urgent phrase, or unknown.
- Extract a refusal reason when the user supplies one.
- Generate short reminder or alert copy that avoids medical advice.

Disallowed AI behavior:
- Diagnosis.
- Dosage advice.
- Medication recommendations.
- Medication interaction checks.
- Clinical decision support.
- Emergency triage.
- Personalized medical instructions.

If Gemini is unavailable, deterministic fallback classification must still keep the workflow usable and safe.

## Urgent Phrase Handling
Urgent phrases such as chest pain, cannot breathe, fell, dizzy, emergency, severe allergic reaction, or similar language must trigger static safety guidance.

The app must:
- Log the response as `help_requested`.
- Create caregiver-visible notification behavior where supported.
- Avoid generated medical advice.
- Avoid deciding severity.
- Tell the user to contact emergency services or a trusted person according to static copy.

The app must not:
- Diagnose the symptom.
- Decide whether the situation is or is not an emergency.
- Suggest medication changes.
- Delay emergency care.

## Refusal Handling
Refusals are caregiver visibility events, not clinical decisions.

Supported refusal reasons:
- `away_from_medicine`
- `side_effects`
- `feeling_unwell`
- `confused`
- `does_not_understand`
- `other`
- `unknown`

The app may record that a senior refused medication and why. It may surface that reason to a caregiver. It must not tell the senior whether refusal is medically safe.

## Trusted Family Voice Reminder Boundary
Trusted Family Voice Reminder is a demo concept for playing caregiver-recorded reminder audio.

Allowed behavior:
- A caregiver records or uploads their own audio.
- Consent confirmation is required before saving audio metadata.
- Audio metadata may be saved in `voiceReminders`.
- The senior can play the trusted reminder.
- Browser speech fallback may be used if no recording exists.

Disallowed behavior:
- Synthetic family voice cloning.
- Impersonation.
- Covert recording.
- Using a voice reminder to provide dosage or clinical advice.
- Treating voice reminders as a substitute for caregiver or clinician judgement.

## Real Patient Data Warning
This repository is demo only. Do not store real patient data, prescriptions, medication records, personal health information, or emergency information in this prototype.

Before any real pilot, the system would need privacy, security, clinical governance, consent, audit logging, data retention, incident response, and healthcare compliance review.

## Production Requirements Before Any Pilot
Before any pharmacy, provider, caregiver, or senior pilot, Pilly would require:
- Formal clinical safety review.
- Privacy and data protection review.
- Consent model for seniors, caregivers, and audio reminders.
- Strong Firebase Auth and household membership enforcement.
- Firestore and Storage rules validated in emulator tests.
- Audit logs for medication events, changes, access, and notifications.
- Clear escalation policy that does not rely on AI triage.
- Human support model for caregiver and pharmacist workflows.
- Real notification delivery reliability checks.
- Data retention and deletion controls.
- Security review of Cloud Functions, Storage, and API contracts.
- Accessibility review with senior users.
- Clear disclaimers and clinician-approved wording.
