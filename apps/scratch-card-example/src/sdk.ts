import { RemoteAdapter } from "@repo/game-core";
import type { TrackingEvent } from "@repo/game-core";
import { SDK_GLOBAL_NAME } from "./game-name.ts";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, mountGame } from "./mount-game.tsx";

interface SdkConfig {
  gameId: string;
  baseUrl: string;
  getAccessTokenFunc: () => string | Promise<string>;
  sendTrackingFunc?: (event: TrackingEvent) => void | Promise<void>;
  width?: number;
  height?: number;
}

let current: { unmount(): void } | null = null;

const isNonEmpty = (v: unknown): v is string =>
  typeof v === "string" && v !== "";
const isPositive = (v: unknown): boolean =>
  typeof v === "number" && Number.isFinite(v) && v > 0;

/** Returns an error message, or null when the config is valid. */
function validateConfig(config: unknown): string | null {
  if (typeof config !== "object" || config === null) {
    return "config must be an object";
  }
  const c = config as Record<string, unknown>;
  if (!isNonEmpty(c["gameId"])) {
    return "config.gameId is required and must be a non-empty string";
  }
  if (!isNonEmpty(c["baseUrl"])) {
    return "config.baseUrl is required and must be a non-empty string";
  }
  if (typeof c["getAccessTokenFunc"] !== "function") {
    return "config.getAccessTokenFunc is required and must be a function";
  }
  const tracking = c["sendTrackingFunc"];
  if (tracking !== undefined && typeof tracking !== "function") {
    return "config.sendTrackingFunc must be a function";
  }
  for (const key of ["width", "height"]) {
    if (c[key] !== undefined && !isPositive(c[key])) {
      return `config.${key} must be a positive number`;
    }
  }
  return null;
}

function resolveContainer(
  container: unknown,
): { element: Element } | { error: string } {
  if (typeof container === "string") {
    try {
      const element = document.querySelector(container);
      return element
        ? { element }
        : { error: `container "${container}" not found` };
    } catch {
      return { error: `invalid container selector "${container}"` };
    }
  }
  if (container instanceof Element) return { element: container };
  return { error: "container must be a CSS selector or an Element" };
}

function fail(message: string): void {
  console.error(`[${SDK_GLOBAL_NAME}] init: ${message}`);
}

export function init(container: string | Element, config: unknown): void {
  const resolved = resolveContainer(container);
  if ("error" in resolved) return fail(resolved.error);
  const invalid = validateConfig(config);
  if (invalid) return fail(invalid);
  const c = config as SdkConfig;
  destroy();
  try {
    current = mountGame(resolved.element, {
      gameId: c.gameId,
      adapter: RemoteAdapter,
      httpConfig: {
        baseUrl: c.baseUrl,
        getAccessTokenFunc: c.getAccessTokenFunc,
      },
      sendTrackingFunc: c.sendTrackingFunc,
      width: c.width ?? DEFAULT_WIDTH,
      height: c.height ?? DEFAULT_HEIGHT,
    });
  } catch {
    fail("container cannot host a shadow root");
  }
}

export function destroy(): void {
  current?.unmount();
  current = null;
}
