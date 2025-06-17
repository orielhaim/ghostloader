import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default [
  // ESM build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/ghostloader.esm.js',
      format: 'esm',
      sourcemap: true
    },
    plugins: [resolve(), commonjs(), terser()]
  },

  // CJS build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/ghostloader.cjs.js',
      format: 'cjs',
      sourcemap: true
    },
    plugins: [resolve(), commonjs(), terser()]
  },

  // UMD minified build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/ghostloader.umd.js',
      format: 'umd',
      name: 'GhostLoader',
      sourcemap: true
    },
    plugins: [resolve(), commonjs(), terser()]
  }
];