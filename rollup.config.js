import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import json from "rollup-plugin-json";
import builtins from "rollup-plugin-node-builtins";
import copy from "rollup-plugin-copy";

import fs from "fs";
export default async () => [
  {
    input: "server/main.js",
    output: {
      file: "./build/cluster.unminified.js",
      format: "cjs",
      intro: fs.readFileSync("./license.js", {
        encoding: "utf8",
      }),
    },
    external: ["fs", "cluster", "events", "path", "child_process"],
    plugins: [
      builtins(),
      nodeResolve({
        preferBuiltins: true,
      }),
      commonjs(),
      json(),
    ],
  },
  {
    input: "server/main.js",
    output: {
      file: "./dist/cluster.js",
      format: "cjs",
      intro: fs.readFileSync("./license.js", {
        encoding: "utf8",
      }),
    },
    external: ["fs", "cluster", "events", "path", "child_process"],
    plugins: [
      builtins(),
      nodeResolve({
        preferBuiltins: true,
      }),
      commonjs(),
      json(),
      copy({
        targets: [
          { src: "client/cluster.html", dest: "dist/" },
          {
            src: "package.json",
            dest: "dist/",
            transform: (contents) => {
              let pjson = JSON.parse(contents);
              pjson.devDependencies = [];
              pjson.dependencies = [];
              pjson.main = "cluster.js";
              return JSON.stringify(pjson, null, 4);
            },
          },
        ],
      }),
    ],
  },
];
