// Let Metro resolve drizzle's generated .sql migration files as source
// (paired with babel-plugin-inline-import, which inlines their contents).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('sql');

module.exports = config;
