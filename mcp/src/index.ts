#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

type MedicationEventTrigger =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "bedtime"
  | "leaving_home"
  | "post_discharge"
  | "caregiver_check_in";

type MedicationSource =
  | "webster_pack"
  | "temporary_post_hospital"
  | "antibiotic"
  | "other";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");

const docs = {
  readme: { title: "README", file: "README.md" },
  api: { title: "Backend API", file: "API.md" },
  prd: { title: "Product Requirements", file: "PRD.md" },
  tdd: { title: "Technical Design", file: "TDD.md" },
  tasks: { title: "Task State", file: "TASKS.md" },
  mcp: { title: "MCP Plan", file: "MCP.md" },
  workflows: { title: "Workflows", file: "WORFLOWs.md" },
  skills: { title: "Skills", file: "SKILLS.md" },
} as const;

const frontendPages = [
  {
    id: "home",
    title: "Senior Home",
    sourceFolder: "FRONT_END/medimate_home_simplified_voice_navigation",
    hostedPath: "/home/",
    type: "html",
  },
  {
    id: "add-medication",
    title: "Add Medication",
    sourceFolder: "FRONT_END/add_medication_updated_navigation",
    hostedPath: "/add-medication/",
    type: "html",
  },
  {
    id: "log-medication",
    title: "Log Medication",
    sourceFolder: "FRONT_END/log_medication_updated_navigation",
    hostedPath: "/log-medication/",
    type: "html",
  },
  {
    id: "caregiver-dashboard",
    title: "Caregiver Dashboard",
    sourceFolder: "FRONT_END/caregiver_dashboard_updated_navigation",
    hostedPath: "/caregiver-dashboard/",
    type: "html",
  },
  {
    id: "sign-in",
    title: "Sign In",
    sourceFolder: "FRONT_END/sign_in_updated_navigation",
    hostedPath: "/sign-in/",
    type: "html",
  },
  {
    id: "medimate-home",
    title: "MediMate Home Screenshot",
    sourceFolder: "FRONT_END/medimate_home",
    hostedPath: "",
    type: "screenshot",
  },
  {
    id: "medimate-voice-design",
    title: "MediMate Voice Design",
    sourceFolder: "FRONT_END/medimate_voice",
    hostedPath: "",
    type: "doc",
  },
] as const;

const triggerSchema = z.enum([
  "breakfast",
  "lunch",
  "dinner",
  "bedtime",
  "leaving_home",
  "post_discharge",
  "caregiver_check_in",
]);

const server = new McpServer({
  name: "pilly-mcp",
  version: "0.1.0",
});

for (const [key, doc] of Object.entries(docs)) {
  server.resource(
    doc.title,
    `pilly://docs/${key}`,
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: await readRepoFile(doc.file),
        },
      ],
    }),
  );
}

server.tool(
  "list_project_docs",
  "List the Pilly project documents exposed by this MCP server.",
  {},
  async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          Object.entries(docs).map(([key, doc]) => ({
            key,
            title: doc.title,
            uri: `pilly://docs/${key}`,
            file: doc.file,
          })),
          null,
          2,
        ),
      },
    ],
  }),
);

server.tool(
  "read_project_doc",
  "Read a Pilly project document by key.",
  {
    key: z.enum(Object.keys(docs) as [keyof typeof docs, ...(keyof typeof docs)[]]),
  },
  async ({ key }) => ({
    content: [
      {
        type: "text",
        text: await readRepoFile(docs[key].file),
      },
    ],
  }),
);

server.tool(
  "demo_seed_data",
  "Return the deterministic Eleanor demo IDs and medication fixtures used by the backend seedDemoData function.",
  {},
  async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify({
          householdId: "demo-household-eleanor",
          eleanorId: "demo-eleanor",
          caregiverId: "demo-caregiver",
          medications: [
            {
              name: "Webster Pack morning medicines",
              dose: "1 pack",
              source: "webster_pack",
              eventTriggers: ["breakfast"],
            },
            {
              name: "Post-hospital antibiotic",
              dose: "1 tablet",
              source: "antibiotic",
              eventTriggers: ["lunch", "dinner", "leaving_home"],
            },
          ],
        }, null, 2),
      },
    ],
  }),
);

