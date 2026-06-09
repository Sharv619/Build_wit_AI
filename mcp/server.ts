import * as readline from "readline";
import { repoTools } from "./tools/repo";
import { pillyDocsTools } from "./tools/pilly-docs";
import { pillySafetyTools } from "./tools/pilly-safety";
import { pillyFunctionTools } from "./tools/pilly-functions";
import { pillyTestTools } from "./tools/pilly-tests";
import { verifyTools } from "./tools/verify";
import { taskTools } from "./tools/tasks";
import { RegisteredTool, ToolResult } from "./shared/schemas";

const tools = new Map<string, RegisteredTool>();
for (const tool of [
  ...repoTools,
  ...pillyDocsTools,
  ...pillySafetyTools,
  ...pillyFunctionTools,
  ...pillyTestTools,
  ...verifyTools,
  ...taskTools,
]) {
  tools.set(tool.name, tool);
}

interface RpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on("line", async (line) => {
  if (!line.trim()) return;
  let request: RpcRequest;
  try {
    request = JSON.parse(line) as RpcRequest;
  } catch (error) {
    sendError(null, -32700, "Parse error");
    return;
  }

  try {
    const result = await handleRequest(request);
    if (request.id !== undefined) send({ jsonrpc: "2.0", id: request.id, result });
  } catch (error) {
    if (request.id !== undefined) {
      sendError(request.id, -32000, error instanceof Error ? error.message : String(error));
    }
  }
});

async function handleRequest(request: RpcRequest): Promise<unknown> {
  switch (request.method) {
    case "initialize":
      return {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "pilly-repo-mcp", version: "0.1.0" },
      };
    case "notifications/initialized":
      return {};
    case "tools/list":
      return {
        tools: Array.from(tools.values()).map(({ run: _run, ...definition }) => definition),
      };
    case "tools/call":
      return callTool(request.params ?? {});
    case "ping":
      return {};
    default:
      throw new Error(`Unsupported method: ${request.method}`);
  }
}

async function callTool(params: Record<string, unknown>): Promise<ToolResult> {
  const name = String(params.name ?? "");
  const tool = tools.get(name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  const args = isRecord(params.arguments) ? params.arguments : {};
  const data = await tool.run(args);
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function send(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function sendError(id: string | number | null | undefined, code: number, message: string): void {
  send({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
}
