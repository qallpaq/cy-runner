import react from "@vitejs/plugin-react";
import * as path from "path";
import {fileURLToPath} from "url";
import {defineConfig} from "vite";

import {cyRunnerPlugin} from "./cy-runner-plugin";

const appRoot = path.resolve(fileURLToPath(import.meta.url), "../");

const e2eRoot = path.resolve(appRoot, "../teye-front");

export default () => {
  return defineConfig({
    plugins: [
      react(),
      cyRunnerPlugin({
        root: e2eRoot,
        specsDir: "cypress/e2e",
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
