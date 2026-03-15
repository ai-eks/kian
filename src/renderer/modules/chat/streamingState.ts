import { toFriendlyToolName } from "@shared/utils/toolName";

export interface ToolCallInfo {
  toolUseId: string;
  toolName: string;
  status: "starting" | "running" | "done";
  toolInput?: string;
  output?: string;
}

export type StreamingBlock =
  | {
      kind: "assistant";
      key: string;
      content: string;
      createdAt: string;
    }
  | {
      kind: "tool";
      key: string;
      createdAt: string;
      tool: ToolCallInfo;
    };

const TOOL_STATUS_PRIORITY: Record<ToolCallInfo["status"], number> = {
  starting: 0,
  running: 1,
  done: 2,
};

export const formatToolDisplayName = (rawName: string): string => {
  return toFriendlyToolName(rawName);
};

const mergeToolStatus = (
  current: ToolCallInfo["status"],
  incoming: ToolCallInfo["status"],
): ToolCallInfo["status"] =>
  TOOL_STATUS_PRIORITY[incoming] > TOOL_STATUS_PRIORITY[current]
    ? incoming
    : current;

export const normalizeToolDetailText = (
  value: string | undefined,
): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const mergeToolDetailText = (
  existing: string | undefined,
  incoming: string | undefined,
): string | undefined => {
  const next = normalizeToolDetailText(incoming);
  if (!next) return normalizeToolDetailText(existing);

  const current = normalizeToolDetailText(existing);
  if (!current) return next;
  if (current === next || current.includes(next)) return current;
  if (next.includes(current)) return next;
  return `${current}\n${next}`;
};

export const appendStreamingAssistantDelta = (
  blocks: StreamingBlock[],
  delta: string,
  createdAt: string,
  createKey: (prefix: string) => string,
): StreamingBlock[] => {
  if (!delta) return blocks;
  const last = blocks[blocks.length - 1];
  if (last?.kind === "assistant") {
    const next = [...blocks];
    next[next.length - 1] = {
      ...last,
      content: `${last.content}${delta}`,
    };
    return next;
  }
  return [
    ...blocks,
    {
      kind: "assistant",
      key: createKey("stream-assistant"),
      content: delta,
      createdAt,
    },
  ];
};

export const ensureStreamingAssistantDone = (
  blocks: StreamingBlock[],
  fullText: string | undefined,
  createdAt: string,
  createKey: (prefix: string) => string,
): StreamingBlock[] => {
  const text = fullText?.trim();
  if (!text) return blocks;
  const hasAssistant = blocks.some(
    (block) => block.kind === "assistant" && block.content.trim().length > 0,
  );
  if (hasAssistant) return blocks;
  return [
    ...blocks,
    {
      kind: "assistant",
      key: createKey("stream-assistant"),
      content: text,
      createdAt,
    },
  ];
};

export const upsertStreamingTool = (
  blocks: StreamingBlock[],
  incoming: ToolCallInfo,
  createdAt: string,
  createKey: (prefix: string) => string,
): StreamingBlock[] => {
  const normalizedIncoming: ToolCallInfo = {
    ...incoming,
    toolName: formatToolDisplayName(incoming.toolName || "工具"),
    toolInput: normalizeToolDetailText(incoming.toolInput),
    output: normalizeToolDetailText(incoming.output),
  };

  let found = false;
  let changed = false;
  const nextBlocks = blocks.map((block) => {
    if (
      block.kind !== "tool" ||
      block.tool.toolUseId !== normalizedIncoming.toolUseId
    ) {
      return block;
    }

    found = true;
    const nextStatus = mergeToolStatus(
      block.tool.status,
      normalizedIncoming.status,
    );
    const nextName = block.tool.toolName || normalizedIncoming.toolName;
    const nextToolInput = mergeToolDetailText(
      block.tool.toolInput,
      normalizedIncoming.toolInput,
    );
    const nextOutput = mergeToolDetailText(
      block.tool.output,
      normalizedIncoming.output,
    );
    if (
      nextStatus === block.tool.status &&
      nextName === block.tool.toolName &&
      nextToolInput === block.tool.toolInput &&
      nextOutput === block.tool.output
    ) {
      return block;
    }

    changed = true;
    return {
      ...block,
      tool: {
        ...block.tool,
        status: nextStatus,
        toolName: nextName,
        toolInput: nextToolInput,
        output: nextOutput,
      },
    };
  });

  if (found) {
    return changed ? nextBlocks : blocks;
  }

  return [
    ...nextBlocks,
    {
      kind: "tool",
      key: createKey("stream-tool"),
      createdAt,
      tool: normalizedIncoming,
    },
  ];
};
