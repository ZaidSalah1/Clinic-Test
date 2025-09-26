// webpack.config.js
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env = {}, argv = {}) {
  const mode = env.mode || argv.mode || process.env.NODE_ENV || 'development';
  const platform = env.platform || 'web';

  const config = await createExpoWebpackConfigAsync(
    { mode, platform, projectRoot: __dirname },
    argv
  );

  // استخدم react-native-web على الويب
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    'react-native$': 'react-native-web',
  };

  // إصلاح devServer لـ webpack-dev-server v5:
  // لو @expo/webpack-config ضاف https قديم، حوّله إلى server
  if (config.devServer) {
    const ds = config.devServer;

    // وفّر ملفات ثابتة من الجذر (index.html)
    ds.static = ds.static || [{ directory: __dirname }];

    if ('https' in ds) {
      const useHttps = !!ds.https;
      delete ds.https;                // الخاصية القديمة
      ds.server = useHttps ? 'https' : 'http'; // الشكل الجديد
    }
  } else {
    config.devServer = {
      static: [{ directory: __dirname }],
      server: 'http',
    };
  }

  return config;
};
