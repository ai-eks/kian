import fs from "node:fs";
import path from "node:path";
import * as ts from "typescript";
import { describe, expect, it } from "vitest";
import { translateUiText } from "../../src/renderer/i18n/uiTranslations.ts";

const ROOT_DIR = process.cwd();
const RENDERER_DIR = path.join(ROOT_DIR, "src/renderer");
const TARGET_LANGUAGES = ["en-US", "ko-KR", "ja-JP"] as const;
const HAN_REGEX = /[\p{Script=Han}]/u;
const SKIPPED_LITERALS = new Set(["来自 Agent "]);
const ALLOWED_SAME_TEXT = new Set(["停止"]);

const normalizeLiteral = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const getNodeLiteral = (
  node: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral | ts.JsxText,
): string =>
  ts.isJsxText(node) ? normalizeLiteral(node.text) : node.text;

const collectSourceLiterals = (absolutePath: string): Array<{
  value: string;
  file: string;
  line: number;
}> => {
  const sourceText = fs.readFileSync(absolutePath, "utf8");
  const sourceFile = ts.createSourceFile(
    absolutePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    absolutePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const items: Array<{ value: string; file: string; line: number }> = [];

  const visit = (node: ts.Node): void => {
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isJsxText(node)
    ) {
      const value = getNodeLiteral(node);
      if (value && HAN_REGEX.test(value)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        items.push({
          value,
          file: path.relative(ROOT_DIR, absolutePath),
          line: line + 1,
        });
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return items;
};

const collectAuditFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectAuditFiles(absolutePath);
    }

    if (
      !/\.(ts|tsx)$/.test(entry.name) ||
      absolutePath.endsWith("src/renderer/i18n/uiTranslations.ts")
    ) {
      return [];
    }

    return [absolutePath];
  });

describe("ui translation audit", () => {
  it("covers source literals across renderer modules", () => {
    const missing = collectAuditFiles(RENDERER_DIR).flatMap((absolutePath) =>
      collectSourceLiterals(absolutePath).flatMap((item) => {
        if (SKIPPED_LITERALS.has(item.value) || ALLOWED_SAME_TEXT.has(item.value)) {
          return [];
        }

        const untranslated = TARGET_LANGUAGES.filter(
          (language) =>
            !(
              item.value === "日本語" &&
              language === "ja-JP"
            ) && translateUiText(language, item.value) === item.value,
        );

        return untranslated.length > 0
          ? [
              `${item.file}:${item.line} ${item.value} -> ${untranslated.join(",")}`,
            ]
          : [];
      }),
    );

    expect(missing).toEqual([]);
  });

  it("covers dynamic runtime patterns used across the app", () => {
    const samples = [
      "来自 Agent 项目 A 的回报",
      "技能 Demo 安装成功",
      "技能 Demo 已卸载",
      "仓库元信息已同步：共 12 个技能，更新 3 项",
      "仓库元信息已是最新（共 12 个技能）",
      "操作 README.md",
      "广播渠道 3",
      "当前有 2 个任务仍在运行",
      "• 以及另外 4 个任务",
      "my-app · 应用预览",
      "README-副本.md",
      "建议镜头素材：夕阳下的街道",
      "系统预览打开失败: Permission denied",
      "来自 Agent 子项目 1 的回报\n...(已截断)",
      "图像生成（高质量文生图），适合角色设定图、海报风格镜头和高细节概念图。",
      "Kling v3 Pro 文生视频。",
      "Google Veo 3.1 Fast 首尾帧生视频。",
      "Kling 视频生音频。",
    ];

    const missing = samples.flatMap((sample) =>
      TARGET_LANGUAGES.filter(
        (language) => translateUiText(language, sample) === sample,
      ).map((language) => `${sample} -> ${language}`),
    );

    expect(missing).toEqual([]);
  });
});
