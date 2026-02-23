// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ── Node.js built-in polyfills ──────────────────────────────────────────────
// PouchDB's memory adapter chain (levelup, abstract-leveldown, readable-stream,
// memdown, etc.) imports several Node built-ins that don't exist in React Native.
// We map every one to a browser-compatible polyfill so Metro can resolve them.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,

  // Used by: pouchdb-core, pouchdb-replication, levelup, readable-stream, sublevel-pouchdb
  events: require.resolve('events'),

  // Used by: levelup, abstract-leveldown, readable-stream, inherits
  util: require.resolve('util'),

  // Used by: level-codec, readable-stream
  buffer: require.resolve('buffer'),

  // Used by: readable-stream
  stream: require.resolve('stream-browserify'),

  // Used by: readable-stream, sublevel-pouchdb
  string_decoder: require.resolve('string_decoder'),

  // Used by: levelup
  assert: require.resolve('assert'),

  // Used by: abstract-leveldown, level-iterator-stream
  path: require.resolve('path-browserify'),

  // Used by: pouchdb-md5
  crypto: require.resolve('crypto-browserify'),

  // Used by: pouchdb-mapreduce, pouchdb-changes-filter
  vm: require.resolve('vm-browserify'),

  // Used by: abstract-leveldown (never actually called in memory-adapter path)
  fs: path.resolve(__dirname, 'shims/fs.js'),

  // Global shims
  process: require.resolve('process'),
};

module.exports = config;
