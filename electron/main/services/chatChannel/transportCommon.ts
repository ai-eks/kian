import type { ChatAttachmentDTO, ChatScope } from "@shared/types";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { logger } from "../logger";
import { repositoryService } from "../repositoryService";

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/bmp": ".bmp",
  "image/svg+xml": ".svg",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/mp4": ".m4a",
  "audio/m4a": ".m4a",
  "audio/aac": ".aac",
  "audio/ogg": ".ogg",
  "audio/opus": ".opus",
  "audio/flac": ".flac",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/x-msvideo": ".avi",
  "video/x-matroska": ".mkv",
  "video/webm": ".webm",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/json": ".json",
  "application/zip": ".zip",
  "application/x-zip-compressed": ".zip",
};

export type InboundProvider = "Telegram" | "Discord" | "飞书" | "企业微信";

export const CHANNEL_MAX_INBOUND_ATTACHMENTS = 20;

export interface DownloadedInboundFile {
  sourcePath: string;
  name: string;
  mimeType?: string;
  size: number;
}

export const normalizeChatId = (
  value: number | string | undefined,
): string | null => {
  if (typeof value === "number" && Number.isFinite(value))
    return String(Math.trunc(value));
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }
  return null;
};

export const normalizeMimeType = (
  value: string | undefined | null,
): string | undefined => {
  if (!value) return undefined;
  const normalized = value.split(";")[0]?.trim().toLowerCase();
  return normalized ? normalized : undefined;
};

export const normalizeExtension = (
  value: string | undefined,
): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return undefined;
  return trimmed.startsWith(".") ? trimmed : `.${trimmed}`;
};

const toSafeIncomingFileName = (input: string, fallback: string): string => {
  const normalized =
    path
      .basename(input || fallback)
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
      .replace(/\s+/g, " ")
      .trim() || fallback;
  if (normalized === "." || normalized === "..") {
    return fallback;
  }
  return normalized;
};

const getFileExtensionByMimeType = (
  mimeType: string | undefined,
): string | undefined => {
  if (!mimeType) return undefined;
  return MIME_EXTENSION_MAP[mimeType];
};

const ensureFileNameExtension = (input: {
  fileName: string;
  mimeType?: string;
  fallbackExtension?: string;
}): string => {
  const currentExtension = path.extname(input.fileName);
  if (currentExtension) return input.fileName;
  const extension =
    getFileExtensionByMimeType(input.mimeType) ??
    normalizeExtension(input.fallbackExtension);
  if (!extension) return input.fileName;
  return `${input.fileName}${extension}`;
};

const parseContentDispositionFileName = (
  headerValue: string | null,
): string | undefined => {
  if (!headerValue) return undefined;

  const encodedMatch = headerValue.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  const encodedRaw = encodedMatch?.[1]?.trim();
  if (encodedRaw) {
    const unquoted = encodedRaw.replace(/^"(.*)"$/, "$1");
    try {
      const decoded = decodeURIComponent(unquoted);
      if (decoded.trim()) return decoded.trim();
    } catch {
      if (unquoted) return unquoted;
    }
  }

  const quotedMatch = headerValue.match(/filename\s*=\s*"([^"]+)"/i);
  if (quotedMatch?.[1]?.trim()) return quotedMatch[1].trim();
  const plainMatch = headerValue.match(/filename\s*=\s*([^;]+)/i);
  const plainRaw = plainMatch?.[1]?.trim();
  if (plainRaw) {
    return plainRaw.replace(/^"(.*)"$/, "$1").trim();
  }
  return undefined;
};

const pathExists = async (targetPath: string): Promise<boolean> => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const resolveUniqueTempFilePath = async (
  directoryPath: string,
  fileName: string,
): Promise<{ absolutePath: string; finalName: string }> => {
  const extension = path.extname(fileName);
  const baseName = path.basename(fileName, extension) || "file";
  let index = 0;
  while (true) {
    const suffix = index === 0 ? "" : `-${index + 1}`;
    const finalName = `${baseName}${suffix}${extension}`;
    const absolutePath = path.join(directoryPath, finalName);
    if (!(await pathExists(absolutePath))) {
      return { absolutePath, finalName };
    }
    index += 1;
  }
};

