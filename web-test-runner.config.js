const { fromRollup } = require("@web/dev-server-rollup");
const rollupBabel = require("@rollup/plugin-babel");
const transform = require("./src/babel-plugin-transform-jsx");
// note that you need to use `.default` for babel
const babel = fromRollup(rollupBabel);

module.exports = {
  nodeResolve: true,
  files: ["test/**/*.test.tsx"],
  mimeTypes: {
    "**/*.tsx": "js",
    "**/*.ts": "js",
  },
  plugins: [
    babel({
      extensions: [".tsx", ".ts"],
      presets: [["@babel/preset-typescript", { isTsx: true }]],
      plugins: [
        ["@babel/plugin-syntax-jsx"],
        ["@babel/plugin-proposal-decorators", { version: "2023-05" }],
        [
          transform,
          {
            imports: "@plusnew/webcomponent/jsx-runtime",
          },
        ],
      ],
    }),
  ],
};
