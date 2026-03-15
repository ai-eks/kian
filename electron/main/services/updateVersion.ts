const VERSION_PATTERN =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
}

export const normalizeVersion = (raw: string): string =>
  raw.trim().replace(/^v/i, '');

export const parseVersion = (raw: string): ParsedVersion | null => {
  const normalized = normalizeVersion(raw);
  const matched = normalized.match(VERSION_PATTERN);
  if (!matched) return null;
  return {
    major: Number.parseInt(matched[1], 10),
    minor: Number.parseInt(matched[2], 10),
    patch: Number.parseInt(matched[3], 10),
    prerelease: matched[4] ?? null
  };
};

const comparePrerelease = (left: string, right: string): number => {
  const leftParts = left.split('.');
  const rightParts = right.split('.');
  const maxLength = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = leftParts[index];
    const rightPart = rightParts[index];
    if (leftPart === rightPart) continue;
    if (leftPart === undefined) return -1;
    if (rightPart === undefined) return 1;

    const leftNumber = Number.parseInt(leftPart, 10);
    const rightNumber = Number.parseInt(rightPart, 10);
    const leftIsNumeric = String(leftNumber) === leftPart;
    const rightIsNumeric = String(rightNumber) === rightPart;

    if (leftIsNumeric && rightIsNumeric) {
      return leftNumber === rightNumber ? 0 : leftNumber > rightNumber ? 1 : -1;
    }
    if (leftIsNumeric) return 1;
    if (rightIsNumeric) return -1;
    return leftPart.localeCompare(rightPart);
  }
  return 0;
};

export const compareVersions = (left: string, right: string): number => {
  const leftParsed = parseVersion(left);
  const rightParsed = parseVersion(right);
  if (!leftParsed || !rightParsed) {
    return normalizeVersion(left).localeCompare(normalizeVersion(right));
  }

  if (leftParsed.major !== rightParsed.major) {
    return leftParsed.major > rightParsed.major ? 1 : -1;
  }
  if (leftParsed.minor !== rightParsed.minor) {
    return leftParsed.minor > rightParsed.minor ? 1 : -1;
  }
  if (leftParsed.patch !== rightParsed.patch) {
    return leftParsed.patch > rightParsed.patch ? 1 : -1;
  }

  if (!leftParsed.prerelease && !rightParsed.prerelease) return 0;
  if (!leftParsed.prerelease) return 1;
  if (!rightParsed.prerelease) return -1;
  return comparePrerelease(leftParsed.prerelease, rightParsed.prerelease);
};

export const isValidPublishedVersion = (raw: string): boolean =>
  Boolean(parseVersion(raw));
