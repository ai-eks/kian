import { describe, expect, it } from "vitest";
import {
  AGENT_WORKSPACE_ROOT_PLACEHOLDER,
  GLOBAL_WORKSPACE_ROOT_PLACEHOLDER,
  formatPromptPath,
} from "../../electron/main/services/promptPathPlaceholders";

describe("formatPromptPath", () => {
  it("masks agent workspace paths before global workspace paths", () => {
    expect(
      formatPromptPath({
        filePath: "/Users/lei/KianWorkspace/.kian/main-agent/docs/USER.md",
        agentWorkspaceRoot: "/Users/lei/KianWorkspace/.kian/main-agent",
        globalWorkspaceRoot: "/Users/lei/KianWorkspace",
      }),
    ).toBe(`${AGENT_WORKSPACE_ROOT_PLACEHOLDER}/docs/USER.md`);
  });

  it("masks global workspace paths when they are outside the agent workspace", () => {
    expect(
      formatPromptPath({
        filePath: "/Users/lei/KianWorkspace/cronjob.json",
        agentWorkspaceRoot: "/Users/lei/KianWorkspace/project-a",
        globalWorkspaceRoot: "/Users/lei/KianWorkspace",
      }),
    ).toBe(`${GLOBAL_WORKSPACE_ROOT_PLACEHOLDER}/cronjob.json`);
  });

  it("returns a normalized absolute path when no placeholder matches", () => {
    expect(
      formatPromptPath({
        filePath: "/tmp/demo/../demo/project/docs/USER.md",
      }),
    ).toBe("/tmp/demo/project/docs/USER.md");
  });
});
