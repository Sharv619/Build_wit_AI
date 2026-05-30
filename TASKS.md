# MediMate Voice Tasks

## Phase 1: Project Setup
- [ ] Create React + Vite + TypeScript app.
- [ ] Add base responsive layout.
- [ ] Add high-contrast global styles.
- [ ] Define shared domain types.

## Phase 2: Local Data
- [ ] Implement localStorage service.
- [ ] Support demo users.
- [ ] Support active user persistence.
- [ ] Support medication persistence.
- [ ] Support medication logs.
- [ ] Support notification event persistence.
- [ ] Support settings persistence.
- [ ] Add factory reset.

## Phase 3: Demo Auth
- [ ] Build sign-in/sign-up screen.
- [ ] Store active demo user locally.
- [ ] Seed or support David as a demo senior.
- [ ] Seed or support Rose as household context.
- [ ] Allow switching between senior and caregiver views.

## Phase 4: Senior Home
- [ ] Show next medication.
- [ ] Show medication dose.
- [ ] Show whether medication is in the Webster Pack or outside it.
- [ ] Show scheduled time and instructions.
- [ ] Show safety disclaimer.
- [ ] Add I took it action.
- [ ] Add Remind me later action.
- [ ] Add I don't want to take it action.
- [ ] Capture refusal reason.
- [ ] Add I need help action.
- [ ] Add typed response input.
- [ ] Add voice playback using `speechSynthesis`.
- [ ] Add Speech Recognition where supported.
- [ ] Show leaving-home reminder prompt.

## Phase 5: AI and Intent Handling
- [ ] Read `VITE_GEMINI_API_KEY`.
- [ ] Implement Gemini response classification.
- [ ] Implement Gemini reminder copy generation.
- [ ] Implement Gemini missed-dose alert generation.
- [ ] Implement refusal reason classification or summary.
- [ ] Add deterministic fallback classification.
- [ ] Add urgent phrase detection.
- [ ] Prevent generated medical advice.

## Phase 6: Caregiver Dashboard
- [ ] Show today's medication schedule.
- [ ] Show status labels.
- [ ] Show latest logs.
- [ ] Show refusal reasons.
- [ ] Add missed-dose alert area.
- [ ] Add simulate missed medication demo control.
- [ ] Add simulate leaving-home demo control.

## Phase 7: Medication Setup
- [ ] Add medication form.
- [ ] Validate medication name.
- [ ] Validate medication dose.
- [ ] Validate scheduled time.
- [ ] Validate allowed time window.
- [ ] Save instructions.
- [ ] Capture medication source.
- [ ] Support Webster Pack vs outside-pack medicines.
- [ ] Show existing medication list.

## Phase 7A: Script Upload
- [ ] Add script upload placeholder.
- [ ] Support typed script text fallback.
- [ ] Extract or pre-fill medication fields for demo.
- [ ] Require caregiver confirmation before saving medicines.

## Phase 8: History
- [ ] Calculate seven-day totals.
- [ ] Show taken count.
- [ ] Show missed count.
- [ ] Show snoozed count.
- [ ] Show adherence percentage.

## Phase 9: Settings
- [ ] Edit senior name.
- [ ] Edit caregiver name.
- [ ] Edit caregiver contact.
- [ ] Select voice preference.
- [ ] Add reminder tone placeholder.
- [ ] Add confirmed factory reset.

## Phase 10: Verification
- [ ] Run TypeScript build.
- [ ] Verify app works without Gemini key.
- [ ] Verify mobile layout.
- [ ] Verify typed fallback.
- [ ] Verify voice playback.
- [ ] Verify refusal reason logging.
- [ ] Verify missed-dose time window behavior.
- [ ] Verify leaving-home reminder simulation.
- [ ] Verify caregiver dashboard updates.
- [ ] Verify factory reset clears local data.
