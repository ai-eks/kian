import { describe, expect, it } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { resolveReleaseVersion } = require('../../scripts/releaseVersion.js') as {
  resolveReleaseVersion: (input: {
    branchName: string;
    packageVersion?: string;
    tags: string[];
  }) => {
    releaseTag: string;
    appVersion: string;
    releaseName: string;
    prerelease: string;
    previousStableTag: string;
  };
};

describe('releaseVersion (semver)', () => {
  it('generates first stable version on main when no tags exist', () => {
    const result = resolveReleaseVersion({
      branchName: 'main',
      packageVersion: '0.1.0',
      tags: []
    });

    expect(result).toMatchObject({
      releaseTag: 'v0.1.0',
      appVersion: '0.1.0',
      releaseName: 'Kian 0.1.0',
      prerelease: 'false',
      previousStableTag: ''
    });
  });

  it('uses package version on main when it is newer than the latest stable tag', () => {
    const result = resolveReleaseVersion({
      branchName: 'main',
      packageVersion: '0.1.0',
      tags: ['v0.0.18']
    });

    expect(result.releaseTag).toBe('v0.1.0');
    expect(result.appVersion).toBe('0.1.0');
    expect(result.previousStableTag).toBe('v0.0.18');
  });

  it('increments patch on main when latest stable tag is newer within the same minor line', () => {
    const result = resolveReleaseVersion({
      branchName: 'main',
      packageVersion: '0.1.0',
      tags: ['v0.1.2']
    });

    expect(result.releaseTag).toBe('v0.1.3');
    expect(result.appVersion).toBe('0.1.3');
    expect(result.previousStableTag).toBe('v0.1.2');
  });

  it('falls back to the latest stable line when it is ahead of package version', () => {
    const result = resolveReleaseVersion({
      branchName: 'main',
      packageVersion: '0.1.0',
      tags: ['v1.0.0']
    });

    expect(result.releaseTag).toBe('v1.0.1');
    expect(result.appVersion).toBe('1.0.1');
    expect(result.previousStableTag).toBe('v1.0.0');
  });

  it('increments beta sequence for non-main branch', () => {
    const result = resolveReleaseVersion({
      branchName: 'feature/foo',
      packageVersion: '1.2.0',
      tags: ['v1.2.3', 'v1.2.4-beta.0', 'v1.2.4-beta.1']
    });

    expect(result.releaseTag).toBe('v1.2.4-beta.2');
    expect(result.appVersion).toBe('1.2.4-beta.2');
    expect(result.prerelease).toBe('true');
  });

  it('starts beta at 0 for non-main branch when package version is newer than stable tags', () => {
    const result = resolveReleaseVersion({
      branchName: 'feature/foo',
      packageVersion: '2.0.0',
      tags: ['v1.9.9']
    });

    expect(result.releaseTag).toBe('v2.0.0-beta.0');
    expect(result.appVersion).toBe('2.0.0-beta.0');
  });
});
