# Security Hardening Summary

## Current Status

Pilly is a security-hardened senior-care prototype. It is not production-ready, not medical-grade, and must not be used with real patient, medication, caregiver, household, voice, or biometric data.

The original hackathon demo favored public portfolio access and fast Firebase integration. The current version removes the highest-risk public access paths and adds regression tests for household, role, medication-status, and voice-storage safety boundaries.

## Original Risk Class

- Public/demo Firestore reads and writes for medication and household data.
- Public Storage reads and writes for voice reminder and voice clone sample paths.
- Callable functions trusted client-supplied identity and status fields.
- Demo UI could anonymously bootstrap caregiver/household records.
- Medication responses could be recorded as taken without explicit confirmation.
- Urgent/help language could be overridden by client payload status.
- Legacy generated demo code contained unsafe direct Firestore write fallbacks.

## Fixed

- Callable functions require authentication before accessing household, medication, reminder, voice, or patient-related data.
- Client-supplied identity, roles, and medication status are not trusted as authority.
- Household membership is verified server-side from Firestore.
- Caregiver/family role checks are enforced server-side for caregiver-only actions.
- Public demo Firestore access was removed.
- Public voice and biometric-like Storage access was removed.
- Voice clone sample access is disabled.
- Voice cloning callables are disabled until production-grade consent, retention, deletion, and audit controls exist.
- Medication `taken` state requires explicit confirmation and resolves to `taken_confirmed` only after confirmation.
- Unconfirmed taken/refusal-style responses resolve to `pending_confirmation`.
- Urgent/help phrases resolve to `help_requested` and cannot be overridden by client payload status.
- The obvious stored-XSS rendering path in the active mobile demo was patched.
- The unsafe legacy frontend script was retired and reduced to a safe warning stub.

## Tested

- Firestore rules authorization tests for unauthenticated access, household isolation, role enforcement, role escalation, immutable ownership fields, server-owned collections, and invalid statuses.
- Storage rules authorization tests for public denial, household isolation, caregiver/family write restrictions, script uploads, voice reminders, and fully denied voice clone samples.
- Callable authorization helper tests for unauthenticated requests, admin-only demo seeding, wrong-household rejection, and caregiver/family role checks.
- Medication and urgent behavior tests for confirmation-gated taken states and urgent/help prioritisation.

## Latest Validation

- `cd functions && npm run lint` - passed.
- `cd functions && npm test` - passed.
- `cd functions && npm run test:rules` - passed, 13/13 emulator security tests.
- `cd functions && npm audit --omit=dev` - still reports 8 moderate production dependency advisories through Firebase/Google dependency chain.
- `cd mcp && npm run lint` - passed.
- `cd mcp && npm audit --omit=dev` - 0 vulnerabilities.

## Remaining Risks

- No real onboarding or household membership provisioning flow exists yet.
- No App Check enforcement yet.
- No callable rate limiting or quota controls yet.
- Callable integration coverage is helper-level plus emulator-backed rules coverage; full callable emulator invocation tests are still future work.
- Functions production dependency audit still reports moderate advisories through Firebase/Google dependencies.
- Voice cloning is disabled, not production-hardened.
- Recorded/family voice reminder consent, deletion, retention, and audit workflows are not production-grade.
- Browser/mobile accessibility and runtime safety testing are incomplete.
- Real patient data must not be used.

## Out Of Scope For Current Prototype

- HIPAA, GDPR, or clinical compliance review.
- Production identity proofing and caregiver invitation workflows.
- Clinical safety validation.
- Biometric voice identity infrastructure.
- Emergency-response escalation integrations.
- Real prescription or patient-data handling.

## Why Real Patient Data Still Must Not Be Used

The prototype now demonstrates stronger Firebase access-control patterns, but it still lacks production identity lifecycle, App Check, rate limiting, audit logging, retention/deletion workflows, clinical review, consent operations, and full end-to-end callable integration tests. These are safety-critical gaps for senior-care or medication-adherence software.
