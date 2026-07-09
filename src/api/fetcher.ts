import type { FetcherPostOptions } from "./types";

export class Fetcher {
  constructor(private readonly baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get(url: string) {
    try {
      const response = await fetch(`${this.baseUrl}${url}`);

      return await response.json();
    } catch (e) {
      this.log(e);
    }
  }

  async post(url: string, options?: FetcherPostOptions) {
    try {
      return await fetch(`${this.baseUrl}${url}`, {
        method: "POST",
        ...options,
      });
    } catch (e) {
      this.log(e);
    }
  }

  private log(e: unknown) {
    console.warn("Fetcher error", e);
  }
}
