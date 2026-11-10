// Tests only.
import type {
  GameAdapter,
  GameConfig,
  GameResult,
  TrackingEvent,
} from "@repo/game-core";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { vi } from "vitest";
import { App } from "./App.tsx";
import type { MountOptions } from "./mount-game.tsx";

export const TOKEN = "test-token-not-secret";

export const WIN: GameResult = {
  status: "SUCCESS",
  isWin: true,
  reward: { id: "r1", name: "Golden Ticket", code: "GT" },
  remainingTurns: 3,
  message: "You win",
};

export interface FakeOptions {
  config?: GameConfig;
  configError?: boolean;
  result?: GameResult;
  submitError?: boolean;
  /** when set, getConfig stays pending until this is called */
  holdConfig?: boolean;
}

export function fakeAdapter(opts: FakeOptions = {}): {
  adapter: GameAdapter;
  calls: { submitResult: number[] };
  releaseConfig(): void;
} {
  const calls = { submitResult: [] as number[] };
  let release: () => void = () => {};
  const gate = opts.holdConfig
    ? new Promise<void>((r) => {
        release = r;
      })
    : Promise.resolve();
  const err = { kind: "http" as const, message: "boom" };
  const adapter: GameAdapter = {
    getConfig: async () => {
      await gate;
      return opts.configError
        ? { ok: false, error: err }
        : { ok: true, data: opts.config ?? {} };
    },
    getCurrentUser: () => Promise.resolve({ ok: false, error: err }),
    submitResult: (_env, score) => {
      calls.submitResult.push(score);
      return Promise.resolve(
        opts.submitError
          ? { ok: false, error: err }
          : { ok: true, data: opts.result ?? WIN },
      );
    },
  };
  return { adapter, calls, releaseConfig: () => release() };
}

export async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

export function renderApp(
  fake: ReturnType<typeof fakeAdapter>,
  overrides: Partial<MountOptions> = {},
): { container: HTMLElement; tracking: TrackingEvent[]; unmount(): void } {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  const tracking: TrackingEvent[] = [];
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  void act(() => {
    root.render(
      <App
        gameId="test-game"
        adapter={fake.adapter}
        httpConfig={{ baseUrl: "https://api.test", getAccessTokenFunc: () => TOKEN }}
        sendTrackingFunc={(e) => {
          tracking.push(e);
        }}
        width={360}
        height={480}
        {...overrides}
      />,
    );
  });
  return {
    container,
    tracking,
    unmount: () => {
      void act(() => root.unmount());
      container.remove();
    },
  };
}

export function stubCanvasRect(width: number, height: number): void {
  HTMLCanvasElement.prototype.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
      toJSON: () => ({}),
    }) as DOMRect;
}

/** Makes every random step pad 0, so the first step is pad 0. */
export function stubRandom(): void {
  vi.spyOn(Math, "random").mockReturnValue(0);
}

/** Waits out the playback of a one-step sequence, then taps pad 2 (wrong). */
export async function loseRound(): Promise<void> {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 1300));
  });
  await act(async () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "2" }));
    await Promise.resolve();
    await Promise.resolve();
  });
}
