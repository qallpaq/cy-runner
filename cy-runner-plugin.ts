import {type ChildProcess, spawn} from "child_process";
import {readdirSync, statSync} from "fs";
import * as path from "path";
import type {Plugin} from "vite";

export interface CyRunnerOptions {
  /**
   * Absolute path used as the cwd for `findSpecs` and for spawning the
   * cypress process. Usually the package/app root.
   */
  root: string;
  /**
   * Directory (relative to `root`) that contains the spec files.
   * @default "cypress/e2e"
   */
  specsDir?: string;
  /**
   * Predicate used to decide whether a file is a spec file.
   * @default (name) => name.includes(".cy.")
   */
  isSpecFile?: (fileName: string) => boolean;
  /**
   * Command used to invoke cypress, split as [command, ...baseArgs].
   * The `--spec <spec>` argument is always appended automatically.
   * @default ["pnpm", ["cypress", "run", "--browser", "chrome"]]
   */
  command?: string;
  baseArgs?: string[];
  /** Extra env vars merged into `process.env` for the spawned process. */
  env?: NodeJS.ProcessEnv;
  /** Base path the middleware is mounted on. @default "/api" */
  apiBase?: string;
}

const DEFAULTS: Required<
  Pick<CyRunnerOptions, "specsDir" | "isSpecFile" | "command" | "baseArgs" | "apiBase">
> = {
  specsDir: "cypress/e2e",
  isSpecFile: (fileName) => fileName.includes(".cy."),
  command: "pnpm",
  baseArgs: ["cypress", "run", "--browser", "chrome"],
  apiBase: "/api",
};

function findSpecs(dir: string, isSpecFile: (name: string) => boolean): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...findSpecs(full, isSpecFile));
    } else if (isSpecFile(entry)) {
      results.push(full);
    }
  }
  return results;
}

function killProc(proc: ChildProcess) {
  if (process.platform === "win32" && proc.pid) {
    spawn("taskkill", ["/F", "/T", "/PID", String(proc.pid)], {shell: true});
  } else {
    proc.kill("SIGTERM");
  }
}

export function cyRunnerPlugin(options: CyRunnerOptions): Plugin {
  const opts = {...DEFAULTS, ...options};
  const specsRoot = path.join(opts.root, opts.specsDir);

  let currentProc: ChildProcess | null = null;
  let aborted = false;

  return {
    name: "cy-runner-api",
    configureServer(server) {
      server.middlewares.use(`${opts.apiBase}/cy-specs`, (req, res) => {
        const url = new URL(req.url!, "http://localhost");
        const q = url.searchParams.get("q")?.toLowerCase() ?? "";

        const all = findSpecs(specsRoot, opts.isSpecFile);
        const filtered = q
          ? all.filter((f) => path.basename(f).toLowerCase().includes(q))
          : all;

        const relative = filtered.map((f) =>
          path.relative(opts.root, f).replace(/\\/g, "/"),
        );

        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(relative));
      });

      server.middlewares.use(`${opts.apiBase}/cy-stop`, (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        aborted = true;
        if (currentProc) {
          killProc(currentProc);
          currentProc = null;
        }
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ok: true}));
      });

      server.middlewares.use(`${opts.apiBase}/cy-run`, (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }

        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          const {spec, runs = 1} = JSON.parse(body);

          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.setHeader("Transfer-Encoding", "chunked");
          res.statusCode = 200;

          aborted = false;

          (async () => {
            const results: boolean[] = [];

            for (let i = 0; i < runs; i++) {
              if (aborted) break;

              res.write(
                `\n[CY-RUN-START:${JSON.stringify({run: i + 1, total: runs})}]\n`,
              );

              const passed = await new Promise<boolean>((resolve) => {
                const proc = spawn(
                  opts.command,
                  [...opts.baseArgs, "--spec", spec],
                  {
                    cwd: opts.root,
                    env: {
                      ...process.env,
                      NODE_ENV: "test",
                      TZ: "Etc/UTC",
                      ...opts.env,
                    },
                    shell: process.platform === "win32",
                  },
                );

                currentProc = proc;
                proc.stdout.on("data", (d) => res.write(d));
                proc.stderr.on("data", (d) => res.write(d));
                proc.on("close", (code) => {
                  currentProc = null;
                  resolve(!aborted && code === 0);
                });
              });

              if (aborted) break;

              results.push(passed);
              res.write(
                `\n[CY-RUN-END:${JSON.stringify({run: i + 1, total: runs, passed})}]\n`,
              );
            }

            if (aborted) {
              res.write(`\n[CY-ABORTED]\n`);
            } else {
              const passed = results.filter(Boolean).length;
              res.write(
                `\n[CY-STATS:${JSON.stringify({passed, failed: runs - passed, total: results.length})}]\n`,
              );
            }
            res.end();
          })();
        });
      });
    },
  };
}