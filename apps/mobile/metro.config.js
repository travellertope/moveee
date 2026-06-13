const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the full monorepo so Metro can resolve packages across workspaces
config.watchFolders = [monorepoRoot];

// Resolution order: app-local first, then monorepo root (where npm workspaces hoists to)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Custom resolver: intercept every require() of react and react-native —
// including those inside third-party packages — and force them all to the
// same single copy in the monorepo root. Without this, zustand, react-navigation
// and other deps can resolve react from a different path, producing duplicate
// instances that crash on launch with "ReactCurrentDispatcher of undefined".
const reactPath = path.resolve(monorepoRoot, 'node_modules/react');
const reactNativePath = path.resolve(monorepoRoot, 'node_modules/react-native');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react') {
    return { filePath: require.resolve(reactPath), type: 'sourceFile' };
  }
  if (moduleName === 'react-native') {
    return { filePath: require.resolve(reactNativePath), type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
