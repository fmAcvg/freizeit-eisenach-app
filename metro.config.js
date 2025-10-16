const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Erweitere die Standard-Konfiguration für die verschachtelte Projektstruktur
const config = getDefaultConfig(__dirname);

// Füge das frontend-Verzeichnis zu den Watch-Foldern hinzu
config.watchFolders = [
  path.resolve(__dirname, 'frontend'),
  path.resolve(__dirname, 'frontend/EisenachApp_0.0.1'),
];

// Stelle sicher, dass alle relevanten Verzeichnisse beobachtet werden
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, 'frontend/node_modules'),
  path.resolve(__dirname, 'frontend/EisenachApp_0.0.1/node_modules'),
];

// Blockiere keine Dateien in den React Native Modulen
config.resolver.blockList = [];

// Erlaube alle Dateierweiterungen für React Native
config.resolver.sourceExts = [
  'js',
  'jsx',
  'json',
  'ts',
  'tsx',
  'native.js',
  'native.jsx',
  'native.ts',
  'native.tsx',
];

module.exports = config;

