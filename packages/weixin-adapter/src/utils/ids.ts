import crypto from "node:crypto";

export function normalizeAccountId(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("accountId is required");
  }

  const normalized = trimmed
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!normalized) {
    throw new Error(`accountId "${value}" cannot be normalized`);
  }

  return normalized;
}

export function generateClientId(prefix = "kian-weixin"): string {
  return `${prefix}:${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

export function buildContextTokenKey(accountId: string, userId: string): string {
  return `${accountId}:${userId}`;
}
