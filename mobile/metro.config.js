const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Stub out native-only modules for web
config.resolver = config.resolver || {};
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
