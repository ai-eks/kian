const TOOL_NAME_FALLBACK = "工具";

const splitToolWords = (value: string): string[] => {
  const normalized = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_\-\s]+/g, " ")
    .trim();
  return normalized.length > 0
    ? normalized.split(" ").filter((item) => item.length > 0)
    : [];
};

const normalizeMcpToolName = (rawName: string): string => {
  const trimmed = rawName.trim();
  if (!trimmed) return "";

  if (trimmed.toLowerCase().startsWith("mcp__")) {
    const parts = trimmed.split("__").filter(Boolean);
    if (parts.length >= 3) {
      return parts.slice(2).join("__").trim();
    }
    if (parts.length > 0) {
      return parts[parts.length - 1].trim();
    }
    return "";
  }

  return trimmed.replace(/^mcp(?=[A-Z_\-\s]|$)/, "").trim();
};

export const toFriendlyToolName = (rawName: string): string => {
  const normalized = normalizeMcpToolName(rawName);
  if (!normalized) return TOOL_NAME_FALLBACK;

  const words = splitToolWords(normalized);
  if (words.length === 0) return TOOL_NAME_FALLBACK;

  return words
    .map((word) => {
      if (!/[a-zA-Z]/.test(word)) return word;
      if (/^[A-Z0-9]+$/.test(word)) return word;
      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(" ");
};

export const getToolEmoji = (rawName: string): string => {
  const normalized = normalizeMcpToolName(rawName).toLowerCase();
  if (!normalized) return "🛠️";
  if (/(read|get|list|query|search|fetch|find|open|读取|查询|搜索)/.test(normalized)) {
    return "🔍";
  }
  if (/(write|create|update|edit|save|append|set|写入|创建|更新|编辑)/.test(normalized)) {
    return "✍️";
  }
  if (/(delete|remove|clear|cleanup|unlink|删除|清理)/.test(normalized)) {
    return "🗑️";
  }
  if (/(run|exec|execute|shell|command|bash|script|terminal|命令|执行)/.test(normalized)) {
    return "⚙️";
  }
  if (/(test|lint|check|validate|测试|校验|检查)/.test(normalized)) {
    return "✅";
  }
  if (/(summary|report|analyze|分析|摘要|报告)/.test(normalized)) {
    return "🧾";
  }
  return "🛠️";
};