server.tool(
  "list_frontend_pages",
  "List the Mobile Demo screen artifacts that should be considered when building or reviewing the hosted Pilly website.",
  {},
  async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(frontendPages, null, 2),
      },
    ],
  }),
);

server.tool(
  "generate_reminder_copy",
  "Generate the same safe reminder copy shape used by the backend for a medication event.",
  {
    medicationName: z.string().min(1),
    dose: z.string().min(1),
    trigger: triggerSchema,
  },
  async ({ medicationName, dose, trigger }) => ({
    content: [
      {
        type: "text",
        text: reminderCopy(medicationName, dose, trigger),
      },
    ],
  }),
);

server.tool(
  "generate_missed_dose_alert",
  "Generate caregiver-facing missed-dose alert copy for a medication event.",
  {
    medicationName: z.string().min(1),
    trigger: triggerSchema,
  },
  async ({ medicationName, trigger }) => ({
    content: [
      {
        type: "text",
        text: missedDoseCopy(medicationName, trigger),
      },
    ],
  }),
);

server.tool(
  "extract_script_medication_candidates",
  "Extract draft medication candidates from pasted prescription text for caregiver review. This does not provide medical advice.",
  {
    text: z.string().min(1),
  },
  async ({ text }) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(extractMedicationCandidates(text), null, 2),
      },
    ],
  }),
);

server.tool(
  "validate_medication_payload",
  "Validate a draft medication payload against the Pilly demo data contract.",
  {
    name: z.string().min(1),
    dose: z.string().min(1),
    instructions: z.string().min(1),
    source: z.enum(["webster_pack", "temporary_post_hospital", "antibiotic", "other"]),
    eventTriggers: z.array(triggerSchema).min(1),
    active: z.boolean().default(true),
  },
  async (payload) => {
    const warnings: string[] = [];

    if (payload.source === "antibiotic" && !payload.eventTriggers.includes("lunch") && !payload.eventTriggers.includes("dinner")) {
      warnings.push("Antibiotic demo medicines usually include a meal-time trigger such as lunch or dinner.");
    }

    if (/change|increase|decrease|stop|skip/i.test(payload.instructions)) {
      warnings.push("Instructions appear to mention medication changes. Pilly should only record existing clinician/pharmacist instructions.");
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            valid: warnings.length === 0,
            warnings,
            payload,
          }, null, 2),
        },
      ],
    };
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function readRepoFile(relativePath: string): Promise<string> {
  const resolved = path.resolve(repoRoot, relativePath);
  if (!resolved.startsWith(repoRoot + path.sep)) {
    throw new Error("Refusing to read outside the repository root.");
  }

  return readFile(resolved, "utf8");
}

function reminderCopy(medicationName: string, dose: string, trigger: MedicationEventTrigger): string {
  const label = trigger.replace(/_/g, " ");
  return `It is ${label}. Please take ${dose} of ${medicationName} if this matches your doctor's or pharmacist's instructions.`;
}

function missedDoseCopy(medicationName: string, trigger: MedicationEventTrigger): string {
  const label = trigger.replace(/_/g, " ");
  return `Medication check needed: ${medicationName} was not recorded as taken for ${label}. Please check in with Eleanor.`;
}

function extractMedicationCandidates(text: string): Array<{
  name: string;
  dose: string;
  instructions: string;
  source: MedicationSource;
  eventTriggers: MedicationEventTrigger[];
}> {
  return text
    .split(/\n|;/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((line) => ({
      name: line.split(/\s+-\s+|\s+\d/)[0]?.trim() || line,
      dose: line.match(/\d+\s*(mg|mcg|g|ml|tablet|capsule|pack)/i)?.[0] ?? "",
      instructions: line,
      source: line.toLowerCase().includes("antibiotic") ? "antibiotic" : "other",
      eventTriggers: [],
    }));
}

main().catch((error) => {
  console.error("Pilly MCP server failed to start:", error);
  process.exit(1);
});
