export type RunProgress = {
  run: number;
  total: number;
};

export type RunResult = {
  run: number;
  passed: boolean;
};

export type RunStats = {
  passed: number;
  failed: number;
  total: number;
};
