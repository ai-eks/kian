import { describe, expect, it } from "vitest";
import { renderMarkdownMermaidToAscii } from "../../src/shared/utils/markdownMermaid";

describe("renderMarkdownMermaidToAscii", () => {
  it("converts mermaid fences into plain text code fences", () => {
    const output = renderMarkdownMermaidToAscii(`前置文本

\`\`\`mermaid
graph LR
  A --> B
\`\`\`

后置文本`);

    expect(output).toContain("```text");
    expect(output).not.toContain("```mermaid");
    expect(output).toContain("A");
    expect(output).toContain("B");
    expect(output).toContain("后置文本");
  });

  it("keeps original markdown when mermaid rendering fails", () => {
    const input = `\`\`\`mermaid
not-a-valid-mermaid
\`\`\``;

    expect(renderMarkdownMermaidToAscii(input)).toBe(input);
  });
});
