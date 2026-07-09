import {
  MARKER_ABORTED,
  MARKER_RUN_END,
  MARKER_RUN_START,
  MARKER_STATS,
} from "../constants";
import type { RunResult, RunStats } from "../types";

export const parseMarkers = (
  chunk: string,
  onRunStart: (data: { run: number; total: number }) => void,
  onRunEnd: (data: RunResult) => void,
  onStats: (data: RunStats) => void,
  onAborted: () => void,
): string => {
  return chunk
    .split("\n")
    .filter((line) => {
      if (line.startsWith(MARKER_RUN_START)) {
        onRunStart(JSON.parse(line.slice(MARKER_RUN_START.length, -1)));
        return false;
      }
      if (line.startsWith(MARKER_RUN_END)) {
        onRunEnd(JSON.parse(line.slice(MARKER_RUN_END.length, -1)));
        return false;
      }
      if (line.startsWith(MARKER_STATS)) {
        onStats(JSON.parse(line.slice(MARKER_STATS.length, -1)));
        return false;
      }
      if (line.trim() === MARKER_ABORTED) {
        onAborted();
        return false;
      }
      return true;
    })
    .join("\n");
};
