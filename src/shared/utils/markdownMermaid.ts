import { renderMermaidASCII } from "beautiful-mermaid";

const MERMAID_FENCE_PATTERN = /(^|\n)```mermaid[^\n]*\n([\s\S]*?)\n```(?=\n|$)/gi;

const normalizeFenceCode = (value: string): string => value.replace(/\s+$/, "");

export const renderMarkdownMermaidToAscii = (markdown: string): string =>
  markdown.replace(
    MERMAID_FENCE_PATTERN,
    (fullMatch, leadingBreak: string, mermaidSource: string) => {
      try {
        const ascii = renderMermaidASCII(normalizeFenceCode(mermaidSource), {
          colorMode: "none",
        }).trimEnd();
        return `${leadingBreak}\`\`\`text\n${ascii}\n\`\`\``;
      } catch {
        return fullMatch;
      }
    },
  );
