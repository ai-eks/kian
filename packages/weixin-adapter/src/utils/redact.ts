const DEFAULT_PREFIX_LENGTH = 6;

export function redactToken(token: string | undefined, prefixLength = DEFAULT_PREFIX_LENGTH): string {
  if (!token) {
    return "(none)";
  }

  if (token.length <= prefixLength) {
    return `****(len=${token.length})`;
  }

  return `${token.slice(0, prefixLength)}...(len=${token.length})`;
}

export function redactUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const base = `${parsed.origin}${parsed.pathname}`;
    return parsed.search ? `${base}?<redacted>` : base;
  } catch {
    return rawUrl;
  }
}
