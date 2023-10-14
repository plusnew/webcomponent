import { fromRollup } from '@web/dev-server-rollup';
import rollupBabel from '@rollup/plugin-babel';

// note that you need to use `.default` for babel
const babel = fromRollup(rollupBabel);

export default {
    nodeResolve: true,
    files: 'test/**/*.test.tsx',
    mimeTypes: {
        '**/*.tsx': 'js',
    },
    plugins: [
        babel({
            plugins: [
                ['@babel/plugin-transform-react-jsx'],
                ["@babel/plugin-proposal-decorators", { version: "2023-05" }]
            ],
        }),
    ],
};
