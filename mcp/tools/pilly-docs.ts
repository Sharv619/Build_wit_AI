import { exists, readTextFile } from "../shared/fs-utils";
import { RegisteredTool, REQUIRED_DOCS } from "../shared/schemas";

const readmeSections = [
  "live demo",
  "problem",
  "solution",
  "core workflow",
  "screenshots",
  "tech stack",
  "responsible ai",
  "safety",
  "trusted family voice",
  "demo instructions",
  "local development",
  "testing",
  "known limitations",
  "production hardening",
  "my contribution",
];

export const pillyDocsTools: RegisteredTool[] = [
  {
    name: "pilly.audit_docs",
    description: "Check required v2 docs, workflow typo file, and README links.",
    inputSchema: { type: "object", additionalProperties: false },
    run() {
      const requiredDocs = Object.fromEntries(REQUIRED_DOCS.map((doc) => [doc, exists(doc)]));
      const missingDocs = REQUIRED_DOCS.filter((doc) => !exists(doc));
      const typosFound = exists("WORFLOWs.md") ? ["WORFLOWs.md"] : [];
      const readme = readTextFile("README.md").text ?? "";
      const readmeLinksMissing = REQUIRED_DOCS.filter((doc) => doc !== "README.md" && exists(doc) && !readme.includes(doc));
      const recommendations = [
        ...typosFound.map(() => "Rename WORFLOWs.md to WORKFLOWS.md using git mv WORFLOWs.md WORKFLOWS.md."),
        ...missingDocs.map((doc) => `Create ${doc}.`),
        ...readmeLinksMissing.map((doc) => `Link ${doc} from README.md.`),
      ];
      return { requiredDocs, typosFound, missingDocs, readmeLinksMissing, recommendations };
    },
  },
  {
    name: "pilly.audit_readme_positioning",
    description: "Audit README portfolio positioning and required responsible-AI sections.",
    inputSchema: { type: "object", additionalProperties: false },
    run() {
      const read = readTextFile("README.md");
      if (!exists("README.md")) {
        return { exists: false, missingSections: readmeSections, recommendations: ["Create README.md with responsible-AI Pilly positioning."] };
      }
      if (read.skipped) return { exists: true, skipped: true, reason: read.reason };
      const text = read.text ?? "";
      const lower = text.toLowerCase();
      const expectedPositioning = "Pilly is a Firebase-backed responsible-AI medication support prototype for seniors and caregivers.";
      const missingSections = readmeSections.filter((section) => !lower.includes(section));
      return {
        exists: true,
        positioningPresent: text.includes(expectedPositioning),
        missingSections,
        recommendations: [
          ...(text.includes(expectedPositioning) ? [] : [`Add positioning sentence: ${expectedPositioning}`]),
          ...missingSections.map((section) => `Add README section covering ${section}.`),
        ],
      };
    },
  },
];
