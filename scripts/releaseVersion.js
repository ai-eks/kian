'use strict';

const STABLE_PATTERN = /^v(\d+)\.(\d+)\.(\d+)$/;
const BETA_PATTERN = /^v(\d+)\.(\d+)\.(\d+)-beta\.(\d+)$/;
const CORE_VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

const compareCore = (left, right) => {
  if (left.major !== right.major) return left.major > right.major ? 1 : -1;
  if (left.minor !== right.minor) return left.minor > right.minor ? 1 : -1;
  if (left.patch !== right.patch) return left.patch > right.patch ? 1 : -1;
  return 0;
};

const formatCore = (value) => `${value.major}.${value.minor}.${value.patch}`;

const parseCoreVersion = (value) => {
  const matched = String(value || '').trim().match(CORE_VERSION_PATTERN);
  if (!matched) {
    return null;
  }

  return {
    major: Number(matched[1]),
    minor: Number(matched[2]),
    patch: Number(matched[3])
  };
};

const parseTags = (tags) => {
  const stableEntries = [];
  const betaEntries = [];
  const existingTags = new Set(tags);

  for (const tag of tags) {
    const stableMatched = tag.match(STABLE_PATTERN);
    if (stableMatched) {
      stableEntries.push({
        tag,
        major: Number(stableMatched[1]),
        minor: Number(stableMatched[2]),
        patch: Number(stableMatched[3])
      });
      continue;
    }

    const betaMatched = tag.match(BETA_PATTERN);
    if (betaMatched) {
      betaEntries.push({
        tag,
        major: Number(betaMatched[1]),
        minor: Number(betaMatched[2]),
        patch: Number(betaMatched[3]),
        beta: Number(betaMatched[4])
      });
    }
  }

  return { stableEntries, betaEntries, existingTags };
};

const findLatestStable = (stableEntries) => {
  let latest = null;
  for (const value of stableEntries) {
    if (!latest || compareCore(value, latest) > 0) {
      latest = value;
    }
  }
  return latest;
};

const resolveBaseCore = ({ packageVersion, latestStable }) => {
  const packageCore = parseCoreVersion(packageVersion);

  if (!packageCore) {
    if (latestStable) {
      return { major: latestStable.major, minor: latestStable.minor, patch: latestStable.patch + 1 };
    }
    return { major: 0, minor: 0, patch: 1 };
  }

  if (!latestStable) {
    return packageCore;
  }

  if (compareCore(packageCore, latestStable) > 0) {
    return packageCore;
  }

  if (packageCore.major === latestStable.major && packageCore.minor === latestStable.minor) {
    return { major: latestStable.major, minor: latestStable.minor, patch: latestStable.patch + 1 };
  }

  return { major: latestStable.major, minor: latestStable.minor, patch: latestStable.patch };
};

const resolveReleaseVersion = (input) => {
  const branchName = input.branchName || '';
  const isMain = branchName === 'main';
  const tags = (input.tags || []).map((item) => String(item).trim()).filter(Boolean);

  const { stableEntries, betaEntries, existingTags } = parseTags(tags);
  const latestStable = findLatestStable(stableEntries);
  const baseCore = resolveBaseCore({
    packageVersion: input.packageVersion,
    latestStable
  });

  let releaseTag = '';
  let appVersion = '';
  let prerelease = 'false';
  let releaseName = '';

  if (isMain) {
    let core = { ...baseCore };
    releaseTag = `v${formatCore(core)}`;
    while (existingTags.has(releaseTag)) {
      core = { ...core, patch: core.patch + 1 };
      releaseTag = `v${formatCore(core)}`;
    }

    appVersion = releaseTag.slice(1);
    prerelease = 'false';
    releaseName = `Kian ${appVersion}`;
  } else {
    const base = { ...baseCore };
    let maxBeta = -1;
    for (const beta of betaEntries) {
      if (compareCore(beta, base) === 0 && beta.beta > maxBeta) {
        maxBeta = beta.beta;
      }
    }

    let betaNum = maxBeta + 1;
    releaseTag = `v${formatCore(base)}-beta.${betaNum}`;
    while (existingTags.has(releaseTag)) {
      betaNum += 1;
      releaseTag = `v${formatCore(base)}-beta.${betaNum}`;
    }

    appVersion = releaseTag.slice(1);
    prerelease = 'true';
    releaseName = `Kian ${formatCore(base)} beta.${betaNum}`;
  }

  return {
    releaseTag,
    appVersion,
    releaseName,
    prerelease,
    previousStableTag: latestStable ? latestStable.tag : ''
  };
};

module.exports = {
  resolveReleaseVersion
};
