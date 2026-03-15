import { describe, expect, it } from "vitest";
import type { McpServerDTO } from "../../src/shared/types";
import {
  buildMcpServerSignature,
  getMcpToolIdentifier,
  parseCommandString,
} from "../../electron/main/services/mcpRuntime";

const createServer = (overrides: Partial<McpServerDTO> = {}): McpServerDTO => ({
  id: "1",
  name: "Filesystem MCP",
  transport: "stdio",
  enabled: true,
  command: "npx -y @modelcontextprotocol/server-filesystem",
  args: ["/tmp/demo"],
  cwd: "",
  env: {
    B: "2",
    A: "1",
  },
  url: "",
  headers: {},
  createdAt: "2026-03-08T00:00:00.000Z",
  updatedAt: "2026-03-08T00:00:00.000Z",
  ...overrides,
});

describe("mcpRuntime helpers", () => {
  it("parses shell-style command strings", () => {
    expect(
      parseCommandString(
        `npx -y "@modelcontextprotocol/server-filesystem" '/tmp/my dir'`,
      ),
    ).toEqual([
      "npx",
      "-y",
      "@modelcontextprotocol/server-filesystem",
      "/tmp/my dir",
    ]);
  });

  it("builds stable signatures from enabled servers only", () => {
    const signature = buildMcpServerSignature([
      createServer({
        id: "2",
        enabled: false,
      }),
      createServer({
        id: "1",
        headers: {
          Z: "last",
          A: "first",
        },
      }),
    ]);

    expect(signature).toContain('"id":"1"');
    expect(signature).not.toContain('"id":"2"');
    expect(signature).toContain('"env":[["A","1"],["B","2"]]');
    expect(signature).toContain('"headers":[["A","first"],["Z","last"]]');
  });

  it("creates collision-resistant MCP tool identifiers", () => {
    expect(
      getMcpToolIdentifier(createServer({ id: "9" }), "Read Project Files"),
    ).toBe("mcp__server_9__read_project_files");
  });
});
