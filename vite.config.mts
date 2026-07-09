import react from "@vitejs/plugin-react";
import { spawn, type ChildProcess } from "child_process";
import { readdirSync, statSync } from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

// @TODO: get path to e2e(etc...) from config
const repoRoot = path.resolve(fileURLToPath(import.meta.url), "../");

let currentProc: ChildProcess | null = null;
let aborted = false;

function killProc(proc: ChildProcess) {
  if (process.platform === "win32" && proc.pid) {
    spawn("taskkill", ["/F", "/T", "/PID", String(proc.pid)], { shell: true });
  } else {
    proc.kill("SIGTERM");
  }
}

function findSpecs(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...findSpecs(full));
    } else if (entry.includes(".cy.")) {
      results.push(full);
    }
  }
  return results;
}

export default () => {
  return defineConfig({
    plugins: [
      react(),
      {
        name: "cy-runner-api",
        configureServer(server) {
          server.middlewares.use("/api/cy-specs", (req, res) => {
            const url = new URL(req.url!, "http://localhost");
            const q = url.searchParams.get("q")?.toLowerCase() ?? "";

            const specsDir = path.join(repoRoot, "cypress", "e2e");
            const all = findSpecs(specsDir);
            const filtered = q
              ? all.filter((f) => path.basename(f).toLowerCase().includes(q))
              : all;

            const relative = filtered.map((f) =>
              path.relative(repoRoot, f).replace(/\\/g, "/"),
            );

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(relative));
          });

          server.middlewares.use("/api/cy-stop", (req, res) => {
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
            res.end(JSON.stringify({ ok: true }));
          });

          server.middlewares.use("/api/cy-run", (req, res) => {
            if (req.method !== "POST") {
              res.statusCode = 405;
              res.end();
              return;
            }

            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", () => {
              const { spec, runs = 1 } = JSON.parse(body);

              res.setHeader("Content-Type", "text/plain; charset=utf-8");
              res.setHeader("Transfer-Encoding", "chunked");
              res.statusCode = 200;

              aborted = false;

              (async () => {
                const results: boolean[] = [];

                for (let i = 0; i < runs; i++) {
                  if (aborted) break;

                  res.write(
                    `\n[CY-RUN-START:${JSON.stringify({ run: i + 1, total: runs })}]\n`,
                  );

                  const passed = await new Promise<boolean>((resolve) => {
                    const proc = spawn(
                      "pnpm",
                      ["cypress", "run", "--browser", "chrome", "--spec", spec],
                      {
                        cwd: repoRoot,
                        env: {
                          ...process.env,
                          NODE_ENV: "test",
                          TZ: "Etc/UTC",
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
                    `\n[CY-RUN-END:${JSON.stringify({ run: i + 1, total: runs, passed })}]\n`,
                  );
                }

                if (aborted) {
                  res.write(`\n[CY-ABORTED]\n`);
                } else {
                  const passed = results.filter(Boolean).length;
                  res.write(
                    `\n[CY-STATS:${JSON.stringify({ passed, failed: runs - passed, total: results.length })}]\n`,
                  );
                }
                res.end();
              })();
            });
          });
        },
      },
    ],
    server: {
      port: 3001,
    },
  });
};
