import { exists } from "../shared/fs-utils";
import { readPackageScripts, runScript } from "../shared/command-utils";
import { RegisteredTool } from "../shared/schemas";

export const verifyTools: RegisteredTool[] = [
  {
    name: "verify.get_available_scripts",
    description: "Read root and functions package scripts without installing dependencies.",
    inputSchema: { type: "object", additionalProperties: false },
    run() {
      return {
        root: exists("package.json") ? readPackageScripts("package.json") : {},
        functions: exists("functions/package.json") ? readPackageScripts("functions/package.json") : {},
        mcp: exists("mcp/package.json") ? readPackageScripts("mcp/package.json") : {},
      };
    },
  },
  {
    name: "verify.run_functions_tests",
    description: "Run cd functions && npm test only if a test script exists.",
    inputSchema: { type: "object", additionalProperties: false },
    run: () => runScript("functions/package.json", "test"),
  },
  {
    name: "verify.run_functions_build",
    description: "Run cd functions && npm run build only if a build script exists.",
    inputSchema: { type: "object", additionalProperties: false },
    run: () => runScript("functions/package.json", "build"),
  },
  {
    name: "verify.run_root_tests",
    description: "Run npm test at repo root only if a test script exists.",
    inputSchema: { type: "object", additionalProperties: false },
    run: () => runScript("package.json", "test"),
  },
  {
    name: "verify.run_root_build",
    description: "Run npm run build at repo root only if a build script exists.",
    inputSchema: { type: "object", additionalProperties: false },
    run: () => runScript("package.json", "build"),
  },
  {
    name: "verify.run_full_verification",
    description: "Run available functions/root tests and builds, skipping missing scripts.",
    inputSchema: { type: "object", additionalProperties: false },
    run() {
      const functionsTest = runScript("functions/package.json", "test");
      const functionsBuild = runScript("functions/package.json", "build");
      const rootTest = runScript("package.json", "test");
      const rootBuild = runScript("package.json", "build");
      const results = [functionsTest, functionsBuild, rootTest, rootBuild];
      return {
        functionsTest,
        functionsBuild,
        rootTest,
        rootBuild,
        overallSuccess: results.every((result) => result.skipped || result.success),
        recommendations: results.filter((result) => result.skipped).map((result) => result.reason),
      };
    },
  },
];
