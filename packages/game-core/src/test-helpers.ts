import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { GameContextProvider, useGameContext } from "./game-context.ts";
import type { GameContextProviderProps, GameContextValue } from "./types.ts";

export const TOKEN = "test-token-not-secret";

export interface RecordedCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
}

export function fakeFetch(
  handler: (url: string, init: RequestInit) => Response | Promise<Response>,
): { fetchFunc: typeof fetch; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const fetchFunc = ((
    input: string | URL | Request,
    init: RequestInit = {},
  ) => {
    const url = String(input);
    const headers: Record<string, string> = {};
    new Headers(init.headers).forEach((v, k) => {
      headers[k.toLowerCase()] = v;
    });
    calls.push({
      url,
      method: init.method ?? "GET",
      headers,
      body: typeof init.body === "string" ? init.body : null,
    });
    return Promise.resolve(handler(url, init));
  }) as typeof fetch;
  return { fetchFunc, calls };
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function textResponse(status: number, text: string): Response {
  return new Response(text, { status });
}

export function failingFetch(): { fetchFunc: typeof fetch } {
  const fetchFunc = (() =>
    Promise.reject(new TypeError("Failed to fetch " + TOKEN))) as typeof fetch;
  return { fetchFunc };
}

export function forbiddenFetch(): {
  fetchFunc: typeof fetch;
  calls: string[];
} {
  const calls: string[] = [];
  const fetchFunc = ((input: string | URL | Request) => {
    calls.push(String(input));
    throw new Error("fetch must not be called");
  }) as typeof fetch;
  return { fetchFunc, calls };
}

export interface Snapshot {
  config: GameContextValue["config"];
  currentUser: GameContextValue["currentUser"];
  result: GameContextValue["result"];
  isLoading: boolean;
  error: GameContextValue["error"];
}

export function renderGameContext(props: GameContextProviderProps): {
  current(): GameContextValue;
  snapshot(): Snapshot;
  run<T>(fn: (ctx: GameContextValue) => Promise<T>): Promise<T>;
  unmount(): void;
} {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  let latest: GameContextValue | undefined;
  const Probe = (): null => {
    latest = useGameContext();
    return null;
  };
  void act(() => {
    root.render(
      createElement(GameContextProvider, props, createElement(Probe)),
    );
  });
  const current = (): GameContextValue => latest as GameContextValue;
  return {
    current,
    snapshot: () => {
      const c = current();
      return {
        config: c.config,
        currentUser: c.currentUser,
        result: c.result,
        isLoading: c.isLoading,
        error: c.error,
      };
    },
    run: async <T>(fn: (ctx: GameContextValue) => Promise<T>) => {
      let out: T | undefined;
      await act(async () => {
        out = await fn(current());
      });
      return out as T;
    },
    unmount: () => {
      void act(() => root.unmount());
    },
  };
}
