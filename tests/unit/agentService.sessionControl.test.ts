import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  workspaceRoot: "",
  listMessages: vi.fn(),
}));

vi.mock("electron", () => ({
  app: {
    isPackaged: false,
  },
}));

vi.mock("../../electron/main/services/workspacePaths", () => ({
  get WORKSPACE_ROOT() {
    return state.workspaceRoot;
  },
  get INTERNAL_ROOT() {
    return path.join(state.workspaceRoot, ".kian");
  },
  get GLOBAL_CONFIG_DIR() {
    return path.join(state.workspaceRoot, ".global");
  },
}));

vi.mock("../../electron/main/services/repositoryService", () => ({
  repositoryService: {
    listMessages: (...args: unknown[]) => state.listMessages(...args),
  },
}));

describe("agentService session control tools", () => {
  let tempRoot = "";

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-09T10:00:00.000Z"));
    state.listMessages.mockReset();
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "kian-agent-service-"));
    state.workspaceRoot = tempRoot;
  });

  afterEach(async () => {
    vi.useRealTimers();
    if (tempRoot) {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  it("exposes the same session reset tool for main and project agents", async () => {
    const { createSessionControlTools } = await import(
      "../../electron/main/services/agentService"
    );

    const mainTools = createSessionControlTools({
      scope: { type: "main" },
      chatSessionId: "main-session",
      agentCwd: path.join(tempRoot, ".kian", "main-agent"),
    });
    const projectTools = createSessionControlTools({
      scope: { type: "project", projectId: "p-2026-03-09-1" },
      chatSessionId: "project-session",
      agentCwd: path.join(tempRoot, "p-2026-03-09-1"),
    });

    expect(mainTools.map((tool) => tool.name)).toEqual(["NewSession"]);
    expect(projectTools.map((tool) => tool.name)).toEqual(["NewSession"]);
  });

  it("writes main agent session summaries under the main agent sessions directory", async () => {
    state.listMessages.mockResolvedValue([
      {
        id: "m1",
        sessionId: "main-session",
        role: "user",
        content: "请开启一个新的主 Agent 会话",
        createdAt: "2026-03-09T09:59:00.000Z",
      },
      {
        id: "m2",
        sessionId: "main-session",
        role: "assistant",
        content: "已整理当前上下文。",
        createdAt: "2026-03-09T09:59:30.000Z",
      },
    ]);

    const {
      createSessionControlTools,
      getSessionSummaryDir,
    } = await import("../../electron/main/services/agentService");
    const mainAgentDir = path.join(tempRoot, ".kian", "main-agent");
    const [tool] = createSessionControlTools({
      scope: { type: "main" },
      chatSessionId: "main-session",
      agentCwd: mainAgentDir,
    });

    const result = await tool.handler({
      file_title: "main-agent-reset",
      summary: "整理完当前主 Agent 上下文，准备开始新一轮任务。",
      key_points: ["保留最近任务结论"],
      next_actions: ["等待新的用户指令"],
    });

    expect(result.isError).toBeUndefined();

    const summaryDir = getSessionSummaryDir({ type: "main" }, mainAgentDir);
    const expectedFilePath = path.join(
      summaryDir,
      "2026-03-09-main-agent-reset.md",
    );

    await expect(fs.readFile(expectedFilePath, "utf8")).resolves.toContain(
      "- 会话归属：主 Agent",
    );
    await expect(fs.readFile(expectedFilePath, "utf8")).resolves.toContain(
      "整理完当前主 Agent 上下文，准备开始新一轮任务。",
    );
    expect(result.text).toContain(expectedFilePath);
  });
});
