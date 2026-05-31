export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

export interface RegisteredTool extends ToolDefinition {
  run: (input: Record<string, unknown>) => Promise<unknown> | unknown;
}

export const DEFAULT_IGNORE = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  "lib",
  ".env",
  ".env.local",
  ".env.production",
  "firebase-debug.log",
  "firestore-debug.log",
];

export const SENSITIVE_BASENAMES = new Set([
  ".env",
  ".env.local",
  ".env.production",
  "serviceAccount.json",
  "firebase-debug.log",
  "firestore-debug.log",
]);

export const IMPORTANT_FILES = [
  "README.md",
  "PRD.md",
  "TDD.md",
  "WORKFLOWS.md",
  "WORFLOWs.md",
  "TASKS_V2.md",
  "SAFETY_BOUNDARIES.md",
  "BUSINESS_DIRECTION.md",
  "API.md",
  "DEMO_VERIFICATION.md",
  "firebase.json",
  "firestore.rules",
  "storage.rules",
  "functions/package.json",
  "functions/src/index.ts",
];

export const REQUIRED_DOCS = [
  "README.md",
  "PRD.md",
  "TDD.md",
  "WORKFLOWS.md",
  "TASKS_V2.md",
  "SAFETY_BOUNDARIES.md",
  "BUSINESS_DIRECTION.md",
  "API.md",
  "DEMO_VERIFICATION.md",
];

export const EXPECTED_FUNCTIONS = [
  "classifyMedicationResponse",
  "recordMedicationResponse",
  "completeRoutineEvent",
  "simulateLeavingHome",
  "generateReminderCopy",
  "generateMissedDoseAlert",
  "processScriptUpload",
  "seedDemoData",
];

export const EXPECTED_COLLECTIONS = [
  "users",
  "households",
  "medications",
  "routineEvents",
  "medicationLogs",
  "notifications",
  "scriptUploads",
  "voiceReminders",
];

export const EXPECTED_STATUSES = ["taken", "snoozed", "missed", "refused", "help_requested", "unknown"];
export const EXPECTED_EVENTS = [
  "breakfast",
  "lunch",
  "dinner",
  "bedtime",
  "leaving_home",
  "post_discharge_check_in",
  "caregiver_check_in",
];
export const EXPECTED_NOTIFICATION_TYPES = [
  "missed_dose",
  "refusal",
  "help_requested",
  "leaving_home",
  "urgent_phrase",
  "system",
];
