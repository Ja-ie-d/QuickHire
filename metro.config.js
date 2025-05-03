const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add any custom configuration here
config.resolver.assetExts.push('svg');
config.resolver.sourceExts.push('svg');

// Add support for mjs and cjs files
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json', 'mjs', 'cjs'];

// Configure the transformer for SVG files
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

// Add support for Node.js modules
config.resolver.extraNodeModules = {
  'ws': require.resolve('ws'),
  'stream': require.resolve('stream-browserify'),
  'crypto': require.resolve('crypto-browserify'),
  'http': require.resolve('stream-http'),
  'https': require.resolve('https-browserify'),
  'os': require.resolve('os-browserify'),
  'url': require.resolve('url'),
  'buffer': require.resolve('buffer'),
  'process': require.resolve('process'),
  'assert': require.resolve('assert'),
  'zlib': require.resolve('browserify-zlib'),
  'events': require.resolve('events'),
  'net': require.resolve('empty-module'),
  'tls': require.resolve('empty-module'),
  'fs': require.resolve('empty-module'),
  'child_process': require.resolve('empty-module'),
  'dns': require.resolve('empty-module'),
};

module.exports = config; 