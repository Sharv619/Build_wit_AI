import { listFiles, readTextFile } from "./fs-utils";

export interface SearchMatch {
  file: string;
  line: number;
  snippet: string;
}

export function findReferences(pattern: string, options: { regex?: boolean; maxResults?: number } = {}): SearchMatch[] {
  const maxResults = options.maxResults ?? 100;
  const matcher = options.regex
    ? new RegExp(pattern, "i")
    : new RegExp(escapeRegExp(pattern), "i");
  const matches: SearchMatch[] = [];

  for (const file of listFiles({ maxDepth: 8 })) {
    if (!isSearchable(file)) continue;
    const read = readTextFile(file, 128_000);
    if (read.skipped || !read.text) continue;
    const lines = read.text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (matches.length >= maxResults) return;
      if (matcher.test(line)) {
        matches.push({ file, line: index + 1, snippet: line.trim().slice(0, 240) });
      }
    });
    if (matches.length >= maxResults) break;
  }

  return matches;
}

export function containsAny(text: string, values: string[]): string[] {
  const lower = text.toLowerCase();
  return values.filter((value) => lower.includes(value.toLowerCase()));
}

function isSearchable(file: string): boolean {
  return /\.(md|ts|js|json|rules|html|css|txt)$/i.test(file) || !file.includes(".");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
