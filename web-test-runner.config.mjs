import { fromRollup } from '@web/dev-server-rollup';
import rollupBabel from '@rollup/plugin-babel';

// note that you need to use `.default` for babel
const babel = fromRollup(rollupBabel);

export default {
    nodeResolve: true,
    files: ['test/**/*.test.tsx', "src/**/*.ts"],
    mimeTypes: {
        '**/*.tsx': 'js',
        '**/*.ts': 'js',
    },
    plugins: [
        babel({
            extensions: [".tsx", ".ts"],
            presets: [
                ["@babel/preset-typescript", { isTsx: true }],
            ],
            plugins: [
                ['@babel/plugin-transform-react-jsx', {
                    "runtime": "automatic",
                    "importSource": "@plusnew/webcomponent"
                }],
                ["@babel/plugin-proposal-decorators", { version: "2023-05" }]
            ],
        }),
    ],
};
