import { MarkdownCodeBlock } from "@renderer/components/MarkdownCodeBlock";
import { MarkdownMermaidBlock } from "@renderer/components/MarkdownMermaidBlock";
import { isValidElement, useMemo, type ReactNode } from "react";

interface MarkdownPreBlockProps {
  children: ReactNode;
  variant: "editor" | "chat";
}

const extractTextFromReactNode = (node: ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map((item) => extractTextFromReactNode(item)).join("");
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractTextFromReactNode(node.props.children ?? "");
  }
  return "";
};

const extractCodeClassName = (node: ReactNode): string | undefined => {
  if (Array.isArray(node)) {
    for (const item of node) {
      const className = extractCodeClassName(item);
      if (className) return className;
    }
    return undefined;
  }
  if (isValidElement<{ className?: string; children?: ReactNode }>(node)) {
    if (
      typeof node.props.className === "string" &&
      node.props.className.includes("language-")
    ) {
      return node.props.className;
    }
    return extractCodeClassName(node.props.children ?? "");
  }
  return undefined;
};

const normalizeCodeSource = (node: ReactNode): string =>
  extractTextFromReactNode(node).replace(/\n$/, "");

const isMermaidLanguage = (className?: string): boolean =>
  /(?:^|\s)language-mermaid(?:\s|$)/i.test(className ?? "");

export const MarkdownPreBlock = ({
  children,
  variant,
}: MarkdownPreBlockProps) => {
  const className = useMemo(() => extractCodeClassName(children), [children]);
  const source = useMemo(() => normalizeCodeSource(children), [children]);

  if (isMermaidLanguage(className)) {
    return <MarkdownMermaidBlock code={source} variant={variant} />;
  }

  return <MarkdownCodeBlock variant={variant}>{children}</MarkdownCodeBlock>;
};
