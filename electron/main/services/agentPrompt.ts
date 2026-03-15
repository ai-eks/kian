import { renderDefaultSystemPromptTemplate } from "./systemPromptTemplate";

export type SessionContextFile = {
  fileName: string;
  title: string;
  content: string;
};

type BuildSessionSystemPromptInput = {
  contextFiles?: SessionContextFile[];
  runtimeEnvironmentSection?: string;
  contextSnapshotSection?: string;
  softwareInfoSection?: string;
};

const getContextFileContent = (
  files: SessionContextFile[] | undefined,
  fileName: string,
): string | undefined =>
  files?.find((item) => item.fileName === fileName)?.content;

export const buildSessionSystemPrompt = (
  template: string | undefined,
  input: BuildSessionSystemPromptInput = {},
): string =>
  renderDefaultSystemPromptTemplate(template?.trim() ?? "", {
    runtimeEnvironment: input.runtimeEnvironmentSection,
    contextSnapshot: input.contextSnapshotSection,
    softwareInfo: input.softwareInfoSection,
    identity: getContextFileContent(input.contextFiles, "IDENTITY.md"),
    soul: getContextFileContent(input.contextFiles, "SOUL.md"),
    user: getContextFileContent(input.contextFiles, "USER.md"),
  });
