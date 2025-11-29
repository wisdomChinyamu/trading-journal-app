const createExpoWebpackConfigAsync = require("@expo/webpack-config");
const webpack = require("webpack");
const path = require("path");

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Provide fallbacks for Node core modules used by some libs (crypto, stream, buffer)
  config.resolve = config.resolve || {};
  config.resolve.fallback = Object.assign({}, config.resolve.fallback, {
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
    buffer: require.resolve("buffer/"),
    process: require.resolve("process/browser"),
    vm: require.resolve("vm-browserify"),
    util: require.resolve("util/"),
    path: require.resolve("path-browserify"),
  });

  // Ensure extensions are resolved properly
  config.resolve.extensions = config.resolve.extensions || [
    ".js",
    ".json",
    ".jsx",
    ".ts",
    ".tsx",
  ];
  if (!config.resolve.extensions.includes(".web.js")) {
    config.resolve.extensions.unshift(
      ".web.js",
      ".web.jsx",
      ".web.ts",
      ".web.tsx"
    );
  }

  // Ensure imports like 'process/browser' resolve correctly and handle safe-area-context for web
  config.resolve.alias = Object.assign({}, config.resolve.alias, {
    "process/browser": require.resolve("process/browser"),
    "react-native-safe-area-context": require.resolve(
      "react-native-safe-area-context/lib/commonjs/index.js"
    ),
  });

  // Transpile certain packages that ship untranspiled CJS code which may use runtime require()
  // This ensures modules like @react-navigation, react-native-safe-area-context, and react-native-screens are processed for web builds.
  config.module = config.module || {};
  config.module.rules = config.module.rules || [];
  config.module.rules.unshift({
    test: /\.(js|ts|tsx)$/,
    include: [
      path.resolve(__dirname, "src"),
      path.resolve(__dirname, "App.tsx"),
      /node_modules\/(?:@react-navigation|@react-native|@react-native-community|react-native-safe-area-context|react-native-screens|expo-modules-core)/,
    ],
    use: {
      loader: "babel-loader",
      options: {
        babelrc: false,
        presets: [
          "babel-preset-expo",
          ["@babel/preset-react", { runtime: "automatic" }],
          "@babel/preset-typescript",
        ],
        plugins: [
          "@babel/plugin-proposal-optional-chaining",
          "@babel/plugin-proposal-nullish-coalescing-operator",
        ],
      },
    },
  });

  config.plugins = config.plugins || [];
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    })
  );

  // Suppress warnings about @tauri-apps/api not being resolvable on web
  // (it's intentionally excluded via webpackIgnore: true)
  if (config.ignoreWarnings === undefined) {
    config.ignoreWarnings = [];
  }
  config.ignoreWarnings.push({
    module: /tauri/,
    message: /Can't resolve/,
  });

  return config;
};