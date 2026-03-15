import { ScrollArea } from "@renderer/components/ScrollArea";
import { renderMermaidSVG } from "beautiful-mermaid";
import { useMemo } from "react";

interface MarkdownMermaidBlockProps {
  code: string;
  variant: "editor" | "chat";
}

const MERMAID_RENDER_OPTIONS = {
  bg: "var(--mermaid-bg)",
  fg: "var(--mermaid-fg)",
  line: "var(--mermaid-line)",
  accent: "var(--mermaid-accent)",
  muted: "var(--mermaid-muted)",
  surface: "var(--mermaid-surface)",
  border: "var(--mermaid-border)",
  font: "system-ui, sans-serif",
  padding: 24,
  nodeSpacing: 28,
  layerSpacing: 40,
  componentSpacing: 28,
  transparent: true,
} as const;

export const MarkdownMermaidBlock = ({
  code,
  variant,
}: MarkdownMermaidBlockProps) => {
  const rendered = useMemo(() => {
    try {
      return {
        svg: renderMermaidSVG(code.trim(), MERMAID_RENDER_OPTIONS),
        error: null,
      };
    } catch (error) {
      return {
        svg: "",
        error: error instanceof Error ? error.message : "未知 Mermaid 渲染错误",
      };
    }
  }, [code]);

  if (rendered.error) {
    return (
      <div
        className={`markdown-mermaid-block markdown-mermaid-block--${variant} markdown-mermaid-block--error`}
      >
        <div className="markdown-mermaid-block__error">{rendered.error}</div>
        <pre className="markdown-mermaid-block__fallback">
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className={`markdown-mermaid-block markdown-mermaid-block--${variant}`}>
      <ScrollArea className="markdown-mermaid-block__scroll markdown-code-scroll">
        <div
          className="markdown-mermaid-block__canvas"
          dangerouslySetInnerHTML={{ __html: rendered.svg }}
        />
      </ScrollArea>
    </div>
  );
};
