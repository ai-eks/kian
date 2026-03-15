import fs from 'node:fs';
import path from 'node:path';
import { INTERNAL_ROOT, WORKSPACE_ROOT } from './workspacePaths';

const MAX_DECODE_ROUNDS = 3;
const MAIN_AGENT_SCOPE_ID = 'main-agent';

const normalizePathCandidate = (value: string): string | null => {
  const normalized = path.normalize(value.trim());
  if (!normalized || normalized === '.') return null;
  return normalized;
};

const collectDecodedCandidates = (encodedPath: string): string[] => {
  const candidates: string[] = [];
  let current = encodedPath;

  for (let round = 0; round < MAX_DECODE_ROUNDS; round += 1) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(current);
    } catch {
      break;
    }

    const normalizedCandidate = normalizePathCandidate(decoded);
    if (normalizedCandidate && !candidates.includes(normalizedCandidate)) {
      candidates.push(normalizedCandidate);
    }

    if (decoded === current) {
      break;
    }
    current = decoded;
  }

  return candidates;
};

const isWithinDirectory = (targetPath: string, rootDir: string): boolean => {
  const relative = path.relative(rootDir, targetPath);
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  );
};

const resolveProjectRelativeCandidate = (
  candidate: string,
  projectId: string | undefined,
): string | null => {
  if (!projectId?.trim()) return null;
  if (path.isAbsolute(candidate)) return null;

  const normalizedProjectId = projectId.trim();
  const projectDir =
    normalizedProjectId === MAIN_AGENT_SCOPE_ID
      ? path.join(INTERNAL_ROOT, MAIN_AGENT_SCOPE_ID)
      : path.join(WORKSPACE_ROOT, normalizedProjectId);
  const resolved = path.resolve(projectDir, candidate);
  if (!isWithinDirectory(resolved, projectDir)) {
    return null;
  }
  return resolved;
};

export const resolveLocalMediaPath = (
  encodedPath: string,
  options?: { projectId?: string },
): string | null => {
  const candidates = collectDecodedCandidates(encodedPath);
  if (candidates.length === 0) {
    return null;
  }

  for (const candidate of candidates) {
    if (!path.isAbsolute(candidate)) continue;
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  for (const candidate of candidates) {
    const resolved = resolveProjectRelativeCandidate(
      candidate,
      options?.projectId,
    );
    if (!resolved) continue;
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }

  const absoluteFallback = candidates.find((candidate) => path.isAbsolute(candidate));
  if (absoluteFallback) {
    return absoluteFallback;
  }

  for (const candidate of candidates) {
    const resolved = resolveProjectRelativeCandidate(
      candidate,
      options?.projectId,
    );
    if (resolved) {
      return resolved;
    }
  }

  return null;
};
