import { Fetcher } from "./fetcher";
import { type RunSpecParams } from "./types";

const cyFetcher = new Fetcher("/api/cy-");

export class CyApi {
  getSpecs(query: string) {
    return cyFetcher.get(`specs?q=${encodeURIComponent(query)}`);
  }

  run({ spec, runs }: RunSpecParams) {
    return cyFetcher.post("run", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spec, runs }),
    });
  }

  stop() {
    return cyFetcher.post("stop");
  }
}

export const cyApi = new CyApi();
