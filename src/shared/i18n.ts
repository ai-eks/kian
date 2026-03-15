export const APP_LANGUAGES = ["zh-CN", "en-US", "ko-KR", "ja-JP"] as const;

export type AppLanguage = (typeof APP_LANGUAGES)[number];

export const DEFAULT_APP_LANGUAGE: AppLanguage = "zh-CN";

export const isAppLanguage = (value: unknown): value is AppLanguage =>
  typeof value === "string" &&
  APP_LANGUAGES.includes(value as AppLanguage);
