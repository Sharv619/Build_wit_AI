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
- [ ] Support settings persistence.
- [ ] Add factory reset.

## Phase 3: Demo Auth
- [ ] Build sign-in/sign-up screen.
- [ ] Store active demo user locally.
- [ ] Seed or support Ravi as a demo senior.
- [ ] Allow switching between senior and caregiver views.

## Phase 4: Senior Home
- [ ] Show next medication.
- [ ] Show scheduled time and instructions.
- [ ] Show safety disclaimer.
- [ ] Add I took it action.
- [ ] Add Remind me later action.
- [ ] Add I need help action.
- [ ] Add typed response input.
- [ ] Add voice playback using `speechSynthesis`.
- [ ] Add Speech Recognition where supported.

## Phase 5: AI and Intent Handling
- [ ] Read `VITE_GEMINI_API_KEY`.
- [ ] Implement Gemini response classification.
- [ ] Implement Gemini reminder copy generation.
- [ ] Implement Gemini missed-dose alert generation.
- [ ] Add deterministic fallback classification.
- [ ] Add urgent phrase detection.
- [ ] Prevent generated medical advice.

## Phase 6: Caregiver Dashboard
- [ ] Show today's medication schedule.
- [ ] Show status labels.
- [ ] Show latest logs.
- [ ] Add missed-dose alert area.
- [ ] Add simulate missed medication demo control.

## Phase 7: Medication Setup
- [ ] Add medication form.
- [ ] Validate medication name.
- [ ] Validate scheduled time.
- [ ] Save instructions.
- [ ] Show existing medication list.

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
- [ ] Verify caregiver dashboard updates.
- [ ] Verify factory reset clears local data.

