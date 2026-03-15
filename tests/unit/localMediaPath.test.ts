import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveLocalMediaPath } from '../../electron/main/services/localMediaPath';
import {
  INTERNAL_ROOT,
  WORKSPACE_ROOT
} from '../../electron/main/services/workspacePaths';

const tempDirs: string[] = [];

const createTempDir = (): string => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kian-local-media-'));
  tempDirs.push(dir);
  return dir;
};

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('resolveLocalMediaPath', () => {
  it('resolves a single-encoded absolute path', () => {
    const root = createTempDir();
    const target = path.join(root, '我的项目', 'assets', 'user_files', 'demo.jpg');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, 'x');

    const encoded = encodeURIComponent(target);
    const resolved = resolveLocalMediaPath(encoded);
    expect(resolved).toBe(path.normalize(target));
  });

  it('resolves mixed double-encoded segments by preferring existing path', () => {
    const root = createTempDir();
    const chineseDir = '我的项目';
    const target = path.join(root, chineseDir, 'assets', 'user_files', 'demo.jpg');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, 'x');

    const onceEncodedSegmentPath = target.replace(chineseDir, encodeURIComponent(chineseDir));
    const encoded = encodeURIComponent(onceEncodedSegmentPath);
    const resolved = resolveLocalMediaPath(encoded);
    expect(resolved).toBe(path.normalize(target));
  });

  it('keeps literal percent-encoded folder names when they actually exist', () => {
    const root = createTempDir();
    const literalDir = '%E6%88%91%E7%9A%84%E9%A1%B9%E7%9B%AE';
    const target = path.join(root, literalDir, 'assets', 'user_files', 'demo.jpg');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, 'x');

    const encoded = encodeURIComponent(target);
    const resolved = resolveLocalMediaPath(encoded);
    expect(resolved).toBe(path.normalize(target));
  });

  it('resolves relative path with project id', () => {
    const relativePath = 'assets/user_files/demo.jpg';
    const encoded = encodeURIComponent(relativePath);
    const resolved = resolveLocalMediaPath(encoded, { projectId: 'demo-project' });
    expect(resolved).toBe(path.join(WORKSPACE_ROOT, 'demo-project', relativePath));
  });

  it('resolves relative path with main-agent scope id', () => {
    const relativePath = 'assets/generated/demo.jpg';
    const encoded = encodeURIComponent(relativePath);
    const resolved = resolveLocalMediaPath(encoded, { projectId: 'main-agent' });
    expect(resolved).toBe(path.join(INTERNAL_ROOT, 'main-agent', relativePath));
  });

  it('rejects relative traversal outside project directory', () => {
    const encoded = encodeURIComponent('../outside.txt');
    const resolved = resolveLocalMediaPath(encoded, { projectId: 'demo-project' });
    expect(resolved).toBeNull();
  });
});
