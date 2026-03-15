import type { AppErrorCode, Result } from '@shared/types';

export class IpcResultError extends Error {
  readonly code: AppErrorCode;
  readonly details?: unknown;

  constructor(input: { code: AppErrorCode; message: string; details?: unknown }) {
    super(input.message);
    this.name = 'IpcResultError';
    this.code = input.code;
    this.details = input.details;
  }
}

export const unwrap = <T>(result: Result<T>): T => {
  if (!result.ok) {
    throw new IpcResultError(result.error);
  }
  return result.data;
};
