import type {
  GameCoreError,
  HttpClient,
  HttpConfig,
  Outcome,
  RequestOptions,
} from "./types.ts";

function fail(error: GameCoreError): Outcome<never> {
  return { ok: false, error };
}

function describeActual(value: unknown): string {
  if (value === undefined) return "missing";
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

async function resolveToken(
  config: HttpConfig,
  op: string,
): Promise<string | Outcome<never>> {
  const unavailable = fail({
    kind: "token",
    message: `Access token unavailable: ${op} not sent`,
  });
  try {
    const token: unknown = await config.getAccessTokenFunc();
    return typeof token === "string" && token !== "" ? token : unavailable;
  } catch {
    return unavailable;
  }
}

function unwrap(parsed: unknown, op: string): Outcome<unknown> {
  const isObject =
    typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
  const data = isObject ? (parsed as Record<string, unknown>)["data"] : parsed;
  if (isObject && data !== null && data !== undefined) {
    return { ok: true, data };
  }
  const actual = isObject ? describeActual(data) : describeActual(parsed);
  return fail({
    kind: "validation",
    message: `Invalid response from ${op}: field "data" expected object, got ${actual}`,
  });
}

async function readBody(response: Response, op: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await response.text());
  } catch {
    return fail({ kind: "parse", message: `Invalid JSON: ${op}` });
  }
  return unwrap(parsed, op);
}

export function createHttpClient(config: HttpConfig): HttpClient {
  const base = config.baseUrl.replace(/\/$/, "");
  return {
    async request(options: RequestOptions): Promise<Outcome<unknown>> {
      const path = `/${encodeURIComponent(options.gameId)}/v1/${options.endpoint}`;
      const op = `${options.method} ${path}`;
      const headers: Record<string, string> = { Accept: "application/json" };
      if (options.method === "POST") {
        headers["Content-Type"] = "application/json";
      }
      if (!options.isPublic) {
        const token = await resolveToken(config, op);
        if (typeof token !== "string") return token;
        headers["X-Access-Token"] = token;
      }
      const init: RequestInit = { method: options.method, headers };
      if (options.body !== undefined) init.body = JSON.stringify(options.body);
      let response: Response;
      try {
        const fetchFunc = config.fetchFunc ?? globalThis.fetch;
        response = await fetchFunc(base + path, init);
      } catch {
        return fail({
          kind: "network",
          message: `Network error: ${op} failed`,
        });
      }
      if (!response.ok) {
        return fail({
          kind: "http",
          status: response.status,
          message: `HTTP ${response.status}: ${op} failed`,
        });
      }
      return readBody(response, op);
    },
  };
}
