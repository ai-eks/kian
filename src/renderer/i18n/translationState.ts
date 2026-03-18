import type { AppLanguage } from "@shared/i18n";

import { translateUiText } from "./uiTranslations";

export type TranslationState = {
  source: string;
  translated: string;
};

export const resolveTranslationState = (
  language: AppLanguage,
  currentValue: string,
  existingState?: TranslationState,
): TranslationState => {
  const sourceValue =
    existingState && currentValue === existingState.translated
      ? existingState.source
      : currentValue;

  return {
    source: sourceValue,
    translated: translateUiText(language, sourceValue),
  };
};
