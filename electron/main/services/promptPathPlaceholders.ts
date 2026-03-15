import path from "node:path";

export const AGENT_WORKSPACE_ROOT_PLACEHOLDER = "<AgentWorkspaceRoot>";
export const GLOBAL_WORKSPACE_ROOT_PLACEHOLDER = "<GlobalWorkspaceRoot>";

const normalizePromptPath = (input: string): string =>
  path.resolve(input).replace(/\\/g, "/").replace(/\/+$/, "");

const replacePathPrefix = (
  filePath: string,
  rootPath: string,
  placeholder: string,
): string | null => {
  const normalizedFilePath = normalizePromptPath(filePath);
  const normalizedRootPath = normalizePromptPath(rootPath);
  if (normalizedFilePath === normalizedRootPath) {
    return placeholder;
  }
  const prefix = `${normalizedRootPath}/`;
  if (!normalizedFilePath.startsWith(prefix)) {
    return null;
  }
  return `${placeholder}/${normalizedFilePath.slice(prefix.length)}`;
};

export const formatPromptPath = (input: {
  filePath: string;
  agentWorkspaceRoot?: string;
  globalWorkspaceRoot?: string;
}): string => {
  const { filePath, agentWorkspaceRoot, globalWorkspaceRoot } = input;
  if (agentWorkspaceRoot) {
    const maskedAgentPath = replacePathPrefix(
      filePath,
      agentWorkspaceRoot,
      AGENT_WORKSPACE_ROOT_PLACEHOLDER,
    );
    if (maskedAgentPath) {
      return maskedAgentPath;
    }
  }
  if (globalWorkspaceRoot) {
    const maskedGlobalPath = replacePathPrefix(
      filePath,
      globalWorkspaceRoot,
      GLOBAL_WORKSPACE_ROOT_PLACEHOLDER,
    );
    if (maskedGlobalPath) {
      return maskedGlobalPath;
    }
  }
  return normalizePromptPath(filePath);
};
