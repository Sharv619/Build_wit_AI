<<<<<<< HEAD
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
=======
# Pilly Repo MCP

This is a small repo-local MCP server for Pilly / MediMate Voice. It helps future coding agents inspect, audit, test, and plan changes before editing the Firebase-backed medication support prototype.

The MCP layer is intentionally conservative:
- Read-only by default.
- No package installation.
- No commits or pushes.
- No secret printing.
- No production medical claims.
- No tools that delete files or rewrite the app.

Allowed write tools:
- `tasks.update_tasks_v2`
- `docs.generate_safety_report`
- `docs.generate_backend_contract_report`

## Build

From the repo root:

```bash
cd mcp
npm run build
```

This uses the existing TypeScript compiler from `functions/node_modules`.

## Start

```bash
cd mcp
npm start
```

The server speaks MCP-compatible JSON-RPC over stdio and supports `initialize`, `tools/list`, and `tools/call`.

## Recommended Agent Workflow

Future agents should run these tools before editing:

1. `repo.detect_project_type`
2. `repo.scan_tree`
3. `repo.read_key_files`
4. `pilly.audit_docs`
5. `pilly.audit_safety_claims`
6. `pilly.audit_function_contracts`
7. `pilly.audit_data_model`
8. `pilly.audit_tests`
9. `pilly.audit_firestore_rules`
10. `verify.get_available_scripts`
11. `tasks.generate_v2_task_plan`

After minimal edits, run:

1. `verify.run_full_verification`
2. Report files changed, tests/build results, risks, and next steps.

## Tool Groups

Repo:
- `repo.scan_tree`
- `repo.read_key_files`
- `repo.find_references`
- `repo.detect_project_type`

Docs:
- `pilly.audit_docs`
- `pilly.audit_readme_positioning`

Safety:
- `pilly.audit_safety_claims`
- `pilly.audit_urgent_phrase_handling`
- `pilly.audit_family_voice_boundary`

Firebase and functions:
- `pilly.audit_function_contracts`
- `pilly.audit_data_model`
- `pilly.audit_firestore_rules`
- `pilly.audit_storage_rules`

Tests and verification:
- `pilly.audit_tests`
- `verify.get_available_scripts`
- `verify.run_functions_tests`
- `verify.run_functions_build`
- `verify.run_root_tests`
- `verify.run_root_build`
- `verify.run_full_verification`

Planning and reports:
- `tasks.generate_v2_task_plan`
- `tasks.update_tasks_v2`
- `docs.generate_backend_contract_report`
- `docs.generate_safety_report`

## Safety Boundary

Pilly is a medication support prototype, demo only, and not for real patient data. AI may only be used for bounded response classification and safe workflow routing. Pilly must not diagnose, recommend medication, recommend dosage changes, tell users to skip or take extra medication, replace clinicians, or act as emergency triage.
>>>>>>> 1fc2c96a7840bb57dbe9295caf62fd10847b9fc6
