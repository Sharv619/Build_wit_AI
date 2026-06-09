import * as childProcess from "child_process";
import * as fs from "fs";
import { resolveRepoPath } from "./fs-utils";

export interface CommandResult {
  skipped?: boolean;
  reason?: string;
  command?: string;
  exitCode?: number | null;
  stdout?: string;
  stderr?: string;
  success?: boolean;
}

export function readPackageScripts(relativePath: string): Record<string, string> {
  const full = resolveRepoPath(relativePath);
  if (!fs.existsSync(full)) return {};
  const parsed = JSON.parse(fs.readFileSync(full, "utf8")) as { scripts?: Record<string, string> };
  return parsed.scripts ?? {};
}

export function runScript(packageJsonPath: string, scriptName: string): CommandResult {
  const scripts = readPackageScripts(packageJsonPath);
  if (!scripts[scriptName]) {
    return { skipped: true, reason: `No ${scriptName} script in ${packageJsonPath}` };
  }
  const cwd = packageJsonPath.includes("/") ? packageJsonPath.split("/").slice(0, -1).join("/") : ".";
  const command = `npm run ${scriptName}`;
  const result = childProcess.spawnSync("npm", ["run", scriptName], {
    cwd: resolveRepoPath(cwd),
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 1024 * 1024,
  });
  return {
    command: cwd === "." ? command : `cd ${cwd} && ${command}`,
    exitCode: result.status,
    stdout: scrubOutput(result.stdout),
    stderr: scrubOutput(result.stderr),
    success: result.status === 0,
  };
}

function scrubOutput(value: string | undefined): string {
  if (!value) return "";
  return value
    .split(/\r?\n/)
    .filter((line) => !/api[_-]?key|secret|token|private[_-]?key/i.test(line))
    .join("\n")
    .slice(0, 20_000);
}
