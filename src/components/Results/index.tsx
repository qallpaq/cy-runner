import type { RunResult, RunStats } from "../../types";

interface ResultsProps {
  runResults: RunResult[];
  aborted: boolean;
  stats: RunStats | null;
}

export const Results = ({ runResults, aborted, stats }: ResultsProps) => {
  return (
    <>
      <h2>Results</h2>
      <section className="vstack gap-1">
        <div className="hstack gap-2">
          {runResults.map((r) => (
            <span
              style={{
                color: r.passed ? "green" : "red",
              }}
              key={r.run}
            >
              {`${r.run}-${r.passed ? "passed" : "failed"}`}
            </span>
          ))}
        </div>
        {aborted && <p>Stopped after {runResults.length} run(s)</p>}
        {stats && (
          <p>
            {stats.passed}/{stats.total}{" "}
            <span style={{ color: "green" }}>passed</span> - {stats.failed}/
            {stats.total} <span style={{ color: "red" }}>failed</span>
          </p>
        )}
      </section>
    </>
  );
};
