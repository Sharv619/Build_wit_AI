import { exists, readTextFile } from "../shared/fs-utils";
import {
  EXPECTED_COLLECTIONS,
  EXPECTED_EVENTS,
  EXPECTED_FUNCTIONS,
  EXPECTED_NOTIFICATION_TYPES,
  EXPECTED_STATUSES,
  RegisteredTool,
} from "../shared/schemas";
import { findReferences } from "../shared/search-utils";

export const pillyFunctionTools: RegisteredTool[] = [
  {
    name: "pilly.audit_function_contracts",
    description: "Inspect Cloud Functions source and detect expected Pilly function contracts.",
    inputSchema: { type: "object", additionalProperties: false },
    run() {
      const source = readTextFile("functions/src/index.ts", 200_000).text ?? "";
      return {
        functions: EXPECTED_FUNCTIONS.map((name) => auditFunction(name, source)),
        missingFunctions: EXPECTED_FUNCTIONS.filter((name) => !source.includes(`export const ${name}`)),
      };
    },
  },
  {
    name: "pilly.audit_data_model",
    description: "Check docs and code for expected Firestore collections, statuses, events, and notification types.",
    inputSchema: { type: "object", additionalProperties: false },
    run() {
      const text = ["PRD.md", "TDD.md", "API.md", "SAFETY_BOUNDARIES.md", "functions/src/types.ts", "functions/src/index.ts", "firestore.rules"]
        .filter(exists)
        .map((file) => readTextFile(file, 200_000).text ?? "")
        .join("\n");
      return {
        collections: presence(EXPECTED_COLLECTIONS, text),
        statuses: presence(EXPECTED_STATUSES, text),
        routineEvents: presence(EXPECTED_EVENTS, text),
        notificationTypes: presence(EXPECTED_NOTIFICATION_TYPES, text),
        inconsistencies: detectInconsistencies(text),
      };
    },
  },
  {
    name: "pilly.audit_firestore_rules",
    description: "Inspect Firestore rules for demo-open access, household checks, and collection coverage.",
    inputSchema: { type: "object", additionalProperties: false },
    run() {
      if (!exists("firestore.rules")) return { rulesFileExists: false, risks: ["firestore.rules missing"], recommendations: ["Add Firestore rules before any pilot."] };
      const text = readTextFile("firestore.rules", 100_000).text ?? "";
      const demoOpenAccessDetected = /demo-household-eleanor/.test(text);
      const householdIsolationDetected = /isLinkedToHousehold|householdIdFor|isCaregiverFor/.test(text);
      const collections = Object.fromEntries(EXPECTED_COLLECTIONS.map((collection) => [collection, text.includes(`/${collection}/`) || text.includes(`match /${collection}`)]));
      const risks = [
        ...(demoOpenAccessDetected ? ["Rules include demo-open access and should not be used with real patient data."] : []),
        ...(householdIsolationDetected ? [] : ["Household isolation checks were not detected."]),
        ...(collections.voiceReminders ? [] : ["voiceReminders rules are missing."]),
      ];
      return {
        rulesFileExists: true,
        demoOpenAccessDetected,
        householdIsolationDetected,
        collectionRules: collections,
        risks,
        recommendations: risks.map((risk) => `Address or document: ${risk}`),
      };
    },
  },
  {
    name: "pilly.audit_storage_rules",
    description: "Inspect Storage rules for script upload and voice reminder boundaries.",
    inputSchema: { type: "object", additionalProperties: false },
    run() {
      if (!exists("storage.rules")) return { rulesFileExists: false, risks: ["storage.rules missing"], recommendations: ["Add Storage rules before uploads are used."] };
      const text = readTextFile("storage.rules", 100_000).text ?? "";
      const lower = text.toLowerCase();
      const hasScriptBoundary = lower.includes("script") || lower.includes("prescription");
      const hasVoiceBoundary = lower.includes("voice");
      const risks = [
        ...(hasScriptBoundary ? [] : ["Script/prescription upload storage boundary not detected."]),
        ...(hasVoiceBoundary ? [] : ["Voice reminder storage boundary not detected."]),
        ...(/allow read, write: if true|allow write: if true/.test(text) ? ["Storage rules appear publicly writable."] : []),
      ];
      return {
        rulesFileExists: true,
        scriptUploadBoundaryDetected: hasScriptBoundary,
        voiceReminderBoundaryDetected: hasVoiceBoundary,
        risks,
        recommendations: risks.map((risk) => `Address or document: ${risk}`),
      };
    },
  },
];

