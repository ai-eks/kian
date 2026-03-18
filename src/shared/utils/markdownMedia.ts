export type MarkdownMediaKind = "image" | "video" | "audio";

export const MARKDOWN_IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
  ".avif",
  ".heic",
  ".heif",
]);

export const MARKDOWN_VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".mov",
  ".m4v",
  ".webm",
  ".avi",
  ".mkv",
  ".flv",
  ".wmv",
  ".m3u8",
]);

export const MARKDOWN_AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".wav",
  ".m4a",
  ".aac",
  ".flac",
  ".ogg",
  ".opus",
]);

const REMOTE_MEDIA_URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;
const MARKDOWN_DESTINATION_PATTERN = /\]\(([^)\n]+)\)/g;
const FENCE_PATTERN = /^(`{3,}|~{3,})/;
const UNSAFE_URL_PATTERN = /^(?:javascript|vbscript):/i;

const stripWrappedSource = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed.slice(1, -1).trim();
  }
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const getFileExtension = (fileName: string): string => {
  const index = fileName.lastIndexOf(".");
  if (index <= 0 || index === fileName.length - 1) {
    return "";
  }
  return fileName.slice(index).toLowerCase();
};

const splitSourceSuffix = (value: string): { path: string; suffix: string } => {
  const hashIndex = value.indexOf("#");
  const queryIndex = value.indexOf("?");
  const suffixIndex =
    hashIndex < 0
      ? queryIndex
      : queryIndex < 0
        ? hashIndex
        : Math.min(hashIndex, queryIndex);

  if (suffixIndex < 0) {
    return { path: value, suffix: "" };
  }

  return {
    path: value.slice(0, suffixIndex),
    suffix: value.slice(suffixIndex),
  };
};

const countChar = (value: string, target: string): number =>
  Array.from(value).reduce(
    (total, current) => total + (current === target ? 1 : 0),
    0,
  );

const trimTrailingMediaUrlPunctuation = (
  value: string,
): { url: string; suffix: string } => {
  let normalized = value;
  let suffix = "";

  while (/[.,!?;:，。！？；：]+$/.test(normalized)) {
    suffix = normalized.slice(-1) + suffix;
    normalized = normalized.slice(0, -1);
  }
  while (
    normalized.endsWith(")") &&
    countChar(normalized, ")") > countChar(normalized, "(")
  ) {
    suffix = ")" + suffix;
    normalized = normalized.slice(0, -1);
  }
  while (
    normalized.endsWith("]") &&
    countChar(normalized, "]") > countChar(normalized, "[")
  ) {
    suffix = "]" + suffix;
    normalized = normalized.slice(0, -1);
  }

  return { url: normalized, suffix };
};

export const detectMarkdownMediaKindFromSource = (
  source: string,
): MarkdownMediaKind | null => {
  const normalized = stripWrappedSource(source);
  if (!normalized || UNSAFE_URL_PATTERN.test(normalized)) {
    return null;
  }
  if (/^data:image\//i.test(normalized)) return "image";
  if (/^data:video\//i.test(normalized)) return "video";
  if (/^data:audio\//i.test(normalized)) return "audio";

  const { path } = splitSourceSuffix(normalized);
  let extensionSource = path;
  if (/^(?:https?|file|blob):/i.test(path)) {
    try {
      extensionSource = new URL(path).pathname;
    } catch {
      extensionSource = path;
    }
  }

  const extension = getFileExtension(extensionSource);
  if (MARKDOWN_IMAGE_EXTENSIONS.has(extension)) return "image";
  if (MARKDOWN_VIDEO_EXTENSIONS.has(extension)) return "video";
  if (MARKDOWN_AUDIO_EXTENSIONS.has(extension)) return "audio";
  return null;
};

const replaceRemoteMediaUrlsInLine = (
  line: string,
  buildMarkdown: (kind: MarkdownMediaKind, url: string) => string,
): string => {
  const protectedRanges = Array.from(
    line.matchAll(MARKDOWN_DESTINATION_PATTERN),
  ).map((match) => {
    const fullMatch = match[0];
    const matchIndex = match.index ?? -1;
    const pathIndex = fullMatch.indexOf("(");
    const path = match[1] ?? "";
    return {
      start: matchIndex + pathIndex + 1,
      end: matchIndex + pathIndex + 1 + path.length,
    };
  });

  return line.replace(REMOTE_MEDIA_URL_PATTERN, (match, offset, source) => {
    const index = typeof offset === "number" ? offset : source.indexOf(match);
    if (protectedRanges.some((range) => index >= range.start && index < range.end)) {
      return match;
    }

    const { url, suffix } = trimTrailingMediaUrlPunctuation(match);
    const kind = detectMarkdownMediaKindFromSource(url);
    if (!kind) {
      return match;
    }
    return `${buildMarkdown(kind, url)}${suffix}`;
  });
};

export const rewriteBareRemoteMediaUrlsInMarkdown = (
  content: string,
  buildMarkdown: (kind: MarkdownMediaKind, url: string) => string,
): string => {
  if (!content.trim()) return content;

  let inFenceBlock = false;
  return content
    .split("\n")
    .map((line) => {
      const trimmed = line.trimStart();
      if (FENCE_PATTERN.test(trimmed)) {
        inFenceBlock = !inFenceBlock;
        return line;
      }
      if (inFenceBlock) {
        return line;
      }
      return replaceRemoteMediaUrlsInLine(line, buildMarkdown);
    })
    .join("\n");
};
