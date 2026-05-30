# MediMate Voice MCP

## Purpose
This document lists Model Context Protocol opportunities for the MediMate Voice project. MCP is not required for the first prototype, but these integrations can support future development, testing, and demo operations.

## Current Prototype
The first pass does not require an MCP server. The app should run locally with browser storage and optional Gemini API access through `VITE_GEMINI_API_KEY`.

## Potential MCP Integrations

### Documentation MCP
Use a documentation MCP to retrieve current API references for:
- Gemini API usage.
- Vite configuration.
- React and TypeScript patterns.
- Browser speech APIs.

### Test Automation MCP
Use a browser automation MCP to:
- Open the local app.
- Run the demo workflow.
- Capture mobile viewport screenshots.
- Verify that controls are visible and not overlapping.

### Local Data MCP
Use a local data MCP to inspect or seed:
- Demo users.
- Medication schedules.
- Medication logs.
- Notification events.
- David/Rose persona seed data.
- Settings.

For the first prototype, this should remain optional because browser `localStorage` is sufficient.

### Issue Tracking MCP
Use an issue tracker MCP to sync implementation tasks from `TASKS.md` into project tickets.

### Document Intake MCP
Use a document or file-processing MCP in a future version to support prescription or script upload workflows. The MCP could help extract candidate medication names, doses, frequencies, and instructions for caregiver review.

### Location/Context MCP
Use a location or context MCP only in future prototypes that explicitly need real leaving-home detection. The first prototype should keep this simulated to avoid privacy and platform complexity.

## MCP Boundaries
- MCP should not store real medical data.
- MCP should not send medication records to external services without explicit consent.
- MCP should not bypass the app's safety rules.
- MCP should not generate medical advice.
- MCP should not save or process real prescriptions in the hackathon demo unless explicitly approved.
- MCP should not enable real location tracking without explicit informed consent.

## Future MCP Tasks
- [ ] Add browser automation workflow for the hackathon demo.
- [ ] Add screenshot checks for mobile layout.
- [ ] Add local seed-data utility.
- [ ] Add David/Rose demo seed data.
- [ ] Add script upload extraction exploration.
- [ ] Add leaving-home reminder simulation checks.
- [ ] Add issue tracker sync for implementation tasks.
- [ ] Add documentation lookup flow for API changes.
