import { describe, expect, it } from "vitest";

import { resolveTranslationState } from "../../src/renderer/i18n/translationState";

describe("resolveTranslationState", () => {
  it("keeps the original source text when the DOM still contains the last translated value", () => {
    const existingState = {
      source: "设置",
      translated: "Settings",
    };

    expect(
      resolveTranslationState("en-US", "Settings", existingState),
    ).toEqual(existingState);
  });

  it("refreshes the source text when the DOM value changes externally", () => {
    const existingState = {
      source: "法外狂徒张三",
      translated: "法外狂徒张三",
    };

    expect(
      resolveTranslationState("en-US", "健身教练潘老师", existingState),
    ).toEqual({
      source: "健身教练潘老师",
      translated: "健身教练潘老师",
    });
  });

  it("refreshes attribute values with the new source text instead of reusing stale cache", () => {
    const existingState = {
      source: "删除",
      translated: "Delete",
    };

    expect(
      resolveTranslationState("en-US", "关闭", existingState),
    ).toEqual({
      source: "关闭",
      translated: "Close",
    });
  });
});
