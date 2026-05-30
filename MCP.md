# MediMate Voice MCP

## Purpose
This document lists Model Context Protocol opportunities for the backend-first MediMate Voice project. MCP is not required for the first prototype, but it can support documentation lookup, Firebase validation, browser testing, script processing research, and demo operations.

## Current Prototype
The first pass should use Firebase directly:
- Firebase Auth for future identity.
- Firestore for backend data.
- Firebase Storage for future script uploads.
- Cloud Functions for Gemini, event logic, alerts, and safety-sensitive behavior.

The Stitch frontend will be added later and should consume the Firebase contract.

## Potential MCP Integrations

### Documentation MCP
Use a documentation MCP to retrieve current references for:
- Firebase Auth.
- Firestore data modeling and security rules.
- Firebase Storage rules.
- Cloud Functions callable and HTTP APIs.
- Gemini server-side usage.

### Test Automation MCP
Use a browser automation MCP after Stitch integration to:
- Open the Stitch frontend.
- Run the David/Rose demo workflow.
- Capture mobile viewport screenshots.
- Verify that event reminders, refusal flows, and caregiver alerts render correctly.

### Firebase/Data MCP
Use a Firebase-aware or local data MCP to inspect or seed:
- David/Rose demo users.
- Household links.
- Medication records.
- Routine event records.
- Medication logs.
- Notification events.
- Script upload metadata.

### Document Intake MCP
Use a document or file-processing MCP in a future version to support prescription or script upload workflows. The MCP could help extract candidate medication names, doses, frequencies, and instructions for caregiver review.

### Location/Context MCP
Use a location or context MCP only in future prototypes that explicitly need real leaving-home detection. The first backend-first prototype should keep leaving home simulated as an event trigger.

### Issue Tracking MCP
Use an issue tracker MCP to sync implementation tasks from `TASKS.md` into project tickets.

## MCP Boundaries
- MCP should not store real medical data.
- MCP should not send medication records to external services without explicit consent.
- MCP should not bypass backend safety rules.
- MCP should not generate medical advice.
- MCP should not save or process real prescriptions in the hackathon demo unless explicitly approved.
- MCP should not enable real location tracking without explicit informed consent.

## Future MCP Tasks
- [ ] Add Firebase documentation lookup flow.
- [ ] Add Firebase emulator test workflow.
- [ ] Add David/Rose seed-data utility.
- [ ] Add script upload extraction exploration.
- [ ] Add leaving-home event simulation checks.
- [ ] Add browser automation workflow after Stitch frontend is connected.
- [ ] Add issue tracker sync for implementation tasks.
