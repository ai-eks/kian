import { randomUUID } from "node:crypto";

import type { WeixinApiOptions } from "../api/api.js";
import type {
  GetBotQrCodeResp,
  GetQrCodeStatusResp,
  QrLoginStatus,
} from "../api/types.js";
import type { FileWeixinAccountStore, WeixinAccountRecord } from "../storage/account-store.js";
import {
  DEFAULT_BASE_URL,
  DEFAULT_CDN_BASE_URL,
} from "../storage/account-store.js";
import type { WeixinAdapterLogger } from "../utils/logger.js";
import { createLogger } from "../utils/logger.js";
import { redactToken } from "../utils/redact.js";
import { normalizeAccountId } from "./accounts.js";

const ACTIVE_LOGIN_TTL_MS = 5 * 60_000;
const QR_POLL_TIMEOUT_MS = 35_000;
const MAX_QR_REFRESH_COUNT = 3;
const DEFAULT_ILINK_BOT_TYPE = "3";

type ActiveLoginSession = {
  sessionKey: string;
  qrCode: string;
  qrCodeUrl: string;
  apiBaseUrl: string;
  routeTag?: string;
  startedAt: number;
};

const activeLoginSessions = new Map<string, ActiveLoginSession>();

export interface StartQrLoginOptions {
  sessionKey?: string;
  apiBaseUrl?: string;
  botType?: string;
  forceRefresh?: boolean;
  routeTag?: string;
  fetchImpl?: typeof fetch;
}

export interface WaitForQrLoginOptions {
  sessionKey: string;
  timeoutMs?: number;
  botType?: string;
  saveAccount?: boolean;
  accountStore?: FileWeixinAccountStore;
  cdnBaseUrl?: string;
  fetchImpl?: typeof fetch;
  logger?: WeixinAdapterLogger;
}

export interface WeixinQrLoginSession {
  sessionKey: string;
  qrCode: string;
  qrCodeUrl: string;
  apiBaseUrl: string;
  startedAt: number;
  expiresAt: number;
}

export interface WeixinQrLoginResult {
  connected: boolean;
  status: QrLoginStatus | "timeout" | "missing";
  message: string;
  account?: WeixinAccountRecord;
}

function isFresh(session: ActiveLoginSession): boolean {
  return Date.now() - session.startedAt < ACTIVE_LOGIN_TTL_MS;
}

function purgeExpiredSessions(): void {
  for (const [sessionKey, session] of activeLoginSessions) {
    if (!isFresh(session)) {
      activeLoginSessions.delete(sessionKey);
    }
  }
}

async function fetchQrCode(
  options: StartQrLoginOptions & {
    apiBaseUrl: string;
  },
): Promise<GetBotQrCodeResp> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = new URL(
    `ilink/bot/get_bot_qrcode?bot_type=${encodeURIComponent(options.botType ?? DEFAULT_ILINK_BOT_TYPE)}`,
    options.apiBaseUrl.endsWith("/") ? options.apiBaseUrl : `${options.apiBaseUrl}/`,
  );
  const headers: Record<string, string> = {};
  if (options.routeTag?.trim()) {
    headers.SKRouteTag = options.routeTag.trim();
  }

  const response = await fetchImpl(url.toString(), { headers });
  if (!response.ok) {
    const rawText = await response.text().catch(() => "");
    throw new Error(`failed to fetch QR code: ${response.status} ${rawText}`);
  }

  return response.json() as Promise<GetBotQrCodeResp>;
}

