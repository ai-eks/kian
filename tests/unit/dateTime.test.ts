import { describe, expect, it } from 'vitest';
import {
  formatUtcTimestampToLocal,
  normalizeUtcTimestamp
} from '@shared/utils/dateTime';

describe('dateTime utils', () => {
  it('normalizes ISO timestamps with offsets to UTC', () => {
    expect(normalizeUtcTimestamp('2026-03-08T08:00:00+08:00', 'fallback')).toBe(
      '2026-03-08T00:00:00.000Z'
    );
  });

  it('treats zone-less ISO timestamps as UTC when normalizing', () => {
    expect(normalizeUtcTimestamp('2026-03-08T00:00:00', 'fallback')).toBe(
      '2026-03-08T00:00:00.000Z'
    );
  });

  it('formats UTC timestamps with the target local timezone', () => {
    expect(
      formatUtcTimestampToLocal('2026-03-08T00:00:00.000Z', {
        locale: 'zh-CN',
        timeZone: 'Asia/Shanghai'
      })
    ).toBe('2026/03/08 08:00:00');
  });

  it('supports omitting seconds when formatting display text', () => {
    expect(
      formatUtcTimestampToLocal('2026-03-08T00:00:00.000Z', {
        includeSeconds: false,
        locale: 'zh-CN',
        timeZone: 'Asia/Shanghai'
      })
    ).toBe('2026/03/08 08:00');
  });

  it('returns fallback for invalid timestamps', () => {
    expect(
      formatUtcTimestampToLocal('not-a-timestamp', {
        fallback: '--'
      })
    ).toBe('--');
  });
});
