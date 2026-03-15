import { execFile } from 'node:child_process';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { logger } from './logger';

const execFileAsync = promisify(execFile);
const TEMP_DIR_RM_MAX_RETRIES = 5;
const TEMP_DIR_RM_RETRY_DELAY_MS = 200;

interface CodeSignatureInfo {
  identifier?: string;
  teamIdentifier?: string;
}

const extractValue = (source: string, pattern: RegExp): string | undefined => {
  const matched = source.match(pattern);
  return matched?.[1]?.trim() || undefined;
};

const readCodeSignatureInfo = async (appPath: string): Promise<CodeSignatureInfo> => {
  const { stderr } = await execFileAsync('codesign', ['-dv', '--verbose=4', appPath]);
  return {
    identifier: extractValue(stderr, /^Identifier=(.+)$/m),
    teamIdentifier: extractValue(stderr, /^TeamIdentifier=(.+)$/m)
  };
};

const findAppBundle = async (directoryPath: string): Promise<string | null> => {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.endsWith('.app')) {
      return path.join(directoryPath, entry.name);
    }
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.endsWith('.app')) continue;
    const nestedAppBundle = await findAppBundle(path.join(directoryPath, entry.name));
    if (nestedAppBundle) {
      return nestedAppBundle;
    }
  }

  return null;
};

const getCurrentAppBundlePath = (): string => path.resolve(process.execPath, '../../..');

const cleanupExtractDir = async (extractDir: string): Promise<void> => {
  try {
    await rm(extractDir, {
      recursive: true,
      force: true,
      maxRetries: TEMP_DIR_RM_MAX_RETRIES,
      retryDelay: TEMP_DIR_RM_RETRY_DELAY_MS
    });
  } catch (error) {
    logger.warn('Failed to cleanup temporary macOS update directory', {
      extractDir,
      error
    });
  }
};

export const validateDownloadedMacUpdate = async (downloadedFilePath: string): Promise<void> => {
  if (process.platform !== 'darwin') {
    return;
  }

  if (!downloadedFilePath.toLowerCase().endsWith('.zip')) {
    throw new Error('macOS 自动更新包不是 ZIP 文件，请重新下载后再试。');
  }

  const extractDir = await mkdtemp(path.join(tmpdir(), 'kian-update-'));
  try {
    await execFileAsync('ditto', ['-x', '-k', downloadedFilePath, extractDir]);

    const downloadedAppBundlePath = await findAppBundle(extractDir);
    if (!downloadedAppBundlePath) {
      throw new Error('未在更新包中找到应用程序，无法继续自动安装。');
    }

    await execFileAsync('codesign', ['--verify', '--deep', '--strict', '--verbose=2', downloadedAppBundlePath]);

    const currentAppBundlePath = getCurrentAppBundlePath();
    const [currentSignature, nextSignature] = await Promise.all([
      readCodeSignatureInfo(currentAppBundlePath),
      readCodeSignatureInfo(downloadedAppBundlePath)
    ]);

    if (!currentSignature.teamIdentifier) {
      throw new Error('当前安装版本缺少有效签名信息，无法安全执行增量升级，请手动下载安装最新版。');
    }

    if (!nextSignature.teamIdentifier) {
      throw new Error('下载的更新包缺少有效签名信息，已阻止自动安装，请重新发布安装包。');
    }

    if (
      currentSignature.identifier &&
      nextSignature.identifier &&
      currentSignature.identifier !== nextSignature.identifier
    ) {
      throw new Error(
        `更新包应用标识与当前安装版本不一致（${currentSignature.identifier} -> ${nextSignature.identifier}），请手动下载安装最新版。`
      );
    }

    if (currentSignature.teamIdentifier !== nextSignature.teamIdentifier) {
      throw new Error(
        `更新包签名身份与当前安装版本不一致（${currentSignature.teamIdentifier} -> ${nextSignature.teamIdentifier}），请手动下载安装最新版。`
      );
    }
  } finally {
    await cleanupExtractDir(extractDir);
  }
};
