const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add .mjs support for lucide-react-native and other modern packages
config.resolver.sourceExts.push('mjs');

module.exports = config;
