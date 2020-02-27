import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';
import builtins from 'rollup-plugin-node-builtins';
import obfuscator from 'rollup-plugin-obfuscator';

import fs from 'fs';
export default (async () => ([{
    input: 'server/main.js',
    output: {
      file: './build/cluster.unminified.js',
      format: 'cjs',
      intro: fs.readFileSync('./license.js', {
        encoding: 'utf8'
      })
    },
    external: ['fs', 'cluster', 'events', 'path', 'child_process'],
    plugins: [
      builtins(),
      nodeResolve({
        preferBuiltins: true
      }),
      commonjs(),
      json()
    ]
  },
  {
    input: 'server/main.js',
    output: {
      file: './node-red-contrib-lyteworx-cluster/cluster.js',
      format: 'cjs',
      intro: fs.readFileSync('./license.js', {
        encoding: 'utf8'
      })
    },
    external: ['fs', 'cluster', 'events', 'path', 'child_process'],
    plugins: [
      builtins(),
      nodeResolve({
        preferBuiltins: true
      }),
      commonjs(),
      json()/*,
      obfuscator({
        // options that will be passed to javascript-obfuscator
        // when it processes each file
        // see allowed options here https://github.com/javascript-obfuscator/javascript-obfuscator
        fileOptions: {

        },

        // options that will be passed to javascript-obfuscator
        // when it processes the whole bundle
        // see allowed options here https://github.com/javascript-obfuscator/javascript-obfuscator
        // if you don't want to apply the obfuscation to the whole bundle, you can set this to `false`
        globalOptions: {
          deadCodeInjection: true,
          rotateStringArray: true
        },

        // on which files not to apply the `fileOptions`
        exclude: ['node_modules/**'],

        // this plugin supplies javascript-obfuscator but you are free to override it if you want
        obfuscator: require('javascript-obfuscator'),
      }),*/
     
    ]
  }
]));