import { describe, expect, it } from "vitest";
import type { ChatMessageDTO } from "../../src/shared/types";
import {
  buildUserRequestMetadataJson,
  extractUserRequestIdFromMetadataJson,
  hasPersistedPendingUserMessage,
} from "../../src/shared/utils/chatPendingMessage";

const buildMessage = (
  overrides: Partial<ChatMessageDTO> = {},
): ChatMessageDTO => ({
  id: overrides.id ?? "m1",
  sessionId: overrides.sessionId ?? "s1",
  role: overrides.role ?? "user",
  content: overrides.content ?? "默认消息",
  metadataJson: overrides.metadataJson,
  createdAt: overrides.createdAt ?? "2026-03-10T10:00:00.000Z",
  toolCallJson: overrides.toolCallJson,
});

describe("chatPendingMessage", () => {
  it("extracts requestId from user request metadata", () => {
    const metadataJson = buildUserRequestMetadataJson("req-1");
    expect(extractUserRequestIdFromMetadataJson(metadataJson)).toBe("req-1");
  });

  it("matches pending and persisted user messages by requestId", () => {
    const requestId = "req-attachment-1";
    const pendingMessage = buildMessage({
      id: "pending-user-req-attachment-1",
      content:
        "基于这个性格测试报告，创建一个设定完全符合的子智能体。\n\n@[file](/Users/lei/Downloads/拯 张 Results.pdf)",
      metadataJson: buildUserRequestMetadataJson(requestId),
    });
    const persistedMessage = buildMessage({
      id: "persisted-user-1",
      content:
        "基于这个性格测试报告，创建一个设定完全符合的子智能体。\n\n@[file](/Users/lei/Projects/vivid/.kian/main-agent/files/user_files/拯 张 Results.pdf)",
      metadataJson: buildUserRequestMetadataJson(requestId),
      createdAt: "2026-03-10T10:00:01.000Z",
    });

    expect(
      hasPersistedPendingUserMessage([persistedMessage], pendingMessage),
    ).toBe(true);
  });

  it("falls back to normalized attachment comparison for older messages", () => {
    const pendingMessage = buildMessage({
      id: "pending-user-legacy",
      content:
        "请读取附件\n\n@[attachment](/Users/lei/Downloads/demo/report.pdf)",
    });
    const persistedMessage = buildMessage({
      id: "persisted-user-legacy",
      content:
        "请读取附件\n\n@[file](/Users/lei/Projects/vivid/.kian/main-agent/files/user_files/report.pdf)",
      createdAt: "2026-03-10T10:00:02.000Z",
    });

    expect(
      hasPersistedPendingUserMessage([persistedMessage], pendingMessage),
    ).toBe(true);
  });
});
