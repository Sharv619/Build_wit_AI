# Pilly Tasks

## Hackathon MVP Status
- [x] Built Firebase-hosted senior/caregiver medication support demo.
- [x] Added event-based medication reminders for breakfast, lunch, dinner, bedtime, leaving home, post-discharge, and caregiver check-in.
- [x] Added Firestore collections for users, households, medications, routine events, medication logs, notifications, and script uploads.
- [x] Added Eleanor demo household with sample Webster Pack and post-hospital antibiotic medication records.
- [x] Added voice-friendly browser interactions for reminder playback and response capture.
- [x] Added caregiver dashboard visibility for logs, statuses, refusal reasons, and notifications.
- [x] Added demo Trusted Family Voice Reminders using recorded/uploaded audio.
- [x] Added Cloud Functions for response classification, medication logging, event completion, missed-dose alerts, leaving-home reminders, reminder copy, alert copy, script upload parsing, and demo seeding.
- [x] Added deterministic fallback behavior when `GEMINI_API_KEY` is not configured.
- [x] Added static urgent-phrase safety handling without medical advice.
- [x] Moved core demo workflows to Cloud Functions: medication response logging, routine event completion, missed-dose alert generation, and leaving-home reminder creation.

## Demo Tasks
- [x] Keep hosted demo available at https://medimate-voice-demo.web.app.
- [x] Keep anonymous Firebase Auth demo flow usable.
- [x] Keep demo seeding path for Eleanor and sample medication records.
- [x] Keep demo medication creation available for the hackathon UI.
- [x] Label demo-only bootstrap and medication creation paths in code comments.
- [x] Preserve live Firestore dashboard updates.
- [x] Store recorded family voice reminder audio in Firebase Storage.
- [x] Store family voice reminder metadata in Firestore `voiceReminders`.
- [x] Require a visible consent checkbox before uploading a family voice reminder.
- [x] Prefer a matching family voice reminder when the senior selects `Play Reminder`.
- [x] Fall back to browser speech synthesis when no family recording exists.
- [x] Allow demo caregiver replacement and deletion of the selected medication/event voice reminder.
- [~] Keep demo reads available for the Eleanor household.
  - This is intentional for the portfolio demo and must be removed before real data.

## Portfolio Tasks
- [x] Add portfolio-ready `README.md`.
- [x] Document live demo link, problem, solution, workflow, features, tech stack, architecture, screenshots, demo steps, contribution, safety boundary, limitations, and roadmap.
- [x] Document Trusted Family Voice Reminders as recorded-audio MVP, not voice cloning.
- [x] Add "Built in 12 hours" section with professional hackathon framing.
- [x] Add root `.env.example`.
- [x] Add lightweight tests for refusal fallback, urgent phrase fallback, and no-key Gemini fallback.
- [x] Update task tracking to separate Demo, Portfolio, and Production work.
- [ ] Add final curated screenshots to the README as embedded images after choosing the best viewport captures.
- [ ] Add a short demo video or GIF for recruiters and reviewers.
- [ ] Add CI badge after GitHub Actions is configured.

## Production Hardening Tasks
- [ ] Remove unauthenticated demo household access from Firestore rules.
- [ ] Move medication creation behind a caregiver-authorized Cloud Function.
- [ ] Enforce authenticated household membership inside every callable function before honoring a target senior `userId`.
- [ ] Add explicit senior, caregiver, family, spouse, pharmacy, and provider authorization checks.
- [ ] Replace demo Storage rules with household membership validation for `scriptUploads/{householdId}`.
- [ ] Add Firebase emulator tests for Firestore rules.
- [ ] Add Firebase emulator tests for `voiceReminders` Firestore rules.
- [ ] Add Firebase Storage rules tests for recorded voice reminder uploads.
- [ ] Add callable integration tests for `recordMedicationResponse`.
- [ ] Add callable integration tests for `completeRoutineEvent` and missed-dose notification creation.
- [ ] Add callable integration tests for `simulateLeavingHome`.
- [ ] Add tests proving urgent phrases are logged as `help_requested` and return only static guidance.
- [ ] Add CI for install, build, lint, tests, and rules validation.
- [ ] Run dependency audit and decide whether to accept, patch, or upgrade moderate vulnerabilities.
- [ ] Complete accessibility review for keyboard navigation, screen reader labels, contrast, and mobile layout.
- [ ] Add production delete/replace flow for family voice reminder audio and metadata with audit trails.
- [ ] Add consent audit trail for speaker permission, caregiver identity, timestamp, and revocation.
- [ ] Add senior opt-out controls for familiar voice reminders.
- [ ] Review family voice reminder scripts for manipulation, guilt language, and medical advice boundaries.
- [ ] Evaluate consent-based custom voice or Google Chirp roadmap only after safety and opt-out design is complete.
- [ ] Add privacy review, audit logging, and retention policy before handling real patient or prescription data.

## Safety Boundary
- [x] Do not provide diagnosis.
- [x] Do not provide dosage recommendations.
- [x] Do not suggest skip-dose or extra-dose actions.
- [x] Support only an existing medication schedule.
- [x] Treat AI classification as assistive workflow support, not medical authority.
- [x] Show medical disclaimer in the app.
- [x] Support familiarity, not manipulation, for family voice reminders.
- [x] Require consent confirmation before recorded family voice upload.
- [x] Keep synthetic voice cloning out of the MVP.

## Current Verification
- [x] `npm test` passes in `functions`.
- [x] `npm run lint` passes in `functions`.
- [ ] Firebase emulator tests are still pending.
- [ ] Browser smoke test of the deployed live demo should be repeated after every deploy.
