import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import livereload from 'rollup-plugin-livereload';

export default {
  input: ['./src/game.ts'],
  output: {
    file: './dist/game.js',
    name: 'MyGame',
    format: 'iife',
    intro: 'var global = window;',
  },
  plugins: [
    replace({
      'typeof CANVAS_RENDERER': JSON.stringify(true),
      'typeof WEBGL_RENDERER': JSON.stringify(true),
      'typeof EXPERIMENTAL': JSON.stringify(true),
      'typeof PLUGIN_CAMERA3D': JSON.stringify(false),
      'typeof PLUGIN_FBINSTANT': JSON.stringify(false),
      'typeof FEATURE_SOUND': JSON.stringify(true),
    }),
    resolve({
      extensions: ['.ts', '.tsx'],
    }),
    commonjs({
      include: ['node_modules/eventemitter3/**', 'node_modules/phaser/**'],
      exclude: ['node_modules/phaser/src/polyfills/requestAnimationFrame.js'],
      ignoreGlobal: true,
    }),
    typescript({
      tsconfigOverride: {
        transpileOnly: true,
      },
    }),
    terser(),
    livereload(),
  ],
};