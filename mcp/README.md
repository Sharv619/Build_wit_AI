# Pilly MCP Server

Local Model Context Protocol server for the Pilly/MediMate Voice project.

It exposes project documentation as MCP resources and provides safe demo utilities for reminder copy, missed-dose copy, script text candidate extraction, and medication payload validation. It does not connect to Firebase, store medical data, or call external AI services.

## Setup

```bash
cd mcp
npm install
npm run build
npm start
```

## Client Config

Use this command from an MCP-capable client:

```json
{
  "mcpServers": {
    "pilly": {
      "command": "node",
      "args": ["C:/Users/Hlade/Documents/Build_Wit_AI/mcp/lib/index.js"]
    }
  }
}
```

## Resources

- `pilly://docs/readme`
- `pilly://docs/api`
- `pilly://docs/prd`
- `pilly://docs/tdd`
- `pilly://docs/tasks`
- `pilly://docs/mcp`
- `pilly://docs/workflows`
- `pilly://docs/skills`

## Tools

- `list_project_docs`
- `read_project_doc`
- `demo_seed_data`
- `list_frontend_pages`
- `generate_reminder_copy`
- `generate_missed_dose_alert`
- `extract_script_medication_candidates`
- `validate_medication_payload`
