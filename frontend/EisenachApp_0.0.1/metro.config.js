const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Standard Metro-Konfiguration für Expo
const config = getDefaultConfig(__dirname);

// Explizit das Projekt-Root-Verzeichnis setzen
config.projectRoot = __dirname;

// Node-Module-Pfade für die verschachtelte Struktur
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../../node_modules'),
];

module.exports = config;
