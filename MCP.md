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
- Settings.

For the first prototype, this should remain optional because browser `localStorage` is sufficient.

### Issue Tracking MCP
Use an issue tracker MCP to sync implementation tasks from `TASKS.md` into project tickets.

## MCP Boundaries
- MCP should not store real medical data.
- MCP should not send medication records to external services without explicit consent.
- MCP should not bypass the app's safety rules.
- MCP should not generate medical advice.

## Future MCP Tasks
- [ ] Add browser automation workflow for the hackathon demo.
- [ ] Add screenshot checks for mobile layout.
- [ ] Add local seed-data utility.
- [ ] Add issue tracker sync for implementation tasks.
- [ ] Add documentation lookup flow for API changes.

