import { detectMarkdownMediaKindFromSource } from "@shared/utils/markdownMedia";

const LOCAL_MEDIA_SCHEME_PREFIX = "kian-local://local/";
const WINDOWS_ABS = /^[a-zA-Z]:[\\/]/;
const UNSAFE_URL = /^(?:javascript|vbscript):/i;
const PASSTHROUGH_URL = /^(?:https?|file|data|blob|mailto|tel|kian-local):/i;

export type DocMediaKind = "image" | "video" | "audio" | null;

export const detectDocMediaKind = (src: string): DocMediaKind => {
  return detectMarkdownMediaKindFromSource(src);
};

export const isDocPassthroughUrl = (rawUrl: string): boolean =>
  PASSTHROUGH_URL.test(rawUrl.trim());

export const toLocalMediaUrl = (
  filePath: string,
  options?: { projectId?: string; documentPath?: string },
): string => {
  const base = `${LOCAL_MEDIA_SCHEME_PREFIX}${encodeURIComponent(filePath)}`;
  const searchParams = new URLSearchParams();
  const normalizedProjectId = options?.projectId?.trim();
  if (normalizedProjectId) {
    searchParams.set("projectId", normalizedProjectId);
  }
  const normalizedDocumentPath = options?.documentPath?.trim();
  if (normalizedDocumentPath) {
    searchParams.set("documentPath", normalizedDocumentPath);
  }
  const query = searchParams.toString();
  return query ? `${base}?${query}` : base;
};

export const resolveDocLocalUrl = (
  rawUrl: string,
  options?: { projectId?: string; documentPath?: string },
): string => {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (UNSAFE_URL.test(trimmed)) return "";
  if (isDocPassthroughUrl(trimmed)) return trimmed;
  if (trimmed.startsWith("/") || WINDOWS_ABS.test(trimmed) || trimmed.startsWith("\\\\")) {
    return toLocalMediaUrl(trimmed, options);
  }
  return toLocalMediaUrl(trimmed, options);
};
