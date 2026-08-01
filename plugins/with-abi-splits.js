const { withAppBuildGradle } = require('@expo/config-plugins');

const ABI_SPLITS = `android {
  splits {
    abi {
      enable true
      reset()
      include "arm64-v8a"
      universalApk true
    }
  }
}
`;

module.exports = function withAbiSplits(config) {
  return withAppBuildGradle(config, (config) => {
    const contents = config.modResults.contents;
    if (!contents.includes('splits {') && !contents.includes('splits{')) {
      config.modResults.contents = contents + '\n' + ABI_SPLITS;
    }
    return config;
  });
};
