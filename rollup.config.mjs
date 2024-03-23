import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import clear from "rollup-plugin-clear";
import dts from "rollup-plugin-dts";

export default defineConfig([
  {
    input: {
      index: "./src/index.ts",
    },
    output: [
      {
        dir: "dist",
        entryFileNames: "[name].js",
        format: "umd", // 格式
        name: "QXPromise", // 全局变量名
      },
      {
        dir: "dist",
        entryFileNames: "[name].cjs.js",
        format: "cjs",
      },
      {
        dir: "dist",
        entryFileNames: "[name].esm.js",
        format: "es",
      },
    ],
    // 插件
    plugins: [
      nodeResolve(),
      commonjs({ extensions: ['.js', '.ts'] }),
      typescript({}),
      clear({
        targets: ["dist"],
        watch: true,
      }),
    ],
  },
  {
    // 打包d.ts
    input: {
      index: "./src/index.ts",
    },
    output: {
      dir: "dist",
      entryFileNames: "[name].d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
]);
