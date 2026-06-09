import { findReferences } from "../shared/search-utils";
import { exists, readTextFile } from "../shared/fs-utils";
import { RegisteredTool } from "../shared/schemas";

const riskyPhrases = [
  "AI doctor",
  "diagnose",
  "diagnosis",
  "dosage recommendation",
  "dose recommendation",
  "take extra",
  "skip dose",
  "clinical assistant",
  "emergency triage",
  "prescription intelligence",
  "medical decision",
  "treatment recommendation",
  "automated clinician",
];

const safePhrases = [
  "medication support prototype",
  "caregiver visibility",
  "event-based reminders",
  "human oversight",
  "response classification",
  "static safety guidance",
  "post-discharge support",
  "demo only",
  "not for real patient data",
  "not medical advice",
];

const urgentPhrases = ["chest pain", "cannot breathe", "fell", "dizzy", "emergency", "severe pain", "confused", "passed out"];

export const pillySafetyTools: RegisteredTool[] = [
  {
    name: "pilly.audit_safety_claims",
    description: "Search for unsafe or overclaiming medical language and check safe boundary language.",
    inputSchema: { type: "object", additionalProperties: false },
    run() {
      const unsafeClaims = riskyPhrases.flatMap((phrase) =>
        findReferences(phrase, { maxResults: 40 })
          .filter((match) => !match.file.startsWith("mcp/tools/pilly-safety.ts"))
          .map((match) => ({
            ...match,
            text: phrase,
            severity: severityForPhrase(phrase),
            boundaryNegation: /\b(no|not|does not|must not|without|avoiding)\b/i.test(match.snippet),
            recommendation: recommendationForPhrase(phrase),
          })),
      );
      const safeBoundaryPresent = safePhrases.some((phrase) => findReferences(phrase, { maxResults: 1 }).length > 0);
      return {
        unsafeClaims,
        safeBoundaryPresent,
        recommendations: [
          ...(safeBoundaryPresent ? [] : ["Add explicit demo-only, not-medical-advice, human-oversight safety boundary language."]),
          ...unsafeClaims.map((claim) => `${claim.file}:${claim.line} replace or qualify "${claim.text}".`),
        ],
      };
    },
  },
  {
    name: "pilly.audit_urgent_phrase_handling",
    description: "Check whether urgent phrase handling exists in docs, code, and tests.",
    inputSchema: { type: "object", additionalProperties: false },
    run() {
      const code = `${readTextFile("functions/src/ai.ts").text ?? ""}\n${readTextFile("functions/src/index.ts").text ?? ""}`;
      const docs = ["SAFETY_BOUNDARIES.md", "TDD.md", "API.md", "BACKEND_CONTRACT_AUDIT.md"]
        .map((file) => readTextFile(file).text ?? "")
        .join("\n");
      const tests = findReferences("urgent", { maxResults: 50 }).filter((match) => /test|spec/i.test(match.file));
      const risks: string[] = [];
      if (!/static safety|does not provide medical advice|emergency services/i.test(docs)) risks.push("Urgent phrase static safety behavior is not fully documented.");
      if (!urgentPhrases.some((phrase) => code.toLowerCase().includes(phrase))) risks.push("Urgent phrase keywords are not clearly implemented.");
      if (!/notification/i.test(code) || !/urgent/i.test(code)) risks.push("Urgent phrase caregiver notification behavior is not clearly implemented.");
      if (!tests.length) risks.push("No urgent phrase tests found.");
      return {
        urgentPhraseHandlingDocumented: /urgent phrase|chest pain|cannot breathe|emergency/i.test(docs),
        urgentPhraseHandlingImplemented: urgentPhrases.some((phrase) => code.toLowerCase().includes(phrase)),
        urgentPhraseTestsFound: tests.length > 0,
        risks,
        recommendations: risks.map((risk) => `Address: ${risk}`),
      };
    },
  },
  {
    name: "pilly.audit_family_voice_boundary",
    description: "Check Trusted Family Voice Reminder safety boundaries.",
    inputSchema: { type: "object", additionalProperties: false },
    run() {
      const text = ["SAFETY_BOUNDARIES.md", "BUSINESS_DIRECTION.md", "README.md", "PRD.md", "TDD.md"]
        .filter(exists)
        .map((file) => readTextFile(file).text ?? "")
        .join("\n")
        .toLowerCase();
      const required = {
        caregiverAudio: /recorded|uploaded|caregiver/.test(text),
        consent: text.includes("consent"),
        metadata: text.includes("voicereminders") || text.includes("voice reminders"),
        storage: text.includes("storage"),
        noSyntheticVoiceCloning: text.includes("synthetic family voice cloning") || text.includes("no synthetic"),
        noImpersonation: text.includes("impersonation"),
        noManipulativeLanguage: text.includes("manipulative") || text.includes("guilt"),
      };
      const missingBoundaryItems = Object.entries(required).filter(([, ok]) => !ok).map(([key]) => key);
      return {
        boundaryItems: required,
        missingBoundaryItems,
        recommendations: missingBoundaryItems.map((item) => `Document Trusted Family Voice boundary item: ${item}.`),
      };
    },
  },
];

function severityForPhrase(phrase: string): "high" | "medium" {
  return /AI doctor|diagnos|take extra|skip dose|emergency triage|automated clinician/i.test(phrase) ? "high" : "medium";
}

function recommendationForPhrase(phrase: string): string {
  if (/AI doctor/i.test(phrase)) return "Replace with 'medication support prototype'.";
  if (/diagnos/i.test(phrase)) return "Clarify that Pilly does not diagnose.";
  if (/take extra|skip dose|dosage|dose recommendation/i.test(phrase)) return "Clarify that Pilly does not provide dosage, skip-dose, or extra-dose advice.";
  if (/emergency triage/i.test(phrase)) return "Clarify that Pilly uses static safety guidance and is not emergency triage.";
  return "Replace with safety-bounded support language.";
}
