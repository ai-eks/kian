import { DEFAULT_APP_LANGUAGE, type AppLanguage } from "@shared/i18n";

type DateTimeInput = string | number | Date;

type FormatUtcTimestampToLocalOptions = {
  fallback?: string;
  includeSeconds?: boolean;
  locale?: string;
  timeZone?: string;
};

const ISO_TIMESTAMP_WITH_ZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

const ISO_TIMESTAMP_WITHOUT_ZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?$/;

let defaultDateTimeLocale: AppLanguage = DEFAULT_APP_LANGUAGE;

export const setDefaultDateTimeLocale = (locale: AppLanguage): void => {
  defaultDateTimeLocale = locale;
};

const parseUtcDateTime = (value: DateTimeInput): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? new Date(value) : null;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = ISO_TIMESTAMP_WITHOUT_ZONE_PATTERN.test(trimmed)
    ? `${trimmed}Z`
    : trimmed;

  if (
    !ISO_TIMESTAMP_WITH_ZONE_PATTERN.test(normalized) &&
    !ISO_TIMESTAMP_WITHOUT_ZONE_PATTERN.test(trimmed)
  ) {
    return null;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const normalizeUtcTimestamp = (
  value: unknown,
  fallback: string
): string => {
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
    return fallback;
  }

  const parsed = parseUtcDateTime(value);
  return parsed ? parsed.toISOString() : fallback;
};

export const formatUtcTimestampToLocal = (
  value: unknown,
  options: FormatUtcTimestampToLocalOptions = {}
): string => {
  const {
    fallback = '',
    includeSeconds = true,
    locale = defaultDateTimeLocale,
    timeZone
  } = options;

  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
    return fallback;
  }

  const parsed = parseUtcDateTime(value);
  if (!parsed) return fallback;

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: false,
    timeZone
  }).format(parsed);
};
