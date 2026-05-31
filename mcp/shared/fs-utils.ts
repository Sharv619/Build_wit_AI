import * as fs from "fs";
import * as path from "path";
import { DEFAULT_IGNORE, SENSITIVE_BASENAMES } from "./schemas";

export const REPO_ROOT = findRepoRoot();

export function resolveRepoPath(relativePath: string): string {
  const resolved = path.resolve(REPO_ROOT, relativePath);
  if (!resolved.startsWith(REPO_ROOT)) {
    throw new Error(`Path escapes repository: ${relativePath}`);
  }
  return resolved;
}

export function toRepoRelative(fullPath: string): string {
  return path.relative(REPO_ROOT, fullPath).replace(/\\/g, "/");
}

export function exists(relativePath: string): boolean {
  return fs.existsSync(resolveRepoPath(relativePath));
}

export function isSensitivePath(relativePath: string): boolean {
  const parts = relativePath.split(/[\\/]/);
  return parts.some((part) => SENSITIVE_BASENAMES.has(part));
}

export function readTextFile(relativePath: string, maxBytes = 64_000): { skipped?: boolean; reason?: string; text?: string } {
  if (isSensitivePath(relativePath)) return { skipped: true, reason: "sensitive file" };
  const fullPath = resolveRepoPath(relativePath);
  if (!fs.existsSync(fullPath)) return { text: "" };
  const stat = fs.statSync(fullPath);
  if (!stat.isFile()) return { text: "" };
  const fd = fs.openSync(fullPath, "r");
  try {
    const size = Math.min(stat.size, maxBytes);
    const buffer = Buffer.alloc(size);
    fs.readSync(fd, buffer, 0, size, 0);
    return { text: buffer.toString("utf8") };
  } finally {
    fs.closeSync(fd);
  }
}

export function writeTextFile(relativePath: string, content: string): void {
  if (isSensitivePath(relativePath)) throw new Error("Refusing to write sensitive file");
  const fullPath = resolveRepoPath(relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
}

export function lineCount(text: string): number {
  if (!text) return 0;
  return text.split(/\r?\n/).length;
}

export function listFiles(options: { maxDepth?: number; ignore?: string[] } = {}): string[] {
  const maxDepth = options.maxDepth ?? 4;
  const ignore = new Set([...(options.ignore ?? []), ...DEFAULT_IGNORE]);
  const output: string[] = [];

function walk(dir: string, depth: number): void {
    if (depth > maxDepth) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ignore.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      const relative = toRepoRelative(full);
      if (isSensitivePath(relative)) continue;
      if (entry.isDirectory()) {
        walk(full, depth + 1);
      } else if (entry.isFile()) {
        output.push(relative);
      }
    }
  }

  walk(REPO_ROOT, 0);
  return output.sort();
}

function findRepoRoot(): string {
  const candidates = [
    process.env.PILLY_REPO_ROOT,
    process.cwd(),
    path.resolve(__dirname, "..", "..", ".."),
    path.resolve(__dirname, "..", ".."),
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    let current = path.resolve(candidate);
    for (let depth = 0; depth < 6; depth += 1) {
      if (fs.existsSync(path.join(current, "firebase.json")) && fs.existsSync(path.join(current, "functions"))) {
        return current;
      }
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }

  return path.resolve(__dirname, "..", "..", "..");
}

export function listDirectories(options: { maxDepth?: number; ignore?: string[] } = {}): string[] {
  const maxDepth = options.maxDepth ?? 4;
  const ignore = new Set([...(options.ignore ?? []), ...DEFAULT_IGNORE]);
  const output: string[] = [];

  function walk(dir: string, depth: number): void {
    if (depth > maxDepth) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || ignore.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      const relative = toRepoRelative(full);
      output.push(relative);
      walk(full, depth + 1);
    }
  }

  walk(REPO_ROOT, 0);
  return output.sort();
}