export const createInboundTempDirectory = async (
  prefix: string,
): Promise<string> => {
  return await fs.mkdtemp(path.join(os.tmpdir(), `${prefix}-`));
};

export const cleanupInboundTempDirectory = async (
  directoryPath: string,
): Promise<void> => {
  try {
    await fs.rm(directoryPath, { recursive: true, force: true });
  } catch (error) {
    logger.warn("Failed to cleanup inbound temp directory", {
      directoryPath,
      error,
    });
  }
};

export const assertHttpOk = async (
  response: Response,
  provider: InboundProvider,
  action: string,
): Promise<void> => {
  if (response.ok) return;
  const body = await response.text().catch(() => "");
  throw new Error(
    `${provider} ${action} HTTP ${response.status}${body ? `: ${body}` : ""}`,
  );
};

export const downloadInboundFileToTemp = async (input: {
  url: string;
  provider: InboundProvider;
  action: string;
  tempDir: string;
  preferredFileName?: string;
  fallbackFileName: string;
  mimeType?: string;
  fallbackExtension?: string;
  headers?: Record<string, string>;
}): Promise<DownloadedInboundFile> => {
  const response = await fetch(input.url, {
    headers: input.headers,
  });
  await assertHttpOk(response, input.provider, input.action);

  const responseMimeType = normalizeMimeType(
    response.headers.get("content-type"),
  );
  const resolvedMimeType =
    normalizeMimeType(input.mimeType) ?? responseMimeType;
  const headerFileName = parseContentDispositionFileName(
    response.headers.get("content-disposition"),
  );
  const baseName = toSafeIncomingFileName(
    input.preferredFileName || headerFileName || input.fallbackFileName,
    input.fallbackFileName,
  );
  const normalizedName = ensureFileNameExtension({
    fileName: baseName,
    mimeType: resolvedMimeType,
    fallbackExtension: input.fallbackExtension,
  });
  const { absolutePath, finalName } = await resolveUniqueTempFilePath(
    input.tempDir,
    normalizedName,
  );
  const fileBuffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(absolutePath, fileBuffer);
  return {
    sourcePath: absolutePath,
    name: finalName,
    mimeType: resolvedMimeType,
    size: fileBuffer.byteLength,
  };
};

export const importInboundFilesToChatAttachments = async (input: {
  provider: InboundProvider;
  scope: ChatScope;
  chatId: string;
  files: DownloadedInboundFile[];
}): Promise<ChatAttachmentDTO[]> => {
  const attachments: ChatAttachmentDTO[] = [];
  for (const file of input.files.slice(0, CHANNEL_MAX_INBOUND_ATTACHMENTS)) {
    try {
      const uploaded = await repositoryService.uploadChatFiles({
        scope: input.scope,
        files: [
          {
            name: file.name,
            sourcePath: file.sourcePath,
            mimeType: file.mimeType,
            size: file.size,
          },
        ],
      });
      if (uploaded[0]) {
        attachments.push(uploaded[0]);
      }
    } catch (error) {
      logger.warn("Failed to import inbound attachment into assets", {
        provider: input.provider,
        scope: input.scope,
        chatId: input.chatId,
        fileName: file.name,
        sourcePath: file.sourcePath,
        error,
      });
    }
  }
  return attachments;
};

export const readRecordString = (
  payload: Record<string, unknown> | undefined,
  key: string,
): string | undefined => {
  const value = payload?.[key];
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

export const splitMessage = (
  input: string,
  maxLength: number,
  fallbackText = "Agent 未返回文本内容。",
): string[] => {
  const text = input.trim() || fallbackText;
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    let end = Math.min(cursor + maxLength, text.length);
    if (end < text.length) {
      const breakPoint = text.lastIndexOf("\n", end);
      if (breakPoint > cursor + Math.floor(maxLength * 0.5)) {
        end = breakPoint;
      }
    }

    if (end <= cursor) {
      end = Math.min(cursor + maxLength, text.length);
    }

    const part = text.slice(cursor, end).trim();
    if (part.length > 0) {
      chunks.push(part);
    }
    cursor = end;
  }

  return chunks.length > 0 ? chunks : ["Agent 未返回文本内容。"];
};
