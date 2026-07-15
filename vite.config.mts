import react from "@vitejs/plugin-react";
import * as path from "path";
import {fileURLToPath} from "url";
import {defineConfig} from "vite";

import { config as loadDotenv } from "dotenv";

import {cyRunnerPlugin} from "./cy-runner-plugin";

const appRoot = path.resolve(fileURLToPath(import.meta.url), "../");

loadDotenv({ path: path.join(appRoot, ".env") });

const e2eRoot = path.resolve(appRoot, process.env.E2E_APP_PATH ?? "");
const e2ePath = process.env.TESTS_PATH

export default () => {
  return defineConfig({
    plugins: [
      react(),
      cyRunnerPlugin({
        root: e2eRoot,
        specsDir: e2ePath,
        // command / baseArgs / apiBase all fall back to sensible defaults;
        // override here if this app's cypress setup ever differs, e.g.:
        // command: "yarn",
        // baseArgs: ["cypress", "run", "--browser", "electron"],
      }),
    ],
    server: {
      port: 3001,
    },
  });
};
