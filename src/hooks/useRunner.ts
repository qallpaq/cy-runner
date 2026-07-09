import { useState } from "react";

import { cyApi } from "../api";
import { parseMarkers } from "../helpers";
import type { RunProgress, RunResult, RunStats } from "../types";

export const useRunner = () => {
  const [output, setOutput] = useState("");
  const [runResults, setRunResults] = useState<RunResult[]>([]);
  const [stats, setStats] = useState<RunStats | null>(null);
  const [runningSpec, setRunningSpec] = useState<string | null>(null);
  const [currentRun, setCurrentRun] = useState<RunProgress | null>(null);
  const [aborted, setAborted] = useState(false);

  const stop = () => {
    cyApi.stop();
  };

  const run = async (spec: string, runsCount: string) => {
    setOutput("");
    setRunResults([]);
    setStats(null);
    setCurrentRun(null);
    setAborted(false);
    setRunningSpec(spec);

    const runs = Math.max(1, parseInt(runsCount) || 1);
    const response = await cyApi.run({ spec, runs });

    if (!response) {
      setRunningSpec(null);
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const filtered = parseMarkers(
        chunk,
        (data) => setCurrentRun(data),
        (data) => setRunResults((prev) => [...prev, data]),
        (data) => setStats(data),
        () => setAborted(true),
      );

      setOutput((prev) => prev + filtered);
    }

    setRunningSpec(null);
    setCurrentRun(null);
  };

  return {
    output,
    runResults,
    stats,
    runningSpec,
    currentRun,
    aborted,
    run,
    stop,
  };
};
