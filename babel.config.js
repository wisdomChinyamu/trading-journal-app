module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      "babel-preset-expo",
      ["@babel/preset-react", { runtime: "automatic" }],
      "@babel/preset-typescript",
    ],
    plugins: [
      "@babel/plugin-proposal-optional-chaining",
      "@babel/plugin-proposal-nullish-coalescing-operator",
    ],
  };
};