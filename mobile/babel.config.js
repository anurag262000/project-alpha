module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // inline-import bundles drizzle's .sql migrations as strings;
    // react-native-reanimated/plugin must be listed last.
    plugins: [['inline-import', { extensions: ['.sql'] }], 'react-native-reanimated/plugin'],
  };
};
