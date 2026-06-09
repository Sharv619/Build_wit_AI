import * as fs from "fs";
import { exists, lineCount, listDirectories, listFiles, readTextFile } from "../shared/fs-utils";
import { findReferences } from "../shared/search-utils";
import { IMPORTANT_FILES, RegisteredTool } from "../shared/schemas";
import { readPackageScripts } from "../shared/command-utils";

export const repoTools: RegisteredTool[] = [
  {
    name: "repo.scan_tree",
    description: "Return a filtered repository tree with important files and detected frameworks.",
    inputSchema: {
      type: "object",
      properties: {
        maxDepth: { type: "number", default: 4 },
        ignore: { type: "array", items: { type: "string" } },
      },
      additionalProperties: false,
    },
    run(input) {
      const maxDepth = typeof input.maxDepth === "number" ? input.maxDepth : 4;
      const ignore = Array.isArray(input.ignore) ? input.ignore.filter((x): x is string => typeof x === "string") : [];
      const files = listFiles({ maxDepth, ignore });
      return {
        directories: listDirectories({ maxDepth, ignore }),
        files,
        importantFiles: IMPORTANT_FILES.filter(exists).concat(files.filter((file) => /^functions\/src\/.+\.ts$/.test(file))),
        detectedFrameworks: detectFrameworks(files),
      };
    },
  },
  {
    name: "repo.read_key_files",
    description: "Read previews of key Pilly repository files without dumping large files or secrets.",
    inputSchema: {
      type: "object",
      properties: {
        files: { type: "array", items: { type: "string" } },
        maxBytes: { type: "number", default: 12000 },
      },
      additionalProperties: false,
    },
    run(input) {
      const requested = Array.isArray(input.files) && input.files.length
        ? input.files.filter((x): x is string => typeof x === "string")
        : IMPORTANT_FILES;
      const maxBytes = typeof input.maxBytes === "number" ? input.maxBytes : 12_000;
      return {
        files: requested.map((file) => {
          if (!exists(file)) return { path: file, exists: false, lineCount: 0, contentPreview: "" };
          const read = readTextFile(file, maxBytes);
          if (read.skipped) return { path: file, exists: true, skipped: true, reason: read.reason };
          return {
            path: file,
            exists: true,
            lineCount: lineCount(read.text ?? ""),
            contentPreview: read.text ?? "",
          };
        }),
      };
    },
  },
  {
    name: "repo.find_references",
    description: "Search repository text or regex and return file, line, and short snippets.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        regex: { type: "boolean", default: false },
        maxResults: { type: "number", default: 100 },
      },
      required: ["query"],
      additionalProperties: false,
    },
    run(input) {
      const query = String(input.query ?? "");
      return { matches: findReferences(query, { regex: input.regex === true, maxResults: Number(input.maxResults ?? 100) }) };
    },
  },
  {
    name: "repo.detect_project_type",
    description: "Detect Pilly project structure, frameworks, runtime, Firebase services, and likely commands.",
    inputSchema: { type: "object", additionalProperties: false },
    run() {
      const functionsPackage = exists("functions/package.json") ? readPackageScripts("functions/package.json") : {};
      const rootScripts = fs.existsSync("package.json") ? readPackageScripts("package.json") : {};
      const aiSource = readTextFile("functions/src/ai.ts").text ?? "";
      return {
        frontend: exists("FRONT_END/app/index.html") ? "HTML/Tailwind/vanilla JS" : "not detected",
        backend: exists("functions/src/index.ts") ? "Firebase Cloud Functions" : "not detected",
        language: exists("functions/tsconfig.json") ? "TypeScript" : "unknown",
        runtime: runtimeFromFunctionsPackage(),
        database: exists("firestore.rules") ? "Firestore" : "not detected",
        storage: exists("storage.rules") ? "Firebase Storage" : "not detected",
        hosting: exists("firebase.json") ? "Firebase Hosting" : "not detected",
        ai: aiSource.includes("GEMINI_API_KEY") && aiSource.includes("classifyFallback")
          ? "Gemini API server-side with deterministic fallback"
          : "not detected",
        testCommand: functionsPackage.test ? "cd functions && npm test" : undefined,
        buildCommand: functionsPackage.build ? "cd functions && npm run build" : undefined,
        rootTestCommand: rootScripts.test ? "npm test" : undefined,
        rootBuildCommand: rootScripts.build ? "npm run build" : undefined,
      };
    },
  },
];

function detectFrameworks(files: string[]): string[] {
  const frameworks = new Set<string>();
  if (files.includes("firebase.json")) frameworks.add("Firebase");
  if (files.includes("functions/package.json")) frameworks.add("Firebase Functions");
  if (files.some((file) => file.startsWith("FRONT_END/") && file.endsWith(".html"))) frameworks.add("Static HTML frontend");
  if (files.includes("functions/tsconfig.json")) frameworks.add("TypeScript");
  return Array.from(frameworks);
}

function runtimeFromFunctionsPackage(): string {
  const read = readTextFile("functions/package.json").text;
  if (!read) return "unknown";
  try {
    const parsed = JSON.parse(read) as { engines?: { node?: string } };
    return parsed.engines?.node ? `Node.js ${parsed.engines.node}` : "Node.js";
  } catch {
    return "Node.js";
  }
}
