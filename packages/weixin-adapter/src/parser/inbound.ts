import type { MessageItem, WeixinMessage } from "../api/types.js";
import { MessageItemType } from "../api/types.js";

export type WeixinInboundMediaKind = "image" | "video" | "file" | "voice";

export interface WeixinInboundMedia {
  kind: WeixinInboundMediaKind;
  fileName?: string;
  mimeType?: string;
  remoteUrl?: string;
  raw: MessageItem;
}

export interface WeixinInboundMessage {
  id: string;
  accountId: string;
  fromUserId: string;
  toUserId?: string;
  createTimeMs?: number;
  contextToken?: string;
  sessionId?: string;
  text?: string;
  raw: WeixinMessage;
  media?: WeixinInboundMedia[];
}

function itemText(item: MessageItem): string | undefined {
  if (item.type === MessageItemType.TEXT && item.text_item?.text) {
    return item.text_item.text;
  }

  if (item.type === MessageItemType.VOICE && item.voice_item?.text) {
    return item.voice_item.text;
  }

  return undefined;
}

function flattenText(items: MessageItem[] | undefined): string | undefined {
  if (!items?.length) {
    return undefined;
  }

  const parts = items
    .map((item) => itemText(item))
    .filter((value): value is string => Boolean(value && value.trim()));

  return parts.length > 0 ? parts.join("\n") : undefined;
}

function mediaFromItem(item: MessageItem): WeixinInboundMedia | null {
  if (item.type === MessageItemType.IMAGE) {
    return {
      kind: "image",
      mimeType: "image/*",
      raw: item,
      ...(item.image_item?.url ? { remoteUrl: item.image_item.url } : {}),
    };
  }

  if (item.type === MessageItemType.VIDEO) {
    return {
      kind: "video",
      mimeType: "video/mp4",
      raw: item,
    };
  }

  if (item.type === MessageItemType.FILE) {
    return {
      kind: "file",
      mimeType: guessMimeTypeFromFileName(item.file_item?.file_name),
      raw: item,
      ...(item.file_item?.file_name ? { fileName: item.file_item.file_name } : {}),
    };
  }

  if (item.type === MessageItemType.VOICE) {
    return {
      kind: "voice",
      mimeType: "audio/*",
      raw: item,
    };
  }

  return null;
}

export function parseInboundMessage(
  message: WeixinMessage,
  accountId: string,
): WeixinInboundMessage | null {
  const fromUserId = message.from_user_id?.trim();
  if (!fromUserId) {
    return null;
  }

  const text = flattenText(message.item_list);
  const media = (message.item_list ?? [])
    .map((item) => mediaFromItem(item))
    .filter((item): item is WeixinInboundMedia => item !== null);

  return {
    id: String(message.message_id ?? message.client_id ?? `${accountId}:${fromUserId}:${message.create_time_ms ?? Date.now()}`),
    accountId,
    fromUserId,
    ...(message.to_user_id?.trim() ? { toUserId: message.to_user_id.trim() } : {}),
    ...(typeof message.create_time_ms === "number" ? { createTimeMs: message.create_time_ms } : {}),
    ...(message.context_token?.trim() ? { contextToken: message.context_token.trim() } : {}),
    ...(message.session_id?.trim() ? { sessionId: message.session_id.trim() } : {}),
    ...(text ? { text } : {}),
    raw: message,
    ...(media.length > 0 ? { media } : {}),
  };
}

function guessMimeTypeFromFileName(fileName: string | undefined): string {
  if (!fileName) {
    return "application/octet-stream";
  }

  const lower = fileName.toLowerCase();
  if (lower.endsWith(".txt")) {
    return "text/plain";
  }
  if (lower.endsWith(".pdf")) {
    return "application/pdf";
  }
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (lower.endsWith(".png")) {
    return "image/png";
  }
  if (lower.endsWith(".mp4")) {
    return "video/mp4";
  }
  if (lower.endsWith(".mp3")) {
    return "audio/mpeg";
  }

  return "application/octet-stream";
}
