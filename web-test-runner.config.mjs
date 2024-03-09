import { fromRollup } from "@web/dev-server-rollup";
import rollupBabel from "@rollup/plugin-babel";
import transform from "./src/babel-plugin-transform-jsx.mjs";
// note that you need to use `.default` for babel
const babel = fromRollup(rollupBabel);

export default {
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
