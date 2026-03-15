import { api } from "@renderer/lib/api";
import {
  APP_LANGUAGES,
  DEFAULT_APP_LANGUAGE,
  type AppLanguage,
} from "@shared/i18n";
import { setDefaultDateTimeLocale } from "@shared/utils/dateTime";
import { useQuery } from "@tanstack/react-query";
import type { Locale } from "antd/es/locale";
import enUS from "antd/locale/en_US";
import jaJP from "antd/locale/ja_JP";
import koKR from "antd/locale/ko_KR";
import zhCN from "antd/locale/zh_CN";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type PropsWithChildren,
} from "react";
import { translateUiText } from "./uiTranslations";

type AppI18nContextValue = {
  language: AppLanguage;
  antdLocale: Locale;
};

const ATTRIBUTES_TO_TRANSLATE = ["placeholder", "title", "aria-label", "alt"];
const BLOCKED_TEXT_TAGS = new Set(["SCRIPT", "STYLE", "CODE", "PRE"]);
const BLOCKED_ATTRIBUTE_TAGS = new Set(["SCRIPT", "STYLE", "CODE", "PRE"]);
const BLOCKED_CLASS_NAMES = [
  "chat-markdown",
  "markdown-code-block",
  "markdown-mermaid-block",
  "i18n-no-translate",
];
const ANTD_LOCALES: Record<AppLanguage, Locale> = {
  "zh-CN": zhCN,
  "en-US": enUS,
  "ko-KR": koKR,
  "ja-JP": jaJP,
};

const AppI18nContext = createContext<AppI18nContextValue>({
  language: DEFAULT_APP_LANGUAGE,
  antdLocale: ANTD_LOCALES[DEFAULT_APP_LANGUAGE],
});

const isTranslatableLanguage = (value: unknown): value is AppLanguage =>
  typeof value === "string" &&
  APP_LANGUAGES.includes(value as AppLanguage);

const hasBlockedClassName = (element: Element): boolean =>
  BLOCKED_CLASS_NAMES.some((className) => element.classList.contains(className));

const shouldSkipTextElement = (element: Element | null): boolean => {
  if (!element) return false;
  if (BLOCKED_TEXT_TAGS.has(element.tagName)) return true;
  if ((element as HTMLElement).isContentEditable) return true;
  if (hasBlockedClassName(element)) return true;
  return shouldSkipTextElement(element.parentElement);
};

const shouldSkipAttributeElement = (element: Element | null): boolean => {
  if (!element) return false;
  if (BLOCKED_ATTRIBUTE_TAGS.has(element.tagName)) return true;
  if ((element as HTMLElement).isContentEditable) return true;
  if (hasBlockedClassName(element)) return true;
  return shouldSkipAttributeElement(element.parentElement);
};

const translateDocumentText = (
  language: AppLanguage,
  textNodes: WeakMap<Text, string>,
  attributeValues: WeakMap<Element, Map<string, string>>,
  root: ParentNode,
): void => {
  const applyToTextNode = (node: Text) => {
    if (shouldSkipTextElement(node.parentElement)) return;
    const original = textNodes.get(node) ?? node.textContent ?? "";
    if (!textNodes.has(node)) {
      textNodes.set(node, original);
    }
    const translated = translateUiText(language, original);
    if (node.textContent !== translated) {
      node.textContent = translated;
    }
  };

  const applyToAttributes = (element: Element) => {
    if (shouldSkipAttributeElement(element)) return;
    const originalMap = attributeValues.get(element) ?? new Map<string, string>();
    for (const attribute of ATTRIBUTES_TO_TRANSLATE) {
      const currentValue = element.getAttribute(attribute);
      if (currentValue === null) continue;
      if (!originalMap.has(attribute)) {
        originalMap.set(attribute, currentValue);
      }
      const translated = translateUiText(
        language,
        originalMap.get(attribute) ?? currentValue,
      );
      if (currentValue !== translated) {
        element.setAttribute(attribute, translated);
      }
    }
    if (originalMap.size > 0) {
      attributeValues.set(element, originalMap);
    }
  };

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
  );

  let currentNode: Node | null = walker.currentNode;
  while (currentNode) {
    if (currentNode.nodeType === Node.TEXT_NODE) {
      applyToTextNode(currentNode as Text);
    } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
      applyToAttributes(currentNode as Element);
    }
    currentNode = walker.nextNode();
  }
};

const UiTextTranslator = ({ language }: { language: AppLanguage }) => {
  const textNodesRef = useRef(new WeakMap<Text, string>());
  const attributeValuesRef = useRef(new WeakMap<Element, Map<string, string>>());

  useEffect(() => {
    if (!document.body) return;

    translateDocumentText(
      language,
      textNodesRef.current,
      attributeValuesRef.current,
      document.body,
    );

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData" && mutation.target instanceof Text) {
          translateDocumentText(
            language,
            textNodesRef.current,
            attributeValuesRef.current,
            mutation.target.parentElement ?? document.body,
          );
          continue;
        }

        if (mutation.type === "attributes" && mutation.target instanceof Element) {
          translateDocumentText(
            language,
            textNodesRef.current,
            attributeValuesRef.current,
            mutation.target,
          );
          continue;
        }

        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element || node instanceof Text) {
            translateDocumentText(
              language,
              textNodesRef.current,
              attributeValuesRef.current,
              node instanceof Text ? node.parentElement ?? document.body : node,
            );
          }
        });
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRIBUTES_TO_TRANSLATE,
    });

    return () => {
      observer.disconnect();
    };
  }, [language]);

  return null;
};

export const AppI18nProvider = ({ children }: PropsWithChildren) => {
  const generalConfigQuery = useQuery({
    queryKey: ["settings", "general"],
    queryFn: api.settings.getGeneralConfig,
  });

  const language = isTranslatableLanguage(generalConfigQuery.data?.language)
    ? generalConfigQuery.data.language
    : DEFAULT_APP_LANGUAGE;

  useEffect(() => {
    setDefaultDateTimeLocale(language);
    document.documentElement.lang = language;
    document.title = translateUiText(language, "Kian - AI 短剧创作");
  }, [language]);

  const value = useMemo<AppI18nContextValue>(
    () => ({
      language,
      antdLocale: ANTD_LOCALES[language],
    }),
    [language],
  );

  return (
    <AppI18nContext.Provider value={value}>
      <UiTextTranslator language={language} />
      {children}
    </AppI18nContext.Provider>
  );
};

export const useAppI18n = (): AppI18nContextValue => useContext(AppI18nContext);
