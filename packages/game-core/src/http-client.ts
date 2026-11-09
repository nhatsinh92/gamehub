import type { HttpClient, HttpConfig, Outcome } from "./types.ts";

export function createHttpClient(config: HttpConfig): HttpClient {
  void config;
  return {
    request: (): Promise<Outcome<unknown>> =>
      Promise.resolve({ ok: false, error: { kind: "unknown", message: "stub" } }),
  };
}