function auditFunction(name: string, source: string) {
  const found = source.includes(`export const ${name}`);
  const body = found ? extractFunctionBody(name, source) : "";
  const testsFound = findReferences(name, { maxResults: 100 }).some((match) => isActualTestFile(match.file));
  return {
    name,
    found,
    file: found ? "functions/src/index.ts" : undefined,
    inputLikely: Array.from(body.matchAll(/(?:stringField|enumField|optionalString)\(request\.data,?\s*"?([A-Za-z0-9_]+)?"?/g)).map((match) => match[1]).filter(Boolean),
    firestoreWritesLikely: collectionsFromBody(body, [".add(", ".set(", "batch.set"]),
    firestoreReadsLikely: collectionsFromBody(body, [".where(", ".get("]),
    safetyBehaviorLikely: [
      ...(body.includes("classifyWithGemini") || body.includes("classifyFallback") ? ["bounded response classification"] : []),
      ...(body.includes("missedDoseCopy") || body.includes("reminderCopy") ? ["bounded copy helper"] : []),
      ...(body.includes("help_requested") ? ["help requested routing"] : []),
    ],
    testsFound,
    risks: risksForFunction(name, body, testsFound),
    recommendations: risksForFunction(name, body, testsFound).map((risk) => `Address: ${risk}`),
  };
}

function extractFunctionBody(name: string, source: string): string {
  const start = source.indexOf(`export const ${name}`);
  if (start === -1) return "";
  const candidates = [
    source.indexOf("\nexport const ", start + 1),
    source.indexOf("\nasync function ", start + 1),
    source.indexOf("\nfunction ", start + 1),
  ].filter((index) => index > start);
  const next = candidates.length ? Math.min(...candidates) : source.length;
  return source.slice(start, next);
}

function collectionsFromBody(body: string, markers: string[]): string[] {
  const found = new Set<string>();
  for (const collection of EXPECTED_COLLECTIONS) {
    if (body.includes(`collection("${collection}")`) && markers.some((marker) => body.includes(marker))) found.add(collection);
  }
  return Array.from(found);
}

function risksForFunction(name: string, body: string, testsFound: boolean): string[] {
  const risks = [];
  if (!body) risks.push("Function missing.");
  if (!testsFound) risks.push("No direct tests found.");
  if (name === "recordMedicationResponse" && !body.includes("notifications")) risks.push("Caregiver-visible refusal/help notification behavior not detected.");
  if (name === "completeRoutineEvent" && !/existing|hasFinal/.test(body)) risks.push("Idempotency check not detected.");
  if (name === "seedDemoData" && !body.includes("routineEvents")) risks.push("Starter routine event seed data not detected.");
  return risks;
}

function presence(values: string[], text: string) {
  return Object.fromEntries(values.map((value) => [value, text.includes(value)]));
}

function detectInconsistencies(text: string): string[] {
  const items: string[] = [];
  if (text.includes("post_discharge") && !text.includes("post_discharge_check_in")) items.push("Legacy event value post_discharge detected; v2 expects post_discharge_check_in.");
  if (text.includes("missed_dose_alert") && !text.includes('"missed_dose"')) items.push("Legacy notification value missed_dose_alert detected; v2 expects missed_dose.");
  return items;
}

function isActualTestFile(file: string): boolean {
  return /(^|\/)(test|tests)\//i.test(file) || /\.(test|spec)\.(ts|js)$/i.test(file);
}
