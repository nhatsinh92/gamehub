import {
  parseCurrentUser,
  parseGameConfig,
  parseGameResult,
} from "./validate.ts";
import type {
  AdapterEnv,
  GameAdapter,
  Outcome,
  RequestOptions,
} from "./types.ts";

async function fetchValidated<T>(
  env: AdapterEnv,
  options: Omit<RequestOptions, "gameId">,
  parse: (value: unknown) => Outcome<T>,
): Promise<Outcome<T>> {
  const out = await env.http.request({ ...options, gameId: env.gameId });
  if (!out.ok) return out;
  const parsed = parse(out.data);
  if (parsed.ok) return parsed;
  const op = `${options.method} /${encodeURIComponent(env.gameId)}/v1/${options.endpoint}`;
  return {
    ok: false,
    error: {
      ...parsed.error,
      message: `Invalid response from ${op}: ${parsed.error.message}`,
    },
  };
}

export const RemoteAdapter: GameAdapter = {
  getConfig: (env) =>
    fetchValidated(
      env,
      { method: "GET", endpoint: "init", isPublic: true },
      parseGameConfig,
    ),
  getCurrentUser: (env) =>
    fetchValidated(env, { method: "GET", endpoint: "me" }, parseCurrentUser),
  submitResult: (env, score) =>
    fetchValidated(
      env,
      { method: "POST", endpoint: "reward", body: { score } },
      parseGameResult,
    ),
};
