import type { AppError, AppErrorCode, Result } from '@shared/types';

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });

export const err = (
  code: AppErrorCode,
  message: string,
  details?: unknown
): Result<never> => ({
  ok: false,
  error: { code, message, details } satisfies AppError
});
