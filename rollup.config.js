import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import babel from '@rollup/plugin-babel';
import clear from 'rollup-plugin-clear';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

export default [
    {
        input: 'src/index.ts',
        plugins: [
            clear({
                targets: ['esm', 'cjs'],
            }),
            resolve(),
            commonjs(),
            typescript(),
            json(),
            babel({
                babelHelpers: 'runtime',
                extensions: ['.ts', '.js'],
                exclude: ['node_modules/**'],
                presets: [['@babel/preset-env', { modules: false }]],
                plugins: ['@babel/plugin-transform-runtime'],
            }),
            terser(),
        ],
        output: [
            {
                dir: 'es',
                format: 'esm',
                sourcemap: true,
                preserveModules: false,
                exports: 'auto',
            },
            {
                dir: 'cjs',
                format: 'cjs',
                sourcemap: true,
                preserveModules: false,
                exports: 'auto',
            },
        ],
    },
];
