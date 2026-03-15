import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promisify } from 'node:util';

const fsState = vi.hoisted(() => ({
  mkdtemp: vi.fn<(prefix: string) => Promise<string>>(),
  readdir: vi.fn<(directoryPath: string, options?: unknown) => Promise<Array<{ isDirectory: () => boolean; name: string }>>>(),
  rm: vi.fn<(path: string, options?: unknown) => Promise<void>>()
}));

const childProcessState = vi.hoisted(() => ({
  execFile: vi.fn<(file: string, args: string[], callback: (error: Error | null, stdout?: string, stderr?: string) => void) => void>()
}));

const loggerState = vi.hoisted(() => ({
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
}));

vi.mock('node:fs/promises', () => ({
  mkdtemp: (prefix: string) => fsState.mkdtemp(prefix),
  readdir: (directoryPath: string, options?: unknown) => fsState.readdir(directoryPath, options),
  rm: (directoryPath: string, options?: unknown) => fsState.rm(directoryPath, options)
}));

vi.mock('node:child_process', () => ({
  execFile: Object.assign(
    (
    file: string,
    args: string[],
    callback: (error: Error | null, stdout?: string, stderr?: string) => void
    ) => childProcessState.execFile(file, args, callback),
    {
      [promisify.custom]: async (file: string, args: string[]) => {
        return await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
          childProcessState.execFile(file, args, (error, stdout, stderr) => {
            if (error) {
              reject(error);
              return;
            }
            resolve({
              stdout: stdout ?? '',
              stderr: stderr ?? ''
            });
          });
        });
      }
    }
  )
}));

vi.mock('../../electron/main/services/logger', () => ({
  logger: loggerState
}));

describe('updatePackageValidator', () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.resetModules();
    fsState.mkdtemp.mockReset();
    fsState.readdir.mockReset();
    fsState.rm.mockReset();
    childProcessState.execFile.mockReset();
    loggerState.warn.mockReset();
    loggerState.error.mockReset();
    loggerState.info.mockReset();
    loggerState.debug.mockReset();

    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: 'darwin'
    });

    fsState.mkdtemp.mockResolvedValue('/tmp/kian-update-test');
    fsState.readdir.mockResolvedValue([
      {
        isDirectory: () => true,
        name: 'Kian.app'
      }
    ]);
    fsState.rm.mockResolvedValue();
    childProcessState.execFile.mockImplementation((file, args, callback) => {
      if (file !== 'codesign') {
        callback(null, '', '');
        return;
      }
      if (args.includes('-dv')) {
        callback(
          null,
          '',
          ['Identifier=com.heykian.desktop', 'TeamIdentifier=TEAM123'].join('\n')
        );
        return;
      }
      callback(null, '', '');
    });
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: originalPlatform
    });
  });

  it('does not fail validation when temp directory cleanup returns ENOTEMPTY', async () => {
    fsState.rm.mockRejectedValue(Object.assign(new Error('directory not empty'), { code: 'ENOTEMPTY' }));

    const { validateDownloadedMacUpdate } = await import(
      '../../electron/main/services/updatePackageValidator'
    );

    await expect(validateDownloadedMacUpdate('/tmp/Kian-1.2.3.zip')).resolves.toBeUndefined();
    expect(fsState.rm).toHaveBeenCalledWith('/tmp/kian-update-test', {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200
    });
    expect(loggerState.warn).toHaveBeenCalledTimes(1);
  });

  it('still cleans up temp directory when signature validation fails', async () => {
    childProcessState.execFile.mockImplementation((file, args, callback) => {
      if (file !== 'codesign') {
        callback(null, '', '');
        return;
      }
      if (args.includes('-dv')) {
        const teamIdentifier = args[args.length - 1].includes('/tmp/kian-update-test')
          ? 'TEAM999'
          : 'TEAM123';
        callback(
          null,
          '',
          [`Identifier=com.heykian.desktop`, `TeamIdentifier=${teamIdentifier}`].join('\n')
        );
        return;
      }
      callback(null, '', '');
    });

    const { validateDownloadedMacUpdate } = await import(
      '../../electron/main/services/updatePackageValidator'
    );

    await expect(validateDownloadedMacUpdate('/tmp/Kian-1.2.3.zip')).rejects.toThrow(
      '更新包签名身份与当前安装版本不一致'
    );
    expect(fsState.rm).toHaveBeenCalledTimes(1);
    expect(loggerState.warn).not.toHaveBeenCalled();
  });
});
