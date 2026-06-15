const { getDefaultConfig } = require('expo/metro-config');
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

// Use resolveRequest (takes priority over node_modules) to redirect packages
// that require native binaries not bundled in Expo Go.
const EXPO_GO_STUBS = {
  'react-native-passkeys': path.resolve(projectRoot, 'src/mocks/react-native-passkeys.js'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (EXPO_GO_STUBS[moduleName]) {
    return { filePath: EXPO_GO_STUBS[moduleName], type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
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

module.exports = config;
