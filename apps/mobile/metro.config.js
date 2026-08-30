const { getDefaultConfig } = require('expo/metro-config');
const { withSentryConfig } = require('@sentry/react-native/metro');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Find where react actually lives (could be app-local or hoisted to root)
function findPkg(name) {
  const local = path.resolve(projectRoot, 'node_modules', name);
  if (fs.existsSync(local)) return local;
  return path.resolve(monorepoRoot, 'node_modules', name);
}

const reactDir = findPkg('react');
const rnDir = findPkg('react-native');

// Pin react and react-native to a single copy so third-party packages
// cannot accidentally resolve a different instance from their own node_modules.
config.resolver.extraNodeModules = {
  react: reactDir,
  'react-native': rnDir,
};

// Block any OTHER copy of react/react-native that Metro might discover
// while crawling the monorepo. This is the nuclear option — if a second
// copy exists anywhere, Metro will ignore it completely.
const escapedRoot = monorepoRoot.replace(/[/\\]/g, '[/\\\\]');
const blockPatterns = [];

if (reactDir === path.resolve(monorepoRoot, 'node_modules/react')) {
  // React is hoisted — block any app-local copy
  blockPatterns.push(
    new RegExp(`${escapedRoot}[/\\\\]apps[/\\\\]mobile[/\\\\]node_modules[/\\\\]react[/\\\\].*`)
  );
} else {
  // React is local — block the root copy
  blockPatterns.push(
    new RegExp(`${escapedRoot}[/\\\\]node_modules[/\\\\]react[/\\\\].*`)
  );
}

if (blockPatterns.length > 0) {
  const existing = config.resolver.blockList;
  const allPatterns = existing
    ? [].concat(existing instanceof RegExp ? [existing] : Array.from(existing), blockPatterns)
    : blockPatterns;
  config.resolver.blockList = allPatterns;
}

// Wraps the (already monorepo-customized) config above with Sentry's own
// Metro plugin — adds source-context annotations to the bundle so stack
// traces in the Sentry dashboard show the actual failing line, not just a
// file/offset. Safe to leave in place even with SENTRY_DSN unset (src/config/
// sentry.ts) — it only affects bundling, not whether events are sent.
module.exports = withSentryConfig(config);
