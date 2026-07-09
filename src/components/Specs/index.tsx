import type { RunProgress } from "../../types";

interface SpecsProps {
  specs: string[];
  runningSpec: string | null;
  runsCount: string;
  currentRun: RunProgress | null;
  run: (spec: string, runsCount: string) => void;
}

export const Specs = ({
  specs,
  runningSpec,
  runsCount,
  run,
  currentRun,
}: SpecsProps) => {
  return (
    <>
      <h2>Specs</h2>
      <section>
        <ul>
          {specs.map((spec) => (
            <li key={spec} className="hstack gap-2">
              {spec}
              <button
                disabled={runningSpec !== null}
                onClick={() => run(spec, runsCount)}
              >
                {runningSpec === spec
                  ? currentRun
                    ? `Running ${currentRun.run}/${currentRun.total}...`
                    : "Running..."
                  : "Run"}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
};
