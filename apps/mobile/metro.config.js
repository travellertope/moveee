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

// Force a single React instance — npm workspaces hoists react/react-native to the
// monorepo root. Without this pin Metro can resolve them from two different paths
// and bundle duplicates, causing the ReactCurrentDispatcher crash on launch.
config.resolver.extraNodeModules = {
  react: path.resolve(monorepoRoot, 'node_modules/react'),
  'react-native': path.resolve(monorepoRoot, 'node_modules/react-native'),
};

module.exports = config;
