import { describe, expect, it } from 'vitest';
import {
  compareVersions,
  isValidPublishedVersion,
  normalizeVersion,
  parseVersion
} from '../../electron/main/services/updateVersion';

describe('updateVersion (semver)', () => {
  it('normalizes v-prefixed version strings', () => {
    expect(normalizeVersion(' v1.2.3 ')).toBe('1.2.3');
    expect(normalizeVersion('V1.2.3-beta.1')).toBe('1.2.3-beta.1');
  });

  it('parses valid semantic versions', () => {
    expect(parseVersion('1.2.3')).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: null
    });
    expect(parseVersion('v1.2.3-beta.1')).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: 'beta.1'
    });
  });

  it('rejects invalid versions', () => {
    expect(isValidPublishedVersion('1.2')).toBe(false);
    expect(isValidPublishedVersion('1.2.3.4')).toBe(false);
    expect(isValidPublishedVersion('foo')).toBe(false);
  });

  it('compares major/minor/patch correctly', () => {
    expect(compareVersions('1.3.0', '1.2.9')).toBeGreaterThan(0);
    expect(compareVersions('2.0.0', '1.99.99')).toBeGreaterThan(0);
    expect(compareVersions('1.2.4', '1.2.3')).toBeGreaterThan(0);
  });

  it('treats stable as newer than prerelease with same core', () => {
    expect(compareVersions('1.2.3', '1.2.3-beta.9')).toBeGreaterThan(0);
    expect(compareVersions('1.2.3-beta.9', '1.2.3')).toBeLessThan(0);
  });

  it('compares beta versions by numeric suffix', () => {
    expect(compareVersions('1.2.3-beta.2', '1.2.3-beta.1')).toBeGreaterThan(0);
    expect(compareVersions('1.2.3-beta.10', '1.2.3-beta.2')).toBeGreaterThan(0);
  });

  it('handles v-prefixed input in comparison', () => {
    expect(compareVersions('v1.2.3', '1.2.2')).toBeGreaterThan(0);
    expect(compareVersions('1.2.2', 'v1.2.3')).toBeLessThan(0);
  });
});