async function pollQrStatus(
  session: ActiveLoginSession,
  options: Pick<WaitForQrLoginOptions, "fetchImpl">,
): Promise<GetQrCodeStatusResp> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = new URL(
    `ilink/bot/get_qrcode_status?qrcode=${encodeURIComponent(session.qrCode)}`,
    session.apiBaseUrl.endsWith("/") ? session.apiBaseUrl : `${session.apiBaseUrl}/`,
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), QR_POLL_TIMEOUT_MS);
  const headers: Record<string, string> = {
    "iLink-App-ClientVersion": "1",
  };
  if (session.routeTag?.trim()) {
    headers.SKRouteTag = session.routeTag.trim();
  }

  try {
    const response = await fetchImpl(url.toString(), {
      headers,
      signal: controller.signal,
    });
    const rawText = await response.text();
    if (!response.ok) {
      throw new Error(`failed to poll QR status: ${response.status} ${rawText}`);
    }

    return JSON.parse(rawText) as GetQrCodeStatusResp;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { status: "wait" };
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function startQrLogin(options: StartQrLoginOptions = {}): Promise<WeixinQrLoginSession> {
  const sessionKey = options.sessionKey?.trim() || randomUUID();
  const apiBaseUrl = options.apiBaseUrl?.trim() || DEFAULT_BASE_URL;

  purgeExpiredSessions();

  const existing = activeLoginSessions.get(sessionKey);
  if (existing && isFresh(existing) && !options.forceRefresh) {
    return {
      sessionKey: existing.sessionKey,
      qrCode: existing.qrCode,
      qrCodeUrl: existing.qrCodeUrl,
      apiBaseUrl: existing.apiBaseUrl,
      startedAt: existing.startedAt,
      expiresAt: existing.startedAt + ACTIVE_LOGIN_TTL_MS,
    };
  }

  const qrCodeResponse = await fetchQrCode({ ...options, apiBaseUrl });
  const session: ActiveLoginSession = {
    sessionKey,
    qrCode: qrCodeResponse.qrcode,
    qrCodeUrl: qrCodeResponse.qrcode_img_content,
    apiBaseUrl,
    startedAt: Date.now(),
    ...(options.routeTag?.trim() ? { routeTag: options.routeTag.trim() } : {}),
  };

  activeLoginSessions.set(sessionKey, session);

  return {
    sessionKey,
    qrCode: session.qrCode,
    qrCodeUrl: session.qrCodeUrl,
    apiBaseUrl: session.apiBaseUrl,
    startedAt: session.startedAt,
    expiresAt: session.startedAt + ACTIVE_LOGIN_TTL_MS,
  };
}

export async function waitForQrLogin(options: WaitForQrLoginOptions): Promise<WeixinQrLoginResult> {
  const logger = options.logger ?? createLogger();
  let session = activeLoginSessions.get(options.sessionKey);

  if (!session) {
    return {
      connected: false,
      status: "missing",
      message: "no active QR login session found",
    };
  }

  const deadline = Date.now() + Math.max(options.timeoutMs ?? 8 * 60_000, 1_000);
  let refreshCount = 0;

  while (Date.now() < deadline) {
    if (!isFresh(session)) {
      activeLoginSessions.delete(options.sessionKey);
      return {
        connected: false,
        status: "expired",
        message: "QR code expired before confirmation",
      };
    }

    const statusResponse = await pollQrStatus(session, options);
    logger.debug(
      `QR status=${statusResponse.status} account=${statusResponse.ilink_bot_id ?? "(pending)"} token=${redactToken(statusResponse.bot_token)}`,
    );

    if (statusResponse.status === "wait" || statusResponse.status === "scaned") {
      await sleep(1_000);
      continue;
    }

    if (statusResponse.status === "expired") {
      refreshCount += 1;
      if (refreshCount > MAX_QR_REFRESH_COUNT) {
        activeLoginSessions.delete(options.sessionKey);
        return {
          connected: false,
          status: "expired",
          message: "QR code expired too many times",
        };
      }

      const refreshed = await startQrLogin({
        sessionKey: options.sessionKey,
        apiBaseUrl: session.apiBaseUrl,
        ...(session.routeTag ? { routeTag: session.routeTag } : {}),
        ...(options.botType ? { botType: options.botType } : {}),
        forceRefresh: true,
        ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
      });

      session = {
        sessionKey: refreshed.sessionKey,
        qrCode: refreshed.qrCode,
        qrCodeUrl: refreshed.qrCodeUrl,
        apiBaseUrl: refreshed.apiBaseUrl,
        startedAt: refreshed.startedAt,
        ...(session.routeTag ? { routeTag: session.routeTag } : {}),
      };
      continue;
    }

    if (!statusResponse.ilink_bot_id || !statusResponse.bot_token) {
      activeLoginSessions.delete(options.sessionKey);
      return {
        connected: false,
        status: "confirmed",
        message: "login confirmed but account credentials are incomplete",
      };
    }

    const accountId = normalizeAccountId(statusResponse.ilink_bot_id);
    const account: WeixinAccountRecord = {
      accountId,
      rawAccountId: statusResponse.ilink_bot_id,
      token: statusResponse.bot_token,
      baseUrl: statusResponse.baseurl?.trim() || session.apiBaseUrl || DEFAULT_BASE_URL,
      cdnBaseUrl: options.cdnBaseUrl?.trim() || DEFAULT_CDN_BASE_URL,
      savedAt: new Date().toISOString(),
      ...(statusResponse.ilink_user_id?.trim() ? { userId: statusResponse.ilink_user_id.trim() } : {}),
    };

    if (options.saveAccount !== false && options.accountStore) {
      await options.accountStore.saveAccount(account);
    }

    activeLoginSessions.delete(options.sessionKey);
    return {
      connected: true,
      status: "confirmed",
      message: "login confirmed",
      account,
    };
  }

  return {
    connected: false,
    status: "timeout",
    message: "timed out waiting for QR confirmation",
  };
}

export function getActiveQrLoginSession(sessionKey: string): WeixinQrLoginSession | null {
  const session = activeLoginSessions.get(sessionKey);
  if (!session || !isFresh(session)) {
    return null;
  }

  return {
    sessionKey: session.sessionKey,
    qrCode: session.qrCode,
    qrCodeUrl: session.qrCodeUrl,
    apiBaseUrl: session.apiBaseUrl,
    startedAt: session.startedAt,
    expiresAt: session.startedAt + ACTIVE_LOGIN_TTL_MS,
  };
}

export async function fetchQrLoginConfig(
  apiOptions: WeixinApiOptions,
  botType = DEFAULT_ILINK_BOT_TYPE,
): Promise<WeixinQrLoginSession> {
  return startQrLogin({
    apiBaseUrl: apiOptions.baseUrl,
    botType,
    ...(apiOptions.routeTag ? { routeTag: apiOptions.routeTag } : {}),
    ...(apiOptions.fetchImpl ? { fetchImpl: apiOptions.fetchImpl } : {}),
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
