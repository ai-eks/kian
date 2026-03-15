import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppOperationEvent, ProjectDTO } from "../../src/shared/types";
import { appOperationEvents } from "../../electron/main/services/appOperationEvents";
import { createAppOperationTools } from "../../electron/main/services/appOperationMcpServer";
import { repositoryService } from "../../electron/main/services/repositoryService";

vi.mock("../../electron/main/services/repositoryService", () => ({
  repositoryService: {
    listProjects: vi.fn(),
    createProject: vi.fn(),
  },
}));

const mockedRepositoryService = vi.mocked(repositoryService);

const createProjectDto = (
  overrides: Partial<ProjectDTO> = {},
): ProjectDTO => ({
  id: "agent-a",
  name: "阿青",
  description: "内容策划 Agent",
  cover: null,
  createdAt: "2026-03-10T10:00:00.000Z",
  updatedAt: "2026-03-10T10:00:00.000Z",
  ...overrides,
});

describe("createAppOperationTools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("CreateAgent no longer exposes auto-open params and does not navigate", async () => {
    const events: AppOperationEvent[] = [];
    const dispose = appOperationEvents.on((event) => {
      events.push(event);
    });
    const createdProject = createProjectDto();
    mockedRepositoryService.createProject.mockResolvedValue(createdProject);

    try {
      const tool = createAppOperationTools("current-agent", "main").find(
        (item) => item.name === "CreateAgent",
      );

      expect(tool).toBeDefined();
      const schema = tool?.parameters as {
        properties?: Record<string, unknown>;
      };
      expect(schema.properties).not.toHaveProperty("open_after_create");
      expect(schema.properties).not.toHaveProperty("module");

      const result = await tool!.handler({
        name: "阿青",
        description: "内容策划 Agent",
      });

      expect(mockedRepositoryService.createProject).toHaveBeenCalledWith({
        name: "阿青",
        description: "内容策划 Agent",
        source: "agent",
      });
      expect(events).toEqual([]);
      expect(result).toEqual({
        text: [
          "Agent 已创建：阿青 (agent-a)",
          "Agent ID（工作区目录）：agent-a",
          "如果用户没有明确指定目标 Agent，后续任务默认继续由主 Agent 处理。",
          "如需进入该 Agent 工作区，请调用 OpenAgent。",
        ].join("\n"),
      });
    } finally {
      dispose();
    }
  });

  it("OpenAgent resolves the target agent and emits navigate event", async () => {
    const events: AppOperationEvent[] = [];
    const dispose = appOperationEvents.on((event) => {
      events.push(event);
    });
    mockedRepositoryService.listProjects.mockResolvedValue([
      createProjectDto(),
      createProjectDto({
        id: "agent-b",
        name: "小白",
        updatedAt: "2026-03-09T10:00:00.000Z",
      }),
    ]);

    try {
      const tool = createAppOperationTools("current-agent", "main").find(
        (item) => item.name === "OpenAgent",
      );

      expect(tool).toBeDefined();

      const result = await tool!.handler({ agent: "阿青" });

      expect(events).toEqual([
        {
          type: "navigate",
          projectId: "agent-a",
          module: "docs",
        },
      ]);
      expect(result).toEqual({
        text: "已打开 Agent 阿青 (agent-a)，并切换到 文档 模块。",
      });
    } finally {
      dispose();
    }
  });
});
