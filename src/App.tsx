import { useState } from "react";

import "./app.css";
import { Results, Specs } from "./components";
import { useRunner, useSpecs } from "./hooks";
import { Input } from "./ui";

// @TODO: crossPlatform(windows/linux)
export const App = () => {
  const [query, setQuery] = useState("");
  const [runsCount, setRunsCount] = useState("1");
  const specs = useSpecs(query);
  const {
    output,
    runResults,
    stats,
    runningSpec,
    currentRun,
    aborted,
    run,
    stop,
  } = useRunner();

  return (
    <div className="root">
      <h1>CY-runner</h1>
      <section className="hstack gap-2">
        <Input label="query" value={query} onChange={setQuery} />
        <Input
          label="runs"
          type="number"
          min={1}
          value={runsCount}
          onChange={setRunsCount}
          disabled={runningSpec !== null}
        />
      </section>
      {!!specs.length && (
        <Specs
          specs={specs}
          runningSpec={runningSpec}
          currentRun={currentRun}
          runsCount={runsCount}
          run={run}
        />
      )}
      {runningSpec && <button onClick={stop}>Stop</button>}
      {(runResults.length > 0 || stats || aborted) && (
        <Results runResults={runResults} aborted={aborted} stats={stats} />
      )}
      {output.length > 0 && (
        <section>
          <pre>{output}</pre>
        </section>
      )}
    </div>
  );
};
