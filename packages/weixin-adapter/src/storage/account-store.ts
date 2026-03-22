import fs from "node:fs/promises";
import path from "node:path";

import { normalizeAccountId } from "../utils/ids.js";
import type { WeixinAdapterLogger } from "../utils/logger.js";
import { createLogger } from "../utils/logger.js";
import { resolveWeixinAdapterStateDir } from "./state-dir.js";

export const DEFAULT_BASE_URL = "https://ilinkai.weixin.qq.com";
export const DEFAULT_CDN_BASE_URL = "https://novac2c.cdn.weixin.qq.com/c2c";

export interface WeixinAccountRecord {
  accountId: string;
  rawAccountId: string;
  token: string;
  baseUrl: string;
  cdnBaseUrl: string;
  userId?: string;
  savedAt: string;
  metadata?: Record<string, unknown>;
}

export interface SaveWeixinAccountInput {
  accountId: string;
  rawAccountId?: string;
  token: string;
  baseUrl?: string;
  cdnBaseUrl?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

type SyncState = {
  get_updates_buf: string;
};

export class FileWeixinAccountStore {
  private readonly stateDir: string;
  private readonly logger: WeixinAdapterLogger;

  constructor(options?: { stateDir?: string; logger?: WeixinAdapterLogger }) {
    this.stateDir = resolveWeixinAdapterStateDir(options?.stateDir);
    this.logger = options?.logger ?? createLogger();
  }

  getStateDir(): string {
    return this.stateDir;
  }

  async saveAccount(input: SaveWeixinAccountInput): Promise<WeixinAccountRecord> {
    const normalizedAccountId = normalizeAccountId(input.accountId);
    const record: WeixinAccountRecord = {
      accountId: normalizedAccountId,
      rawAccountId: input.rawAccountId?.trim() || input.accountId.trim(),
      token: input.token.trim(),
      baseUrl: input.baseUrl?.trim() || DEFAULT_BASE_URL,
      cdnBaseUrl: input.cdnBaseUrl?.trim() || DEFAULT_CDN_BASE_URL,
      savedAt: new Date().toISOString(),
      ...(input.userId?.trim() ? { userId: input.userId.trim() } : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
    };

    if (!record.token) {
      throw new Error(`token is required for account ${normalizedAccountId}`);
    }

    await fs.mkdir(this.resolveAccountsDir(), { recursive: true });
    const filePath = this.resolveAccountPath(normalizedAccountId);
    await fs.writeFile(filePath, `${JSON.stringify(record, null, 2)}\n`, "utf-8");
    await this.tryChmod600(filePath);
    this.logger.debug(`saved account ${normalizedAccountId} at ${filePath}`);
    return record;
  }

  async loadAccount(accountId: string): Promise<WeixinAccountRecord | null> {
    const normalizedAccountId = normalizeAccountId(accountId);
    const filePath = this.resolveAccountPath(normalizedAccountId);
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      return JSON.parse(raw) as WeixinAccountRecord;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async listAccounts(): Promise<WeixinAccountRecord[]> {
    try {
      const entries = await fs.readdir(this.resolveAccountsDir(), { withFileTypes: true });
      const accountFiles = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && !entry.name.endsWith(".sync.json"))
        .map((entry) => this.resolveAccountsDir(entry.name));

      const records = await Promise.all(
        accountFiles.map(async (filePath) => {
          const raw = await fs.readFile(filePath, "utf-8");
          return JSON.parse(raw) as WeixinAccountRecord;
        }),
      );

      return records.sort((left, right) => left.accountId.localeCompare(right.accountId));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  async removeAccount(accountId: string): Promise<void> {
    const normalizedAccountId = normalizeAccountId(accountId);
    await Promise.allSettled([
      fs.unlink(this.resolveAccountPath(normalizedAccountId)),
      fs.unlink(this.resolveSyncStatePath(normalizedAccountId)),
    ]);
    this.logger.debug(`removed account ${normalizedAccountId}`);
  }

  async saveSyncBuffer(accountId: string, getUpdatesBuf: string): Promise<void> {
    const normalizedAccountId = normalizeAccountId(accountId);
    await fs.mkdir(this.resolveAccountsDir(), { recursive: true });
    const filePath = this.resolveSyncStatePath(normalizedAccountId);
    const payload: SyncState = { get_updates_buf: getUpdatesBuf };
    await fs.writeFile(filePath, JSON.stringify(payload), "utf-8");
    await this.tryChmod600(filePath);
  }

  async loadSyncBuffer(accountId: string): Promise<string | undefined> {
    const normalizedAccountId = normalizeAccountId(accountId);
    const filePath = this.resolveSyncStatePath(normalizedAccountId);
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      const payload = JSON.parse(raw) as Partial<SyncState>;
      return typeof payload.get_updates_buf === "string" ? payload.get_updates_buf : undefined;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return undefined;
      }
      throw error;
    }
  }

  resolveAccountPath(accountId: string): string {
    return this.resolveAccountsDir(`${normalizeAccountId(accountId)}.json`);
  }

  resolveSyncStatePath(accountId: string): string {
    return this.resolveAccountsDir(`${normalizeAccountId(accountId)}.sync.json`);
  }

  private resolveAccountsDir(childPath?: string): string {
    return childPath ? path.join(this.stateDir, "accounts", childPath) : path.join(this.stateDir, "accounts");
  }

  private async tryChmod600(filePath: string): Promise<void> {
    try {
      await fs.chmod(filePath, 0o600);
    } catch {
      this.logger.debug(`chmod 600 skipped for ${filePath}`);
    }
  }
}

export function createFileAccountStore(options?: {
  stateDir?: string;
  logger?: WeixinAdapterLogger;
}): FileWeixinAccountStore {
  return new FileWeixinAccountStore(options);
}
