import { exists, listFiles, readTextFile } from "../shared/fs-utils";
import { RegisteredTool } from "../shared/schemas";

const coverageChecks = {
  geminiFallback: ["GEMINI_API_KEY", "fallback", "classifyFallback"],
  urgentPhraseSafety: ["urgent", "chest pain", "emergency", "medical advice"],
  medicationLogWrite: ["recordMedicationResponse", "medicationLogs"],
  refusalNotification: ["refused", "refusal", "notifications"],
  helpRequestNotification: ["help_requested", "help request", "notifications"],
  missedDoseScoped: ["completeRoutineEvent", "missed", "eventTriggers"],
  missedDoseNoDuplicate: ["completeRoutineEvent", "duplicate", "idempotent", "hasFinal"],
  leavingHomeNotification: ["simulateLeavingHome", "leaving_home", "notifications"],
  seedDemoData: ["seedDemoData", "demo-household-eleanor", "medications"],
  firestoreRules: ["firestore.rules", "household"],
};

export const pillyTestTools: RegisteredTool[] = [
  {
    name: "pilly.audit_tests",
    description: "Inspect tests/docs to determine whether v2 requirements are covered.",
    inputSchema: { type: "object", additionalProperties: false },
    run() {
      const testFiles = listFiles({ maxDepth: 8 }).filter(isActualTestFile);
      const testTexts = testFiles.map((file) => readTextFile(file, 200_000).text ?? "");
      const testText = testTexts.join("\n");
      const docsText = ["TASKS_V2.md", "BACKEND_CONTRACT_AUDIT.md", "TDD.md"].filter(exists).map((file) => readTextFile(file).text ?? "").join("\n");
      const coverageAreas = Object.fromEntries(Object.entries(coverageChecks).map(([key, terms]) => [
        key,
        testTexts.some((text) => terms.every((term) => text.toLowerCase().includes(term.toLowerCase()))),
      ]));
      const documentedAreas = Object.fromEntries(Object.entries(coverageChecks).map(([key, terms]) => [
        key,
        terms.some((term) => docsText.toLowerCase().includes(term.toLowerCase())),
      ]));
      const missingTests = Object.entries(coverageAreas).filter(([, covered]) => !covered).map(([key]) => key);
      return {
        testFiles,
        coverageAreas,
        documentedAreas,
        missingTests,
        recommendations: missingTests.map((area) => `Add automated test coverage for ${area}, or document blocker if emulator/function structure prevents it.`),
      };
    },
  },
];

function isActualTestFile(file: string): boolean {
  return /(^|\/)(test|tests)\//i.test(file) || /\.(test|spec)\.(ts|js)$/i.test(file);
}
